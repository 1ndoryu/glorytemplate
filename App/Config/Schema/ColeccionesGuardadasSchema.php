<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ColeccionesGuardadasSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'colecciones_guardadas';
    }

    public function columnas(): array
    {
        return [
            'id'            => ['tipo' => 'serial', 'pk' => true],
            'usuario_id'    => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'coleccion_id'  => ['tipo' => 'int', 'ref' => 'colecciones(id)'],
            'created_at'    => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
