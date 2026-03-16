<?php
/* sentinel-disable-file limite-lineas — servicio cohesivo: CTEs + scoring pre-agregado, 3 niveles acoplados */

/**
 * PrecomputadorFeed — Genera CTEs de pre-cómputo para la query del feed.
 *
 * Problema: la query original ejecutaba 9× sqlTagsEnriquecidos (4 JSONB extrations
 * cada uno) + 4 EXISTS por candidato + 5 correlated subqueries en comportamiento.
 * Con 294 samples el total era >30s.
 *
 * Solución: pre-computar en CTEs:
 * 1. Tags enriquecidos de candidatos (1× en vez de 9×)
 * 2. Vectores de afinidad de tags por fuente de interacción
 * 3. Flags de interacción del usuario (LEFT JOINs en vez de EXISTS)
 * 4. IDs de usuarios seguidos (para señal social)
 *
 * Resultado: O(N) + O(M_interacciones) en vez de O(N × M_interacciones).
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\FollowsCols;

class PrecomputadorFeed
{
    /**
     * Genera todas las definiciones CTE de pre-cómputo.
     * Las CTEs se declaran en orden de dependencia.
     *
     * @return array<string, string> Mapa nombreCte => SQL (sin el "AS (...)")
     */
    public static function generarCtes(int $userId, array $config = []): array
    {
        $uid = (int) $userId;
        $ctes = [];

        /* Nivel 0: sin dependencias */
        $ctes['enriched'] = self::cteEnriched();
        $ctes['user_likes'] = self::cteUserLikes($uid);
        $ctes['user_descargas'] = self::cteUserDescargas($uid);
        $ctes['user_colecciones'] = self::cteUserColecciones($uid);
        $ctes['user_comentarios'] = self::cteUserComentarios($uid);
        $ctes['followed_ids'] = self::cteFollowedIds($uid);

        /* Nivel 1: dependen de enriched y/o tablas de interacción */
        $ctes['utag_likes'] = self::cteTagLikes($uid);
        $ctes['utag_repro'] = self::cteTagRepro($uid);
        $ctes['utag_tiempo'] = self::cteTagTiempo($uid);
        $ctes['utag_descargas'] = self::cteTagDescargas($uid);
        $ctes['utag_completadas'] = self::cteTagCompletadas($uid);
        $ctes['utag_dislikes'] = self::cteTagDislikes($uid);
        $ctes['utag_ctx'] = self::cteTagContexto($uid);

        /* Nivel 2: scores pre-agregados (eliminan subqueries correlacionadas del scoring) */
        $ctes['score_tags'] = self::cteScoreTags();
        $ctes['repro_peso'] = self::cteReproPeso($uid, $config);
        $ctes['likes_seguidos_cte'] = self::cteLikesSeguidos();

        return $ctes;
    }

    /**
     * Serializa las CTEs como prefijo WITH para la query.
     * @return string "nombre AS (sql), nombre2 AS (sql2), ..."
     */
    public static function serializarCtes(array $ctes): string
    {
        $partes = [];
        foreach ($ctes as $nombre => $sql) {
            $partes[] = "{$nombre} AS (\n{$sql}\n)";
        }
        return implode(",\n", $partes);
    }

    /**
     * Genera los JOINs de CTEs para base_scores.
     */
    public static function joinsPrecomputo(): string
    {
        $sId = SamplesCols::ID;
        return "JOIN enriched e ON s.{$sId} = e.sample_id\n"
             . "                    LEFT JOIN user_likes ul ON s.{$sId} = ul.sample_id\n"
             . "                    LEFT JOIN user_descargas ud ON s.{$sId} = ud.sample_id\n"
             . "                    LEFT JOIN user_colecciones uc ON s.{$sId} = uc.sample_id\n"
             . "                    LEFT JOIN user_comentarios ucom ON s.{$sId} = ucom.sample_id\n"
             . "                    LEFT JOIN score_tags st ON s.{$sId} = st.sample_id\n"
             . "                    LEFT JOIN repro_peso rp ON s.{$sId} = rp.sample_id\n"
             . "                    LEFT JOIN likes_seguidos_cte ls ON s.{$sId} = ls.sample_id\n"
             . "                    ";
    }

    /* ========== CTEs Nivel 0 ========== */

    private static function cteEnriched(): string
    {
        $sId = SamplesCols::ID;
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $ts = SamplesCols::TABLA;
        $etagsExpr = ConstructorSenales::sqlTagsEnriquecidos('s');

        return "SELECT s.{$sId} AS sample_id, {$etagsExpr} AS etags
            FROM {$ts} s WHERE s.{$sEstado} = '{$eActivo}'";
    }

    private static function cteUserLikes(int $uid): string
    {
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $lCreAt = LikesCols::CREATED_AT;
        $ltSample = LikesEnums::TIPO_SAMPLE;

        return "SELECT DISTINCT ON ({$lTarget}) {$lTarget} AS sample_id, {$lReacc} AS reaccion
            FROM {$tl} WHERE {$lUid} = {$uid} AND {$lTipo} = '{$ltSample}'
            ORDER BY {$lTarget}, {$lCreAt} DESC";
    }

    private static function cteUserDescargas(int $uid): string
    {
        $td = DescargasCols::TABLA;
        $dUid = DescargasCols::USUARIO_ID;
        $dSid = DescargasCols::SAMPLE_ID;
        return "SELECT DISTINCT {$dSid} AS sample_id FROM {$td} WHERE {$dUid} = {$uid}";
    }

    private static function cteUserColecciones(int $uid): string
    {
        $tcs = ColeccionSamplesCols::TABLA;
        $csSid = ColeccionSamplesCols::SAMPLE_ID;
        $csColId = ColeccionSamplesCols::COLECCION_ID;
        $tcCol = ColeccionesCols::TABLA;
        $colId = ColeccionesCols::ID;
        $colUid = ColeccionesCols::USUARIO_ID;

        return "SELECT DISTINCT cs.{$csSid} AS sample_id
            FROM {$tcs} cs JOIN {$tcCol} c ON cs.{$csColId} = c.{$colId}
            WHERE c.{$colUid} = {$uid}";
    }

    private static function cteUserComentarios(int $uid): string
    {
        $tcom = ComentariosCols::TABLA;
        $comAutor = ComentariosCols::AUTOR_ID;
        $comTipo = ComentariosCols::TIPO;
        $comTarget = ComentariosCols::TARGET_ID;
        $comTipoSample = ComentariosEnums::TIPO_SAMPLE;

        return "SELECT DISTINCT {$comTarget} AS sample_id
            FROM {$tcom} WHERE {$comAutor} = {$uid} AND {$comTipo} = '{$comTipoSample}'";
    }

    private static function cteFollowedIds(int $uid): string
    {
        $tf = FollowsCols::TABLA;
        $fSeguidorId = FollowsCols::SEGUIDOR_ID;
        $fSeguidoId = FollowsCols::SEGUIDO_ID;
        return "SELECT {$fSeguidoId} AS user_id FROM {$tf} WHERE {$fSeguidorId} = {$uid}";
    }

    /* ========== CTEs Nivel 1: Tag Affinity (dependen de enriched) ========== */

    private static function cteTagLikes(int $uid): string
    {
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;

        return "SELECT UNNEST(e.etags) AS tag,
                SUM(CASE WHEN l.{$lReacc} = '{$lrEncanta}' THEN 2 ELSE 1 END) AS peso
            FROM {$tl} l JOIN enriched e ON l.{$lTarget} = e.sample_id
            WHERE l.{$lUid} = {$uid} AND l.{$lTipo} = '{$ltSample}'
                AND l.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
            GROUP BY tag";
    }

    /** Helper genérico para CTEs de tags desde reproducciones */
    private static function cteTagDesdeRepro(int $uid, string $filtroExtra = ''): string
    {
        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;

        return "SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
            FROM {$trep} r JOIN enriched e ON r.{$trSid} = e.sample_id
            WHERE r.{$trUid} = {$uid}{$filtroExtra}
            GROUP BY tag";
    }

    private static function cteTagRepro(int $uid): string
    {
        return self::cteTagDesdeRepro($uid);
    }

    private static function cteTagTiempo(int $uid): string
    {
        $trDur = ReproduccionesCols::DURACION_ESCUCHADA;
        return self::cteTagDesdeRepro($uid, " AND r.{$trDur} > 10");
    }

    private static function cteTagCompletadas(int $uid): string
    {
        $trComp = ReproduccionesCols::COMPLETADA;
        return self::cteTagDesdeRepro($uid, " AND r.{$trComp} = true");
    }

    private static function cteTagDescargas(int $uid): string
    {
        $td = DescargasCols::TABLA;
        $dUid = DescargasCols::USUARIO_ID;
        $dSid = DescargasCols::SAMPLE_ID;

        return "SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
            FROM {$td} d JOIN enriched e ON d.{$dSid} = e.sample_id
            WHERE d.{$dUid} = {$uid}
            GROUP BY tag";
    }

    private static function cteTagDislikes(int $uid): string
    {
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrDislike = LikesEnums::REACCION_DISLIKE;

        return "SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
            FROM {$tl} l JOIN enriched e ON l.{$lTarget} = e.sample_id
            WHERE l.{$lUid} = {$uid} AND l.{$lTipo} = '{$ltSample}'
                AND l.{$lReacc} = '{$lrDislike}'
            GROUP BY tag";
    }

    /** Top 8 tags del usuario para genero_match de contexto */
    private static function cteTagContexto(int $uid): string
    {
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;

        return "SELECT tag, SUM(freq) AS freq FROM (
                SELECT UNNEST(e.etags) AS tag, 1 AS freq
                FROM {$tl} l JOIN enriched e ON l.{$lTarget} = e.sample_id
                WHERE l.{$lUid} = {$uid} AND l.{$lTipo} = '{$ltSample}'
                    AND l.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
            ) t GROUP BY tag ORDER BY freq DESC LIMIT 8";
    }

    /* ========== Scoring Expressions (referencian CTEs) ========== */

    /**
     * Comportamiento optimizado v2: referencia columnas pre-agregadas de score_tags CTE.
     * Zero subqueries correlacionadas — O(1) por candidato via hash join.
     */
    public static function sqlComportamiento(float $peso, array $config): string
    {
        $detalle = $config['comportamiento_detalle'] ?? [];
        $pesoLikes = $detalle['likes_dados'] ?? 0.30;
        $pesoRepro = $detalle['reproducciones'] ?? 0.25;
        $pesoTiempo = $detalle['tiempo_escucha'] ?? 0.20;
        $pesoDescargas = $detalle['descargas'] ?? 0.15;
        $pesoCompletadas = $detalle['completadas'] ?? 0.10;

        return "({$peso} * GREATEST(0, (
            {$pesoLikes} * COALESCE(st.likes_score, 0) +
            {$pesoRepro} * COALESCE(st.repro_score, 0) +
            {$pesoTiempo} * COALESCE(st.tiempo_score, 0) +
            {$pesoDescargas} * COALESCE(st.descargas_score, 0) +
            {$pesoCompletadas} * COALESCE(st.completadas_score, 0)
            - LEAST(0.15, COALESCE(st.dislikes_raw, 0))
        )))";
    }

    /**
     * Contexto optimizado: genero_match usa CTE utag_ctx + enriched en vez de
     * recalcular tags enriquecidos inline 2× por candidato.
     */
    public static function sqlContexto(float $peso, array $perfilUsuario, array $config, array &$params): string
    {
        $detalle = $config['contexto_detalle'] ?? [];
        $pesoBpm = $detalle['bpm_proximidad'] ?? 0.15;
        $pesoKey = $detalle['key_match'] ?? 0.12;
        $pesoEscala = $detalle['escala_match'] ?? 0.08;
        $pesoGenero = $detalle['genero_match'] ?? 0.20;
        $pesoTipo = $detalle['tipo_match'] ?? 0.10;
        $pesoCreador = $detalle['creador_afin'] ?? 0.35;
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sEscala = SamplesCols::ESCALA;
        $sTipo = SamplesCols::TIPO;
        $sCreadorId = SamplesCols::CREADOR_ID;

        $bpmProm = $perfilUsuario['bpmProm'] ?? 0;
        $bpmScore = $bpmProm > 0
            ? "GREATEST(0, ({$toleranciaBpm} - ABS(COALESCE(s.{$sBpm}, 0) - {$bpmProm}))::float / {$toleranciaBpm})"
            : '0.5';

        $keyFav = $perfilUsuario['keyFav'] ?? null;
        if ($keyFav) {
            $params['keyFavUsuario'] = $keyFav;
            $keyScore = "CASE WHEN s.{$sKey} = :keyFavUsuario THEN 1 ELSE 0 END";
        } else {
            $keyScore = '0.5';
        }

        $escalaFav = $perfilUsuario['escalaFav'] ?? null;
        if ($escalaFav) {
            $params['escalaFavUsuario'] = $escalaFav;
            $escalaScore = "CASE WHEN LOWER(s.{$sEscala}) = :escalaFavUsuario THEN 1 ELSE 0 END";
        } else {
            $escalaScore = '0.5';
        }

        /* Genero match: usa score_tags.ctx_cnt pre-agregado + inline para declarados */
        $generosDeclarados = $perfilUsuario['generosDeclarados'] ?? [];
        $declSum = '0';
        if (!empty($generosDeclarados)) {
            $declParts = [];
            foreach ($generosDeclarados as $i => $g) {
                $key = "generoDec{$i}";
                $params[$key] = strtolower($g);
                $declParts[] = "CASE WHEN e.etags @> ARRAY[:{$key}::text] THEN 1 ELSE 0 END";
            }
            $declSum = implode(' + ', $declParts);
        }

        $generoScore = "(COALESCE(st.ctx_cnt, 0) + {$declSum})::float / GREATEST(1, COALESCE(st.etags_len, 1))";

        $tipoFav = $perfilUsuario['tipoFav'] ?? null;
        if ($tipoFav) {
            $params['tipoFavUsuario'] = $tipoFav;
            $tipoScore = "CASE WHEN s.{$sTipo} = :tipoFavUsuario THEN 1 ELSE 0 END";
        } else {
            $tipoScore = '0.5';
        }

        $creadoresFav = $perfilUsuario['creadoresFav'] ?? [];
        if (!empty($creadoresFav)) {
            $placeholders = [];
            foreach ($creadoresFav as $i => $cId) {
                $key = "creadorFav{$i}";
                $params[$key] = $cId;
                $placeholders[] = ":{$key}";
            }
            $lista = implode(', ', $placeholders);
            $creadorScore = "CASE WHEN s.{$sCreadorId} IN ({$lista}) THEN 1 ELSE 0 END";
        } else {
            $creadorScore = '0';
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

    /** Grafo social v2: followed_ids (hashed subplan) + likes_seguidos_cte pre-agregado */
    public static function sqlGrafoSocial(float $peso): string
    {
        $sCreadorId = SamplesCols::CREADOR_ID;

        $seguidoDirecto = "CASE WHEN s.{$sCreadorId} IN (SELECT user_id FROM followed_ids) THEN 1 ELSE 0 END";
        $likeadoPorSeguidos = "LEAST(1, COALESCE(ls.score_seguidos, 0) / 4)";

        return "({$peso} * (0.6 * {$seguidoDirecto} + 0.4 * {$likeadoPorSeguidos}))";
    }

    /**
     * Penalización pasiva v2: usa repro_peso CTE pre-agregado.
     * Zero subqueries correlacionadas.
     */
    public static function sqlPenalizacionPasiva(int $userId, array $config): string
    {
        $penConfig = $config['parametros']['penalizacion_pasiva'] ?? [];
        if (!($penConfig['habilitado'] ?? true)) return '1';

        $factor = (float) ($penConfig['factor'] ?? 0.85);
        $minRepro = (int) ($penConfig['min_reproducciones'] ?? 2);

        return "(CASE WHEN COALESCE(rp.repro_significativas, 0) >= {$minRepro}
            AND ul.sample_id IS NULL AND ud.sample_id IS NULL AND uc.sample_id IS NULL
            THEN {$factor} ELSE 1 END)";
    }

    /**
     * Penalización progresiva por reproducciones v2: usa repro_peso CTE.
     * Reemplaza ConstructorSenales::sqlPenalizacionReproduccion sin subqueries.
     */
    public static function sqlPenalizacionReproduccion(array $config): string
    {
        $penConfig = $config['parametros']['penalizacion_reproduccion'] ?? [];
        $tasa = (float) ($penConfig['tasa_decaimiento'] ?? 0.15);
        $minimo = (float) ($penConfig['minimo'] ?? 0.20);

        return "GREATEST({$minimo}, 1.0 / (1.0 + COALESCE(rp.sum_ponderada, 0) * {$tasa}))";
    }

    /* ========== CTEs Nivel 2: Scores Pre-agregados ========== */

    /**
     * CTE score_tags: pre-agrega todos los tag overlaps en un solo pass via UNNEST + JOIN.
     * Elimina 7 subqueries correlacionadas del scoring (SubPlans 7-13 en EXPLAIN).
     * Columnas: likes_score, repro_score, tiempo_score, descargas_score,
     *           completadas_score, dislikes_raw, ctx_cnt, etags_len.
     */
    private static function cteScoreTags(): string
    {
        return "SELECT e.sample_id,
            COALESCE(array_length(e.etags, 1), 0) AS etags_len,
            LEAST(1.0, COALESCE(SUM(utl.peso), 0)::float / GREATEST(1, COALESCE(array_length(e.etags, 1), 0))) AS likes_score,
            LEAST(1.0, COALESCE(SUM(utr.freq), 0)::float / GREATEST(1, COALESCE(array_length(e.etags, 1), 0))) AS repro_score,
            LEAST(1.0, COALESCE(SUM(utt.freq), 0)::float / GREATEST(1, COALESCE(array_length(e.etags, 1), 0))) AS tiempo_score,
            LEAST(1.0, COALESCE(SUM(utd.freq), 0)::float / GREATEST(1, COALESCE(array_length(e.etags, 1), 0))) AS descargas_score,
            LEAST(1.0, COALESCE(SUM(utco.freq), 0)::float / GREATEST(1, COALESCE(array_length(e.etags, 1), 0))) AS completadas_score,
            COALESCE(SUM(utdi.freq), 0)::float / GREATEST(1, COALESCE(array_length(e.etags, 1), 0)) AS dislikes_raw,
            COUNT(uctx.tag)::int AS ctx_cnt
        FROM enriched e
        LEFT JOIN LATERAL (SELECT DISTINCT tag FROM unnest(e.etags) AS tag) AS t(tag) ON true
        LEFT JOIN utag_likes utl ON utl.tag = t.tag
        LEFT JOIN utag_repro utr ON utr.tag = t.tag
        LEFT JOIN utag_tiempo utt ON utt.tag = t.tag
        LEFT JOIN utag_descargas utd ON utd.tag = t.tag
        LEFT JOIN utag_completadas utco ON utco.tag = t.tag
        LEFT JOIN utag_dislikes utdi ON utdi.tag = t.tag
        LEFT JOIN utag_ctx uctx ON uctx.tag = t.tag
        GROUP BY e.sample_id, e.etags";
    }

    /**
     * CTE repro_peso: pre-agrega reproducciones ponderadas por calidad por sample.
     * Elimina SubPlan 16-17 (penalizacionReproduccion + hasPlayed).
     * Columnas: sum_ponderada (weighted), repro_significativas (count de plays significativos).
     */
    private static function cteReproPeso(int $uid, array $config): string
    {
        $clasConfig = $config['parametros']['clasificacion_reproduccion'] ?? [];
        $habilitado = $clasConfig['habilitado'] ?? true;

        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $trDur = ReproduccionesCols::DURACION_ESCUCHADA;
        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $sDuracion = SamplesCols::DURACION;

        if (!$habilitado) {
            return "SELECT r.{$trSid} AS sample_id,
                COUNT(*)::float AS sum_ponderada,
                COUNT(*)::int AS repro_significativas
            FROM {$trep} r
            WHERE r.{$trUid} = {$uid}
            GROUP BY r.{$trSid}";
        }

        $umbralMin = (float) ($clasConfig['umbral_minimo_seg'] ?? 1);
        $pctCorto = (float) ($clasConfig['porcentaje_significativa_corto'] ?? 0.50);
        $pctMedio = (float) ($clasConfig['porcentaje_significativa_medio'] ?? 0.30);
        $pctLargo = (float) ($clasConfig['porcentaje_significativa_largo'] ?? 0.15);
        $minAbsoluto = (int) ($clasConfig['minimo_absoluto_significativa'] ?? 10);
        $pesoRapida = (float) ($clasConfig['peso_rapida'] ?? 0.30);
        $legacyComoSig = ($clasConfig['legacy_como_significativa'] ?? true) ? '1.0' : (string) $pesoRapida;

        $esSignificativa = "CASE
                WHEN s.{$sDuracion} <= 20 THEN r.{$trDur} >= s.{$sDuracion} * {$pctCorto}
                WHEN s.{$sDuracion} <= 60 THEN r.{$trDur} >= GREATEST({$minAbsoluto}, s.{$sDuracion} * {$pctMedio})
                ELSE r.{$trDur} >= GREATEST({$minAbsoluto}, s.{$sDuracion} * {$pctLargo})
            END";

        return "SELECT r.{$trSid} AS sample_id,
            SUM(CASE
                WHEN r.{$trDur} = 0 THEN {$legacyComoSig}
                WHEN r.{$trDur} < {$umbralMin} THEN 0
                WHEN {$esSignificativa} THEN 1.0
                ELSE {$pesoRapida}
            END) AS sum_ponderada,
            COUNT(*) FILTER (WHERE
                r.{$trDur} >= {$umbralMin}
                AND ({$esSignificativa})
            ) AS repro_significativas
        FROM {$trep} r JOIN {$ts} s ON r.{$trSid} = s.{$sId}
        WHERE r.{$trUid} = {$uid}
        GROUP BY r.{$trSid}";
    }

    /**
     * CTE likes_seguidos_cte: pre-agrega likes de usuarios seguidos por sample.
     * Elimina SubPlan 15 (likeadoPorSeguidos correlated query).
     */
    private static function cteLikesSeguidos(): string
    {
        $tl = LikesCols::TABLA;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $lUid = LikesCols::USUARIO_ID;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;

        return "SELECT l.{$lTarget} AS sample_id,
            SUM(CASE WHEN l.{$lReacc} = '{$lrEncanta}' THEN 2 ELSE 1 END)::float AS score_seguidos
        FROM {$tl} l
        WHERE l.{$lTipo} = '{$ltSample}'
            AND l.{$lReacc} IN ('{$lrLike}', '{$lrEncanta}')
            AND l.{$lUid} IN (SELECT user_id FROM followed_ids)
        GROUP BY l.{$lTarget}";
    }
}
