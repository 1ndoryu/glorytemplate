/*
 * v021 — Índices de optimización
 * Basado en auditoría SQL (App/docs/auditoria-sql.md) Parte 4 sección A2/B3.
 * Todos usan IF NOT EXISTS para idempotencia.
 */

/* ========== PRIORIDAD ALTA ========== */

/* Feed social: ORDER BY created_at DESC es la query más frecuente */
CREATE INDEX IF NOT EXISTS idx_publicaciones_created
    ON publicaciones (created_at DESC);

/* Búsqueda samples por tipo (loop/oneshot/fx) — filtro frecuente */
CREATE INDEX IF NOT EXISTS idx_samples_tipo
    ON samples (tipo) WHERE estado = 'activo';

/* Colecciones públicas — listado en explorador */
CREATE INDEX IF NOT EXISTS idx_colecciones_publica
    ON colecciones (publica, created_at DESC) WHERE publica = TRUE;

/* Mensajes no leídos — badge count en TopBar */
CREATE INDEX IF NOT EXISTS idx_mensajes_no_leidos
    ON mensajes (remitente_id, leido) WHERE leido = FALSE;

/* Comentarios por autor — perfil del usuario */
CREATE INDEX IF NOT EXISTS idx_comentarios_autor
    ON comentarios (autor_id, created_at DESC);

/* Reproducciones para algoritmo — ventana temporal */
CREATE INDEX IF NOT EXISTS idx_reproducciones_created
    ON reproducciones (created_at DESC);

/* Descargas hoy — control de créditos diarios (query más costosa en throughput) */
CREATE INDEX IF NOT EXISTS idx_descargas_usuario_created
    ON descargas (usuario_id, created_at DESC);

/* Likes por usuario — página favoritos */
CREATE INDEX IF NOT EXISTS idx_likes_usuario_created
    ON likes (usuario_id, created_at DESC);

/* ========== PRIORIDAD MEDIA ========== */

/* Samples premium — partial index para filtro rápido */
CREATE INDEX IF NOT EXISTS idx_samples_premium
    ON samples (es_premium, publicado_at DESC) WHERE es_premium = TRUE AND estado = 'activo';

/* Publicaciones con moderacion pendiente — panel admin */
CREATE INDEX IF NOT EXISTS idx_publicaciones_moderacion
    ON publicaciones (moderacion_estado) WHERE moderacion_estado = 'pendiente';

/* Conversaciones por último mensaje — orden en chat */
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo_msg
    ON conversaciones (ultimo_mensaje_at DESC);

/* Notificaciones no leídas — badge count */
CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas
    ON notificaciones (usuario_id) WHERE leida = FALSE;

/* ========== JSONB EXPRESSION INDEXES ========== */

/* Acceso frecuente a metadata->>'genero' para filtros de búsqueda */
CREATE INDEX IF NOT EXISTS idx_samples_genero
    ON samples USING GIN ((metadata->'genero'));

/* Acceso frecuente a carpeta_primaria para agrupación de samples */
CREATE INDEX IF NOT EXISTS idx_samples_carpeta
    ON samples ((metadata->>'carpeta_primaria'));
