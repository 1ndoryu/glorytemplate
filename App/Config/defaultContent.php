<?php

use Glory\Manager\DefaultContentManager;

DefaultContentManager::define('libro', [
    [
        'slugDefault' => 'las-48-leyes-del-poder',
        'titulo'      => 'Las 48 Leyes del Poder',
        'contenido'   => 'Un libro de Robert Greene que explora las dinámicas del poder a través de la historia.',
        'imagenDestacadaAsset' => 'elements::libros/48leyesdelpoder.png',
    ],
    [
        'slugDefault' => 'alicia-en-el-pais-de-las-maravillas',
        'titulo'      => 'Alicia en el País de las Maravillas',
        'contenido'   => 'Un clásico de Lewis Carroll sobre las fantásticas aventuras de una niña llamada Alicia.',
        'imagenDestacadaAsset' => 'elements::libros/aliciaenelpais.jpg',
    ],
    [
        'slugDefault' => 'el-principito',
        'titulo'      => 'El Principito',
        'contenido'   => 'Una novela poética de Antoine de Saint-Exupéry que reflexiona sobre la vida, el amor y la amistad.',
        'imagenDestacadaAsset' => 'elements::libros/principito.jpeg',
    ],
]);

// Contenido por defecto para tareas (tarea)
DefaultContentManager::define('tarea', [
    // Ejemplo: meta con fecha límite y próxima válida
    [
        'slugDefault' => 'meta-crear-portfolio',
        'titulo'      => 'Crear portfolio profesional',
        'contenido'   => 'Montar y publicar un portfolio con trabajos recientes.',
        // Metas/metadata usadas por `taskItem.php`
        'meta' => [
            'importancia'   => 'alta',
            'tipo'          => 'meta',
            'estado'        => 'pendiente',
            'frecuencia'    => 1,
            'fechaProxima'  => date('Y-m-d', strtotime('+7 days')),
            'fechaLimite'   => date('Y-m-d', strtotime('+30 days')),
            'sesion'        => 'General',
            'impnum'        => 3,
        ],
    ],
    // Ejemplo: hábito con fechas completadas/saltadas y frecuencia
    [
        'slugDefault' => 'habito-ejercicio-matutino',
        'titulo'      => 'Ejercicio matutino',
        'contenido'   => 'Hábito diario de 20 minutos de ejercicio al levantarse.',
        'meta' => [
            'importancia'      => 'media',
            'tipo'             => 'habito',
            'estado'           => 'pendiente',
            'frecuencia'       => 1,
            'fechaProxima'     => date('Y-m-d'),
            'fechaLimite'      => '0000-00-00',
            'sesion'           => 'Salud',
            'impnum'           => 2,
            'fechasCompletado' => [date('Y-m-d', strtotime('-1 day')), date('Y-m-d', strtotime('-2 days'))],
            'fechasSaltado'    => [],
        ],
    ],
]);
