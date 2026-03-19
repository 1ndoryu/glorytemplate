<?php

/* [183A-109] Schema para likes de artículos.
 * PK compuesta (usuario_id, articulo_id) — un like por usuario por artículo. */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ArticulosLikesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'articulos_likes';
    }

    public function columnas(): array
    {
        return [
            'usuario_id'  => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'articulo_id' => ['tipo' => 'int', 'ref' => 'articulos(id)'],
            'created_at'  => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }

    public function pkCompuesta(): array
    {
        return ['usuario_id', 'articulo_id'];
    }
}
