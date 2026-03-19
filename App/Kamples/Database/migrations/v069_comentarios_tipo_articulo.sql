/* [183A-109 Fase 5] Añadir 'articulo' al CHECK constraint de comentarios.tipo
 * para soportar comentarios en artículos del blog. */

-- Eliminar constraint existente
ALTER TABLE comentarios DROP CONSTRAINT IF EXISTS comentarios_tipo_check;

-- Recrear con 'articulo' incluido
ALTER TABLE comentarios ADD CONSTRAINT comentarios_tipo_check
    CHECK (tipo IN ('sample', 'publicacion', 'cancion', 'relacion', 'articulo'));
