<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/* [183A-22] Schema para likes de colecciones.
 * Tabla simple de junction (usuario_id, coleccion_id) para rastrear qué usuarios
 * han dado like a qué colecciones. Se crea con IF NOT EXISTS en el primer acceso. */
class ColeccionesLikesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'colecciones_likes';
    }

    public function columnas(): array
    {
        return [
            'id'           => ['tipo' => 'int', 'pk' => true],
            'usuario_id'   => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'coleccion_id' => ['tipo' => 'int', 'ref' => 'colecciones(id)'],
            'created_at'   => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
