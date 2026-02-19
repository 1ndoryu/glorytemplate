/*
 * Migración v006 — Agregar tamano_bytes a descargas para tracking de transferencia por plan.
 * Permite enforcar límites de transferencia mensual (1 GB free, 10 GB pro, 50 GB premium).
 */

ALTER TABLE descargas ADD COLUMN IF NOT EXISTS tamano_bytes BIGINT DEFAULT 0;

COMMENT ON COLUMN descargas.tamano_bytes IS 'Tamaño del archivo descargado en bytes, para tracking de transferencia mensual';
