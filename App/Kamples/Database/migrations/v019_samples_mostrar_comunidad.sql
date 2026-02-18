/*
 * v019: Añadir columna mostrar_en_comunidad a samples
 * C220: Toggle para que un sample aparezca o no en el feed de comunidad
 * Por defecto TRUE — los samples aparecen en comunidad
 */

ALTER TABLE samples ADD COLUMN IF NOT EXISTS mostrar_en_comunidad BOOLEAN DEFAULT TRUE;
