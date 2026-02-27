<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/**
 * C356: Schema para la cola de procesamiento IA.
 *
 * Gestiona el retry automatico cuando Groq alcanza rate limit (429).
 * Tipos soportados: analisis de audio (samples), moderacion (publicaciones/comentarios).
 * Flujo: pendiente -> procesando -> completado|error_reintento|error_final
 */
class ColaProcesamientoIaSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cola_procesamiento_ia';
    }

    public function columnas(): array
    {
        return [
            'id'               => ['tipo' => 'int', 'pk' => true],
            'tipo'             => ['tipo' => 'string', 'max' => 20, 'check' => ['sample', 'comentario', 'publicacion']],
            'entidad_id'       => ['tipo' => 'int'],
            'operacion'        => ['tipo' => 'string', 'max' => 30, 'check' => ['analisis_audio', 'moderacion_texto', 'moderacion_imagen', 'moderacion_completa']],
            'estado'           => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente', 'check' => ['pendiente', 'procesando', 'completado', 'error_reintento', 'error_final']],
            'intentos'         => ['tipo' => 'int', 'default' => 0],
            'max_intentos'     => ['tipo' => 'int', 'default' => 2],
            'ultimo_error'     => ['tipo' => 'text', 'nullable' => true],
            'proximo_intento'  => ['tipo' => 'datetime', 'nullable' => true],
            'metadata'         => ['tipo' => 'json', 'default' => '{}'],
            'procesado_at'     => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'       => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
