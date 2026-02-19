/*
 * Migración v005 — Metadata de imágenes IA
 *
 * Agrega campo JSONB para almacenar el análisis automático de imágenes
 * en publicaciones. Cada imagen analizada genera: tags, descripción,
 * tipo de contenido, sentimiento, y flag de seguridad.
 *
 * Estructura imagenes_metadata: { "0": { tags, tags_es, descripcion, ... }, "1": ... }
 * Donde la key es el índice de la imagen en el array imagenes.
 */

/* Campo para metadata IA de las imágenes de publicaciones */
ALTER TABLE publicaciones
ADD COLUMN IF NOT EXISTS imagenes_metadata JSONB DEFAULT '{}'::jsonb;

/* Comentario descriptivo */
COMMENT ON COLUMN publicaciones.imagenes_metadata IS 'Metadata IA de imágenes: tags, descripción, tipo contenido, sentimiento, seguridad. Key = índice imagen.';
