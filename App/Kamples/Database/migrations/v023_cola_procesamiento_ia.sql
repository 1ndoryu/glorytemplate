/*
 * v023 — Cola de procesamiento IA (C356)
 *
 * Tabla para reintentos cuando Groq alcanza rate limit (429).
 * Tipos soportados: analisis_audio (samples), moderacion_texto/imagen/completa
 * (publicaciones/comentarios).
 *
 * Flujo de estados:
 *   pendiente -> procesando -> completado
 *                           -> error_reintento (reintento en proximo_intento)
 *                           -> error_final (max_intentos alcanzado)
 *
 * ProcesadorColaIA (cron 15min) procesa hasta 10 items FIFO
 * ordenados por (proximo_intento ASC NULLS FIRST, created_at ASC).
 */

CREATE TABLE IF NOT EXISTS cola_procesamiento_ia (
    id               SERIAL PRIMARY KEY,
    tipo             TEXT NOT NULL
                         CHECK (tipo IN ('sample', 'comentario', 'publicacion')),
    entidad_id       INTEGER NOT NULL,
    operacion        TEXT NOT NULL
                         CHECK (operacion IN ('analisis_audio', 'moderacion_texto', 'moderacion_imagen', 'moderacion_completa')),
    estado           TEXT NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente', 'procesando', 'completado', 'error_reintento', 'error_final')),
    intentos         INTEGER NOT NULL DEFAULT 0,
    max_intentos     INTEGER NOT NULL DEFAULT 2,
    ultimo_error     TEXT,
    proximo_intento  TIMESTAMPTZ,
    metadata         JSONB NOT NULL DEFAULT '{}',
    procesado_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Indice compuesto para el cron FIFO: solo items pendientes o en reintento */
CREATE INDEX IF NOT EXISTS idx_cola_ia_estado_proximo
    ON cola_procesamiento_ia (estado, proximo_intento, created_at)
    WHERE estado IN ('pendiente', 'error_reintento');

/* Indice para buscar por entidad (evita tabla full-scan al encolar) */
CREATE INDEX IF NOT EXISTS idx_cola_ia_entidad
    ON cola_procesamiento_ia (tipo, entidad_id);
