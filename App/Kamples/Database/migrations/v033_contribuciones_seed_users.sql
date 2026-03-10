/*
 * v033 — Sistema de contribuciones comunitarias, seed users y reporte legal.
 *
 * Cambios:
 * 1. Columna `es_seed` en `usuarios_ext` para marcar usuarios simulados.
 * 2. Tabla `contribuciones_pendientes` para contribuciones de relaciones (moderacion).
 * 3. Indices para busquedas eficientes en contribuciones.
 *
 * Prerequisito: v032 ejecutada.
 */

BEGIN;

/* 1. Marcador secreto para seed users (no expuesto en API) */
ALTER TABLE usuarios_ext
    ADD COLUMN IF NOT EXISTS es_seed BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN usuarios_ext.es_seed
    IS 'True para usuarios generados automaticamente (seed). No exponer en API publica.';

CREATE INDEX IF NOT EXISTS idx_usuarios_ext_es_seed
    ON usuarios_ext(es_seed) WHERE es_seed = true;

/* 2. Tabla de contribuciones pendientes de moderacion */
CREATE TABLE IF NOT EXISTS contribuciones_pendientes (
    id SERIAL PRIMARY KEY,
    contribuidor_id INT NOT NULL REFERENCES usuarios_ext(id),

    /* Cancion existente (al menos uno de los dos debe ser NOT NULL al aprobar) */
    cancion_destino_id INT REFERENCES canciones(id),
    cancion_fuente_id INT REFERENCES canciones(id),

    /* Datos de cancion nueva (cuando la cancion no existe en BD) */
    cancion_nueva_titulo VARCHAR(500),
    cancion_nueva_artista VARCHAR(300),
    cancion_nueva_youtube_url VARCHAR(500),
    cancion_nueva_lado VARCHAR(10) CHECK (cancion_nueva_lado IN ('destino', 'fuente')),

    /* Datos de la relacion propuesta */
    tipo_relacion VARCHAR(20) DEFAULT 'sample'
        CHECK (tipo_relacion IN ('sample', 'cover', 'remix', 'interpolation')),
    tipo_elemento VARCHAR(50) DEFAULT 'multiple_elements'
        CHECK (tipo_elemento IN (
            'hook_riff', 'vocals_lyrics', 'drums', 'bass',
            'keys_synth', 'sound_effect', 'multiple_elements', 'other'
        )),

    /* Moderacion */
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    moderador_id INT REFERENCES usuarios_ext(id),
    moderador_nota TEXT,

    /* Resultado: ID de la relacion creada al aprobar */
    relacion_creada_id INT REFERENCES relaciones_sample(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    resuelto_at TIMESTAMPTZ
);

/* 3. Indices para contribuciones */
CREATE INDEX IF NOT EXISTS idx_contribuciones_estado
    ON contribuciones_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_contribuciones_contribuidor
    ON contribuciones_pendientes(contribuidor_id);
CREATE INDEX IF NOT EXISTS idx_contribuciones_estado_created
    ON contribuciones_pendientes(estado, created_at DESC);

COMMIT;
