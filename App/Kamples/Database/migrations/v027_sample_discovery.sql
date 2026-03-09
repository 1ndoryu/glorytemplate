/*
 * Migración v027: Tablas para Sample Discovery & Metadata Engine (Fase S)
 *
 * 6 tablas: artistas_musicales, canciones, canciones_artistas,
 * relaciones_sample, scraping_log, cola_extraccion_samples
 *
 * Ejecutar: psql -U postgres -d kamples -f v023_sample_discovery.sql
 */

BEGIN;

/* ============================================================
   ARTISTAS MUSICALES
   ============================================================ */
CREATE TABLE IF NOT EXISTS artistas_musicales (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(300) NOT NULL,
    slug            VARCHAR(350) UNIQUE NOT NULL,
    imagen_url      TEXT,
    whosampled_slug VARCHAR(350) UNIQUE,
    musicbrainz_id  VARCHAR(36),
    metadata        JSONB DEFAULT '{}',
    total_canciones INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artistas_slug ON artistas_musicales(slug);
CREATE INDEX IF NOT EXISTS idx_artistas_ws_slug ON artistas_musicales(whosampled_slug);


/* ============================================================
   CANCIONES
   ============================================================ */
CREATE TABLE IF NOT EXISTS canciones (
    id                SERIAL PRIMARY KEY,
    titulo            VARCHAR(500) NOT NULL,
    slug              VARCHAR(550) UNIQUE NOT NULL,
    artista_id        INT NOT NULL REFERENCES artistas_musicales(id),
    album             VARCHAR(500),
    sello             VARCHAR(200),
    anio              SMALLINT,
    duracion_segundos SMALLINT,
    genero            VARCHAR(100),
    youtube_id        VARCHAR(20),
    imagen_url        TEXT,
    whosampled_url    VARCHAR(500) UNIQUE,
    bpm               SMALLINT,
    tonalidad         VARCHAR(5),
    metadata          JSONB DEFAULT '{}',
    total_sampleada   INT DEFAULT 0,
    total_samplea     INT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canciones_artista ON canciones(artista_id);
CREATE INDEX IF NOT EXISTS idx_canciones_slug ON canciones(slug);
CREATE INDEX IF NOT EXISTS idx_canciones_ws ON canciones(whosampled_url);
CREATE INDEX IF NOT EXISTS idx_canciones_anio ON canciones(anio);
CREATE INDEX IF NOT EXISTS idx_canciones_youtube ON canciones(youtube_id);


/* ============================================================
   CANCIONES_ARTISTAS — Relación N:N
   ============================================================ */
CREATE TABLE IF NOT EXISTS canciones_artistas (
    cancion_id  INT NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
    artista_id  INT NOT NULL REFERENCES artistas_musicales(id) ON DELETE CASCADE,
    rol         VARCHAR(20) NOT NULL DEFAULT 'principal'
                CHECK (rol IN ('principal', 'featuring', 'producer')),
    PRIMARY KEY (cancion_id, artista_id, rol)
);

CREATE INDEX IF NOT EXISTS idx_ca_artista ON canciones_artistas(artista_id);


/* ============================================================
   RELACIONES DE SAMPLE
   ============================================================ */
CREATE TABLE IF NOT EXISTS relaciones_sample (
    id                  SERIAL PRIMARY KEY,
    cancion_destino_id  INT NOT NULL REFERENCES canciones(id),
    cancion_fuente_id   INT NOT NULL REFERENCES canciones(id),
    whosampled_id       INT UNIQUE,
    tipo_relacion       VARCHAR(20) NOT NULL DEFAULT 'sample'
                        CHECK (tipo_relacion IN (
                            'sample', 'cover', 'remix', 'interpolation'
                        )),
    tipo_elemento       VARCHAR(50) DEFAULT 'multiple_elements'
                        CHECK (tipo_elemento IN (
                            'hook_riff', 'vocals_lyrics', 'drums',
                            'bass', 'keys_synth', 'sound_effect',
                            'multiple_elements', 'other'
                        )),
    timings_destino     JSONB DEFAULT '[]',
    timings_fuente      JSONB DEFAULT '[]',
    aparece_en_todo     BOOLEAN DEFAULT FALSE,
    sample_id           INT REFERENCES samples(id) ON DELETE SET NULL,
    votos_total         INT DEFAULT 0,
    votos_promedio      DECIMAL(2,1) DEFAULT 0,
    fuente              VARCHAR(20) DEFAULT 'scraping'
                        CHECK (fuente IN ('scraping', 'comunidad', 'musicbrainz', 'import')),
    contribuidor_id     INT REFERENCES usuarios_ext(id),
    verificada          BOOLEAN DEFAULT FALSE,
    UNIQUE (cancion_destino_id, cancion_fuente_id, tipo_relacion),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rel_destino ON relaciones_sample(cancion_destino_id);
CREATE INDEX IF NOT EXISTS idx_rel_fuente ON relaciones_sample(cancion_fuente_id);
CREATE INDEX IF NOT EXISTS idx_rel_tipo ON relaciones_sample(tipo_relacion);
CREATE INDEX IF NOT EXISTS idx_rel_sample ON relaciones_sample(sample_id);
CREATE INDEX IF NOT EXISTS idx_rel_verificada ON relaciones_sample(verificada);
CREATE INDEX IF NOT EXISTS idx_rel_ws ON relaciones_sample(whosampled_id);


/* ============================================================
   SCRAPING LOG
   ============================================================ */
CREATE TABLE IF NOT EXISTS scraping_log (
    id              SERIAL PRIMARY KEY,
    url             VARCHAR(1000) UNIQUE NOT NULL,
    tipo_pagina     VARCHAR(30) NOT NULL
                    CHECK (tipo_pagina IN (
                        'hot_samples', 'hot_covers', 'hot_remixes',
                        'sample_detail', 'cover_detail', 'remix_detail',
                        'artist', 'track', 'track_samples', 'track_sampled',
                        'browse_year', 'browse_genre'
                    )),
    estado          VARCHAR(20) DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'procesado', 'error', 'skip')),
    intentos        SMALLINT DEFAULT 0,
    bytes_descargados INT DEFAULT 0,
    error_mensaje   TEXT,
    procesado_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraping_estado ON scraping_log(estado);
CREATE INDEX IF NOT EXISTS idx_scraping_tipo ON scraping_log(tipo_pagina);


/* ============================================================
   COLA EXTRACCIÓN SAMPLES
   ============================================================ */
CREATE TABLE IF NOT EXISTS cola_extraccion_samples (
    id                  SERIAL PRIMARY KEY,
    relacion_id         INT NOT NULL REFERENCES relaciones_sample(id),
    youtube_id          VARCHAR(20) NOT NULL,
    timing_inicio_seg   SMALLINT NOT NULL,
    bpm_detectado       SMALLINT,
    duracion_compas_seg DECIMAL(5,2),
    compas_inicio_seg   DECIMAL(5,2),
    compas_fin_seg      DECIMAL(5,2),
    estado              VARCHAR(20) DEFAULT 'pendiente'
                        CHECK (estado IN (
                            'pendiente', 'descargando', 'analizando',
                            'recortando', 'completado', 'error',
                            'revision_humana'
                        )),
    sample_id           INT REFERENCES samples(id),
    error_mensaje       TEXT,
    intentos            SMALLINT DEFAULT 0,
    procesado_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cola_estado ON cola_extraccion_samples(estado);
CREATE INDEX IF NOT EXISTS idx_cola_relacion ON cola_extraccion_samples(relacion_id);

COMMIT;
