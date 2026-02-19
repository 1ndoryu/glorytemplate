<?php

/**
 * MotorRecomendacion — Orquestador de scoring y recomendación v3.
 *
 * A01 SOLID split: Lógica de señales extraída a ConstructorSenales,
 * perfil de usuario extraído a PerfilUsuario.
 * Este archivo conserva la orquestación (feed, cache, similares).
 *
 * 6 señales: Similitud contenido (0.25), Comportamiento (0.25),
 * Contexto (0.15), Tendencias (0.15), Grafo social (0.10), Novedad (0.10).
 *
 * Cache: WP transients con invalidación al publicar/interactuar.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Services\ConstructorSenales;
use App\Kamples\Services\PerfilUsuario;
use App\Kamples\LogAlgoritmo as KamplesLogger;

class MotorRecomendacion
{
    private static ?array $pesos = null;
    private static ?bool $pgvectorDisponible = null;
    private const CACHE_TTL = 300; /* 5 minutos */
    private const CACHE_PREFIX = 'kamples_feed_';

    /**
     * Proxy retrocompatible: delega a ConstructorSenales::sqlTagsEnriquecidos.
     * @deprecated Usar ConstructorSenales::sqlTagsEnriquecidos() directamente.
     */
    public static function sqlTagsEnriquecidos(string $alias): string
    {
        return ConstructorSenales::sqlTagsEnriquecidos($alias);
    }

    /**
     * Carga los pesos desde el archivo de configuración.
     */
    private static function cargarPesos(): array
    {
        if (self::$pesos === null) {
            $ruta = \dirname(__DIR__) . '/Config/algoritmoPesos.php';
            self::$pesos = \file_exists($ruta) ? require $ruta : [];
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
        self::$pgvectorDisponible = SamplesRepository::verificarPgvector();
        return self::$pgvectorDisponible;
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
            if ($cached !== false && \is_array($cached)) {
                KamplesLogger::debug('Algoritmo: Sirviendo desde cache', [
                    'cacheKey' => $cacheKey, 'resultados' => \count($cached),
                ]);
                return $cached;
            }
        }

        $config = self::cargarPesos();
        $pesos = $config['senales'] ?? [];
        $params = $config['parametros'] ?? [];

        /* Obtener perfil de preferencias del usuario */
        $perfilUsuario = PerfilUsuario::construir($userId);

        if (empty($perfilUsuario['interacciones']) && ($params['min_interacciones'] ?? 5) > 0) {
            KamplesLogger::info('Algoritmo: Usuario nuevo sin interacciones, usando feed de tendencias', [
                'userId' => $userId, 'interacciones' => $perfilUsuario['interacciones'] ?? 0,
            ]);
            $resultado = self::feedNuevoUsuario($limite, $offset, $userId);
            if ($offset === 0 && !empty($resultado)) {
                \set_transient($cacheKey ?? '', $resultado, self::CACHE_TTL);
            }
            return $resultado;
        }

        $queryParams = ['userId' => $userId, 'limit' => $limite, 'offset' => $offset];

        /*
         * Construir query SQL con scoring multi-señal.
         * Cada señal genera una sub-expresión SQL ponderada (delegada a ConstructorSenales).
         */
        $additiveParts = [];

        /* Señal 1: Comportamiento — 5 sub-factores ponderados */
        $pesoComportamiento = $pesos['comportamiento'] ?? 0.25;
        if ($pesoComportamiento > 0) {
            $additiveParts[] = ConstructorSenales::sqlComportamiento($userId, $pesoComportamiento, $config, $queryParams);
        }

        /* Señal 2: Contexto — BPM proximidad, key match, género match, tipo match */
        $pesoContexto = $pesos['contexto'] ?? 0.15;
        if ($pesoContexto > 0) {
            $additiveParts[] = ConstructorSenales::sqlContexto($userId, $pesoContexto, $perfilUsuario, $config, $queryParams);
        }

        /* Señal 3: Tendencias — engagement velocity multi-ventana */
        $pesoTendencias = $pesos['tendencias'] ?? 0.15;
        if ($pesoTendencias > 0) {
            $ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
            $additiveParts[] = ConstructorSenales::sqlTendencias($pesoTendencias, $ventanas, $config);
        }

        /* Señal 4: Novedad — boost logarítmico (inline, no necesita servicio) */
        $pesoNovedad = $pesos['novedad'] ?? 0.10;
        if ($pesoNovedad > 0) {
            $diasBoost = (int) ($params['novedad_dias_boost'] ?? 14);
            $sPubAt = SamplesCols::PUBLICADO_AT;
        $additiveParts[] = "({$pesoNovedad} * GREATEST(0, 1 - LN(GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / 86400)) / LN({$diasBoost})))";
        }

        /* Señal 5: Grafo social — samples de seguidos + likes de seguidos */
        $pesoSocial = $pesos['grafo_social'] ?? 0.10;
        if ($pesoSocial > 0) {
            $additiveParts[] = ConstructorSenales::sqlGrafoSocial($userId, $pesoSocial, $queryParams);
        }

        /* Señal 6: Similitud de contenido — pgvector coseno */
        $pgvActivo = self::pgvectorActivo();
        KamplesLogger::debug('Algoritmo: pgvector activo', ['activo' => $pgvActivo]);
        if ($pgvActivo) {
            $pesoSimilitud = $pesos['similitud_contenido'] ?? 0.25;
            if ($pesoSimilitud > 0) {
                $sqlSim = ConstructorSenales::sqlSimilitudContenido($userId, $pesoSimilitud, $queryParams);
                if ($sqlSim !== '0') {
                    $additiveParts[] = $sqlSim;
                }
            }
        }

        /* Sumar todas las señales aditivas */
        $scoreAditivo = !empty($additiveParts) ? '(' . \implode(' + ', $additiveParts) . ')' : '1';

        KamplesLogger::info('Algoritmo: Señales construidas', [
            'userId' => $userId,
            'numSenales' => \count($additiveParts),
            'perfilInteracciones' => $perfilUsuario['interacciones'] ?? 0,
            'bpmProm' => $perfilUsuario['bpmProm'] ?? 0,
            'keyFav' => $perfilUsuario['keyFav'] ?? null,
            'tipoFav' => $perfilUsuario['tipoFav'] ?? null,
        ]);

        /* Multiplicador de penalización por ya escuchado */
        $penConfig = $params['penalizacion_ya_escuchado'] ?? [];
        $umbralRepro = (int) ($penConfig['umbral_reproducciones'] ?? 3);
        $factorPen = (float) ($penConfig['factor_penalizacion'] ?? 0.3);
        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $sId = SamplesCols::ID;
        $penalizacion = "(CASE WHEN (SELECT COUNT(*) FROM {$trep} WHERE {$trUid} = :userId AND {$trSid} = s.{$sId}) >= {$umbralRepro} THEN {$factorPen} ELSE 1 END)";

        /* C178: Boost para samples verificados por humano */
        $boostVerificado = (float) ($params['verificado_boost'] ?? 1.15);
        $sVerif = SamplesCols::VERIFICADO;
        $multiplicadorVerificado = "(CASE WHEN s.{$sVerif} = true THEN {$boostVerificado} ELSE 1 END)";

        $scoreTotal = "{$scoreAditivo} * {$penalizacion} * {$multiplicadorVerificado}";

        /* Diversidad por creador como penalización suave */
        $maxPorCreador = (int) ($params['max_por_creador'] ?? 3);

        /*
         * C74: Penalización suave a partir del Nº sample por creador.
         * Los primeros rankean alto, los siguientes bajan pero NUNCA se excluyen.
         */
        /*
         * FIX verificado_sample: El CTE debe usar los mismos aliases que sqlSelectSamples()
         * para que NormalizadorSample::normalizar() encuentre 'verificado_sample'.
         * Sin el alias, s.verificado es sobreescrito por u.verificado en el array asociativo
         * de PDO (último valor con mismo key gana), y 'verificado_sample' no existe → siempre false.
         */
        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $sCreadorId = SamplesCols::CREADOR_ID;
        $sEstado = SamplesCols::ESTADO;
        $sMostrar = SamplesCols::MOSTRAR_EN_COMUNIDAD;
        $uId = UsuariosExtCols::ID;
        $uUser = UsuariosExtCols::USERNAME;
        $uNombre = UsuariosExtCols::NOMBRE_VISIBLE;
        $uAvatar = UsuariosExtCols::AVATAR_URL;
        $uVerif = UsuariosExtCols::VERIFICADO;
        $uWpId = UsuariosExtCols::WP_USER_ID;
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;

        $sql = "WITH scored AS (
                    SELECT s.*, s.{$sVerif} AS verificado_sample, s.{$sMostrar},
                           u.{$uUser}, u.{$uNombre}, u.{$uAvatar}, u.{$uVerif},
                           u.{$uWpId} AS creador_wp_user_id,
                           u.{$uId} as creador_id,
                           (SELECT {$lReacc} FROM {$tl} WHERE {$lUid} = :userId AND {$lTipo} = '{$ltSample}' AND {$lTarget} = s.{$sId} LIMIT 1) AS reaccion_usuario,
                           ({$scoreTotal}) as score,
                           ROW_NUMBER() OVER (PARTITION BY s.{$sCreadorId} ORDER BY ({$scoreTotal}) DESC) as rn
                    FROM {$ts} s
                    LEFT JOIN {$tu} u ON s.{$sCreadorId} = u.{$uId}
                    WHERE s.{$sEstado} = '{$eActivo}'
                )
                SELECT * FROM scored
                ORDER BY (score * CASE WHEN rn <= {$maxPorCreador} THEN 1 ELSE GREATEST(0.3, 1.0 - (rn - {$maxPorCreador}) * 0.15) END) DESC
                LIMIT :limit OFFSET :offset";

        $resultado = SamplesRepository::consultar($sql, $queryParams);

        KamplesLogger::info('Algoritmo: Resultados obtenidos', [
            'userId' => $userId, 'totalResultados' => \count($resultado),
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
    private static function feedNuevoUsuario(int $limite, int $offset, ?int $userId = null): array
    {
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sTotLikes = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $sPubAt = SamplesCols::PUBLICADO_AT;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE s.{$sEstado} = '{$eActivo}'"
             . " ORDER BY (s.{$sTotLikes} * 2 + s.{$sTotRepro} + s.{$sTotDesc} * 3)"
             . "   * GREATEST(0.1, 1 - EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / (86400 * 30)) DESC"
             . " LIMIT :limit OFFSET :offset";

        return SamplesRepository::consultar($sql, ['limit' => $limite, 'offset' => $offset]);
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
     * Usa embeddings pgvector (cosine distance) con fallback a scoring por tags + BPM + key + tipo.
     */
    public static function samplesSimilares(int $sampleId, int $limite = 5, ?int $userId = null): array
    {
        $config = self::cargarPesos();

        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sId = SamplesCols::ID;
        $sEmbed = SamplesCols::EMBEDDING;
        $ts = SamplesCols::TABLA;

        if (self::pgvectorActivo()) {
            if (SamplesRepository::verificarTieneEmbedding($sampleId)) {
                $similares = SamplesRepository::consultar(
                    NormalizadorSample::sqlSelectSamples()
                    . " WHERE s.{$sEstado} = '{$eActivo}' AND s.{$sId} != :sampleId AND s.{$sEmbed} IS NOT NULL"
                    . " ORDER BY s.{$sEmbed} <=> (SELECT {$sEmbed} FROM {$ts} WHERE {$sId} = :sampleId)"
                    . " LIMIT :limit",
                    ['sampleId' => $sampleId, 'limit' => $limite]
                );

                if (!empty($similares)) return $similares;
            }
        }

        /* Fallback: scoring por tags, BPM, key, tipo */
        $sample = SamplesRepository::buscarMetadataParaSimilares($sampleId);

        if (!$sample) return [];

        $tags = NormalizadorSample::pgArrayToPhp($sample[SamplesCols::TAGS] ?? '');
        $bpm = $sample[SamplesCols::BPM] ? (int) $sample[SamplesCols::BPM] : null;
        $key = $sample[SamplesCols::KEY] ?? null;
        $tipo = $sample[SamplesCols::TIPO] ?? SamplesEnums::TIPO_ONESHOT;
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $params = ['sampleId' => $sampleId, 'limit' => $limite];

        /* Score por tags en común */
        $sTags = SamplesCols::TAGS;
        $tagParts = [];
        foreach (\array_slice($tags, 0, 10) as $i => $tag) {
            $tagParts[] = "CASE WHEN :tag{$i} = ANY(s.{$sTags}) THEN 2 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagParts) ? '(' . \implode(' + ', $tagParts) . ')' : '0';

        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sTipo = SamplesCols::TIPO;
        $sTotLk = SamplesCols::TOTAL_LIKES;

        $bpmScore = $bpm
            ? "GREATEST(0, {$toleranciaBpm} - ABS(COALESCE(s.{$sBpm}, 0) - {$bpm})) / {$toleranciaBpm} * 5"
            : "0";

        $keyScore = $key ? "CASE WHEN s.{$sKey} = :simKey THEN 5 ELSE 0 END" : "0";
        if ($key) $params['simKey'] = $key;

        $tipoScore = "CASE WHEN s.{$sTipo} = :simTipo THEN 3 ELSE 0 END";
        $params['simTipo'] = $tipo;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.{$sEstado} = '{$eActivo}' AND s.{$sId} != :sampleId"
             . " ORDER BY ({$tagScore} + {$bpmScore} + {$keyScore} + {$tipoScore}) DESC,"
             . " s.{$sTotLk} DESC LIMIT :limit";

        return SamplesRepository::consultar($sql, $params);
    }
}
