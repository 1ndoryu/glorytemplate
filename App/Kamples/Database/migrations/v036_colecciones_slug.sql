/*
 * v036_colecciones_slug.sql — Migración para agregar slug SEO a colecciones.
 *
 * Agrega columna slug + índice único. Genera slugs para colecciones existentes
 * usando sanitize_title(nombre) + '-' + id, implementado en PHP post-migración.
 *
 * Ejecutar: psql -f v036_colecciones_slug.sql
 * Post-migración PHP: ColeccionesRepository::generarSlugsFaltantes()
 */

-- 1. Agregar columna slug (nullable inicialmente para colecciones existentes)
ALTER TABLE colecciones
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Generar slugs para colecciones existentes (formato: lower-nombre-id)
UPDATE colecciones
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(nombre, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
) || '-' || id
WHERE slug IS NULL;

-- 3. Crear índice único sobre slug (solo para no nulos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_colecciones_slug
    ON colecciones (slug) WHERE slug IS NOT NULL;
