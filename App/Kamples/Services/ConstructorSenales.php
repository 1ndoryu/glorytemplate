<?php
/* sentinel-disable-file limite-lineas — fragmentos SQL de scoring cohesivos, comparten config/pesos; TO-DO: extraer senal por dominio */

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
 *
 * TO-DO [D2]: 655 lineas raw (~450 efectivas). Candidato a split:
 * - ConstructorSenalesPositivas: tags, similitud, comportamiento, contexto, tendencias, grafo social
 * - ConstructorPenalizaciones: reproduccion, pasiva, saturacion, statsDescargas
 */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\FollowsCols;
use App\Kamples\Services\GeneradorEmbeddings;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\LogAlgoritmo;

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
        $gKey = CancionesCols::GENERO;

        return "(SELECT COALESCE(ARRAY_AGG(LOWER(t)), ARRAY[]::text[]) FROM UNNEST(
            COALESCE({$alias}.tags, ARRAY[]::text[])
            || COALESCE(
                CASE
                    WHEN jsonb_typeof({$alias}.metadata->'{$gKey}') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text({$alias}.metadata->'{$gKey}'))
                    WHEN {$alias}.metadata->>'{$gKey}' IS NOT NULL AND {$alias}.metadata->>'{$gKey}' != ''
                    THEN ARRAY[{$alias}.metadata->>'{$gKey}']
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
            WHERE {$tagsCandidato} @> ARRAY[liked_tags.tag::text]
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
            WHERE {$tagsCandidato} @> ARRAY[repro_tags.tag::text]
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
            WHERE {$tagsCandidato} @> ARRAY[tiempo_tags.tag::text]
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
            WHERE {$tagsCandidato} @> ARRAY[desc_tags.tag::text]
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
            WHERE {$tagsCandidato} @> ARRAY[comp_tags.tag::text]
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
            WHERE {$tagsCandidato} @> ARRAY[dislike_tags.tag::text]
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

        /*
         * Genero/metadata match: tags enriquecidos del candidato vs top tags del usuario.
         * Combina tags derivados de interacciones (likes) con generos declarados
         * del onboarding. Para usuarios nuevos sin interacciones, solo los generos
         * declarados determinan el match. A medida que el usuario interactua,
         * los tags de comportamiento dominan naturalmente (LIMIT 8).
         */
        $generosDeclarados = $perfilUsuario['generosDeclarados'] ?? [];
        $generosDeclSql = '';
        if (!empty($generosDeclarados)) {
            $placeholdersGeneros = [];
            foreach ($generosDeclarados as $i => $g) {
                $key = "generoDec{$i}";
                $params[$key] = strtolower($g);
                $placeholdersGeneros[] = ":{$key}";
            }
            $listaGeneros = implode(', ', $placeholdersGeneros);
            $generosDeclSql = "UNION ALL SELECT UNNEST(ARRAY[{$listaGeneros}]) as tag, 1 as freq";
        }

        $generoScore = "COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length({$tagsCandidato}, 1))
            FROM (
                (SELECT tag, COUNT(*) as freq FROM (
                    SELECT UNNEST({$tagsInner}) as tag
                    FROM {$tl} l_inner
                    JOIN {$ts} s_inner ON l_inner.{$lTarget} = s_inner.{$sId}
                    WHERE l_inner.{$lUid} = :userId AND l_inner.{$lTipo} = '{$ltSample}' AND l_inner.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
                ) t GROUP BY tag ORDER BY freq DESC LIMIT 8)
                {$generosDeclSql}
            ) top_tags
            WHERE {$tagsCandidato} @> ARRAY[top_tags.tag::text]
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
     * Señal de Tendencias — engagement velocity absoluto en ventana temporal.
     * Mide interacciones recientes sin sesgo por edad del sample.
     * Los samples no pierden valor con el tiempo — usa normalizadores
     * absolutos por ventana en vez de dividir por horas desde publicación.
     *
     * Opt-8: Si $usarVistaMatTrending=true, referencia mv_trending_samples (pre-agregado)
     * en vez de ejecutar 4 subqueries correlacionadas por fila.
     * El JOIN a mv_trending_samples lo agrega MotorRecomendacion en el CTE base_scores.
     */
    public static function sqlTendencias(float $peso, array $ventanas, array $config, bool $usarVistaMatTrending = false): string
    {
        $detalle = $config['tendencias_detalle'] ?? [];
        $pesoLikes24h = $detalle['likes_24h'] ?? 0.40;
        $pesoRepro24h = $detalle['reproducciones_24h'] ?? 0.30;
        $pesoDescargas7d = $detalle['descargas_7d'] ?? 0.20;
        $pesoFollows7d = $detalle['follows_creador_7d'] ?? 0.10;

        /*
         * Normalizadores absolutos por ventana.
         * Reemplazan la división por horasPublicado que penalizaba samples antiguos.
         * Así un sample de hace 2 años con 10 likes en 24h puntúa igual que uno nuevo.
         */
        $norm = $config['tendencias_normalizadores'] ?? [];
        $maxLikes = (int) ($norm['max_likes_ventana_corta'] ?? 15);
        $maxRepro = (int) ($norm['max_repro_ventana_corta'] ?? 30);
        $maxDescargas = (int) ($norm['max_descargas_ventana_media'] ?? 20);
        $maxFollows = (int) ($norm['max_follows_ventana_media'] ?? 10);

        /*
         * Opt-8: Si la vista materializada existe y se pidio usarla,
         * referirnos a columnas pre-calculadas del LEFT JOIN (alias 'mvt').
         * Esto elimina 4 subqueries correlacionadas por fila.
         */
        if ($usarVistaMatTrending) {
            $likes24h = "COALESCE(mvt.likes_24h, 0)";
            $repro24h = "COALESCE(mvt.repro_24h, 0)";
            $descargas7d = "COALESCE(mvt.descargas_7d, 0)";
            $follows7d = "COALESCE(mvt.follows_7d, 0)";
        } else {
            /* Fallback: subqueries correlacionadas originales */
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
            $trep = ReproduccionesCols::TABLA;
            $trSid = ReproduccionesCols::SAMPLE_ID;
            $trCreAt = ReproduccionesCols::CREATED_AT;
            $td = DescargasCols::TABLA;
            $dSid = DescargasCols::SAMPLE_ID;
            $dCreAt = DescargasCols::CREATED_AT;
            $tf = FollowsCols::TABLA;
            $fSeguidoId = FollowsCols::SEGUIDO_ID;
            $fCreAt = FollowsCols::CREATED_AT;

            /* @codeSentinel-ignore INTERVAL — $ventanaCorta y $ventanaMedia validadas con whitelist */
            $likes24h = "COALESCE((SELECT SUM(CASE WHEN {$lReacc} = '{$lrEncanta}' THEN 2 WHEN {$lReacc} = '{$lrLike}' THEN 1 WHEN {$lReacc} = '{$lrDislike}' THEN -1 ELSE 0 END) FROM {$tl} WHERE {$lTipo} = '{$ltSample}' AND {$lTarget} = s.{$sId} AND {$lCreAt} > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

            $repro24h = "COALESCE((SELECT COUNT(*) FROM {$trep} WHERE {$trSid} = s.{$sId} AND {$trCreAt} > NOW() - INTERVAL '{$ventanaCorta}'), 0)";

            /* @codeSentinel-ignore INTERVAL — misma whitelist */
            $descargas7d = "COALESCE((SELECT COUNT(*) FROM {$td} WHERE {$dSid} = s.{$sId} AND {$dCreAt} > NOW() - INTERVAL '{$ventanaMedia}'), 0)";

            /* @codeSentinel-ignore INTERVAL — misma whitelist */
            $follows7d = "COALESCE((SELECT COUNT(*) FROM {$tf} WHERE {$fSeguidoId} = s.{$sCreadorId} AND {$fCreAt} > NOW() - INTERVAL '{$ventanaMedia}'), 0)";
        }

        /*
         * Normalización por valores máximos absolutos en vez de por edad.
         * Cada sub-factor acotado a [0,1] con LEAST.
         */
        return "({$peso} * (
            {$pesoLikes24h} * LEAST(1.0, GREATEST(0, {$likes24h}::float) / {$maxLikes}) +
            {$pesoRepro24h} * LEAST(1.0, {$repro24h}::float / {$maxRepro}) +
            {$pesoDescargas7d} * LEAST(1.0, {$descargas7d}::float / {$maxDescargas}) +
            {$pesoFollows7d} * LEAST(1.0, {$follows7d}::float / {$maxFollows})
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

    /**
     * Penalización progresiva por reproducciones ponderadas por calidad.
     *
     * Usa SUM(peso_calidad) en vez de COUNT(*):
     * - Significativa (escuchó >= umbral adaptativo): peso 1.0
     * - Rápida (escuchó algo pero < umbral): peso configurable (default 0.3)
     * - Ignorada (< 1s): peso 0 (no cuenta)
     * - Legacy (duracion_escuchada=0): configurable (default = significativa)
     *
     * Umbrales adaptativos según duración del sample:
     * - Corto (<= 20s): >= 50% del sample
     * - Medio (20-60s): >= 30% o mínimo 10s
     * - Largo (> 60s): >= 15% o mínimo 10s
     *
     * Formula: max(minimo, 1 / (1 + sum_ponderada * tasa))
     */
    public static function sqlPenalizacionReproduccion(int $userId, array $config): string
    {
        $penConfig = $config['parametros']['penalizacion_reproduccion'] ?? [];
        $tasa = (float) ($penConfig['tasa_decaimiento'] ?? 0.15);
        $minimo = (float) ($penConfig['minimo'] ?? 0.20);

        $clasConfig = $config['parametros']['clasificacion_reproduccion'] ?? [];
        $habilitado = $clasConfig['habilitado'] ?? true;

        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $trDur = ReproduccionesCols::DURACION_ESCUCHADA;
        $sId = SamplesCols::ID;
        $sDuracion = SamplesCols::DURACION;

        if (!$habilitado) {
            /* Sin clasificación: comportamiento legacy con COUNT */
            return "GREATEST({$minimo}, 1.0 / (1.0 + COALESCE((SELECT COUNT(*) FROM {$trep} WHERE {$trUid} = :userId AND {$trSid} = s.{$sId}), 0) * {$tasa}))";
        }

        $umbralMin = (float) ($clasConfig['umbral_minimo_seg'] ?? 1);
        $pctCorto = (float) ($clasConfig['porcentaje_significativa_corto'] ?? 0.50);
        $pctMedio = (float) ($clasConfig['porcentaje_significativa_medio'] ?? 0.30);
        $pctLargo = (float) ($clasConfig['porcentaje_significativa_largo'] ?? 0.15);
        $minAbsoluto = (int) ($clasConfig['minimo_absoluto_significativa'] ?? 10);
        $pesoRapida = (float) ($clasConfig['peso_rapida'] ?? 0.30);
        $legacyComoSig = ($clasConfig['legacy_como_significativa'] ?? true) ? '1.0' : (string) $pesoRapida;

        /*
         * CASE clasifica cada reproducción según duración escuchada vs duración del sample:
         * 1. Legacy (duracion_escuchada=0): configurable
         * 2. Ignorada (< umbral_minimo): peso 0
         * 3. Significativa: cumple umbral adaptativo → peso 1.0
         * 4. Rápida: escuchó algo pero no suficiente → peso reducido
         */
        $sumPonderada = "(SELECT COALESCE(SUM(
            CASE
                /* Legacy: datos sin tracking de duración */
                WHEN r_pen.{$trDur} = 0 THEN {$legacyComoSig}
                /* Ignorada: < umbral_minimo (accidental) */
                WHEN r_pen.{$trDur} < {$umbralMin} THEN 0
                /* Significativa: cumple umbral adaptativo según duración del sample */
                WHEN CASE
                    WHEN s.{$sDuracion} <= 20 THEN r_pen.{$trDur} >= s.{$sDuracion} * {$pctCorto}
                    WHEN s.{$sDuracion} <= 60 THEN r_pen.{$trDur} >= GREATEST({$minAbsoluto}, s.{$sDuracion} * {$pctMedio})
                    ELSE r_pen.{$trDur} >= GREATEST({$minAbsoluto}, s.{$sDuracion} * {$pctLargo})
                END THEN 1.0
                /* Rápida: escuchó algo pero no suficiente */
                ELSE {$pesoRapida}
            END
        ), 0) FROM {$trep} r_pen WHERE r_pen.{$trUid} = :userId AND r_pen.{$trSid} = s.{$sId})";

        return "GREATEST({$minimo}, 1.0 / (1.0 + {$sumPonderada} * {$tasa}))";
    }

    /**
     * Penalización pasiva: reproducción sin acción positiva.
     * Si el usuario reprodujo un sample >= N veces pero NO dio like,
     * NI lo descargó, NI lo guardó en colección → "dislike implícito".
    /**
     * Penalización pasiva: reproducciones significativas sin acción positiva.
     *
     * Solo cuenta reproducciones donde el usuario escuchó lo suficiente
     * (clasificadas como "significativas" por el sistema de calidad).
     * Quick-plays no disparan esta penalización — el usuario no tuvo
     * oportunidad real de decidir si le gustaba.
     *
     * @param int $userId ID del usuario
     * @param array $config Configuración completa del algoritmo
     * @return string Fragmento SQL multiplicativo (1 = sin penalty, factor < 1 = penalizado)
     */
    public static function sqlPenalizacionPasiva(int $userId, array $config): string
    {
        $penConfig = $config['parametros']['penalizacion_pasiva'] ?? [];
        if (!($penConfig['habilitado'] ?? true)) return '1';

        $factor = (float) ($penConfig['factor'] ?? 0.85);
        $minRepro = (int) ($penConfig['min_reproducciones'] ?? 2);
        $userId_int = (int) $userId;

        $clasConfig = $config['parametros']['clasificacion_reproduccion'] ?? [];
        $clasHabilitado = $clasConfig['habilitado'] ?? true;

        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $trDur = ReproduccionesCols::DURACION_ESCUCHADA;
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTarget = LikesCols::TARGET_ID;
        $lTipo = LikesCols::TIPO;
        $td = DescargasCols::TABLA;
        $dUid = DescargasCols::USUARIO_ID;
        $dSid = DescargasCols::SAMPLE_ID;
        $tcs = ColeccionSamplesCols::TABLA;
        $csSid = ColeccionSamplesCols::SAMPLE_ID;
        $csColId = ColeccionSamplesCols::COLECCION_ID;
        $tcCol = ColeccionesCols::TABLA;
        $colId = ColeccionesCols::ID;
        $colUid = ColeccionesCols::USUARIO_ID;
        $sId = SamplesCols::ID;
        $sDuracion = SamplesCols::DURACION;
        $ltSample = LikesEnums::TIPO_SAMPLE;

        /*
         * Contar solo reproducciones significativas (donde el usuario realmente escuchó).
         * Quick-plays (< umbral adaptativo) no disparan penalización pasiva.
         */
        if ($clasHabilitado) {
            $umbralMin = (float) ($clasConfig['umbral_minimo_seg'] ?? 1);
            $pctCorto = (float) ($clasConfig['porcentaje_significativa_corto'] ?? 0.50);
            $pctMedio = (float) ($clasConfig['porcentaje_significativa_medio'] ?? 0.30);
            $pctLargo = (float) ($clasConfig['porcentaje_significativa_largo'] ?? 0.15);
            $minAbsoluto = (int) ($clasConfig['minimo_absoluto_significativa'] ?? 10);

            $hasPlayed = "(SELECT COUNT(*) FROM {$trep} rp WHERE rp.{$trUid} = :userId AND rp.{$trSid} = s.{$sId}
                AND rp.{$trDur} >= {$umbralMin}
                AND CASE
                    WHEN rp.{$trDur} = 0 THEN true
                    WHEN s.{$sDuracion} <= 20 THEN rp.{$trDur} >= s.{$sDuracion} * {$pctCorto}
                    WHEN s.{$sDuracion} <= 60 THEN rp.{$trDur} >= GREATEST({$minAbsoluto}, s.{$sDuracion} * {$pctMedio})
                    ELSE rp.{$trDur} >= GREATEST({$minAbsoluto}, s.{$sDuracion} * {$pctLargo})
                END
            ) >= {$minRepro}";
        } else {
            /* Sin clasificación: contar todas las reproducciones como antes */
            $hasPlayed = "(SELECT COUNT(*) FROM {$trep} WHERE {$trUid} = :userId AND {$trSid} = s.{$sId}) >= {$minRepro}";
        }

        /* NO tiene like/reacción */
        $noLike = "NOT EXISTS (SELECT 1 FROM {$tl} WHERE {$lUid} = :userId AND {$lTipo} = '{$ltSample}' AND {$lTarget} = s.{$sId})";

        /* NO lo descargó */
        $noDownload = "NOT EXISTS (SELECT 1 FROM {$td} WHERE {$dUid} = {$userId_int} AND {$dSid} = s.{$sId})";

        /* NO lo guardó en colección */
        $noSaved = "NOT EXISTS (SELECT 1 FROM {$tcs} cs_p JOIN {$tcCol} c_p ON cs_p.{$csColId} = c_p.{$colId} WHERE c_p.{$colUid} = {$userId_int} AND cs_p.{$csSid} = s.{$sId})";

        return "(CASE WHEN {$hasPlayed} AND {$noLike} AND {$noDownload} AND {$noSaved} THEN {$factor} ELSE 1 END)";
    }

    /**
     * Saturación de popularidad con umbrales dinámicos (percentiles de la plataforma).
     *
     * En modo 'dinamico': calcula P75 y P95 de descargas de samples activos,
     * y los usa como umbral y escala respectivamente. Se adapta automáticamente
     * al crecimiento de la plataforma. Stats cacheadas en WP transient.
     *
     * En modo 'fijo': usa los valores hardcodeados de config (fallback/override).
     *
     * Formula: max(minimo, 1 / (1 + LN(1 + max(0, descargas - umbral) / escala)))
     *
     * @param array $config Configuración completa del algoritmo
     * @return string Fragmento SQL multiplicativo
     */
    public static function sqlSaturacionPopularidad(array $config): string
    {
        $satConfig = $config['parametros']['saturacion_popularidad'] ?? [];
        if (!($satConfig['habilitado'] ?? true)) return '1';

        $minimo = (float) ($satConfig['minimo'] ?? 0.30);
        $modo = $satConfig['modo'] ?? 'dinamico';

        if ($modo === 'dinamico') {
            $stats = self::obtenerStatsDescargas($satConfig);
            $umbral = $stats['umbral'];
            $escala = $stats['escala'];
        } else {
            $umbral = (int) ($satConfig['umbral_descargas'] ?? 50);
            $escala = (int) ($satConfig['escala'] ?? 100);
        }

        /* Protección: escala nunca puede ser 0 (evita división por cero) */
        $escala = \max(1, $escala);

        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;

        return "GREATEST({$minimo}, 1.0 / (1.0 + LN(1.0 + GREATEST(0, s.{$sTotDesc} - {$umbral})::float / {$escala})))";
    }

    /**
     * Calcula stats de descargas de la plataforma para saturación dinámica.
     *
     * Usa percentiles configurables (default P75 y P95) sobre samples activos.
     * Cacheado en WP transient para evitar recálculo en cada query del feed.
     *
     * @param array $satConfig Sección 'saturacion_popularidad' de config
     * @return array{umbral: int, escala: int} Umbral y escala calculados
     */
    private static function obtenerStatsDescargas(array $satConfig): array
    {
        $ttl = (int) ($satConfig['cache_ttl'] ?? 3600);
        $cacheKey = 'kamples_sat_pop_stats';

        /* Intentar leer de cache */
        $cached = \get_transient($cacheKey);
        if ($cached !== false && \is_array($cached)) {
            return $cached;
        }

        /* Calcular percentiles con query a BD */
        $pctUmbral = (float) ($satConfig['percentil_umbral'] ?? 0.75);
        $pctEscala = (float) ($satConfig['percentil_escala'] ?? 0.95);
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $ts = SamplesCols::TABLA;

        try {
            $resultado = SamplesRepository::consultar(
                "SELECT 
                    COALESCE(PERCENTILE_CONT({$pctUmbral}) WITHIN GROUP (ORDER BY {$sTotDesc}), 0)::int AS p_umbral,
                    COALESCE(PERCENTILE_CONT({$pctEscala}) WITHIN GROUP (ORDER BY {$sTotDesc}), 0)::int AS p_escala
                 FROM {$ts}
                 WHERE {$sEstado} = :estado AND {$sTotDesc} > 0",
                ['estado' => $eActivo]
            );

            if (!empty($resultado)) {
                $pUmbral = (int) ($resultado[0]['p_umbral'] ?? 0);
                $pEscala = (int) ($resultado[0]['p_escala'] ?? 0);

                /* La escala es la diferencia entre P95 y P75 (rango del top 20%) */
                $escalaCalc = \max(1, $pEscala - $pUmbral);

                /* Mínimos: si la plataforma es nueva, usar fallbacks razonables */
                if ($pUmbral < 1) $pUmbral = (int) ($satConfig['umbral_descargas'] ?? 50);
                if ($escalaCalc < 2) $escalaCalc = (int) ($satConfig['escala'] ?? 100);

                $stats = ['umbral' => $pUmbral, 'escala' => $escalaCalc];
                \set_transient($cacheKey, $stats, $ttl);
                return $stats;
            }
        } catch (\Throwable $e) {
            /* Fallo silencioso: usar fallback fijo y loguear */
            if (\class_exists(LogAlgoritmo::class)) {
                LogAlgoritmo::debug('Saturación dinámica: fallo al calcular percentiles, usando fallback', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        /* Fallback: valores fijos de config */
        return [
            'umbral' => (int) ($satConfig['umbral_descargas'] ?? 50),
            'escala' => (int) ($satConfig['escala'] ?? 100),
        ];
    }
}
