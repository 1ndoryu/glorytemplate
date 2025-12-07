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

DefaultContentManager::define('casos', [
    [
        'slugDefault' => 'villa-de-lujo',
        'titulo'      => 'Villa de Lujo',
        'contenido'   => 'Caso de éxito: Villa de Lujo en Costa Valenciana',
        'imagenDestacadaAsset' => 'tema::hotel1.jpg',
        'metaEntrada' => [
            'caso_tipo'        => 'Villa de Lujo',
            'caso_ubicacion'   => 'Costa Valenciana',
            'caso_valor'       => '250.000 €',
            'caso_descripcion' => 'RENTABILIDAD NETA (1ER AÑO)',
        ],
    ],
    [
        'slugDefault' => 'hotel-vacacional',
        'titulo'      => 'Hotel Vacacional',
        'contenido'   => 'Caso de éxito: Hotel Vacacional en Costa Blanca',
        'imagenDestacadaAsset' => 'tema::hotel2.jpg',
        'metaEntrada' => [
            'caso_tipo'        => 'Hotel Vacacional',
            'caso_ubicacion'   => 'Costa Blanca',
            'caso_valor'       => '+5% (70% ventas diretas)',
            'caso_descripcion' => 'INGRESOS ANUALES',
        ],
    ],
    [
        'slugDefault' => 'hotel-boutique-urbano',
        'titulo'      => 'Hotel Boutique Urbano',
        'contenido'   => 'Caso de éxito: Hotel Boutique Urbano Post-reforma',
        'imagenDestacadaAsset' => 'tema::hotel3.jpg',
        'metaEntrada' => [
            'caso_tipo'        => 'Hotel Boutique Urbano',
            'caso_ubicacion'   => 'Post-reforma',
            'caso_valor'       => '+15% ADR',
            'caso_descripcion' => 'VS LA COMPETENCIA',
        ],
    ],
]);
