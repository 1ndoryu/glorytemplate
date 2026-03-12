/*
 * v040 — Sistema de suspensión de usuarios (QQ65).
 *
 * Agrega columnas para gestionar estados de cuenta:
 * - estado: activo | suspendido | en_eliminacion
 * - suspendido_hasta: timestamp hasta cuándo dura la suspensión
 * - suspension_razon: motivo legible de la suspensión
 * - marcado_eliminacion_en: cuándo se marcó para eliminación
 * - sera_eliminado_en: deadline de 15 días para eliminación definitiva
 *
 * También agrega estado a samples y publicaciones para ocultar contenido reportado.
 */

/* Columnas de estado de cuenta en usuarios_ext */
ALTER TABLE usuarios_ext
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    ADD COLUMN IF NOT EXISTS suspendido_hasta TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspension_razon TEXT,
    ADD COLUMN IF NOT EXISTS marcado_eliminacion_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sera_eliminado_en TIMESTAMPTZ;

ALTER TABLE usuarios_ext
    DROP CONSTRAINT IF EXISTS usuarios_ext_estado_check;

ALTER TABLE usuarios_ext
    ADD CONSTRAINT usuarios_ext_estado_check
    CHECK (estado IN ('activo', 'suspendido', 'en_eliminacion'));

/* Índice parcial para queries de contenido: filtrar usuarios no activos */
CREATE INDEX IF NOT EXISTS idx_usuarios_ext_estado
    ON usuarios_ext (estado) WHERE estado != 'activo';

/* Índice para limpieza automática de cuentas en eliminación */
CREATE INDEX IF NOT EXISTS idx_usuarios_ext_sera_eliminado
    ON usuarios_ext (sera_eliminado_en) WHERE sera_eliminado_en IS NOT NULL;
