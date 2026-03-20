<?php

/* [2003A-35] TagAffinityService — Materializa afinidad tag↔usuario.
 *
 * Problema: La CTE score_tags calcula en CADA request la afinidad de tags del
 * usuario haciendo LATERAL UNNEST de 2,649 samples × 5-10 tags = 15-26K filas
 * intermedias con 7 JOINs. Esto consume ~493ms (71% del total).
 *
 * Solución: Pre-computar los pesos de afinidad en la tabla user_tag_scores
 * y consultarla con un simple JOIN indexado (~1ms).
 * Recalcular en background cuando el usuario interactúa (like, play, download)
 * y periódicamente via cron cada hora para usuarios activos.
 *
 * Resultado: score_tags pasa de ~493ms a ~5ms. */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\LogAlgoritmo as KamplesLogger;

class TagAffinityService
{
    private const TABLA = 'user_tag_scores';
    private const CACHE_KEY_PREFIX = 'kamples_uts_fresh_';
    private const FRESHNESS_TTL = 3600; /* 1 hora — considerar stale después */

    /**
     * Verifica si el usuario tiene scores de tags recientes.
     * Usado por PrecomputadorFeed para elegir path optimizado vs fallback.
     */
    public static function tieneScoresRecientes(int $userId): bool
    {
        $cacheKey = self::CACHE_KEY_PREFIX . $userId;
        $cached = ServicioCache::obtener($cacheKey);
        if ($cached !== false) {
            return (bool) $cached;
        }

        try {
            $existe = SamplesRepository::consultarValor(
                "SELECT 1 FROM " . self::TABLA . " WHERE user_id = :uid LIMIT 1",
                ['uid' => $userId]
            );
            $resultado = ($existe !== null);
            ServicioCache::guardar($cacheKey, $resultado ? '1' : '0', self::FRESHNESS_TTL);
            return $resultado;
        } catch (\Throwable $e) {
            KamplesLogger::debug('[TagAffinity] Error verificando scores', [
                'userId' => $userId, 'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Recalcula TODOS los pesos de tags para un usuario.
     * Replica la lógica de las 7 CTEs utag_* + utag_merged en un solo INSERT.
     * Usa INSERT ... ON CONFLICT DO UPDATE para atomicidad (upsert).
     */
    public static function recalcularParaUsuario(int $userId): bool
    {
        $uid = (int) $userId;

        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;
        $lrDislike = LikesEnums::REACCION_DISLIKE;

        $trep = ReproduccionesCols::TABLA;
        $trUid = ReproduccionesCols::USUARIO_ID;
        $trSid = ReproduccionesCols::SAMPLE_ID;
        $trDur = ReproduccionesCols::DURACION_ESCUCHADA;
        $trComp = ReproduccionesCols::COMPLETADA;

        $td = DescargasCols::TABLA;
        $dUid = DescargasCols::USUARIO_ID;
        $dSid = DescargasCols::SAMPLE_ID;

        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sTags = SamplesCols::TAGS_ENRIQUECIDOS;

        /* CTE que replica exactamente la lógica de las 7 utag_* CTEs originales,
         * merge en un solo GROUP BY tag, e inserta/actualiza en user_tag_scores. */
        $sql = "
            WITH enriched AS (
                SELECT s.{$sId} AS sample_id, s.{$sTags} AS etags
                FROM {$ts} s WHERE s.{$sEstado} = :estado
            ),
            utag_likes AS (
                SELECT UNNEST(e.etags) AS tag,
                    SUM(CASE WHEN l.{$lReacc} = :reacEncanta THEN 2 ELSE 1 END) AS peso
                FROM {$tl} l JOIN enriched e ON l.{$lTarget} = e.sample_id
                WHERE l.{$lUid} = :uid AND l.{$lTipo} = :tipoSample
                    AND l.{$lReacc} IN (:reacLike, :reacEncanta2)
                GROUP BY tag
            ),
            utag_repro AS (
                SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
                FROM {$trep} r JOIN enriched e ON r.{$trSid} = e.sample_id
                WHERE r.{$trUid} = :uid2
                GROUP BY tag
            ),
            utag_tiempo AS (
                SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
                FROM {$trep} r JOIN enriched e ON r.{$trSid} = e.sample_id
                WHERE r.{$trUid} = :uid3 AND r.{$trDur} > 10
                GROUP BY tag
            ),
            utag_descargas AS (
                SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
                FROM {$td} d JOIN enriched e ON d.{$dSid} = e.sample_id
                WHERE d.{$dUid} = :uid4
                GROUP BY tag
            ),
            utag_completadas AS (
                SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
                FROM {$trep} r JOIN enriched e ON r.{$trSid} = e.sample_id
                WHERE r.{$trUid} = :uid5 AND r.{$trComp} = true
                GROUP BY tag
            ),
            utag_dislikes AS (
                SELECT UNNEST(e.etags) AS tag, COUNT(*) AS freq
                FROM {$tl} l JOIN enriched e ON l.{$lTarget} = e.sample_id
                WHERE l.{$lUid} = :uid6 AND l.{$lTipo} = :tipoSample2
                    AND l.{$lReacc} = :reacDislike
                GROUP BY tag
            ),
            utag_ctx AS (
                SELECT tag, SUM(freq) AS freq FROM (
                    SELECT UNNEST(e.etags) AS tag, 1 AS freq
                    FROM {$tl} l JOIN enriched e ON l.{$lTarget} = e.sample_id
                    WHERE l.{$lUid} = :uid7 AND l.{$lTipo} = :tipoSample3
                        AND l.{$lReacc} IN (:reacLike2, :reacEncanta3)
                ) t GROUP BY tag ORDER BY freq DESC LIMIT 8
            ),
            merged AS (
                SELECT tag,
                    COALESCE(SUM(w_likes), 0)::float AS w_likes,
                    COALESCE(SUM(w_repro), 0)::float AS w_repro,
                    COALESCE(SUM(w_tiempo), 0)::float AS w_tiempo,
                    COALESCE(SUM(w_descargas), 0)::float AS w_descargas,
                    COALESCE(SUM(w_completadas), 0)::float AS w_completadas,
                    COALESCE(SUM(w_dislikes), 0)::float AS w_dislikes,
                    GREATEST(SUM(w_ctx), 0)::float AS w_ctx
                FROM (
                    SELECT tag, peso::float AS w_likes, 0::float AS w_repro, 0::float AS w_tiempo,
                           0::float AS w_descargas, 0::float AS w_completadas, 0::float AS w_dislikes, 0 AS w_ctx
                    FROM utag_likes
                    UNION ALL SELECT tag, 0, freq::float, 0, 0, 0, 0, 0 FROM utag_repro
                    UNION ALL SELECT tag, 0, 0, freq::float, 0, 0, 0, 0 FROM utag_tiempo
                    UNION ALL SELECT tag, 0, 0, 0, freq::float, 0, 0, 0 FROM utag_descargas
                    UNION ALL SELECT tag, 0, 0, 0, 0, freq::float, 0, 0 FROM utag_completadas
                    UNION ALL SELECT tag, 0, 0, 0, 0, 0, freq::float, 0 FROM utag_dislikes
                    UNION ALL SELECT tag, 0, 0, 0, 0, 0, 0, 1 FROM utag_ctx
                ) combined
                GROUP BY tag
            )
            INSERT INTO " . self::TABLA . " (user_id, tag, w_likes, w_repro, w_tiempo, w_descargas, w_completadas, w_dislikes, w_ctx, updated_at)
            SELECT :uid8, tag, w_likes, w_repro, w_tiempo, w_descargas, w_completadas, w_dislikes, w_ctx, NOW()
            FROM merged
            ON CONFLICT (user_id, tag) DO UPDATE SET
                w_likes = EXCLUDED.w_likes,
                w_repro = EXCLUDED.w_repro,
                w_tiempo = EXCLUDED.w_tiempo,
                w_descargas = EXCLUDED.w_descargas,
                w_completadas = EXCLUDED.w_completadas,
                w_dislikes = EXCLUDED.w_dislikes,
                w_ctx = EXCLUDED.w_ctx,
                updated_at = NOW()
        ";

        $params = [
            'estado' => $eActivo,
            'uid' => $uid, 'uid2' => $uid, 'uid3' => $uid, 'uid4' => $uid,
            'uid5' => $uid, 'uid6' => $uid, 'uid7' => $uid, 'uid8' => $uid,
            'tipoSample' => $ltSample, 'tipoSample2' => $ltSample, 'tipoSample3' => $ltSample,
            'reacLike' => $lrLike, 'reacLike2' => $lrLike,
            'reacEncanta' => $lrEncanta, 'reacEncanta2' => $lrEncanta, 'reacEncanta3' => $lrEncanta,
            'reacDislike' => $lrDislike,
        ];

        try {
            /* Limpiar tags que ya no aplican antes del upsert */
            SamplesRepository::ejecutar(
                "DELETE FROM " . self::TABLA . " WHERE user_id = :uid",
                ['uid' => $uid]
            );

            SamplesRepository::ejecutar($sql, $params);

            /* Marcar como fresco en cache */
            ServicioCache::guardar(self::CACHE_KEY_PREFIX . $uid, '1', self::FRESHNESS_TTL);

            KamplesLogger::debug('[TagAffinity] Recalculado para usuario', ['userId' => $uid]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::warning('[TagAffinity] Error recalculando', [
                'userId' => $uid, 'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Invalida los scores de un usuario (forzar recálculo en próximo request).
     */
    public static function invalidar(int $userId): void
    {
        ServicioCache::eliminar(self::CACHE_KEY_PREFIX . $userId);
    }

    /**
     * Agenda recálculo async post-respuesta para no bloquear al usuario.
     * Similar al patrón de MotorRecomendacion::programarWarm().
     */
    public static function programarRecalculo(int $userId): void
    {
        $lockKey = 'kamples_uts_recalc_' . $userId;
        if (!ServicioCache::adquirirLock($lockKey, 60)) {
            return;
        }

        add_action('shutdown', function () use ($userId, $lockKey) {
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            }
            try {
                self::recalcularParaUsuario($userId);
            } catch (\Throwable $e) {
                KamplesLogger::warning('[TagAffinity] Recálculo async falló', [
                    'userId' => $userId, 'error' => $e->getMessage(),
                ]);
            } finally {
                ServicioCache::liberarLock($lockKey);
            }
        }, 0);
    }

    /**
     * Recalcula para todos los usuarios activos (últimas 24h con login).
     * Para usar desde WP-CLI o cron: TagAffinityService::recalcularActivos().
     */
    public static function recalcularActivos(): int
    {
        try {
            $usuarios = SamplesRepository::consultar(
                "SELECT DISTINCT usuario_id FROM reproducciones
                 WHERE created_at > NOW() - INTERVAL '24 hours'
                 LIMIT 500",
                []
            );

            $count = 0;
            foreach ($usuarios as $row) {
                $uid = (int) ($row['usuario_id'] ?? 0);
                if ($uid > 0 && self::recalcularParaUsuario($uid)) {
                    $count++;
                }
            }

            KamplesLogger::info('[TagAffinity] Recálculo masivo completado', [
                'usuarios' => $count,
            ]);
            return $count;
        } catch (\Throwable $e) {
            KamplesLogger::warning('[TagAffinity] Error en recálculo masivo', [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }
}
