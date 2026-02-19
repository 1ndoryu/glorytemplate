<?php

/**
 * Schema Glory para la tabla cap_configuracion.
 * Fuente de verdad para columnas, tipos y constraints.
 * Incluye las columnas de migración (horarios_semanales, timezone).
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapConfiguracionSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_configuracion';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'centro_id' => ['tipo' => 'int', 'unico' => true, 'ref' => 'cap_centros(id)'],
            'timezone' => ['tipo' => 'string', 'max' => 100, 'default' => 'Europe/Madrid'],
            'hora_inicio_manana' => ['tipo' => 'string', 'max' => 8, 'default' => '09:00:00'],
            'hora_fin_manana' => ['tipo' => 'string', 'max' => 8, 'default' => '14:00:00'],
            'hora_inicio_tarde' => ['tipo' => 'string', 'max' => 8, 'default' => '16:00:00'],
            'hora_fin_tarde' => ['tipo' => 'string', 'max' => 8, 'default' => '21:00:00'],
            'viernes_especial' => ['tipo' => 'bool', 'default' => 0],
            'hora_fin_viernes' => ['tipo' => 'string', 'max' => 8, 'default' => '15:00:00'],
            'alumnos_max_clase' => ['tipo' => 'int', 'default' => 20],
            'duracion_clase' => ['tipo' => 'int', 'default' => 60],
            'duracion_descanso' => ['tipo' => 'int', 'default' => 15],
            'horarios_semanales' => ['tipo' => 'json', 'nullable' => true],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
            'updated_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
