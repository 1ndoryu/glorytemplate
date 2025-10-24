<?php

use Glory\Manager\DefaultContentManager;
use Glory\Utility\AssetsUtility;

// Array de marcas (nombre => nombreArchivoSVG exacto sin extensión)
$marcas = [
    'Adidas' => 'adidas',
    'Bullpadel' => 'bullpadel',
    'NOX' => 'nox',
    'Babolat' => 'Babolat',
    'Head' => 'head',
    'Siux' => 'Siux',
    'Black Crown' => 'black-crown',
    'Star Vie' => 'starvie',
    'Vibor-A' => 'vibor-a',
    'Wilson' => 'wilson',
];

$postsDefault = [];
foreach ($marcas as $nombre => $archivo) {
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $nombre), '-'));
    
    $postsDefault[] = [
        'slugDefault' => $slug,
        'titulo' => $nombre,
        'contenido' => '',
        'imagenDestacadaAsset' => "logos::{$archivo}",
    ];
}

DefaultContentManager::define('brand', $postsDefault); 