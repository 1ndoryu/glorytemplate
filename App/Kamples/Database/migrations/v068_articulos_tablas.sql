/* [183A-109] Tablas para sistema de blog: articulos + articulos_likes.
 * - articulos: contenido HTML, categorías fijas, embeds JSON (samples/colecciones).
 * - articulos_likes: PK compuesta (usuario_id, articulo_id).
 * - Moderación integrada: campo moderacion_estado reutiliza flujo existente.
 * - Índices para listado público, búsqueda por categoría, autor y slug. */

CREATE TABLE IF NOT EXISTS articulos (
    id SERIAL PRIMARY KEY,
    autor_id INT NOT NULL REFERENCES usuarios_ext(id),
    titulo VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    contenido TEXT NOT NULL DEFAULT '',
    extracto VARCHAR(500) NOT NULL DEFAULT '',
    portada_url TEXT,
    categoria VARCHAR(50) NOT NULL DEFAULT 'inspiracion'
        CHECK (categoria IN (
            'inspiracion', 'mastering', 'mezcla', 'promocion-musical', 'teoria-musical',
            'grabacion', 'sampling', 'diseno-sonoro', 'herramientas',
            'ableton-live', 'bitwig-studio', 'cubase', 'fl-studio', 'garageband',
            'logic-pro', 'pro-tools', 'studio-one',
            'drops-gratis', 'midi-gratis', 'plugins-gratis', 'presets-gratis',
            'proyectos-gratis', 'sonidos-gratis',
            'entrevistas', 'destacados', 'noticias'
        )),
    embeds JSONB NOT NULL DEFAULT '[]',
    descarga_publica BOOLEAN NOT NULL DEFAULT FALSE,
    total_likes INT NOT NULL DEFAULT 0,
    total_comentarios INT NOT NULL DEFAULT 0,
    moderacion_estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (moderacion_estado IN ('pendiente', 'revision', 'aprobado', 'rechazado')),
    moderacion_razon VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    publicado_en TIMESTAMPTZ,
    eliminado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_articulos_autor ON articulos(autor_id);
CREATE INDEX IF NOT EXISTS idx_articulos_slug ON articulos(slug);
CREATE INDEX IF NOT EXISTS idx_articulos_categoria ON articulos(categoria);
CREATE INDEX IF NOT EXISTS idx_articulos_publicados ON articulos(publicado_en DESC)
    WHERE moderacion_estado = 'aprobado' AND eliminado_en IS NULL;
CREATE INDEX IF NOT EXISTS idx_articulos_moderacion ON articulos(moderacion_estado)
    WHERE eliminado_en IS NULL;

CREATE TABLE IF NOT EXISTS articulos_likes (
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id),
    articulo_id INT NOT NULL REFERENCES articulos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, articulo_id)
);

CREATE INDEX IF NOT EXISTS idx_articulos_likes_articulo ON articulos_likes(articulo_id);
