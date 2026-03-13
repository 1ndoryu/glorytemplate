/* v045: Backoff exponencial para reintentos de extraccion */

/* Columna para programar el proximo intento con delay incremental */
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS proximo_intento_at TIMESTAMPTZ NULL;

/* Indice parcial: solo filas pendientes con backoff activo */
CREATE INDEX IF NOT EXISTS idx_cola_extraccion_backoff
    ON cola_extraccion_samples (proximo_intento_at)
    WHERE estado = 'pendiente' AND proximo_intento_at IS NOT NULL;
