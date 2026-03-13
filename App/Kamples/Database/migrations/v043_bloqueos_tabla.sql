/* v043: Tabla bloqueos (user-to-user blocking)
 * Creada en QQ25 via Schema System pero sin migración SQL correspondiente.
 * Necesaria para filtros bidireccionales en feed, comentarios, notificaciones y mensajes.
 */

CREATE TABLE IF NOT EXISTS bloqueos (
    id              SERIAL PRIMARY KEY,
    bloqueador_id   INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    bloqueado_id    INT NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    razon           VARCHAR(255) NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bloqueos_par_unico UNIQUE (bloqueador_id, bloqueado_id),
    CONSTRAINT bloqueos_no_autoblock CHECK (bloqueador_id <> bloqueado_id)
);

CREATE INDEX IF NOT EXISTS idx_bloqueos_bloqueador ON bloqueos (bloqueador_id);
CREATE INDEX IF NOT EXISTS idx_bloqueos_bloqueado  ON bloqueos (bloqueado_id);
