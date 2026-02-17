/*
 * v017: Créditos bonus por publicar samples.
 * Cada sample publicado suma 1 crédito permanente al usuario.
 * Se suma al límite diario de descargas del plan.
 */
ALTER TABLE usuarios_ext
    ADD COLUMN IF NOT EXISTS creditos_bonus INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN usuarios_ext.creditos_bonus IS 'Créditos extra permanentes ganados por publicar samples (+1 por publicación)';
