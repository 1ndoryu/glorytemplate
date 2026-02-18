<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class AlgoritmoEstadoSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'algoritmo_estado';
    }

    public function columnas(): array
    {
        return [
            'usuario_id'              => ['tipo' => 'int', 'pk' => true, 'ref' => 'usuarios_ext(id)'],
            'cnt_likes'               => ['tipo' => 'int', 'default' => 0],
            'cnt_reproducciones'      => ['tipo' => 'int', 'default' => 0],
            'cnt_completas'           => ['tipo' => 'int', 'default' => 0],
            'cnt_descargas'           => ['tipo' => 'int', 'default' => 0],
            'cnt_follows'             => ['tipo' => 'int', 'default' => 0],
            'cnt_comentarios'         => ['tipo' => 'int', 'default' => 0],
            'cnt_likes_preciso'       => ['tipo' => 'int', 'default' => 0],
            'cnt_reproducciones_preciso' => ['tipo' => 'int', 'default' => 0],
            'cnt_completas_preciso'   => ['tipo' => 'int', 'default' => 0],
            'cnt_descargas_preciso'   => ['tipo' => 'int', 'default' => 0],
            'cnt_follows_preciso'     => ['tipo' => 'int', 'default' => 0],
            'cnt_comentarios_preciso' => ['tipo' => 'int', 'default' => 0],
            'ultimo_rapido'           => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'ultimo_preciso'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'ultima_actividad'        => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'version_perfil'          => ['tipo' => 'int', 'default' => 0],
        ];
    }
}
