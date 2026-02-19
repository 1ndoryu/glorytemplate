/*
 * Migración v007 — Agregar columnas de moderación a publicaciones.
 * Soporta el sistema de moderación IA (Fase E).
 */

ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS moderacion_estado VARCHAR(20) DEFAULT 'pendiente';
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS moderacion_detalle JSONB DEFAULT '{}';

/* Índice para filtrar solo publicaciones aprobadas en el feed */
CREATE INDEX IF NOT EXISTS idx_publicaciones_moderacion ON publicaciones (moderacion_estado);

COMMENT ON COLUMN publicaciones.moderacion_estado IS 'Estado de moderación: pendiente, aprobado, revision, rechazado';
COMMENT ON COLUMN publicaciones.moderacion_detalle IS 'Detalle del análisis IA (capas guard, vision, contextual)';
