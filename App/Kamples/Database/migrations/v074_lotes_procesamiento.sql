/* [223A-3] Tabla para historial de lotes de procesamiento automático.
 * Cada fila = 1 ejecución horaria (20 extracciones o 500 scrapings).
 * Separada por tipo: extraccion / scraping. La cola IA tiene su propio sistema. */

CREATE TABLE IF NOT EXISTS lotes_procesamiento (
    id                  SERIAL PRIMARY KEY,
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('extraccion', 'scraping')),
    estado              VARCHAR(20) NOT NULL DEFAULT 'ejecutando'
                        CHECK (estado IN ('ejecutando', 'completado', 'error', 'detenido')),
    iniciado_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completado_at       TIMESTAMPTZ,
    exitosos            INT NOT NULL DEFAULT 0,
    fallidos            INT NOT NULL DEFAULT 0,
    recortes            INT NOT NULL DEFAULT 0,
    samples_publicados  INT NOT NULL DEFAULT 0,
    canciones_nuevas    INT NOT NULL DEFAULT 0,
    sampleos_nuevos     INT NOT NULL DEFAULT 0,
    error_mensaje       TEXT,
    metadata            JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_lotes_tipo ON lotes_procesamiento(tipo);
CREATE INDEX IF NOT EXISTS idx_lotes_iniciado ON lotes_procesamiento(iniciado_at DESC);
CREATE INDEX IF NOT EXISTS idx_lotes_tipo_estado ON lotes_procesamiento(tipo, estado);
