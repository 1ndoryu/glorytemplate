/*
 * v035 — Vinculacion de samples subidos por usuarios a una relacion de sampleo.
 *
 * Permite que usuarios suban samples de audio adjuntos a un sampleo especifico
 * (feautre C802c / L5.6: "Subir sample de esta relacion").
 *
 * Cambios:
 * 1. Columna `relacion_sampleo_id` en tabla `samples` — FK nullable a relaciones_sample(id).
 * 2. Indice para consultas de samples por relacion (FeedSamples en RelacionDetalleIsland).
 *
 * Prerequisito: v034 ejecutada.
 */

BEGIN;

/* 1. FK nullable: un sample puede estar vinculado a una relacion de sampleo */
ALTER TABLE samples
    ADD COLUMN IF NOT EXISTS relacion_sampleo_id INT
        REFERENCES relaciones_sample(id) ON DELETE SET NULL;

/* 2. Indice para obtenerSamplesDeRelacion() — SamplesRepository */
CREATE INDEX IF NOT EXISTS idx_samples_relacion_sampleo
    ON samples(relacion_sampleo_id)
    WHERE relacion_sampleo_id IS NOT NULL;

COMMIT;
