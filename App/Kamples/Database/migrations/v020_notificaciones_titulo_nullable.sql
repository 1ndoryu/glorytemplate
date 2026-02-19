/*
 * v020_notificaciones_titulo_nullable.sql
 * C266: Hacer titulo nullable y anadir mensaje como default vacio.
 * Muchos INSERTs no incluian titulo (NOT NULL constraint violada).
 * Tambien agrega un indice parcial para conteo rapido de no leidas.
 */

ALTER TABLE notificaciones ALTER COLUMN titulo DROP NOT NULL;
ALTER TABLE notificaciones ALTER COLUMN titulo SET DEFAULT '';

/* Indice parcial: conteo de no leidas por usuario (query frecuente) */
CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas
    ON notificaciones (usuario_id)
    WHERE leida = false;
