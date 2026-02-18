<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ConversacionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'conversaciones';
    }

    public function columnas(): array
    {
        return [
            'id'                => ['tipo' => 'int', 'pk' => true],
            'participante_1'    => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'participante_2'    => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'ultimo_mensaje_at' => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'created_at'        => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }

    public function uniqueCompuestos(): array
    {
        return [['participante_1', 'participante_2']];
    }
}
