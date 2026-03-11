/*
 * v034 — Soporte para ediciones comunitarias y propuestas de eliminacion.
 *
 * Cambios:
 * 1. Columna `relacion_existente_id` para vincular edicion/eliminacion a relacion existente.
 * 2. Columna `tipo_contribucion` para diferenciar nueva/edicion/eliminacion.
 * 3. Columna `cambios_propuestos` JSONB para almacenar cambios puntuales de edicion.
 *
 * Prerequisito: v033 ejecutada.
 */

BEGIN;

/* 1. Referencia a relacion existente (para ediciones/eliminaciones) */
ALTER TABLE contribuciones_pendientes
    ADD COLUMN IF NOT EXISTS relacion_existente_id INT
        REFERENCES relaciones_sample(id) ON DELETE SET NULL;

/* 2. Tipo de contribucion: nueva relacion, edicion de existente, o propuesta de eliminacion */
ALTER TABLE contribuciones_pendientes
    ADD COLUMN IF NOT EXISTS tipo_contribucion VARCHAR(20) DEFAULT 'nueva'
        CHECK (tipo_contribucion IN ('nueva', 'edicion', 'eliminacion'));

/* 3. Cambios propuestos en formato JSONB (para ediciones parciales) */
ALTER TABLE contribuciones_pendientes
    ADD COLUMN IF NOT EXISTS cambios_propuestos JSONB;

/* 4. Indice para buscar por relacion existente */
CREATE INDEX IF NOT EXISTS idx_contribuciones_relacion_existente
    ON contribuciones_pendientes(relacion_existente_id)
    WHERE relacion_existente_id IS NOT NULL;

/* 5. Indice por tipo_contribucion + estado (consultas admin frecuentes) */
CREATE INDEX IF NOT EXISTS idx_contribuciones_tipo_estado
    ON contribuciones_pendientes(tipo_contribucion, estado);

COMMIT;
