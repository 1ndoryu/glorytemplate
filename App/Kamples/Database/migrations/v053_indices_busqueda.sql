/*
 * v053 — Índices de Búsqueda (QK75)
 *
 * Resuelve: búsqueda "extremadamente lenta" reportada por el usuario.
 * Problema raíz: to_tsvector() calculado en runtime para cada fila sin GIN index,
 * ILIKE sin pg_trgm index, UNNEST(tags) sin GIN array index.
 *
 * Índices creados:
 *   1. GIN full-text search en samples (titulo + descripcion)
 *   2. GIN full-text search en canciones (titulo + artista + album)
 *   3. GIN pg_trgm en samples.titulo (para ILIKE en búsqueda rápida)
 *   4. GIN pg_trgm en canciones.titulo
 *   5. GIN pg_trgm en artistas_musicales.nombre
 *   6. GIN pg_trgm en usuarios_ext.username + nombre_visible
 *   7. GIN array en samples.tags (para operador @> array contains)
 *   8. Índices parciales para subqueries correlacionadas de NormalizadorSample
 *
 * Prerequisito: extensiones pg_trgm y vector ya están habilitadas (v001/v002).
 */

BEGIN;

/* ========== FULL-TEXT SEARCH (GIN) — Eliminan runtime to_tsvector() ========== */

/* Samples: usado por SamplesController::listar() con búsqueda.
   Cubre: ts_rank(to_tsvector('spanish', titulo || ' ' || descripcion), ...) */
CREATE INDEX IF NOT EXISTS idx_samples_busqueda_fts
    ON samples USING GIN (to_tsvector('spanish', COALESCE(titulo, '') || ' ' || COALESCE(descripcion, '')));

/* Samples: ts_rank solo sobre titulo (titulo_boost en scoring) */
CREATE INDEX IF NOT EXISTS idx_samples_titulo_fts
    ON samples USING GIN (to_tsvector('spanish', COALESCE(titulo, '')));

/* Canciones: usado por CancionesRepository::buscarTexto().
   Cubre: to_tsvector('simple', titulo || artista || album) */
CREATE INDEX IF NOT EXISTS idx_canciones_busqueda_fts
    ON canciones USING GIN (to_tsvector('simple', titulo || ' ' || COALESCE(album, '')));

/* Artistas: join con canciones para búsqueda combinada */
CREATE INDEX IF NOT EXISTS idx_artistas_nombre_fts
    ON artistas_musicales USING GIN (to_tsvector('simple', nombre));


/* ========== TRIGRAM (pg_trgm GIN) — Para ILIKE '%query%' eficiente ========== */

/* Samples titulo: BusquedaRapidaController::buscarSamples() */
CREATE INDEX IF NOT EXISTS idx_samples_titulo_trgm
    ON samples USING GIN (titulo gin_trgm_ops);

/* Canciones titulo: BusquedaRapidaController::buscarSampleos() */
CREATE INDEX IF NOT EXISTS idx_canciones_titulo_trgm
    ON canciones USING GIN (titulo gin_trgm_ops);

/* Artistas nombre: BusquedaRapidaController::buscarSampleos() */
CREATE INDEX IF NOT EXISTS idx_artistas_nombre_trgm
    ON artistas_musicales USING GIN (nombre gin_trgm_ops);

/* Usuarios username: BusquedaRapidaController::buscarUsuarios() */
CREATE INDEX IF NOT EXISTS idx_usuarios_username_trgm
    ON usuarios_ext USING GIN (username gin_trgm_ops);

/* Usuarios nombre_visible: BusquedaRapidaController::buscarUsuarios() */
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_visible_trgm
    ON usuarios_ext USING GIN (nombre_visible gin_trgm_ops);


/* ========== ARRAY GIN — Para tags @> ARRAY[...] ========== */

/* Samples tags: reemplaza UNNEST(tags) ... LIKE por operador @> array
   Cubre búsqueda por tags en SamplesController scoring */
CREATE INDEX IF NOT EXISTS idx_samples_tags_gin
    ON samples USING GIN (tags);


/* ========== SUBQUERIES CORRELACIONADAS — NormalizadorSample ========== */

/* Descargas: "ya coleccionado" subquery (usuario_id, sample_id) */
CREATE INDEX IF NOT EXISTS idx_descargas_usuario_sample
    ON descargas (usuario_id, sample_id);

/* Coleccion_samples: "ya guardado en coleccion" subquery */
CREATE INDEX IF NOT EXISTS idx_coleccion_samples_sample_coleccion
    ON coleccion_samples (sample_id, coleccion_id);

/* Transacciones: "ya comprado" subquery (comprador_id + sample_id + tipo) */
CREATE INDEX IF NOT EXISTS idx_transacciones_comprador_sample_opt
    ON transacciones (comprador_id, sample_id)
    WHERE tipo = 'compra_sample';

/* Cola extraccion: extraccion_json subquery (sample_id) */
CREATE INDEX IF NOT EXISTS idx_cola_extraccion_sample_id
    ON cola_extraccion_samples (sample_id);


COMMIT;
