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

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\FollowsCols;
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
        if (!\preg_match('/^[a-z_][a-z0-9_]*$/i', $alias)) {
            throw new \InvalidArgumentException("Alias SQL inválido: {$alias}");
        }

        /*
         * LOWER() obligatorio: tags se almacenan normalizados desde upload,
         * pero datos legacy pueden tener casing mixto. LOWER() garantiza
         * comparaciones case-insensitive sin depender del estado de la BD.
         * ARRAY_AGG + UNNEST para aplicar LOWER a cada elemento individual.
         * Filtra NULLs y strings vacíos para evitar ruido en comparaciones.
         */
        return "(SELECT COALESCE(ARRAY_AGG(LOWER(t)), ARRAY[]::text[]) FROM UNNEST(
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
        ) AS t WHERE t IS NOT NULL AND t != '')";
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

        $sEmbed = SamplesCols::EMBEDDING;

        /*
         * Distancia coseno (<=>): 0 = idénticos, 2 = opuestos.
         * Convertir a similitud: 1 - distancia/2 => rango [0, 1].
         */
        return "({$peso} * CASE WHEN s.{$sEmbed} IS NOT NULL
            THEN GREATEST(0, 1 - (s.{$sEmbed} <=> :userProfileVector::vector) / 2)
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
        $tagsDisliked = self::sqlTagsEnriquecidos('s7');

        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;
        $lrDislike = LikesEnums::REACCION_DISLIKE;
        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $trDur = ReproduccionesCols::DURACION_ESCUCHADA;
        $trComp = ReproduccionesCols::COMPLETADA;
        $td = DescargasCols::TABLA;
        $dUid = DescargasCols::USUARIO_ID;
        $dSid = DescargasCols::SAMPLE_ID;

        /*
         * Sub-factor 1: Afinidad por tags de samples likeados (0.30)
         * Cuenta tags en comun ponderados: encanta=2, like=1, dislike excluido.
         * Acotado a [0,1] con LEAST para evitar desbordamiento.
         */
        $likesTag = "LEAST(1.0, COALESCE((
            SELECT SUM(liked_tags.peso)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsLiked}) as tag,
                       CASE WHEN l.{$lReacc} = '{$lrEncanta}' THEN 2 ELSE 1 END as peso
                FROM {$tl} l
                JOIN {$ts} s2 ON l.{$lTarget} = s2.{$sId}
                WHERE l.{$lUid} = :userId AND l.{$lTipo} = '{$ltSample}' AND l.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
            ) liked_tags
            WHERE liked_tags.tag = ANY({$tagsCandidato})
        ), 0))";

        /* Sub-factor 2: Afinidad por tags de samples reproducidos (0.25) — acotado [0,1] */
        $reproTag = "LEAST(1.0, COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsRepro}) as tag
                FROM {$trep} r
                JOIN {$ts} s3 ON r.{$trSid} = s3.{$sId}
                WHERE r.{$trUid} = :userId
            ) repro_tags
            WHERE repro_tags.tag = ANY({$tagsCandidato})
        ), 0))";

        /* Sub-factor 3: Afinidad calculada por tiempo total escuchado (0.20) — acotado [0,1] */
        $tiempoTag = "LEAST(1.0, COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsTiempo}) as tag
                FROM {$trep} r2
                JOIN {$ts} s4 ON r2.{$trSid} = s4.{$sId}
                WHERE r2.{$trUid} = :userId AND r2.{$trDur} > 10
            ) tiempo_tags
            WHERE tiempo_tags.tag = ANY({$tagsCandidato})
        ), 0))";

        /* Sub-factor 4: Afinidad por tags de samples descargados (0.15) — acotado [0,1] */
        $descargaTag = "LEAST(1.0, COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsDescargas}) as tag
                FROM {$td} d
                JOIN {$ts} s5 ON d.{$dSid} = s5.{$sId}
                WHERE d.{$dUid} = :userId
            ) desc_tags
            WHERE desc_tags.tag = ANY({$tagsCandidato})
        ), 0))";

        /* Sub-factor 5: Afinidad por reproducciones completadas (0.10) — acotado [0,1] */
        $completadasTag = "LEAST(1.0, COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsCompletadas}) as tag
                FROM {$trep} r3
                JOIN {$ts} s6 ON r3.{$trSid} = s6.{$sId}
                WHERE r3.{$trUid} = :userId AND r3.{$trComp} = true
            ) comp_tags
            WHERE comp_tags.tag = ANY({$tagsCandidato})
        ), 0))";

        /*
         * Señal negativa: penalización por afinidad con samples dislikeados.
         * Si el candidato comparte tags con samples que el usuario marcó 'dislike',
         * se resta hasta 0.15 del score total de comportamiento.
         */
        $dislikePenalty = "LEAST(0.15, COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT UNNEST({$tagsDisliked}) as tag
                FROM {$tl} l_d
                JOIN {$ts} s7 ON l_d.{$lTarget} = s7.{$sId}
                WHERE l_d.{$lUid} = :userId AND l_d.{$lTipo} = '{$ltSample}' AND l_d.{$lReacc} = '{$lrDislike}'
            ) dislike_tags
            WHERE dislike_tags.tag = ANY({$tagsCandidato})
        ), 0))";

        return "({$peso} * GREATEST(0, (
            {$pesoLikes} * {$likesTag} +
            {$pesoRepro} * {$reproTag} +
            {$pesoTiempo} * {$tiempoTag} +
            {$pesoDescargas} * {$descargaTag} +
            {$pesoCompletadas} * {$completadasTag}
            - {$dislikePenalty}
        )))";
    }

    /**
     * Señal de Contexto — BPM, key, metadata match, tipo, afinidad creador.
     * C148: Pesos rebalanceados: metadata/creador > BPM/key.
     */
    public static function sqlContexto(int $userId, float $peso, array $perfilUsuario, array $config, array &$params): string
    {
        $detalle = $config['contexto_detalle'] ?? [];
        $pesoBpm = $detalle['bpm_proximidad'] ?? 0.15;
        $pesoKey = $detalle['key_match'] ?? 0.12;
        $pesoEscala = $detalle['escala_match'] ?? 0.08;
        $pesoGenero = $detalle['genero_match'] ?? 0.20;
        $pesoTipo = $detalle['tipo_match'] ?? 0.10;
        $pesoCreador = $detalle['creador_afin'] ?? 0.35;
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $tagsCandidato = self::sqlTagsEnriquecidos('s');
        $tagsInner = self::sqlTagsEnriquecidos('s_inner');

        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sEscala = SamplesCols::ESCALA;
        $sTipo = SamplesCols::TIPO;
        $sCreadorId = SamplesCols::CREADOR_ID;
        $tl = LikesCols::TABLA;
        $lTarget = LikesCols::TARGET_ID;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lReacc = LikesCols::REACCION;
        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;

        /* BPM proximidad al promedio del usuario */
        $bpmProm = $perfilUsuario['bpmProm'] ?? 0;
        $bpmScore = $bpmProm > 0
            ? "GREATEST(0, ({$toleranciaBpm} - ABS(COALESCE(s.{$sBpm}, 0) - {$bpmProm}))::float / {$toleranciaBpm})"
            : "0.5";

        /* Key match: coincide con la key favorita del usuario */
        $keyFav = $perfilUsuario['keyFav'] ?? null;
        if ($keyFav) {
            $params['keyFavUsuario'] = $keyFav;
            $keyScore = "CASE WHEN s.{$sKey} = :keyFavUsuario THEN 1 ELSE 0 END";
        } else {
            $keyScore = "0.5";
        }

        /* Escala match: coincide con la escala favorita del usuario (major/minor) */
        $escalaFav = $perfilUsuario['escalaFav'] ?? null;
        if ($escalaFav) {
            $params['escalaFavUsuario'] = $escalaFav;
            $escalaScore = "CASE WHEN LOWER(s.{$sEscala}) = :escalaFavUsuario THEN 1 ELSE 0 END";
        } else {
            $escalaScore = "0.5";
        }

        /* Genero/metadata match: tags enriquecidos del candidato vs top tags del usuario (excluye dislikes) */
        $generoScore = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                SELECT tag, COUNT(*) as freq FROM (
                    SELECT UNNEST({$tagsInner}) as tag
                    FROM {$tl} l_inner
                    JOIN {$ts} s_inner ON l_inner.{$lTarget} = s_inner.{$sId}
                    WHERE l_inner.{$lUid} = :userId AND l_inner.{$lTipo} = '{$ltSample}' AND l_inner.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
                ) t GROUP BY tag ORDER BY freq DESC LIMIT 8
            ) top_tags
            WHERE top_tags.tag = ANY({$tagsCandidato})
        ), 0)";

        /* Tipo match: coincide con el tipo favorito del usuario */
        $tipoFav = $perfilUsuario['tipoFav'] ?? null;
        if ($tipoFav) {
            $params['tipoFavUsuario'] = $tipoFav;
            $tipoScore = "CASE WHEN s.{$sTipo} = :tipoFavUsuario THEN 1 ELSE 0 END";
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
            $listaCreadores = \implode(', ', $placeholders);
            $creadorScore = "CASE WHEN s.{$sCreadorId} IN ({$listaCreadores}) THEN 1 ELSE 0 END";
        } else {
            $creadorScore = "0";
        }

        return "({$peso} * (
            {$pesoBpm} * {$bpmScore} +
            {$pesoKey} * {$keyScore} +
            {$pesoEscala} * {$escalaScore} +
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

        $tl = LikesCols::TABLA;
        $lReacc = LikesCols::REACCION;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lCreAt = LikesCols::CREATED_AT;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrDislike = LikesEnums::REACCION_DISLIKE;
        $sId = SamplesCols::ID;
        $sCreadorId = SamplesCols::CREADOR_ID;
        $sPubAt = SamplesCols::PUBLICADO_AT;
        $trep = ReproduccionesCols::TABLA;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $trCreAt = ReproduccionesCols::CREATED_AT;
        $td = DescargasCols::TABLA;
        $dSid = DescargasCols::SAMPLE_ID;
        $dCreAt = DescargasCols::CREATED_AT;
        $tf = FollowsCols::TABLA;
        $fSeguidoId = FollowsCols::SEGUIDO_ID;
        $fCreAt = FollowsCols::CREATED_AT;

        /* Reacciones en ultimas 24h: encanta=2, like=1, dislike=-1 */
        $likes24h = "COALESCE((SELECT SUM(CASE WHEN {$lReacc} = '{$lrEncanta}' THEN 2 WHEN {$lReacc} = '{$lrLike}' THEN 1 WHEN {$lReacc} = '{$lrDislike}' THEN -1 ELSE 0 END) FROM {$tl} WHERE {$lTipo} = '{$ltSample}' AND {$lTarget} = s.{$sId} AND {$lCreAt} > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

        $repro24h = "COALESCE((SELECT COUNT(*) FROM {$trep} WHERE {$trSid} = s.{$sId} AND {$trCreAt} > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

        $descargas7d = "COALESCE((SELECT COUNT(*) FROM {$td} WHERE {$dSid} = s.{$sId} AND {$dCreAt} > NOW() - INTERVAL '{$ventanaMedia}'), 0)";

        $follows7d = "COALESCE((SELECT COUNT(*) FROM {$tf} WHERE {$fSeguidoId} = s.{$sCreadorId} AND {$fCreAt} > NOW() - INTERVAL '{$ventanaMedia}'), 0)";

        /* Normalizar por horas desde publicación para medir velocity */
        $horasPublicado = "GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / 3600)";
        $diasPublicado = "GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.{$sPubAt}) / 86400)";

        /*
         * Cada sub-factor se acota a [0,1] con LEAST para evitar que samples
         * con engagement muy alto en poco tiempo dominen el score.
         */
        return "({$peso} * (
            {$pesoLikes24h} * LEAST(1.0, GREATEST(0, {$likes24h}::float) / {$horasPublicado}) +
            {$pesoRepro24h} * LEAST(1.0, {$repro24h}::float / {$horasPublicado}) +
            {$pesoDescargas7d} * LEAST(1.0, {$descargas7d}::float / {$diasPublicado}) +
            {$pesoFollows7d} * LEAST(1.0, {$follows7d}::float / {$diasPublicado})
        ))";
    }

    /**
     * Señal de Grafo Social — samples de seguidos + likes de seguidos.
     * Dos sub-factores: creador seguido (0.6) + likeado por seguidos (0.4).
     */
    public static function sqlGrafoSocial(int $userId, float $peso, array &$params): string
    {
        $sCreadorId = SamplesCols::CREADOR_ID;
        $tf = FollowsCols::TABLA;
        $fSeguidoId = FollowsCols::SEGUIDO_ID;
        $fSeguidorId = FollowsCols::SEGUIDOR_ID;
        $tl = LikesCols::TABLA;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $lUid = LikesCols::USUARIO_ID;
        $sId = SamplesCols::ID;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;

        /* Sub-factor 1: el creador del sample es un usuario seguido (60% del peso social) */
        $seguidoDirecto = "CASE WHEN s.{$sCreadorId} IN (SELECT {$fSeguidoId} FROM {$tf} WHERE {$fSeguidorId} = :userId) THEN 1 ELSE 0 END";

        /* Sub-factor 2: seguidos han reaccionado positivamente a este sample (40% peso social) */
        $likeadoPorSeguidos = "LEAST(1, COALESCE((
            SELECT SUM(CASE WHEN l.{$lReacc} = '{$lrEncanta}' THEN 2 ELSE 1 END)::float
            FROM {$tl} l
            WHERE l.{$lTipo} = '{$ltSample}' AND l.{$lTarget} = s.{$sId}
            AND l.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
            AND l.{$lUid} IN (SELECT {$fSeguidoId} FROM {$tf} WHERE {$fSeguidorId} = :userId)
        ), 0) / 4)";

        return "({$peso} * (0.6 * {$seguidoDirecto} + 0.4 * {$likeadoPorSeguidos}))";
    }
}
