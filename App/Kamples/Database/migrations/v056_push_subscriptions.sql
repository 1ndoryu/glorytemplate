/*
 * v056 — Tabla push_subscriptions para notificaciones VAPID (Web Push API).
 * Self-hosted, sin dependencia de Firebase/FCM.
 * QK86: Notificaciones push para Android (y web/desktop).
 */

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios_ext(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    plataforma  VARCHAR(20) NOT NULL DEFAULT 'web',
    activa      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Indices para busqueda rapida por usuario y unicidad de endpoint */
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_usuario ON push_subscriptions(usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
