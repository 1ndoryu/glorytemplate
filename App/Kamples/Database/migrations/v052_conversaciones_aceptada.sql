/*
 * v052: QK60 — Agregar columna 'aceptada' a conversaciones.
 *
 * Separa el concepto de "aceptar solicitud de mensaje" del follow mutuo.
 * Cuando un usuario responde a una solicitud, la conversación se marca como aceptada
 * y pasa de "solicitudes" a "principal" sin requerir follow.
 */

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS aceptada BOOLEAN DEFAULT FALSE;
