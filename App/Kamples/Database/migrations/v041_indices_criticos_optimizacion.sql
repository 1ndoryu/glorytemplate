/*
 * v041 — Índices Críticos de Optimización (QQ72)
 *
 * Basado en auditoría profunda de queries en repositorios.
 * Resuelve: feed lento, favoritos sin covered query, comentarios seq scan,
 * mensajes LATERAL sin índice óptimo, CTE recursivo lento.
 *
 * Índices ya existentes NO duplicados:
 *   - idx_bloqueos_bloqueador/bloqueado (ya existían)
 *   - idx_reproducciones_usuario (ya existía con created_at)
 *   - idx_samples_cancion_origen (v031)
 *   - idx_samples_relacion_sampleo (ya existía)
 *   - idx_publicaciones_autor (ya existía sin partial)
 *   - idx_comentarios_target (ya existía sin partial)
 *   - idx_rel_fuente_tipo (ya existía sin INCLUDE)
 *
 * Los nuevos índices mejoran los existentes con:
 *   - Filtros parciales (WHERE moderacion) para reducir tamaño
 *   - INCLUDE columns para covered queries
 *   - Composiciones más específicas para las queries reales
 *
 * EJECUTADA el 2025-07-17
 */

BEGIN;

/* ========== PUBLICACIONES — Feed Social ========== */

/* Partial index: excluye rechazados del feed, reduce tamaño ~20-30%.
   Mejora idx_publicaciones_autor que no tiene filtro parcial. */
CREATE INDEX IF NOT EXISTS idx_publicaciones_autor_created_opt
    ON publicaciones (autor_id, created_at DESC)
    WHERE moderacion_estado IS NULL OR moderacion_estado = 'aprobado';


/* ========== LIKES — Favoritos / Contadores ========== */

/* Covered query: usuario+tipo+target con INCLUDE para evitar table access.
   idx_likes_usuario_created solo tiene (usuario_id, created_at). */
CREATE INDEX IF NOT EXISTS idx_likes_usuario_tipo_target_opt
    ON likes (usuario_id, tipo, target_id)
    INCLUDE (reaccion, created_at);


/* ========== COMENTARIOS — Listado por tipo+target ========== */

/* Partial index: excluye rechazados.
   idx_comentarios_target ya tiene (tipo, target_id, created_at) pero sin partial. */
CREATE INDEX IF NOT EXISTS idx_comentarios_tipo_target_created_opt
    ON comentarios (tipo, target_id, created_at ASC)
    WHERE moderacion_estado IS NULL OR moderacion_estado != 'rechazado';


/* ========== MENSAJES — LATERAL JOIN Conversaciones ========== */

/* Para LATERAL subquery en listarDeUsuarioEnriquecido().
   idx_mensajes_no_leidos existente usa (remitente_id, leido), no conversacion_id. */
CREATE INDEX IF NOT EXISTS idx_mensajes_conv_no_leidos_opt
    ON mensajes (conversacion_id)
    WHERE leido = FALSE;


/* ========== RELACIONES_SAMPLE — CTE Recursivo ========== */

/* Agrega INCLUDE cancion_destino_id para covered query en rama recursiva.
   idx_rel_fuente_tipo existe pero sin INCLUDE. */
CREATE INDEX IF NOT EXISTS idx_rel_fuente_tipo_recursivo_opt
    ON relaciones_sample (cancion_fuente_id, tipo_relacion)
    INCLUDE (cancion_destino_id);


/* ========== REPRODUCCIONES — IDs por usuario ========== */

/* Para GET /reproducciones/ids con DISTINCT sample_id.
   idx_reproducciones_usuario tiene (usuario_id, created_at), no sample_id. */
CREATE INDEX IF NOT EXISTS idx_reproducciones_usuario_sample_opt
    ON reproducciones (usuario_id, sample_id)
    WHERE usuario_id IS NOT NULL;


/* ========== COLECCIONES — Mis colecciones ========== */

/* Compuesto con publica + fecha para ORDER BY.
   idx_colecciones_usuario solo tiene (usuario_id). */
CREATE INDEX IF NOT EXISTS idx_colecciones_usuario_opt
    ON colecciones (usuario_id, publica, created_at DESC);


/* ========== NOTIFICACIONES — Filtro por tipo ========== */

/* Para filtros tipo-específicos en frontend.
   idx_notificaciones_no_leidas solo filtra por usuario_id. */
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_tipo_opt
    ON notificaciones (usuario_id, tipo)
    WHERE leida = FALSE;

COMMIT;
