/*
 * v038 — Agregar columna generos_favoritos a usuarios_ext (QQ45).
 * Almacena array JSON de generos seleccionados por el usuario en onboarding.
 * Usado por MotorRecomendacion como señal de contexto para usuarios nuevos.
 */
ALTER TABLE usuarios_ext
    ADD COLUMN IF NOT EXISTS generos_favoritos JSONB DEFAULT '[]'::jsonb;
