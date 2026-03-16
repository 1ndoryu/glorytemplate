/*
 * v057 — Tabla fcm_tokens para notificaciones push Firebase Cloud Messaging.
 * QL34: FCM para Android nativo (app cerrada).
 *
 * Almacena tokens FCM por usuario/plataforma. Un usuario puede tener
 * multiples tokens (ej: telefono + tablet).
 * El token se renueva periodicamente, UNIQUE constraint previene duplicados.
 */

CREATE TABLE IF NOT EXISTS fcm_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    plataforma  VARCHAR(20) NOT NULL DEFAULT 'android',
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_usuario ON fcm_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_activo ON fcm_tokens(usuario_id, activo) WHERE activo = true;
