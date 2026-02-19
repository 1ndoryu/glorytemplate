/*
 * v011: Añadir total_comentarios a la tabla samples.
 * Permite contar comentarios en samples como ya se hace en publicaciones.
 */
ALTER TABLE samples ADD COLUMN IF NOT EXISTS total_comentarios INT DEFAULT 0;
