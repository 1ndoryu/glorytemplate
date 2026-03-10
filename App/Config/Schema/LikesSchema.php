<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class LikesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'likes';
    }

    public function columnas(): array
    {
        return [
            'usuario_id' => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'tipo'       => ['tipo' => 'string', 'max' => 20, 'check' => ['sample', 'publicacion', 'comentario', 'cancion', 'relacion']],
            'target_id'  => ['tipo' => 'int'],
            'created_at' => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'reaccion'   => ['tipo' => 'string', 'max' => 20, 'default' => 'like', 'check' => ['like', 'dislike', 'encanta']],
        ];
    }

    public function uniqueCompuestos(): array
    {
        return [['usuario_id', 'tipo', 'target_id']];
    }
}
