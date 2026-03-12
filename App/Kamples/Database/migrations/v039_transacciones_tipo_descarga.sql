/*
 * v039 — Agregar 'descarga' al CHECK constraint de tipo en transacciones.
 * Bug: registrarRevenueShare insertaba 'descarga' pero el CHECK solo permitia
 * 'suscripcion', 'compra_sample', 'payout'. El INSERT fallaba a nivel BD.
 */

ALTER TABLE transacciones
    DROP CONSTRAINT IF EXISTS transacciones_tipo_check;

ALTER TABLE transacciones
    ADD CONSTRAINT transacciones_tipo_check
    CHECK (tipo IN ('suscripcion', 'compra_sample', 'payout', 'descarga'));
