<?php

/**
 * Pagina del Editor - Glory Page Builder
 * 
 * UBICACION CORRECTA: App/Templates/pages/editor.php
 * 
 * IMPORTANTE - Convencion de archivos de pagina:
 * - El archivo DEBE estar en App/Templates/pages/
 * - El nombre del archivo debe coincidir con el slug de la pagina
 * - DEBE definir una FUNCION con el mismo nombre que el slug
 * - La funcion se registra en App/Config/pages.php
 * 
 * Ejemplo:
 *   Archivo: App/Templates/pages/mi-pagina.php
 *   Funcion: function miPagina() { ... }
 *   Registro: PageManager::define('mi-pagina', 'miPagina');
 * 
 * NO usar App/Pages/ - esa ubicacion no es reconocida por PageManager
 */

use Glory\Services\ReactIslands;

function editor()
{
    // Datos iniciales de ejemplo para el editor
    $datosIniciales = [
        'time' => time() * 1000,
        'blocks' => [
            [
                'type' => 'header',
                'data' => [
                    'text' => 'Bienvenido al Editor Glory',
                    'level' => 1
                ]
            ],
            [
                'type' => 'paragraph',
                'data' => [
                    'text' => 'Este es un <b>editor de bloques</b> basado en Editor.js. Puedes agregar diferentes tipos de contenido usando el menu (+).'
                ]
            ],
            [
                'type' => 'header',
                'data' => [
                    'text' => 'Caracteristicas',
                    'level' => 2
                ]
            ],
            [
                'type' => 'list',
                'data' => [
                    'style' => 'unordered',
                    'items' => [
                        'Titulos de varios niveles',
                        'Parrafos con formato',
                        'Listas ordenadas y desordenadas',
                        'Citas y delimitadores'
                    ]
                ]
            ],
            [
                'type' => 'quote',
                'data' => [
                    'text' => 'La simplicidad es la maxima sofisticacion.',
                    'caption' => 'Leonardo da Vinci'
                ]
            ],
            [
                'type' => 'delimiter',
                'data' => []
            ],
            [
                'type' => 'paragraph',
                'data' => [
                    'text' => 'Prueba a editar este contenido, agregar nuevos bloques y ver la vista previa.'
                ]
            ]
        ],
        'version' => '2.28.2'
    ];

    // Props para la isla
    $props = [
        'pageId' => get_the_ID() ?: 1,
        'initialData' => $datosIniciales,
        'apiEndpoint' => rest_url('glory/v1/page-content')
    ];

    // Renderizar la isla del editor
    echo ReactIslands::render('PageEditorIsland', $props);
}
