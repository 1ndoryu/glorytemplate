/*
 * Migración v010 — Planificador del algoritmo de recomendación (C45)
 *
 * Tabla de control de frecuencia de recálculo por usuario.
 * Registra contadores de interacciones acumuladas y timestamps
 * del último recálculo rápido y preciso.
 */

/* Tabla de estado del planificador por usuario */
CREATE TABLE IF NOT EXISTS algoritmo_estado (
    usuario_id          INTEGER PRIMARY KEY REFERENCES usuarios_ext(id) ON DELETE CASCADE,

    /* Contadores de interacciones desde el último recálculo rápido */
    cnt_likes           INTEGER NOT NULL DEFAULT 0,
    cnt_reproducciones  INTEGER NOT NULL DEFAULT 0,
    cnt_completas       INTEGER NOT NULL DEFAULT 0,
    cnt_descargas       INTEGER NOT NULL DEFAULT 0,
    cnt_follows         INTEGER NOT NULL DEFAULT 0,
    cnt_comentarios     INTEGER NOT NULL DEFAULT 0,

    /* Contadores desde el último recálculo preciso */
    cnt_likes_preciso           INTEGER NOT NULL DEFAULT 0,
    cnt_reproducciones_preciso  INTEGER NOT NULL DEFAULT 0,
    cnt_completas_preciso       INTEGER NOT NULL DEFAULT 0,
    cnt_descargas_preciso       INTEGER NOT NULL DEFAULT 0,
    cnt_follows_preciso         INTEGER NOT NULL DEFAULT 0,
    cnt_comentarios_preciso     INTEGER NOT NULL DEFAULT 0,

    /* Timestamps de último recálculo */
    ultimo_rapido       TIMESTAMPTZ DEFAULT NOW(),
    ultimo_preciso      TIMESTAMPTZ DEFAULT NOW(),

    /* Última actividad del usuario (para detectar inactividad) */
    ultima_actividad    TIMESTAMPTZ DEFAULT NOW(),

    /* Versión del perfil de embeddings (se incrementa en recálculo preciso) */
    version_perfil      INTEGER NOT NULL DEFAULT 0
);

/* Índice para queries de recálculo masivo (cron) */
CREATE INDEX IF NOT EXISTS idx_algoritmo_ultimo_rapido
    ON algoritmo_estado (ultimo_rapido);

CREATE INDEX IF NOT EXISTS idx_algoritmo_ultimo_preciso
    ON algoritmo_estado (ultimo_preciso);

/* Función helper: registrar interacción y verificar si debe recalcularse */
CREATE OR REPLACE FUNCTION registrar_interaccion_algoritmo(
    p_usuario_id INTEGER,
    p_tipo TEXT
)
RETURNS TABLE(necesita_rapido BOOLEAN, necesita_preciso BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
    v_campo TEXT;
    v_campo_preciso TEXT;
BEGIN
    /* Mapear tipo de interacción al nombre de columna */
    v_campo := CASE p_tipo
        WHEN 'like' THEN 'cnt_likes'
        WHEN 'reproduccion' THEN 'cnt_reproducciones'
        WHEN 'completa' THEN 'cnt_completas'
        WHEN 'descarga' THEN 'cnt_descargas'
        WHEN 'follow' THEN 'cnt_follows'
        WHEN 'comentario' THEN 'cnt_comentarios'
        ELSE NULL
    END;

    IF v_campo IS NULL THEN
        RETURN QUERY SELECT FALSE, FALSE;
        RETURN;
    END IF;

    v_campo_preciso := v_campo || '_preciso';

    /* Upsert: crear o incrementar */
    INSERT INTO algoritmo_estado (usuario_id)
    VALUES (p_usuario_id)
    ON CONFLICT (usuario_id) DO NOTHING;

    /* Incrementar ambos contadores y actualizar última actividad */
    EXECUTE format(
        'UPDATE algoritmo_estado SET %I = %I + 1, %I = %I + 1, ultima_actividad = NOW() WHERE usuario_id = $1',
        v_campo, v_campo, v_campo_preciso, v_campo_preciso
    ) USING p_usuario_id;

    /* Retornar si necesita recálculo (la aplicación PHP define los umbrales) */
    RETURN QUERY SELECT TRUE, TRUE;
END;
$$;

/* Verificación */
SELECT 'v010_planificador_algoritmo OK' AS resultado;
