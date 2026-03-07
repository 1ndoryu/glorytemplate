/*
 * v024 — Changelog de sync para delta sync (F2.1)
 *
 * Registro cronologico de cambios en colecciones y samples del usuario.
 * El desktop client consulta GET /me/sync/delta?cursor={last_id} y recibe
 * solo los cambios desde ese punto, reduciendo la carga de sync de O(total)
 * a O(cambios).
 *
 * Tipos de cambio:
 *   sample_added       — sample creado o asignado a coleccion
 *   sample_removed     — sample eliminado o quitado de coleccion
 *   sample_updated     — metadata de sample modificada (titulo, tags, imagen)
 *   collection_created — coleccion creada
 *   collection_renamed — coleccion renombrada
 *   collection_deleted — coleccion eliminada
 *
 * Retención: 90 dias. Purga via cron semanal.
 * Si el cursor del cliente es anterior al registro mas antiguo,
 * el servidor responde con full_sync_required: true.
 */

CREATE TABLE IF NOT EXISTS sync_changelog (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        TEXT NOT NULL
                    CHECK (tipo IN (
                        'sample_added',
                        'sample_removed',
                        'sample_updated',
                        'collection_created',
                        'collection_renamed',
                        'collection_deleted'
                    )),
    entidad_id  INTEGER NOT NULL,
    metadata    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Indice principal: consultas delta por usuario ordenadas por ID */
CREATE INDEX IF NOT EXISTS idx_sync_changelog_usuario_id
    ON sync_changelog (usuario_id, id);

/* Indice para purga por fecha */
CREATE INDEX IF NOT EXISTS idx_sync_changelog_created
    ON sync_changelog (created_at);

/* Comentario de documentacion */
COMMENT ON TABLE sync_changelog IS 'Changelog incremental para delta sync desktop (F2.1)';
COMMENT ON COLUMN sync_changelog.tipo IS 'Tipo de cambio: sample_added|sample_removed|sample_updated|collection_created|collection_renamed|collection_deleted';
COMMENT ON COLUMN sync_changelog.entidad_id IS 'ID del sample o coleccion afectada segun tipo';
COMMENT ON COLUMN sync_changelog.metadata IS 'Datos extra: {nombre, coleccion_id, titulo_anterior, etc.}';
