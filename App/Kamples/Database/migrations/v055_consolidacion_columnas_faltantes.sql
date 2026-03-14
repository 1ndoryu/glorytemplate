/*
 * v055 — Consolidación defensiva de columnas potencialmente faltantes.
 *
 * QK96: Producción reporta errores 42703 (Undefined column) para columnas
 * que existen en el Schema pero cuyas migraciones (v044, v045, v052) podrían
 * no haberse ejecutado correctamente. Esta migración re-aplica idempotentemente
 * todas las columnas necesarias con IF NOT EXISTS.
 *
 * Columnas:
 *   - samples.eliminado_en (v044 — papelera soft-delete)
 *   - publicaciones.eliminado_en (v044 — papelera soft-delete)
 *   - cola_extraccion_samples.proximo_intento_at (v045 — backoff exponencial)
 *   - conversaciones.aceptada (v052 — aceptar solicitudes sin follow)
 */

BEGIN;

/* === samples.eliminado_en === */
ALTER TABLE samples ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_samples_papelera ON samples (eliminado_en) WHERE eliminado_en IS NOT NULL;

/* === publicaciones.eliminado_en === */
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_publicaciones_papelera ON publicaciones (eliminado_en) WHERE eliminado_en IS NOT NULL;

/* === cola_extraccion_samples.proximo_intento_at === */
ALTER TABLE cola_extraccion_samples ADD COLUMN IF NOT EXISTS proximo_intento_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_cola_extraccion_backoff
    ON cola_extraccion_samples (proximo_intento_at)
    WHERE estado = 'pendiente' AND proximo_intento_at IS NOT NULL;

/* === conversaciones.aceptada === */
ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS aceptada BOOLEAN DEFAULT FALSE;

COMMIT;
