/*
 * v028 — Extender likes y comentarios para canciones y relaciones de sampleo.
 *
 * Agrega 'cancion' y 'relacion' como tipos válidos en ambas tablas,
 * y columnas total_likes/total_comentarios en canciones y relaciones_sample.
 *
 * Ejecutar: psql -U postgres -d kamples -f v028_likes_comentarios_cancion_relacion.sql
 */

BEGIN;

/* ============================================================
   LIKES — Extender CHECK constraint de tipo
   ============================================================
   La constraint original fue inline (sin nombre), PostgreSQL
   la genera como likes_tipo_check. Dropping + recreating.
*/
DO $$
BEGIN
    /* Intentar DROP de constraint inline; pg genera nombre likes_tipo_check */
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'likes_tipo_check'
    ) THEN
        ALTER TABLE likes DROP CONSTRAINT likes_tipo_check;
    END IF;
END $$;

ALTER TABLE likes ADD CONSTRAINT likes_tipo_check
    CHECK (tipo IN ('sample', 'publicacion', 'comentario', 'cancion', 'relacion'));


/* ============================================================
   COMENTARIOS — Extender CHECK constraint de tipo
   ============================================================ */
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comentarios_tipo_check'
    ) THEN
        ALTER TABLE comentarios DROP CONSTRAINT comentarios_tipo_check;
    END IF;
END $$;

ALTER TABLE comentarios ADD CONSTRAINT comentarios_tipo_check
    CHECK (tipo IN ('sample', 'publicacion', 'cancion', 'relacion'));


/* ============================================================
   CANCIONES — Agregar columnas para likes/comentarios
   ============================================================ */
ALTER TABLE canciones ADD COLUMN IF NOT EXISTS total_likes INT DEFAULT 0;
ALTER TABLE canciones ADD COLUMN IF NOT EXISTS total_comentarios INT DEFAULT 0;


/* ============================================================
   RELACIONES_SAMPLE — Agregar columnas para likes/comentarios
   ============================================================ */
ALTER TABLE relaciones_sample ADD COLUMN IF NOT EXISTS total_likes INT DEFAULT 0;
ALTER TABLE relaciones_sample ADD COLUMN IF NOT EXISTS total_comentarios INT DEFAULT 0;


/* ============================================================
   ÍNDICES para filtrado eficiente
   ============================================================ */
CREATE INDEX IF NOT EXISTS idx_likes_cancion ON likes (target_id)
    WHERE tipo = 'cancion';
CREATE INDEX IF NOT EXISTS idx_likes_relacion ON likes (target_id)
    WHERE tipo = 'relacion';
CREATE INDEX IF NOT EXISTS idx_comentarios_cancion ON comentarios (target_id, created_at)
    WHERE tipo = 'cancion';
CREATE INDEX IF NOT EXISTS idx_comentarios_relacion ON comentarios (target_id, created_at)
    WHERE tipo = 'relacion';

COMMIT;
