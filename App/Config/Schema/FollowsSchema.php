<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class FollowsSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'follows';
    }

    public function columnas(): array
    {
        return [
            'seguidor_id' => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'seguido_id'  => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'created_at'  => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }

    public function pkCompuesta(): array
    {
        return ['seguidor_id', 'seguido_id'];
    }
}
