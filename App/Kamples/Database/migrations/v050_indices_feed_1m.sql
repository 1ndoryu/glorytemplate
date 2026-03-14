/* v050 — Indices especializados y vista materializada para feed a 1M samples (QK21) */

/* Fuente "creadores seguidos": faltaba indice en seguidor_id */
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_seguidor
    ON follows(seguidor_id, seguido_id);

/* Fuente "populares all-time": expression index sobre engagement score */
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_samples_engagement_activo
    ON samples((total_likes + total_reproducciones + total_descargas) DESC)
    WHERE estado = 'activo';

/* Trending signal: likes recientes por sample */
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_trending_24h
    ON likes(target_id, created_at DESC)
    WHERE tipo = 'sample';

/* Trending signal: reproducciones por sample + fecha */
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reproducciones_sample_created
    ON reproducciones(sample_id, created_at DESC);

/* Trending signal: descargas por sample + fecha */
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_descargas_sample_created
    ON descargas(sample_id, created_at DESC);

/*
 * Vista materializada trending — pre-agrega metricas de tendencia.
 * Elimina 4 subqueries correlacionadas por fila en la senal de tendencias.
 * Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_samples;
 * Frecuencia recomendada: cada 10 min via WP Cron o crontab VPS.
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trending_samples AS
SELECT
    s.id AS sample_id,
    COALESCE((
        SELECT SUM(
            CASE
                WHEN l.reaccion = 'encanta' THEN 2
                WHEN l.reaccion = 'like' THEN 1
                WHEN l.reaccion = 'dislike' THEN -1
                ELSE 0
            END
        )
        FROM likes l
        WHERE l.tipo = 'sample'
        AND l.target_id = s.id
        AND l.created_at > NOW() - INTERVAL '24 hours'
    ), 0) AS likes_24h,
    COALESCE((
        SELECT COUNT(*)
        FROM reproducciones r
        WHERE r.sample_id = s.id
        AND r.created_at > NOW() - INTERVAL '24 hours'
    ), 0) AS repro_24h,
    COALESCE((
        SELECT COUNT(*)
        FROM descargas d
        WHERE d.sample_id = s.id
        AND d.created_at > NOW() - INTERVAL '7 days'
    ), 0) AS descargas_7d,
    COALESCE((
        SELECT COUNT(*)
        FROM follows f
        WHERE f.seguido_id = s.creador_id
        AND f.created_at > NOW() - INTERVAL '7 days'
    ), 0) AS follows_7d,
    NOW() AS calculado_at
FROM samples s
WHERE s.estado = 'activo'
WITH DATA;

/* Unique index requerido para REFRESH CONCURRENTLY */
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_trending_sample_id
    ON mv_trending_samples(sample_id);

/* Index para JOIN rapido en la query de scoring */
CREATE INDEX IF NOT EXISTS idx_mv_trending_likes
    ON mv_trending_samples(likes_24h DESC)
    WHERE likes_24h > 0;
