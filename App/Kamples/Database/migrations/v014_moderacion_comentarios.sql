/*
 * v014 — Moderación de comentarios + sistema de bans + reportes (C131/C132)
 * Añade moderación a comentarios, baneos a usuarios, y tabla de reportes genérica.
 */

/* Moderación en comentarios */
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS moderacion_estado VARCHAR(20) DEFAULT 'aprobado';
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS moderacion_detalle JSONB DEFAULT '{}';

/* Sistema de bans y violaciones en usuarios */
ALTER TABLE usuarios_ext ADD COLUMN IF NOT EXISTS violaciones_moderacion INT DEFAULT 0;
ALTER TABLE usuarios_ext ADD COLUMN IF NOT EXISTS baneado_hasta TIMESTAMPTZ;
ALTER TABLE usuarios_ext ADD COLUMN IF NOT EXISTS ban_razon TEXT;

/* Tabla genérica de reportes (C112/C132) */
CREATE TABLE IF NOT EXISTS reportes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL,
    target_id INT NOT NULL,
    reportador_id INT NOT NULL REFERENCES usuarios_ext(id),
    reportado_id INT REFERENCES usuarios_ext(id),
    razon TEXT NOT NULL,
    detalles TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    resuelto_por INT REFERENCES usuarios_ext(id),
    resuelto_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo_target ON reportes(tipo, target_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_moderacion ON comentarios(moderacion_estado);
