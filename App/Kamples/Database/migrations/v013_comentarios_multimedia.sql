/*
 * v013 — Soporte multimedia en comentarios (C130)
 * Añade tipo_contenido, media_url y media_metadata a la tabla comentarios.
 * Replica el patrón de v008_mensajes_multimedia.
 */

ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS tipo_contenido VARCHAR(20) DEFAULT 'texto';
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS media_metadata JSONB;

/* Permite contenido vacío cuando hay media (imagen sin caption) */
ALTER TABLE comentarios ALTER COLUMN contenido DROP NOT NULL;
