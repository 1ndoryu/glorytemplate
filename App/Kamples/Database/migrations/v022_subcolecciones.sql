/*
 * v022 - Subcolecciones: jerarquia de 2 niveles en colecciones.
 *
 * Agrega parent_id a colecciones para soportar subcarpetas de sync
 * y subcolecciones en la UI.
 *
 * Una subcoleccion (parent_id IS NOT NULL) no puede tener hijos.
 */

/* Columna para la jerarquia */
ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS parent_id INT NULL
    REFERENCES colecciones(id) ON DELETE CASCADE;

/* Indice para queries de subcolecciones por padre */
CREATE INDEX IF NOT EXISTS idx_colecciones_parent
    ON colecciones(parent_id)
    WHERE parent_id IS NOT NULL;

/* Nombres unicos por (usuario, padre/raiz).
 * COALESCE(parent_id, 0) trata NULL como 0 en el indice unico,
 * evitando que NULL != NULL permita duplicados a nivel raiz. */
CREATE UNIQUE INDEX IF NOT EXISTS idx_colecciones_nombre_unico_por_padre
    ON colecciones (usuario_id, COALESCE(parent_id, 0), LOWER(nombre));

/* Columnas de actualizacion: si faltan por migracion incremental.
 * v001 no incluia updated_at ni portada_url; se agregan idempotentemente. */
ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS portada_url TEXT;
