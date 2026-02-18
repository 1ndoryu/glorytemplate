<?php

/**
 * ConstructorSenales — Genera fragmentos SQL de scoring para el motor de recomendación.
 *
 * Extraído de MotorRecomendacion (A01 SOLID split).
 * Cada método retorna un fragmento SQL ponderado que representa una señal:
 * - Tags enriquecidos (tags + metadata IA)
 * - Similitud de contenido (pgvector coseno)
 * - Comportamiento (5 sub-factores)
 * - Contexto (BPM, key, género, tipo, creador)
 * - Tendencias (engagement velocity)
 * - Grafo social (seguidos + likes de seguidos)
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Services\GeneradorEmbeddings;

class ConstructorSenales
{
    /**
     * SQL que genera un array enriquecido con tags + metadata IA (genero, instrumentos, emocion).
     * Uso: reemplazar `s.tags` por `({alias}_enriquecido)` y `UNNEST(s.tags)` por `UNNEST({alias}_enriquecido)`.
     * Alias del sample debe ser el proporcionado (ej: 's', 's2').
     *
     * C181: Público para reutilizar en ColeccionesController y otros consumidores.
     */
    public static function sqlTagsEnriquecidos(string $alias): string
    {
        /* P0-fix: Validar alias para prevenir SQL injection */
        if (!preg_match('/^[a-z_][a-z0-9_]*$/i', $alias)) {
            throw new \InvalidArgumentException("Alias SQL inválido: {$alias}");
        }

        return "(
            COALESCE({$alias}.tags, ARRAY[]::text[])
            || COALESCE(
                CASE
                    WHEN jsonb_typeof({$alias}.metadata->'genero') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text({$alias}.metadata->'genero'))
                    WHEN {$alias}.metadata->>'genero' IS NOT NULL AND {$alias}.metadata->>'genero' != ''
                    THEN ARRAY[{$alias}.metadata->>'genero']
                    ELSE ARRAY[]::text[]
                END, ARRAY[]::text[]
            )
            || COALESCE(
                CASE
                    WHEN jsonb_typeof({$alias}.metadata->'instrumentos') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text({$alias}.metadata->'instrumentos'))
                    WHEN {$alias}.metadata->>'instrumentos' IS NOT NULL AND {$alias}.metadata->>'instrumentos' != ''
                    THEN ARRAY[{$alias}.metadata->>'instrumentos']
                    ELSE ARRAY[]::text[]
                END, ARRAY[]::text[]
            )
            || COALESCE(
                CASE
                    WHEN jsonb_typeof({$alias}.metadata->'emocion') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text({$alias}.metadata->'emocion'))
                    WHEN {$alias}.metadata->>'emocion' IS NOT NULL AND {$alias}.metadata->>'emocion' != ''
                    THEN ARRAY[{$alias}.metadata->>'emocion']
                    ELSE ARRAY[]::text[]
                END, ARRAY[]::text[]
            )
        )";
    }

    /**
     * Señal de Similitud de Contenido (pgvector coseno).
     * Compara el perfil vectorial del usuario con el embedding del sample candidato.
     *
     * @param int $userId ID del usuario
     * @param float $peso Peso de la señal
     * @param array &$params Parámetros de la query principal (se inyecta :userProfileVector)
     * @return string Fragmento SQL para la señal, o '0' si no hay perfil
     */
    public static function sqlSimilitudContenido(int $userId, float $peso, array &$params): string
    {
        $perfil = GeneradorEmbeddings::perfilUsuario($userId);
        if ($perfil === null) return '0';

        $params['userProfileVector'] = GeneradorEmbeddings::vectorAString($perfil);

        /*
         * Distancia coseno (<=>): 0 = idénticos, 2 = opuestos.
         * Convertir a similitud: 1 - distancia/2 => rango [0, 1].
         */
        return "({$peso} * CASE WHEN s.embedding IS NOT NULL
            THEN GREATEST(0, 1 - (s.embedding <=> :userProfileVector::vector) / 2)
            ELSE 0 END)";
    }

    /**
     * Señal de Comportamiento — 5 sub-factores ponderados.
     * likes_dados (0.30), reproducciones (0.25), tiempo_escucha (0.20),
     * descargas (0.15), completadas (0.10).
     * C148: Usa tags enriquecidos (tags + metadata IA: genero, instrumentos, emocion).
     */
    public static function sqlComportamiento(int $userId, float $peso, array $config, array &$params): string
    {
        $detalle = $config['comportamiento_detalle'] ?? [];
        $pesoLikes = $detalle['likes_dados'] ?? 0.30;
        $pesoRepro = $detalle['reproducciones'] ?? 0.25;
        $pesoTiempo = $detalle['tiempo_escucha'] ?? 0.20;
        $pesoDescargas = $detalle['descargas'] ?? 0.15;
        $pesoCompletadas = $detalle['completadas'] ?? 0.10;

        /* Tags enriquecidos: tags del usuario + metadata IA (genero, instrumentos, emocion) */
        $tagsCandidato = self::sqlTagsEnriquecidos('s');
        $tagsLiked = self::sqlTagsEnriquecidos('s2');
        $tagsRepro = self::sqlTagsEnriquecidos('s3');
        $tagsTiempo = self::sqlTagsEnriquecidos('s4');
        $tagsDescargas = self::sqlTagsEnriquecidos('s5');
        $tagsCompletadas = self::sqlTagsEnriquecidos('s6');

        /*
         * Sub-factor 1: Afinidad por tags de samples likeados (0.30)
         * Cuenta tags en comun ponderados: encanta=2, like=1, dislike excluido.
         */
        $likesTag = "COALESCE((
            SELECT SUM(liked_tags.peso)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsLiked}) as tag,
                       CASE WHEN l.reaccion = 'encanta' THEN 2 ELSE 1 END as peso
                FROM likes l
                JOIN samples s2 ON l.target_id = s2.id
                WHERE l.usuario_id = :userId AND l.tipo = 'sample' AND l.reaccion IN ('like', 'encanta')
            ) liked_tags
            WHERE liked_tags.tag = ANY({$tagsCandidato})
        ), 0)";

        /* Sub-factor 2: Afinidad por tags de samples reproducidos (0.25) */
        $reproTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsRepro}) as tag
                FROM reproducciones r
                JOIN samples s3 ON r.sample_id = s3.id
                WHERE r.usuario_id = :userId
            ) repro_tags
            WHERE repro_tags.tag = ANY({$tagsCandidato})
        ), 0)";

        /* Sub-factor 3: Afinidad calculada por tiempo total escuchado (0.20) */
        $tiempoTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsTiempo}) as tag
                FROM reproducciones r2
                JOIN samples s4 ON r2.sample_id = s4.id
                WHERE r2.usuario_id = :userId AND r2.duracion_escuchada > 10
            ) tiempo_tags
            WHERE tiempo_tags.tag = ANY({$tagsCandidato})
        ), 0)";

        /* Sub-factor 4: Afinidad por tags de samples descargados (0.15) */
        $descargaTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsDescargas}) as tag
                FROM descargas d
                JOIN samples s5 ON d.sample_id = s5.id
                WHERE d.usuario_id = :userId
            ) desc_tags
            WHERE desc_tags.tag = ANY({$tagsCandidato})
        ), 0)";

        /* Sub-factor 5: Afinidad por reproducciones completadas (0.10) */
        $completadasTag = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsCompletadas}) as tag
                FROM reproducciones r3
                JOIN samples s6 ON r3.sample_id = s6.id
                WHERE r3.usuario_id = :userId AND r3.completada = true
            ) comp_tags
            WHERE comp_tags.tag = ANY({$tagsCandidato})
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
     * Señal de Contexto — BPM, key, metadata match, tipo, afinidad creador.
     * C148: Pesos rebalanceados: metadata/creador > BPM/key.
     */
    public static function sqlContexto(int $userId, float $peso, array $perfilUsuario, array $config, array &$params): string
    {
        $detalle = $config['contexto_detalle'] ?? [];
        $pesoBpm = $detalle['bpm_proximidad'] ?? 0.15;
        $pesoKey = $detalle['key_match'] ?? 0.10;
        $pesoGenero = $detalle['genero_match'] ?? 0.30;
        $pesoTipo = $detalle['tipo_match'] ?? 0.10;
        $pesoCreador = $detalle['creador_afin'] ?? 0.35;
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $tagsCandidato = self::sqlTagsEnriquecidos('s');
        $tagsInner = self::sqlTagsEnriquecidos('s_inner');

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

        /* Genero/metadata match: tags enriquecidos del candidato vs top tags del usuario (excluye dislikes) */
        $generoScore = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT tag, COUNT(*) as freq FROM (
                    SELECT UNNEST({$tagsInner}) as tag
                    FROM likes l_inner
                    JOIN samples s_inner ON l_inner.target_id = s_inner.id
                    WHERE l_inner.usuario_id = :userId AND l_inner.tipo = 'sample' AND l_inner.reaccion IN ('like', 'encanta')
                ) t GROUP BY tag ORDER BY freq DESC LIMIT 8
            ) top_tags
            WHERE top_tags.tag = ANY({$tagsCandidato})
        ), 0)";

        /* Tipo match: coincide con el tipo favorito del usuario */
        $tipoFav = $perfilUsuario['tipoFav'] ?? null;
        if ($tipoFav) {
            $params['tipoFavUsuario'] = $tipoFav;
            $tipoScore = "CASE WHEN s.tipo = :tipoFavUsuario THEN 1 ELSE 0 END";
        } else {
            $tipoScore = "0.5";
        }

        /* C148: Afinidad de creador — boost si el creador es uno de los favoritos del usuario */
        $creadoresFav = $perfilUsuario['creadoresFav'] ?? [];
        if (!empty($creadoresFav)) {
            $placeholders = [];
            foreach ($creadoresFav as $i => $cId) {
                $key = "creadorFav{$i}";
                $params[$key] = $cId;
                $placeholders[] = ":{$key}";
            }
            $listaCreadores = implode(', ', $placeholders);
            $creadorScore = "CASE WHEN s.creador_id IN ({$listaCreadores}) THEN 1 ELSE 0 END";
        } else {
            $creadorScore = "0";
        }

        return "({$peso} * (
            {$pesoBpm} * {$bpmScore} +
            {$pesoKey} * {$keyScore} +
            {$pesoGenero} * {$generoScore} +
            {$pesoTipo} * {$tipoScore} +
            {$pesoCreador} * {$creadorScore}
        ))";
    }

    /**
     * Señal de Tendencias — engagement velocity multi-ventana.
     * Pondera interacciones recientes con ventanas temporales: 24h, 7d.
     */
    public static function sqlTendencias(float $peso, array $ventanas, array $config): string
    {
        $detalle = $config['tendencias_detalle'] ?? [];
        $pesoLikes24h = $detalle['likes_24h'] ?? 0.40;
        $pesoRepro24h = $detalle['reproducciones_24h'] ?? 0.30;
        $pesoDescargas7d = $detalle['descargas_7d'] ?? 0.20;
        $pesoFollows7d = $detalle['follows_creador_7d'] ?? 0.10;

        $ventanaCorta = $ventanas['corta'] ?? '24 hours';
        $ventanaMedia = $ventanas['media'] ?? '7 days';

        /* P0-fix: Validar que las ventanas son intervalos PG válidos (whitelist) */
        $ventanasValidas = ['1 hour','6 hours','12 hours','24 hours','48 hours','3 days','7 days','14 days','30 days','90 days','365 days'];
        if (!\in_array($ventanaCorta, $ventanasValidas, true)) $ventanaCorta = '24 hours';
        if (!\in_array($ventanaMedia, $ventanasValidas, true)) $ventanaMedia = '7 days';

        /* Reacciones en ultimas 24h: encanta=2, like=1, dislike=-1 */
        $likes24h = "COALESCE((SELECT SUM(CASE WHEN reaccion = 'encanta' THEN 2 WHEN reaccion = 'like' THEN 1 WHEN reaccion = 'dislike' THEN -1 ELSE 0 END) FROM likes WHERE tipo = 'sample' AND target_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

        $repro24h = "COALESCE((SELECT COUNT(*) FROM reproducciones WHERE sample_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

        $descargas7d = "COALESCE((SELECT COUNT(*) FROM descargas WHERE sample_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaMedia}'), 0)";

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
     * Señal de Grafo Social — samples de seguidos + likes de seguidos.
     * Dos sub-factores: creador seguido (0.6) + likeado por seguidos (0.4).
     */
    public static function sqlGrafoSocial(int $userId, float $peso, array &$params): string
    {
        /* Sub-factor 1: el creador del sample es un usuario seguido (60% del peso social) */
        $seguidoDirecto = "CASE WHEN s.creador_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId) THEN 1 ELSE 0 END";

        /* Sub-factor 2: seguidos han reaccionado positivamente a este sample (40% peso social) */
        $likeadoPorSeguidos = "LEAST(1, COALESCE((
            SELECT SUM(CASE WHEN l.reaccion = 'encanta' THEN 2 ELSE 1 END)::float
            FROM likes l
            WHERE l.tipo = 'sample' AND l.target_id = s.id
            AND l.reaccion IN ('like', 'encanta')
            AND l.usuario_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId)
        ), 0) / 4)";

        return "({$peso} * (0.6 * {$seguidoDirecto} + 0.4 * {$likeadoPorSeguidos}))";
    }
}
