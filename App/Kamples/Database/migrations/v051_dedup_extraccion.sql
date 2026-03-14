/*
 * v051: QK53 — Dedup de extracciones: nuevo estado 'unificado' + indice para busqueda de similares.
 *
 * El estado 'unificado' marca items de cola que se reutilizaron en vez de crear un sample nuevo.
 * El indice acelera la busqueda de samples similares por youtube_id + timing.
 */

/* Agregar 'unificado' al CHECK constraint de estado */
ALTER TABLE cola_extraccion_samples
    DROP CONSTRAINT IF EXISTS cola_extraccion_samples_estado_check;

ALTER TABLE cola_extraccion_samples
    ADD CONSTRAINT cola_extraccion_samples_estado_check
    CHECK (estado IN ('pendiente', 'descargando', 'analizando', 'recortando', 'extraido', 'completado', 'error', 'revision_humana', 'unificado'));

/* Indice parcial para busqueda de dedup: youtube_id + timing en items completados/unificados */
CREATE INDEX IF NOT EXISTS idx_cola_ext_dedup_youtube_timing
    ON cola_extraccion_samples (youtube_id, timing_inicio_seg)
    WHERE estado IN ('completado', 'unificado') AND sample_id IS NOT NULL;
