/* [183A-106] Tablas para codigos de descarga gratuita gestionados por admin.
 * codigos_descarga_gratis: un admin genera un codigo para un sample o coleccion.
 * codigos_gratis_usos: registra que usuario reclamo el codigo (max 1 uso por usuario, enforced por UNIQUE).
 * Pendiente: metricas de conversion (cuantos anonimos se registraron gracias a un codigo). */

CREATE TABLE IF NOT EXISTS codigos_descarga_gratis (
    id          BIGSERIAL PRIMARY KEY,
    codigo      VARCHAR(64) UNIQUE NOT NULL,
    tipo        VARCHAR(32) NOT NULL CHECK (tipo IN ('sample', 'coleccion')),
    target_id   BIGINT NOT NULL,
    creado_por_id BIGINT NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS codigos_gratis_usos (
    id            BIGSERIAL PRIMARY KEY,
    codigo_id     BIGINT NOT NULL REFERENCES codigos_descarga_gratis(id) ON DELETE CASCADE,
    usuario_id    BIGINT NOT NULL,
    reclamado_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(codigo_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_codigos_gratis_tipo_target
    ON codigos_descarga_gratis(tipo, target_id, activo);
CREATE INDEX IF NOT EXISTS idx_codigos_gratis_usos_usuario
    ON codigos_gratis_usos(usuario_id, codigo_id);
