/*
 * v031_recorte_bilateral.sql — Migración para extracción bilateral de samples
 *
 * Cambios:
 * 1. cola_extraccion_samples: campo 'lado' (fuente/destino), spotify_id, youtube_id nullable
 * 2. relaciones_sample: sample_fuente_id + sample_destino_id (reemplaza sample_id singular)
 * 3. samples: cancion_origen_id FK para navegación cruzada sample→canción
 * 4. UNIQUE(relacion_id, lado) para dedup bilateral en cola
 * 5. Índices para los nuevos campos
 */

-- 1. Campo 'lado' en cola_extraccion_samples
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS lado VARCHAR(10) DEFAULT 'fuente'
    CHECK (lado IN ('fuente', 'destino'));
COMMENT ON COLUMN cola_extraccion_samples.lado IS 'Lado de la relación: fuente (sampleada) o destino (que samplea)';

-- 2. spotify_id como fuente de audio alternativa
ALTER TABLE cola_extraccion_samples
    ALTER COLUMN youtube_id DROP NOT NULL;
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(30);
COMMENT ON COLUMN cola_extraccion_samples.spotify_id IS 'ID de Spotify cuando no hay YouTube disponible';

-- 3. sample_fuente_id y sample_destino_id en relaciones_sample
ALTER TABLE relaciones_sample
    ADD COLUMN IF NOT EXISTS sample_fuente_id INT REFERENCES samples(id) ON DELETE SET NULL;
ALTER TABLE relaciones_sample
    ADD COLUMN IF NOT EXISTS sample_destino_id INT REFERENCES samples(id) ON DELETE SET NULL;
COMMENT ON COLUMN relaciones_sample.sample_fuente_id IS 'Sample extraído del lado fuente (canción sampleada)';
COMMENT ON COLUMN relaciones_sample.sample_destino_id IS 'Sample extraído del lado destino (canción que samplea)';

-- 4. Migrar datos existentes de sample_id → sample_fuente_id
UPDATE relaciones_sample SET sample_fuente_id = sample_id WHERE sample_id IS NOT NULL AND sample_fuente_id IS NULL;

-- 5. cancion_origen_id en samples para navegación sample→canción
ALTER TABLE samples
    ADD COLUMN IF NOT EXISTS cancion_origen_id INT REFERENCES canciones(id) ON DELETE SET NULL;
COMMENT ON COLUMN samples.cancion_origen_id IS 'Canción de la que se extrajo este sample (NULL si es upload de usuario)';

-- 6. UNIQUE(relacion_id, lado) para dedup bilateral en cola
ALTER TABLE cola_extraccion_samples
    DROP CONSTRAINT IF EXISTS uq_cola_relacion_lado;
ALTER TABLE cola_extraccion_samples
    ADD CONSTRAINT uq_cola_relacion_lado UNIQUE (relacion_id, lado);

-- 7. CHECK: cola debe tener youtube_id O spotify_id
ALTER TABLE cola_extraccion_samples
    DROP CONSTRAINT IF EXISTS chk_cola_tiene_fuente_audio;
ALTER TABLE cola_extraccion_samples
    ADD CONSTRAINT chk_cola_tiene_fuente_audio
    CHECK (youtube_id IS NOT NULL OR spotify_id IS NOT NULL);

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_relaciones_sample_fuente_id ON relaciones_sample(sample_fuente_id) WHERE sample_fuente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relaciones_sample_destino_id ON relaciones_sample(sample_destino_id) WHERE sample_destino_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_samples_cancion_origen ON samples(cancion_origen_id) WHERE cancion_origen_id IS NOT NULL;
