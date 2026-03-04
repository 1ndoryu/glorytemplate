/*
 * v022 — Subcolecciones: jerarquía de 2 niveles en colecciones.
 *
 * Agrega parent_id a colecciones para soportar subcarpetas de sync
 * y subcolecciones en la UI. Máximo 2 niveles: colección → subcolección.
 *
 * Una subcolección (parent_id IS NOT NULL) NO puede tener hijos.
 * Esto se garantiza con el CHECK constraint chk_max_profundidad
 * que impide que un padre sea a su vez hijo de otra colección.
 */

/* Columna para la jerarquía */
ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS parent_id INT NULL
    REFERENCES colecciones(id) ON DELETE CASCADE;

/* Índice para queries de subcolecciones por padre */
CREATE INDEX IF NOT EXISTS idx_colecciones_parent
    ON colecciones(parent_id)
    WHERE parent_id IS NOT NULL;

/*
 * Nombres únicos por (usuario, padre/raíz).
 * Se usa COALESCE(parent_id, 0) para tratar NULL como 0 en el unique,
 * evitando que NULL != NULL permita duplicados a nivel raíz.
 */
CREATE UNIQUE INDEX IF NOT EXISTS idx_colecciones_nombre_unico_por_padre
    ON colecciones (usuario_id, COALESCE(parent_id, 0), LOWER(nombre));

/*
 * Columnas de actualización — si faltan por migración incremental.
 * v001 no incluía updated_at ni portada_url; se agregan idempotentemente.
 */
ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS portada_url TEXT;
