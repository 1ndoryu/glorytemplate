/*
 * v054 — QK78: Actualizar max_intentos de cola IA de 2 a 30.
 *
 * Items existentes pendientes o en error_reintento se benefician
 * del nuevo límite de reintentos con backoff exponencial.
 * No afecta items ya completados o en error_final.
 */

BEGIN;

/* Actualizar items que aún pueden reintentarse */
UPDATE cola_procesamiento_ia
SET max_intentos = 30
WHERE max_intentos < 30
  AND estado IN ('pendiente', 'procesando', 'error_reintento');

/* Items en error_final con intentos < 30: resetear a error_reintento
   para que el cron los retome con el nuevo límite */
UPDATE cola_procesamiento_ia
SET estado = 'error_reintento',
    max_intentos = 30,
    proximo_intento = NOW() + INTERVAL '15 minutes'
WHERE estado = 'error_final'
  AND intentos < 30;

COMMIT;
