<?php

/**
 * MotorRecomendacion — Motor centralizado de scoring y recomendación v3.
 *
 * 6 señales implementadas:
 * 1. Similitud de contenido (0.25) — pgvector coseno sobre embeddings 128d
 * 2. Comportamiento (0.25) — 5 sub-factores ponderados: likes, reproducciones,
 *    tiempo_escucha, descargas, completadas
 * 3. Contexto (0.15) — BPM proximidad, key match, género match, tipo match
 * 4. Tendencias (0.15) — engagement velocity multi-ventana (24h/7d/30d)
 * 5. Grafo social (0.10) — samples de seguidos + likes de seguidos
 * 6. Novedad (0.10) — boost logarítmico
 * + Penalización por ya escuchado
 *
 * La señal de similitud de contenido usa GeneradorEmbeddings para crear
 * un perfil vectorial del usuario y compararlo con los embeddings de
 * los samples candidatos mediante distancia coseno (pgvector HNSW).
 * Se activa automáticamente cuando pgvector está instalado.
 *
 * Cache: WP transients con invalidación al publicar/interactuar.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Services\GeneradorEmbeddings;
use App\Kamples\LogAlgoritmo as KamplesLogger;

class MotorRecomendacion
{
    private static ?array $pesos = null;
    private static ?bool $pgvectorDisponible = null;
    private const CACHE_TTL = 300; /* 5 minutos */
    private const CACHE_PREFIX = 'kamples_feed_';

    /**
     * Carga los pesos desde el archivo de configuración.
     */
    private static function cargarPesos(): array
    {
        if (self::$pesos === null) {
            $ruta = dirname(__DIR__) . '/Config/algoritmoPesos.php';
            self::$pesos = file_exists($ruta) ? require $ruta : [];
        }
        return self::$pesos;
    }

    /**
     * Verifica si pgvector está disponible y configurado.
     * Se cachea en memoria para no consultar en cada request.
     */
    private static function pgvectorActivo(): bool
    {
        if (self::$pgvectorDisponible !== null) return self::$pgvectorDisponible;
        try {
            $ext = PostgresService::consultarUno(
                "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
            );
            $col = PostgresService::consultarUno(
                "SELECT 1 FROM information_schema.columns WHERE table_name = 'samples' AND column_name = 'embedding'"
            );
            self::$pgvectorDisponible = ($ext !== null && $col !== null);
        } catch (\Exception $e) {
            self::$pgvectorDisponible = false;
        }
        return self::$pgvectorDisponible;
    }

    /**
     * Señal de Similitud de Contenido (0.25) — distancia coseno via pgvector.
     * Compara el perfil del usuario (vector promedio de interacciones) con
     * el embedding del sample candidato.
     *
     * @param int $userId ID del usuario
     * @param float $peso Peso de la señal
     * @param array &$params Parámetros de la query principal (se inyecta :userProfileVector)
     * @return string Fragmento SQL para la señal, o '0' si no hay perfil
     */
    private static function sqlSimilitudContenido(int $userId, float $peso, array &$params): string
    {
        /* Obtener perfil vectorial del usuario */
        $perfil = GeneradorEmbeddings::perfilUsuario($userId);
        if ($perfil === null) return '0';

        $params['userProfileVector'] = GeneradorEmbeddings::vectorAString($perfil);

        /*
         * Distancia coseno (<=>): 0 = idénticos, 2 = opuestos.
         * Convertir a similitud: 1 - distancia/2 => rango [0, 1].
         * Solo aplica si el sample tiene embedding.
         */
        return "({$peso} * CASE WHEN s.embedding IS NOT NULL
            THEN GREATEST(0, 1 - (s.embedding <=> :userProfileVector::vector) / 2)
            ELSE 0 END)";
    }

    /**
     * Feed personalizado para el usuario autenticado.
     * Combina todas las señales disponibles con pesos configurables.
     * Implementa cache con WP transients para reducir carga SQL.
     */
    public static function feedPersonalizado(int $userId, int $limite = 20, int $offset = 0): array
    {
        KamplesLogger::info('Algoritmo: feedPersonalizado iniciado', [
            'userId' => $userId, 'limite' => $limite, 'offset' => $offset,
        ]);

        /* Intentar leer de cache solo para la primera página */
        if ($offset === 0) {
            $cacheKey = self::CACHE_PREFIX . $userId . '_' . $limite;
            $cached = \get_transient($cacheKey);
            if ($cached !== false && is_array($cached)) {
                KamplesLogger::debug('Algoritmo: Sirviendo desde cache', [
                    'cacheKey' => $cacheKey, 'resultados' => count($cached),
                ]);
                return $cached;
            }
        }

        $config = self::cargarPesos();
        $pesos = $config['senales'] ?? [];
        $params = $config['parametros'] ?? [];

        /* Obtener perfil de preferencias del usuario */
        $perfilUsuario = self::construirPerfilUsuario($userId);

        if (empty($perfilUsuario['interacciones']) && ($params['min_interacciones'] ?? 5) > 0) {
            KamplesLogger::info('Algoritmo: Usuario nuevo sin interacciones, usando feed de tendencias', [
                'userId' => $userId, 'interacciones' => $perfilUsuario['interacciones'] ?? 0,
            ]);
            $resultado = self::feedNuevoUsuario($limite, $offset);
            if ($offset === 0) {
                \set_transient($cacheKey ?? '', $resultado, self::CACHE_TTL);
            }
            return $resultado;
        }

        $queryParams = ['userId' => $userId, 'limit' => $limite, 'offset' => $offset];

        /*
         * Construir query SQL con scoring multi-señal.
         * Cada señal genera una sub-expresión SQL ponderada.
         */
        $additiveParts = [];

        /* Señal 1: Comportamiento — 5 sub-factores ponderados */
        $pesoComportamiento = $pesos['comportamiento'] ?? 0.25;
        if ($pesoComportamiento > 0) {
            $additiveParts[] = self::sqlComportamiento($userId, $pesoComportamiento, $config, $queryParams);
        }

        /* Señal 2: Contexto — BPM proximidad, key match, género match, tipo match */
        $pesoContexto = $pesos['contexto'] ?? 0.15;
        if ($pesoContexto > 0) {
            $additiveParts[] = self::sqlContexto($userId, $pesoContexto, $perfilUsuario, $config, $queryParams);
        }

        /* Señal 3: Tendencias — engagement velocity multi-ventana */
        $pesoTendencias = $pesos['tendencias'] ?? 0.15;
        if ($pesoTendencias > 0) {
            $ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
            $additiveParts[] = self::sqlTendencias($pesoTendencias, $ventanas, $config);
        }

        /* Señal 4: Novedad — boost logarítmico */
        $pesoNovedad = $pesos['novedad'] ?? 0.10;
        if ($pesoNovedad > 0) {
            $diasBoost = $params['novedad_dias_boost'] ?? 14;
            $additiveParts[] = "({$pesoNovedad} * GREATEST(0, 1 - LN(GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 86400)) / LN({$diasBoost})))";
        }

        /* Señal 5: Grafo social — samples de seguidos + likes de seguidos */
        $pesoSocial = $pesos['grafo_social'] ?? 0.10;
        if ($pesoSocial > 0) {
            $additiveParts[] = self::sqlGrafoSocial($userId, $pesoSocial, $queryParams);
        }

        /* Señal 6: Similitud de contenido — pgvector coseno (se activa automáticamente) */
        $pgvActivo = self::pgvectorActivo();
        KamplesLogger::debug('Algoritmo: pgvector activo', ['activo' => $pgvActivo]);
        if ($pgvActivo) {
            $pesoSimilitud = $pesos['similitud_contenido'] ?? 0.25;
            if ($pesoSimilitud > 0) {
                $sqlSim = self::sqlSimilitudContenido($userId, $pesoSimilitud, $queryParams);
                if ($sqlSim !== '0') {
                    $additiveParts[] = $sqlSim;
                }
            }
        }

        /* Sumar todas las señales aditivas */
        $scoreAditivo = !empty($additiveParts) ? '(' . implode(' + ', $additiveParts) . ')' : '1';

        KamplesLogger::info('Algoritmo: Señales construidas', [
            'userId' => $userId,
            'numSenales' => count($additiveParts),
            'perfilInteracciones' => $perfilUsuario['interacciones'] ?? 0,
            'bpmProm' => $perfilUsuario['bpmProm'] ?? 0,
            'keyFav' => $perfilUsuario['keyFav'] ?? null,
            'tipoFav' => $perfilUsuario['tipoFav'] ?? null,
        ]);

        /* Multiplicador de penalización por ya escuchado */
        $penConfig = $params['penalizacion_ya_escuchado'] ?? [];
        $umbralRepro = $penConfig['umbral_reproducciones'] ?? 3;
        $factorPen = $penConfig['factor_penalizacion'] ?? 0.3;
        $penalizacion = "(CASE WHEN (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId AND sample_id = s.id) >= {$umbralRepro} THEN {$factorPen} ELSE 1 END)";

        $scoreTotal = "{$scoreAditivo} * {$penalizacion}";

        /* Construir query completa con diversidad por creador */
        $maxPorCreador = $params['max_por_creador'] ?? 3;

        $sql = "WITH scored AS (
                    SELECT s.*, u.username, u.nombre_visible, u.avatar_url, u.verificado,
                           u.id as creador_id,
                           ({$scoreTotal}) as score,
                           ROW_NUMBER() OVER (PARTITION BY s.creador_id ORDER BY ({$scoreTotal}) DESC) as rn
                    FROM samples s
                    LEFT JOIN usuarios_ext u ON s.creador_id = u.id
                    WHERE s.estado = 'activo'
                )
                SELECT * FROM scored
                WHERE rn <= {$maxPorCreador}
                ORDER BY score DESC
                LIMIT :limit OFFSET :offset";

        $resultado = PostgresService::consultar($sql, $queryParams);

        KamplesLogger::info('Algoritmo: Resultados obtenidos', [
            'userId' => $userId, 'totalResultados' => count($resultado),
            'primerScore' => !empty($resultado) ? ($resultado[0]['score'] ?? 'N/A') : 'vacío',
        ]);

        /* Guardar en cache (solo primera página) */
        if ($offset === 0 && !empty($resultado)) {
            \set_transient(self::CACHE_PREFIX . $userId . '_' . $limite, $resultado, self::CACHE_TTL);
        }

        return $resultado;
    }

    /**
     * Feed para usuarios nuevos sin historial de interacciones.
     * Mezcla trending reciente + samples nuevos.
     */
    private static function feedNuevoUsuario(int $limite, int $offset): array
    {
        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo'"
             . " ORDER BY (s.total_likes * 2 + s.total_reproducciones + s.total_descargas * 3)"
             . "   * GREATEST(0.1, 1 - EXTRACT(EPOCH FROM NOW() - s.publicado_at) / (86400 * 30)) DESC"
             . " LIMIT :limit OFFSET :offset";

        return PostgresService::consultar($sql, ['limit' => $limite, 'offset' => $offset]);
    }

    /**
     * Construye el perfil de preferencias del usuario.
     * Extrae: BPM promedio, keys más usadas, géneros favoritos, tipo preferido.
     */
    private static function construirPerfilUsuario(int $userId): array
    {
        /* Contar interacciones totales */
        $interacciones = PostgresService::consultarUno(
            "SELECT
                (SELECT COUNT(*) FROM likes WHERE usuario_id = :userId AND tipo = 'sample') +
                (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId) +
                (SELECT COUNT(*) FROM descargas WHERE usuario_id = :userId) as total",
            ['userId' => $userId]
        );

        $total = (int) ($interacciones['total'] ?? 0);
        if ($total === 0) {
            return ['interacciones' => 0, 'userId' => $userId];
        }

        /* BPM promedio de samples likeados/reproducidos */
        $bpmPref = PostgresService::consultarUno(
            "SELECT AVG(s.bpm)::int as bpm_prom
             FROM samples s
             WHERE s.bpm IS NOT NULL AND s.id IN (
                 SELECT target_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample'
                 UNION
                 SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
             )",
            ['userId' => $userId]
        );

        /* Key más frecuente */
        $keyPref = PostgresService::consultarUno(
            "SELECT s.key as key_fav, COUNT(*) as cnt
             FROM samples s
             WHERE s.key IS NOT NULL AND s.id IN (
                 SELECT target_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample'
                 UNION
                 SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
             )
             GROUP BY s.key ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId]
        );

        /* Tipo más frecuente */
        $tipoPref = PostgresService::consultarUno(
            "SELECT s.tipo as tipo_fav, COUNT(*) as cnt
             FROM samples s
             WHERE s.id IN (
                 SELECT target_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample'
                 UNION
                 SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
             )
             GROUP BY s.tipo ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId]
        );

        return [
            'interacciones' => $total,
            'userId' => $userId,
            'bpmProm' => (int) ($bpmPref['bpm_prom'] ?? 0),
            'keyFav' => $keyPref['key_fav'] ?? null,
            'tipoFav' => $tipoPref['tipo_fav'] ?? null,
        ];
    }

    /**
     * Señal de Comportamiento (0.25) — 5 sub-factores ponderados.
     * likes_dados (0.30), reproducciones (0.25), tiempo_escucha (0.20),
     * descargas (0.15), completadas (0.10).
     */
    private static function sqlComportamiento(int $userId, float $peso, array $config, array &$params): string
    {
        $detalle = $config['comportamiento_detalle'] ?? [];
        $pesoLikes = $detalle['likes_dados'] ?? 0.30;
        $pesoRepro = $detalle['reproducciones'] ?? 0.25;
        $pesoTiempo = $detalle['tiempo_escucha'] ?? 0.20;
        $pesoDescargas = $detalle['descargas'] ?? 0.15;
        $pesoCompletadas = $detalle['completadas'] ?? 0.10;

        /*
         * Sub-factor 1: Afinidad por tags de samples likeados (0.30)
         * Cuenta tags en común entre el sample candidato y los likeados.
         */
        $likesTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT UNNEST(s2.tags) as tag
                FROM likes l
                JOIN samples s2 ON l.target_id = s2.id
                WHERE l.usuario_id = :userId AND l.tipo = 'sample'
            ) liked_tags
            WHERE liked_tags.tag = ANY(s.tags)
        ), 0)";

        /*
         * Sub-factor 2: Afinidad por tags de samples reproducidos (0.25)
         */
        $reproTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT UNNEST(s3.tags) as tag
                FROM reproducciones r
                JOIN samples s3 ON r.sample_id = s3.id
                WHERE r.usuario_id = :userId
            ) repro_tags
            WHERE repro_tags.tag = ANY(s.tags)
        ), 0)";

        /*
         * Sub-factor 3: Afinidad calculada por tiempo total escuchado (0.20)
         * Normalizado: si escuchó mucho tiempo samples con tags similares.
         */
        $tiempoTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT UNNEST(s4.tags) as tag
                FROM reproducciones r2
                JOIN samples s4 ON r2.sample_id = s4.id
                WHERE r2.usuario_id = :userId AND r2.duracion_escuchada > 10
            ) tiempo_tags
            WHERE tiempo_tags.tag = ANY(s.tags)
        ), 0)";

        /*
         * Sub-factor 4: Afinidad por tags de samples descargados (0.15)
         */
        $descargaTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT UNNEST(s5.tags) as tag
                FROM descargas d
                JOIN samples s5 ON d.sample_id = s5.id
                WHERE d.usuario_id = :userId
            ) desc_tags
            WHERE desc_tags.tag = ANY(s.tags)
        ), 0)";

        /*
         * Sub-factor 5: Afinidad por reproducciones completadas (0.10)
         */
        $completadasTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT UNNEST(s6.tags) as tag
                FROM reproducciones r3
                JOIN samples s6 ON r3.sample_id = s6.id
                WHERE r3.usuario_id = :userId AND r3.completa = true
            ) comp_tags
            WHERE comp_tags.tag = ANY(s.tags)
        ), 0)";

        return "({$peso} * (
            {$pesoLikes} * {$likesTag} +
            {$pesoRepro} * {$reproTag} +
            {$pesoTiempo} * {$tiempoTag} +
            {$pesoDescargas} * {$descargaTag} +
            {$pesoCompletadas} * {$completadasTag}
        ))";
    }

    /**
     * Señal de Contexto (0.15) — BPM proximidad, key match, género match, tipo match.
     * Compara las preferencias del usuario con los atributos del sample candidato.
     */
    private static function sqlContexto(int $userId, float $peso, array $perfilUsuario, array $config, array &$params): string
    {
        $detalle = $config['contexto_detalle'] ?? [];
        $pesoBpm = $detalle['bpm_proximidad'] ?? 0.35;
        $pesoKey = $detalle['key_match'] ?? 0.30;
        $pesoGenero = $detalle['genero_match'] ?? 0.20;
        $pesoTipo = $detalle['tipo_match'] ?? 0.15;
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        /* BPM proximidad al promedio del usuario */
        $bpmProm = $perfilUsuario['bpmProm'] ?? 0;
        $bpmScore = $bpmProm > 0
            ? "GREATEST(0, ({$toleranciaBpm} - ABS(COALESCE(s.bpm, 0) - {$bpmProm}))::float / {$toleranciaBpm})"
            : "0.5";

        /* Key match: coincide con la key favorita del usuario */
        $keyFav = $perfilUsuario['keyFav'] ?? null;
        if ($keyFav) {
            $params['keyFavUsuario'] = $keyFav;
            $keyScore = "CASE WHEN s.key = :keyFavUsuario THEN 1 ELSE 0 END";
        } else {
            $keyScore = "0.5";
        }

        /* Género match: tags del sample coinciden con los tags más frecuentes del usuario */
        $generoScore = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT tag, COUNT(*) as freq FROM (
                    SELECT UNNEST(s_inner.tags) as tag
                    FROM likes l_inner
                    JOIN samples s_inner ON l_inner.target_id = s_inner.id
                    WHERE l_inner.usuario_id = :userId AND l_inner.tipo = 'sample'
                ) t GROUP BY tag ORDER BY freq DESC LIMIT 5
            ) top_tags
            WHERE top_tags.tag = ANY(s.tags)
        ), 0)";

        /* Tipo match: coincide con el tipo favorito del usuario */
        $tipoFav = $perfilUsuario['tipoFav'] ?? null;
        if ($tipoFav) {
            $params['tipoFavUsuario'] = $tipoFav;
            $tipoScore = "CASE WHEN s.tipo = :tipoFavUsuario THEN 1 ELSE 0 END";
        } else {
            $tipoScore = "0.5";
        }

        return "({$peso} * (
            {$pesoBpm} * {$bpmScore} +
            {$pesoKey} * {$keyScore} +
            {$pesoGenero} * {$generoScore} +
            {$pesoTipo} * {$tipoScore}
        ))";
    }

    /**
     * Señal de Tendencias (0.15) — engagement velocity multi-ventana.
     * Pondera interacciones recientes con 3 ventanas temporales: 24h, 7d, 30d.
     */
    private static function sqlTendencias(float $peso, array $ventanas, array $config): string
    {
        $detalle = $config['tendencias_detalle'] ?? [];
        $pesoLikes24h = $detalle['likes_24h'] ?? 0.40;
        $pesoRepro24h = $detalle['reproducciones_24h'] ?? 0.30;
        $pesoDescargas7d = $detalle['descargas_7d'] ?? 0.20;
        $pesoFollows7d = $detalle['follows_creador_7d'] ?? 0.10;

        $ventanaCorta = $ventanas['corta'] ?? '24 hours';
        $ventanaMedia = $ventanas['media'] ?? '7 days';

        /* Likes en últimas 24h */
        $likes24h = "COALESCE((SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

        /* Reproducciones en últimas 24h */
        $repro24h = "COALESCE((SELECT COUNT(*) FROM reproducciones WHERE sample_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

        /* Descargas en últimos 7 días */
        $descargas7d = "COALESCE((SELECT COUNT(*) FROM descargas WHERE sample_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaMedia}'), 0)";

        /* Nuevos seguidores del creador en últimos 7 días */
        $follows7d = "COALESCE((SELECT COUNT(*) FROM follows WHERE seguido_id = s.creador_id AND created_at > NOW() - INTERVAL '{$ventanaMedia}'), 0)";

        /* Normalizar por horas desde publicación para medir velocity */
        $horasPublicado = "GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 3600)";

        return "({$peso} * (
            {$pesoLikes24h} * ({$likes24h}::float / {$horasPublicado}) +
            {$pesoRepro24h} * ({$repro24h}::float / {$horasPublicado}) +
            {$pesoDescargas7d} * ({$descargas7d}::float / GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 86400)) +
            {$pesoFollows7d} * ({$follows7d}::float / GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 86400))
        ))";
    }

    /**
     * Señal de Grafo Social (0.10) — samples de seguidos + likes de seguidos.
     * Dos sub-factores: creador seguido (0.6) + likeado por seguidos (0.4).
     */
    private static function sqlGrafoSocial(int $userId, float $peso, array &$params): string
    {
        /* Sub-factor 1: el creador del sample es un usuario seguido (60% del peso social) */
        $seguidoDirecto = "CASE WHEN s.creador_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId) THEN 1 ELSE 0 END";

        /* Sub-factor 2: usuarios seguidos han likeado este sample (40% del peso social) */
        $likeadoPorSeguidos = "LEAST(1, COALESCE((
            SELECT COUNT(*)::float
            FROM likes l
            WHERE l.tipo = 'sample' AND l.target_id = s.id
            AND l.usuario_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId)
        ), 0) / 3)"; /* Normalizado: 3+ likes de seguidos = factor 1.0 */

        return "({$peso} * (0.6 * {$seguidoDirecto} + 0.4 * {$likeadoPorSeguidos}))";
    }

    /**
     * Invalida el cache de feed para un usuario específico.
     * Llamar cuando: el usuario da like, descarga, o se publica un nuevo sample.
     */
    public static function invalidarCache(int $userId): void
    {
        \delete_transient(self::CACHE_PREFIX . $userId . '_20');
        \delete_transient(self::CACHE_PREFIX . $userId . '_50');
    }

    /**
     * Invalida el cache de feed para TODOS los usuarios.
     * Llamar cuando: se publica un sample nuevo (afecta trending).
     */
    public static function invalidarCacheGlobal(): void
    {
        KamplesLogger::debug('Algoritmo: Invalidando cache global de feeds');
        /* WP no tiene wildcard delete para transients. Borrar directamente en BD */
        global $wpdb;
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                '_transient_' . self::CACHE_PREFIX . '%'
            )
        );
    }

    /**
     * Samples similares a uno dado.
     * Usa embeddings pgvector cuando están disponibles (cosine distance),
     * con fallback a scoring por tags + BPM + key + tipo.
     */
    public static function samplesSimilares(int $sampleId, int $limite = 5, ?int $userId = null): array
    {
        $config = self::cargarPesos();

        /* Intentar búsqueda por embedding si pgvector está activo */
        if (self::pgvectorActivo()) {
            $tieneEmbedding = PostgresService::consultarUno(
                "SELECT embedding IS NOT NULL as tiene FROM samples WHERE id = :id",
                ['id' => $sampleId]
            );

            if ($tieneEmbedding && ($tieneEmbedding['tiene'] ?? false)) {
                $similares = PostgresService::consultar(
                    NormalizadorSample::sqlSelectSamples()
                    . " WHERE s.estado = 'activo' AND s.id != :sampleId AND s.embedding IS NOT NULL"
                    . " ORDER BY s.embedding <=> (SELECT embedding FROM samples WHERE id = :sampleId)"
                    . " LIMIT :limit",
                    ['sampleId' => $sampleId, 'limit' => $limite]
                );

                if (!empty($similares)) return $similares;
            }
        }

        /* Fallback: scoring por tags, BPM, key, tipo */
        $sample = PostgresService::consultarUno(
            "SELECT tags, bpm, key, tipo, escala FROM samples WHERE id = :id",
            ['id' => $sampleId]
        );

        if (!$sample) return [];

        $tags = NormalizadorSample::pgArrayToPhp($sample['tags'] ?? '');
        $bpm = $sample['bpm'] ? (int) $sample['bpm'] : null;
        $key = $sample['key'] ?? null;
        $tipo = $sample['tipo'] ?? 'one shot';
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $params = ['sampleId' => $sampleId, 'limit' => $limite];

        /* Score por tags en común */
        $tagParts = [];
        foreach (array_slice($tags, 0, 10) as $i => $tag) {
            $tagParts[] = "CASE WHEN :tag{$i} = ANY(s.tags) THEN 2 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagParts) ? '(' . implode(' + ', $tagParts) . ')' : '0';

        $bpmScore = $bpm
            ? "GREATEST(0, {$toleranciaBpm} - ABS(COALESCE(s.bpm, 0) - {$bpm})) / {$toleranciaBpm} * 5"
            : "0";

        $keyScore = $key ? "CASE WHEN s.key = :simKey THEN 5 ELSE 0 END" : "0";
        if ($key) $params['simKey'] = $key;

        $tipoScore = "CASE WHEN s.tipo = :simTipo THEN 3 ELSE 0 END";
        $params['simTipo'] = $tipo;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo' AND s.id != :sampleId"
             . " ORDER BY ({$tagScore} + {$bpmScore} + {$keyScore} + {$tipoScore}) DESC,"
             . " s.total_likes DESC LIMIT :limit";

        return PostgresService::consultar($sql, $params);
    }
}
