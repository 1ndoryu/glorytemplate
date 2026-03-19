/* [183A-96] Constraints de idempotencia para transacciones.
 * Previene doble procesamiento de webhooks Stripe y race conditions en compras.
 * Normaliza estado 'completed' a 'completada' (valor canónico). */

UPDATE transacciones SET estado = 'completada' WHERE estado = 'completed';

CREATE UNIQUE INDEX IF NOT EXISTS uq_stripe_payment_id
    ON transacciones (stripe_payment_id)
    WHERE stripe_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_compra_sample_por_usuario
    ON transacciones (comprador_id, sample_id)
    WHERE tipo = 'compra_sample' AND estado IN ('completada', 'completed');
