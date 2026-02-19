/*
 * Kamples — Schema inicial para desarrollo local
 * Basada en v001_schema_inicial.sql pero sin pgvector (se añadirá en producción).
 * Extensión pg_trgm sí se incluye (viene con PG por defecto).
 */

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS usuarios_ext (
    id SERIAL PRIMARY KEY,
    wp_user_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre_visible VARCHAR(100) NOT NULL DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    portada_url TEXT,
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'creador', 'admin')),
    verificado BOOLEAN DEFAULT FALSE,
    total_seguidores INT DEFAULT 0,
    total_seguidos INT DEFAULT 0,
    total_samples INT DEFAULT 0,
    total_descargas INT DEFAULT 0,
    stripe_customer_id VARCHAR(100),
    stripe_connect_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_ext_wp ON usuarios_ext (wp_user_id);
CREATE INDEX idx_usuarios_ext_username ON usuarios_ext (username);

CREATE TABLE IF NOT EXISTS samples (
    id SERIAL PRIMARY KEY,
    creador_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    descripcion TEXT DEFAULT '',
    bpm INT,
    key VARCHAR(3),
    escala VARCHAR(10),
    duracion REAL NOT NULL DEFAULT 0,
    formato VARCHAR(10) NOT NULL DEFAULT 'wav',
    tamano BIGINT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    estado VARCHAR(20) NOT NULL DEFAULT 'procesando'
        CHECK (estado IN ('procesando', 'activo', 'inactivo', 'eliminado')),
    tipo VARCHAR(20) NOT NULL DEFAULT 'loop'
        CHECK (tipo IN ('loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro')),
    es_premium BOOLEAN DEFAULT FALSE,
    precio DECIMAL(10, 2),
    ruta_original TEXT,
    ruta_optimizada TEXT,
    ruta_preview TEXT,
    ruta_waveform TEXT,
    imagen_url TEXT,
    /* embedding vector(1536) — se añade cuando pgvector esté instalado */
    total_descargas INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_reproducciones INT DEFAULT 0,
    publicado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_samples_metadata ON samples USING GIN (metadata);
CREATE INDEX idx_samples_tags ON samples USING GIN (tags);
CREATE INDEX idx_samples_estado ON samples (estado, publicado_at DESC);
CREATE INDEX idx_samples_creador ON samples (creador_id);
CREATE INDEX idx_samples_slug ON samples (slug);
CREATE INDEX idx_samples_bpm ON samples (bpm) WHERE bpm IS NOT NULL;
CREATE INDEX idx_samples_key ON samples (key) WHERE key IS NOT NULL;
CREATE INDEX idx_samples_titulo_trgm ON samples USING GIN (titulo gin_trgm_ops);

CREATE TABLE IF NOT EXISTS publicaciones (
    id SERIAL PRIMARY KEY,
    autor_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'social' CHECK (tipo IN ('social', 'sample')),
    contenido TEXT DEFAULT '',
    imagenes TEXT[] DEFAULT '{}',
    samples_adjuntos INT[] DEFAULT '{}',
    total_likes INT DEFAULT 0,
    total_comentarios INT DEFAULT 0,
    total_reposts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publicaciones_autor ON publicaciones (autor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS follows (
    seguidor_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    seguido_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (seguidor_id, seguido_id)
);

CREATE INDEX idx_follows_seguido ON follows (seguido_id);

CREATE TABLE IF NOT EXISTS likes (
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sample', 'publicacion')),
    target_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (usuario_id, tipo, target_id)
);

CREATE INDEX idx_likes_target ON likes (tipo, target_id);

CREATE TABLE IF NOT EXISTS descargas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    sample_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    calidad VARCHAR(10) NOT NULL DEFAULT 'mp3',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_descargas_usuario_dia ON descargas (usuario_id, created_at);

CREATE TABLE IF NOT EXISTS colecciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '',
    imagen_url TEXT,
    publica BOOLEAN DEFAULT TRUE,
    total_samples INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_colecciones_usuario ON colecciones (usuario_id);

CREATE TABLE IF NOT EXISTS coleccion_samples (
    coleccion_id INT NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
    sample_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    posicion INT DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (coleccion_id, sample_id)
);

CREATE TABLE IF NOT EXISTS conversaciones (
    id SERIAL PRIMARY KEY,
    participante_1 INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    participante_2 INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    ultimo_mensaje_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (participante_1, participante_2)
);

CREATE INDEX idx_conversaciones_participantes ON conversaciones (participante_1, participante_2);

CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    remitente_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mensajes_conversacion ON mensajes (conversacion_id, created_at);

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT DEFAULT '',
    leida BOOLEAN DEFAULT FALSE,
    enlace TEXT,
    actor_id INT REFERENCES usuarios_ext(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones (usuario_id, leida, created_at DESC);

CREATE TABLE IF NOT EXISTS suscripciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    estado VARCHAR(30) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'cancelada', 'vencida', 'periodo_prueba')),
    stripe_subscription_id VARCHAR(100),
    inicio_at TIMESTAMPTZ,
    fin_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suscripciones_usuario ON suscripciones (usuario_id);

CREATE TABLE IF NOT EXISTS transacciones (
    id SERIAL PRIMARY KEY,
    comprador_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    vendedor_id INT REFERENCES usuarios_ext(id) ON DELETE SET NULL,
    sample_id INT REFERENCES samples(id) ON DELETE SET NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('suscripcion', 'compra_sample', 'payout')),
    monto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('completada', 'pendiente', 'fallida', 'reembolsada')),
    stripe_payment_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transacciones_comprador ON transacciones (comprador_id);
CREATE INDEX idx_transacciones_vendedor ON transacciones (vendedor_id);

CREATE TABLE IF NOT EXISTS reproducciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios_ext(id) ON DELETE SET NULL,
    sample_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    duracion_escuchada REAL DEFAULT 0,
    completa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reproducciones_usuario ON reproducciones (usuario_id, created_at DESC);
CREATE INDEX idx_reproducciones_sample ON reproducciones (sample_id);

CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    autor_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sample', 'publicacion')),
    target_id INT NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comentarios_target ON comentarios (tipo, target_id, created_at);

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_ext_updated
    BEFORE UPDATE ON usuarios_ext
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_samples_updated
    BEFORE UPDATE ON samples
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
