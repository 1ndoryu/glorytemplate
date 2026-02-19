/*
 * v015 — Verificación de samples
 * Los samples verificados tienen metadata confirmada por humano.
 * Boost en el algoritmo de recomendación para verificados.
 */

ALTER TABLE samples ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE;

/* Índice parcial para consultas de samples verificados */
CREATE INDEX IF NOT EXISTS idx_samples_verificado ON samples (verificado) WHERE verificado = true;
