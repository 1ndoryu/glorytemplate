/*
 * v032 — Unificar flujo de publicación de samples extraídos.
 *
 * Antes: Python insertaba directamente en `samples` con su propia lógica.
 * Ahora: Python solo extrae audio y lo marca como 'extraido'. PHP publica
 * a través del mismo PipelineAudio que usa el upload web/sync.
 *
 * Cambios:
 * 1. Nueva columna `ruta_audio_extraido` para que Python guarde la ruta del MP3
 * 2. Nueva columna `metadata_extraccion` (JSONB) para pasar contexto de la relación a PHP
 * 3. Estado 'extraido' añadido al CHECK de `estado`
 */

BEGIN;

-- 1. Columna para ruta del audio extraído por Python
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS ruta_audio_extraido TEXT;
COMMENT ON COLUMN cola_extraccion_samples.ruta_audio_extraido
    IS 'Ruta absoluta al MP3 extraído por Python. PHP lo mueve a uploads y publica via PipelineAudio.';

-- 2. JSONB para metadata de contexto (titulo, artistas, tipo_elemento, etc.)
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS metadata_extraccion JSONB;
COMMENT ON COLUMN cola_extraccion_samples.metadata_extraccion
    IS 'Metadata de la relación para que PHP genere titulo/tags al publicar.';

-- 3. Añadir 'extraido' al CHECK de estado
ALTER TABLE cola_extraccion_samples
    DROP CONSTRAINT IF EXISTS cola_extraccion_samples_estado_check;
ALTER TABLE cola_extraccion_samples
    ADD CONSTRAINT cola_extraccion_samples_estado_check
    CHECK (estado IN (
        'pendiente', 'descargando', 'analizando',
        'recortando', 'extraido', 'completado', 'error',
        'revision_humana'
    ));

COMMIT;
