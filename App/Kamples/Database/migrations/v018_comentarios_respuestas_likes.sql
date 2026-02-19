/*
 * v018 — Respuestas a comentarios (threading) + likes en comentarios.
 *
 * C264: Menú contextual (editar/eliminar/reportar) necesita updated_at.
 * C265: Replies necesita parent_id + total_respuestas. Likes en comentarios
 *       extiende la tabla likes con tipo 'comentario' + total_likes en comentarios.
 */

/* Threading de respuestas */
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES comentarios(id) ON DELETE CASCADE;
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS total_respuestas INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_comentarios_parent ON comentarios(parent_id);

/* Likes en comentarios */
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS total_likes INT DEFAULT 0;

/* Timestamp de edición para C264 */
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

/* Extender constraint de likes para incluir 'comentario' */
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_tipo_check;
ALTER TABLE likes ADD CONSTRAINT likes_tipo_check CHECK (tipo IN ('sample', 'publicacion', 'comentario'));
