/*
 * v060 — Tabla colecciones_guardadas para bookmarks de colecciones ajenas.
 * QL92: Los usuarios pueden guardar colecciones de otros usuarios para acceso rapido.
 *
 * UNIQUE constraint en (usuario_id, coleccion_id) previene duplicados.
 * ON DELETE CASCADE asegura limpieza si se elimina el usuario o la coleccion.
 */

CREATE TABLE IF NOT EXISTS colecciones_guardadas (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    coleccion_id    INTEGER NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, coleccion_id)
);

CREATE INDEX IF NOT EXISTS idx_colecciones_guardadas_usuario ON colecciones_guardadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_colecciones_guardadas_coleccion ON colecciones_guardadas(coleccion_id);
