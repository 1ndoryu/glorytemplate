/*
 * v042: Columna moderacion_razon en publicaciones.
 *
 * La columna moderacion_razon fue añadida al schema local y al codigo PHP
 * (PublicacionesRepository::actualizarVeredictoModeracion, listarPendientesModeracion)
 * pero nunca tuvo migracion SQL. Sin esta columna el panel de moderacion admin
 * falla con error SQL y no muestra publicaciones pendientes.
 *
 * DEFAULT '': publicaciones existentes quedan con razon vacia (correcto).
 */

ALTER TABLE publicaciones
    ADD COLUMN IF NOT EXISTS moderacion_razon VARCHAR(255) DEFAULT '';

COMMENT ON COLUMN publicaciones.moderacion_razon IS 'Razon resumida de la decision de moderacion (max 255 chars)';
