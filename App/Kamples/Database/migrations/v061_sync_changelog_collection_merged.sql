/*
 * v061 — Agregar tipo 'collection_merged' al CHECK constraint de sync_changelog.
 * QL115: El tipo collection_merged almacena backup de la combinacion para undo (7 dias).
 *
 * ALTER TYPE CHECK: PG no soporta ALTER CHECK directamente, hay que DROP + ADD.
 */

ALTER TABLE sync_changelog DROP CONSTRAINT IF EXISTS sync_changelog_tipo_check;

ALTER TABLE sync_changelog ADD CONSTRAINT sync_changelog_tipo_check CHECK (
    tipo IN (
        'sample_added', 'sample_removed', 'sample_updated',
        'collection_created', 'collection_renamed', 'collection_deleted',
        'collection_merged'
    )
);
