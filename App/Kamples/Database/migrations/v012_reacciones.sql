/*
 * v012 — Sistema de Reacciones (C144/C145)
 * Agrega columna 'reaccion' a tabla likes para soportar:
 * - like (corazón estándar)
 * - encanta (corazón doble / intenso)
 * - dislike (pulgar abajo, sin contador público)
 *
 * La constraint UNIQUE (usuario_id, tipo, target_id) se mantiene:
 * un usuario solo puede tener UNA reacción por target.
 */

/* Agregar columna reaccion con valor por defecto 'like' */
ALTER TABLE likes ADD COLUMN IF NOT EXISTS reaccion VARCHAR(20) DEFAULT 'like';

/* Constraint de valores válidos */
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'likes_reaccion_check'
    ) THEN
        ALTER TABLE likes ADD CONSTRAINT likes_reaccion_check
            CHECK (reaccion IN ('like', 'dislike', 'encanta'));
    END IF;
END $$;

/* Index para queries del algoritmo que filtran por reacción */
CREATE INDEX IF NOT EXISTS idx_likes_reaccion ON likes (tipo, target_id, reaccion);
