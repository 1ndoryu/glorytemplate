<?php

use Glory\Manager\DefaultContentManager;

DefaultContentManager::define('libro', [
    [
        'slugDefault' => 'las-48-leyes-del-poder',
        'titulo'      => 'Las 48 Leyes del Poder',
        'contenido'   => 'Un libro de Robert Greene que explora las dinámicas del poder a través de la historia.',
        'imagenDestacadaAsset' => 'glory::elements/libros/48leyesdelpoder.png',
    ],
    [
        'slugDefault' => 'alicia-en-el-pais-de-las-maravillas',
        'titulo'      => 'Alicia en el País de las Maravillas',
        'contenido'   => 'Un clásico de Lewis Carroll sobre las fantásticas aventuras de una niña llamada Alicia.',
        'imagenDestacadaAsset' => 'glory::elements/libros/aliciaenelpais.jpg',
    ],
    [
        'slugDefault' => 'el-principito',
        'titulo'      => 'El Principito',
        'contenido'   => 'Una novela poética de Antoine de Saint-Exupéry que reflexiona sobre la vida, el amor y la amistad.',
        'imagenDestacadaAsset' => 'glory::elements/libros/principito.jpeg',
    ],
]);
