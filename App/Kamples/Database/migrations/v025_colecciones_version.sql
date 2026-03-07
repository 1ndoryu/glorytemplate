/*
 * v025 — Campo version en colecciones para optimistic locking (F5.2)
 *
 * Cada coleccion lleva un entero version que se incrementa en cada UPDATE.
 * El desktop envia su version local al hacer PUT; si difiere de la BD,
 * el servidor responde 409 Conflict y el cliente debe re-sincronizar.
 *
 * Patron: optimistic concurrency control (OCC) — misma tecnica que
 * eTag/cTag de OneDrive y rev de Dropbox, simplificada a un contador.
 */

ALTER TABLE colecciones ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN colecciones.version IS 'Contador incremental para optimistic locking (F5.2). Se incrementa en cada UPDATE.';
