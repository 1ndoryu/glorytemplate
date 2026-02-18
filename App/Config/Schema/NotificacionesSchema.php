<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class NotificacionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'notificaciones';
    }

    public function columnas(): array
    {
        return [
            'id'         => ['tipo' => 'int', 'pk' => true],
            'usuario_id' => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'tipo'       => ['tipo' => 'string', 'max' => 30],
            'titulo'     => ['tipo' => 'string', 'max' => 200, 'nullable' => true, 'default' => ''],
            'mensaje'    => ['tipo' => 'text', 'default' => ''],
            'leida'      => ['tipo' => 'bool', 'default' => false],
            'enlace'     => ['tipo' => 'text', 'nullable' => true],
            'actor_id'   => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'created_at' => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'datos'      => ['tipo' => 'json', 'default' => '{}'],
        ];
    }
}
