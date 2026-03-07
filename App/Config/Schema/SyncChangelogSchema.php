<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class SyncChangelogSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'sync_changelog';
    }

    public function columnas(): array
    {
        return [
            'id'         => ['tipo' => 'bigint', 'pk' => true],
            'usuario_id' => ['tipo' => 'int', 'ref' => 'usuarios(id)'],
            'tipo'       => ['tipo' => 'string', 'check' => [
                'sample_added', 'sample_removed', 'sample_updated',
                'collection_created', 'collection_renamed', 'collection_deleted',
            ]],
            'entidad_id' => ['tipo' => 'int'],
            'metadata'   => ['tipo' => 'jsonb', 'default' => '{}'],
            'created_at' => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
