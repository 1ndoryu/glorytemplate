/* v044: Sistema de papelera — columna eliminado_en para trash con TTL 30 días */

ALTER TABLE samples ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ NULL;
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ NULL;

/* Backfill: samples ya eliminados reciben timestamp de updated_at */
UPDATE samples SET eliminado_en = updated_at WHERE estado = 'eliminado' AND eliminado_en IS NULL;

/* Índices parciales para cleanup eficiente */
CREATE INDEX IF NOT EXISTS idx_samples_papelera ON samples (eliminado_en) WHERE eliminado_en IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_publicaciones_papelera ON publicaciones (eliminado_en) WHERE eliminado_en IS NOT NULL;
