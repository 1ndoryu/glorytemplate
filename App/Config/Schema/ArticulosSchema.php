<?php

/* [183A-109] Schema para artículos del blog.
 * Tabla PG propia (consistente con samples/publicaciones).
 * Categorías fijas como check constraint.
 * Contenido HTML sanitizado. Embeds de samples/colecciones en JSON. */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ArticulosSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'articulos';
    }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'int', 'pk' => true],
            'autor_id'            => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'titulo'              => ['tipo' => 'string', 'max' => 300],
            'slug'                => ['tipo' => 'string', 'max' => 300, 'unico' => true],
            'contenido'           => ['tipo' => 'text', 'default' => ''],
            'extracto'            => ['tipo' => 'string', 'max' => 500, 'default' => ''],
            'portada_url'         => ['tipo' => 'text', 'nullable' => true],
            'categoria'           => ['tipo' => 'string', 'max' => 50, 'default' => 'inspiracion', 'check' => [
                'inspiracion', 'mastering', 'mezcla', 'promocion-musical', 'teoria-musical',
                'grabacion', 'sampling', 'diseno-sonoro', 'herramientas',
                'ableton-live', 'bitwig-studio', 'cubase', 'fl-studio', 'garageband',
                'logic-pro', 'pro-tools', 'studio-one',
                'drops-gratis', 'midi-gratis', 'plugins-gratis', 'presets-gratis',
                'proyectos-gratis', 'sonidos-gratis',
                'entrevistas', 'destacados', 'noticias',
            ]],
            'embeds'              => ['tipo' => 'json', 'default' => '[]'],
            'descarga_publica'    => ['tipo' => 'bool', 'default' => false],
            'total_likes'         => ['tipo' => 'int', 'default' => 0],
            'total_comentarios'   => ['tipo' => 'int', 'default' => 0],
            'moderacion_estado'   => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente', 'check' => ['pendiente', 'revision', 'aprobado', 'rechazado']],
            'moderacion_razon'    => ['tipo' => 'string', 'max' => 255, 'nullable' => true],
            'created_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'publicado_en'        => ['tipo' => 'datetime', 'nullable' => true],
            'eliminado_en'        => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
