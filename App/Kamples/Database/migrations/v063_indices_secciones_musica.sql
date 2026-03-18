/*
 * v063 — Índices para optimización de secciones de música (183A-75)
 *
 * Problema: secciones() ejecutaba 8-13 queries con EXISTS en ORDER BY
 * y sin índices de soporte para genero, artista_id, total_sampleada, total_likes.
 *
 * Índices creados:
 *   1. B-tree en canciones.genero (filtro por género en secciones)
 *   2. B-tree DESC en canciones.total_sampleada (ORDER BY top sampleadas)
 *   3. B-tree DESC en canciones.total_likes (ORDER BY tendencias)
 *   4. B-tree en canciones.artista_id (JOIN con artistas_musicales)
 *   5. Parcial en samples(cancion_origen_id) WHERE activo + preview (sample adjunto)
 */

BEGIN;

/* Canciones: filtro por género en secciones por estilo musical */
CREATE INDEX IF NOT EXISTS idx_canciones_genero
    ON canciones (genero)
    WHERE genero IS NOT NULL AND genero != '';

/* Canciones: ordenamiento por total sampleada (top / géneros) */
CREATE INDEX IF NOT EXISTS idx_canciones_total_sampleada
    ON canciones (total_sampleada DESC);

/* Canciones: ordenamiento por total likes (tendencias) */
CREATE INDEX IF NOT EXISTS idx_canciones_total_likes
    ON canciones (total_likes DESC);

/* Canciones: FK join con artistas_musicales (PG no indexa FK automáticamente) */
CREATE INDEX IF NOT EXISTS idx_canciones_artista_id
    ON canciones (artista_id);

/* Samples: subquery sample adjunto — parcial para solo activos con preview.
 * Cubre: DISTINCT cancion_origen_id en ranking ligero y
 *         LATERAL sample_adjunto_json en enriquecimiento. */
CREATE INDEX IF NOT EXISTS idx_samples_cancion_activo_preview
    ON samples (cancion_origen_id)
    WHERE estado = 'activo' AND ruta_preview IS NOT NULL;

COMMIT;
