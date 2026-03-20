/* [2003A-35] Fase 1: Índices de rendimiento para el feed.
 * Estos índices cubren los JOINs más frecuentes en las 20 CTEs del algoritmo.
 * CONCURRENTLY evita lock en tablas con producción activa. */

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_usuario_tipo_target
    ON likes(usuario_id, tipo, target_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reproducciones_usuario_sample
    ON reproducciones(usuario_id, sample_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_descargas_usuario_sample
    ON descargas(usuario_id, sample_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coleccion_samples_sample
    ON coleccion_samples(sample_id, coleccion_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_samples_activo_id
    ON samples(id) WHERE estado = 'activo';

/* [2003A-35] Fase 2: Tabla materializada de afinidad tag↔usuario.
 * Elimina el cuello de botella score_tags (493ms) al pre-computar
 * los pesos de tag de cada usuario en background en vez de recalcular
 * con LATERAL UNNEST × 7 CTEs en cada request.
 * PK compuesta (user_id, tag) permite JOIN directo sin hash build. */

CREATE TABLE IF NOT EXISTS user_tag_scores (
    user_id     INT NOT NULL,
    tag         TEXT NOT NULL,
    w_likes     REAL DEFAULT 0,
    w_repro     REAL DEFAULT 0,
    w_tiempo    REAL DEFAULT 0,
    w_descargas REAL DEFAULT 0,
    w_completadas REAL DEFAULT 0,
    w_dislikes  REAL DEFAULT 0,
    w_ctx       REAL DEFAULT 0,
    updated_at  TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_user_tag_scores_user
    ON user_tag_scores(user_id);
