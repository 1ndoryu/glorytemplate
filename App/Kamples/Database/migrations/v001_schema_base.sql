/*
 * Kamples — Schema base de PostgreSQL (SIN pgvector)
 * Migración v001_base: Tablas del sistema sin dependencia de extensiones externas
 *
 * Esta versión es idéntica a v001_schema_inicial.sql pero SIN:
 *   - CREATE EXTENSION pgvector
 *   - Columna embedding vector(1536) en samples
 *   - Índice HNSW idx_samples_embedding
 *
 * Cuando pgvector esté instalado, ejecutar v002_pgvector_setup.sql
 * para agregar la columna embedding y el índice.
 *
 * Ejecutar: psql -U postgres -d kamples -f v001_schema_base.sql
 */

/* Extensión para búsqueda por trigrama (no requiere instalación extra) */
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

/* 
 * Tabla: usuarios_ext
 * Extensión del usuario WP. Vinculada por wp_user_id.
 */
CREATE TABLE IF NOT EXISTS usuarios_ext (
    id SERIAL PRIMARY KEY,
    wp_user_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_usuarios_ext_wp ON usuarios_ext (wp_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_ext_username ON usuarios_ext (username);


/* 
 * Tabla: samples
 * Tabla principal de samples de audio.
 * NOTA: columna embedding se agrega cuando pgvector esté instalado (v002)
 */
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
    total_descargas INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_reproducciones INT DEFAULT 0,
    publicado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* Índices sin pgvector */
CREATE INDEX IF NOT EXISTS idx_samples_metadata ON samples USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_samples_tags ON samples USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_samples_estado ON samples (estado, publicado_at DESC);
CREATE INDEX IF NOT EXISTS idx_samples_creador ON samples (creador_id);
CREATE INDEX IF NOT EXISTS idx_samples_slug ON samples (slug);
CREATE INDEX IF NOT EXISTS idx_samples_bpm ON samples (bpm) WHERE bpm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_samples_key ON samples (key) WHERE key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_samples_titulo_trgm ON samples USING GIN (titulo gin_trgm_ops);


/* 
 * Tabla: publicaciones
 * Publicaciones del feed social.
 */
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

CREATE INDEX IF NOT EXISTS idx_publicaciones_autor ON publicaciones (autor_id, created_at DESC);


/* 
 * Tabla: follows
 * Relaciones de seguimiento entre usuarios.
 */
CREATE TABLE IF NOT EXISTS follows (
    seguidor_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    seguido_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (seguidor_id, seguido_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_seguido ON follows (seguido_id);


/* 
 * Tabla: likes
 * Likes genéricos para samples y publicaciones.
 */
CREATE TABLE IF NOT EXISTS likes (
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sample', 'publicacion')),
    target_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (usuario_id, tipo, target_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_target ON likes (tipo, target_id);


/* 
 * Tabla: descargas
 * Historial de descargas + control de límites.
 */
CREATE TABLE IF NOT EXISTS descargas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    sample_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    calidad VARCHAR(10) NOT NULL DEFAULT 'mp3',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_descargas_usuario_dia ON descargas (usuario_id, created_at);


/* 
 * Tabla: colecciones
 * Playlists y colecciones de samples.
 */
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

CREATE INDEX IF NOT EXISTS idx_colecciones_usuario ON colecciones (usuario_id);


/* 
 * Tabla: coleccion_samples
 * Relación M:N entre colecciones y samples.
 */
CREATE TABLE IF NOT EXISTS coleccion_samples (
    coleccion_id INT NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
    sample_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    posicion INT DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (coleccion_id, sample_id)
);


/* 
 * Tabla: conversaciones
 * Parejas de chat entre dos usuarios.
 */
CREATE TABLE IF NOT EXISTS conversaciones (
    id SERIAL PRIMARY KEY,
    participante_1 INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    participante_2 INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    ultimo_mensaje_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (participante_1, participante_2)
);

CREATE INDEX IF NOT EXISTS idx_conversaciones_participantes ON conversaciones (participante_1, participante_2);


/* 
 * Tabla: mensajes
 * Mensajes individuales dentro de conversaciones.
 */
CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    remitente_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes (conversacion_id, created_at);


/* 
 * Tabla: notificaciones
 * Notificaciones del sistema para cada usuario.
 */
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

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones (usuario_id, leida, created_at DESC);


/* 
 * Tabla: suscripciones
 * Planes de suscripción vinculados a Stripe.
 */
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

CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON suscripciones (usuario_id);


/* 
 * Tabla: transacciones
 * Registro de pagos, compras y payouts.
 */
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

CREATE INDEX IF NOT EXISTS idx_transacciones_comprador ON transacciones (comprador_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_vendedor ON transacciones (vendedor_id);


/* 
 * Tabla: reproducciones
 * Historial de reproducción para alimentar el algoritmo.
 */
CREATE TABLE IF NOT EXISTS reproducciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios_ext(id) ON DELETE SET NULL,
    sample_id INT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    duracion_escuchada REAL DEFAULT 0,
    completa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reproducciones_usuario ON reproducciones (usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reproducciones_sample ON reproducciones (sample_id);


/* 
 * Tabla: comentarios
 * Comentarios en publicaciones y samples.
 */
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    autor_id INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sample', 'publicacion')),
    target_id INT NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_target ON comentarios (tipo, target_id, created_at);


/* 
 * Función: actualizar updated_at automáticamente
 */
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* Triggers solo si no existen (envolver en DO block por idempotencia) */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_usuarios_ext_updated') THEN
        CREATE TRIGGER trg_usuarios_ext_updated
            BEFORE UPDATE ON usuarios_ext
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_samples_updated') THEN
        CREATE TRIGGER trg_samples_updated
            BEFORE UPDATE ON samples
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
END $$;

/* Verificación final */
DO $$
DECLARE
    tabla_count INT;
BEGIN
    SELECT COUNT(*) INTO tabla_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Schema base creado exitosamente.';
    RAISE NOTICE 'Tablas creadas: %', tabla_count;
    RAISE NOTICE 'pgvector: NO instalado (se agrega después con v002)';
    RAISE NOTICE '--------------------------------------';
END $$;
