<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class PushSubscriptionsSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'push_subscriptions';
    }

    public function columnas(): array
    {
        return [
            'id'         => ['tipo' => 'int', 'pk' => true],
            'usuario_id' => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'endpoint'   => ['tipo' => 'text'],
            'p256dh'     => ['tipo' => 'text'],
            'auth'       => ['tipo' => 'text'],
            'plataforma' => ['tipo' => 'string', 'max' => 20, 'default' => 'web'],
            'activa'     => ['tipo' => 'bool', 'default' => true],
            'created_at' => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at' => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
