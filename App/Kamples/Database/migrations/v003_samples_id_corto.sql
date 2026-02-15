/*
 * Kamples — Migración v003
 * Agrega columnas id_corto, permitir_descarga y licencia_libre a samples.
 * id_corto es un identificador alfanumérico único de 7 caracteres (base62).
 */

ALTER TABLE samples ADD COLUMN IF NOT EXISTS id_corto VARCHAR(10) UNIQUE;
ALTER TABLE samples ADD COLUMN IF NOT EXISTS permitir_descarga BOOLEAN DEFAULT TRUE;
ALTER TABLE samples ADD COLUMN IF NOT EXISTS licencia_libre BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_samples_id_corto ON samples (id_corto);
