<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SyncChangelogSchema.php */

namespace App\Config\Schema\_generated;

final class SyncChangelogEnums
{
    /* Valores para columna "tipo" */
    const TIPO_SAMPLE_ADDED = 'sample_added';
    const TIPO_SAMPLE_REMOVED = 'sample_removed';
    const TIPO_SAMPLE_UPDATED = 'sample_updated';
    const TIPO_COLLECTION_CREATED = 'collection_created';
    const TIPO_COLLECTION_RENAMED = 'collection_renamed';
    const TIPO_COLLECTION_DELETED = 'collection_deleted';
    const TIPO_COLLECTION_MERGED = 'collection_merged';

    const TODOS_TIPO = [self::TIPO_SAMPLE_ADDED, self::TIPO_SAMPLE_REMOVED, self::TIPO_SAMPLE_UPDATED, self::TIPO_COLLECTION_CREATED, self::TIPO_COLLECTION_RENAMED, self::TIPO_COLLECTION_DELETED, self::TIPO_COLLECTION_MERGED];
}
