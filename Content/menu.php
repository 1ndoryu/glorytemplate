<?php

// Definición de menú para modo desarrollo (LOCAL=true)
// Estructura: cada item puede incluir 'children' para desplegables
// Las URLs relativas (p.ej. "/ofertas/") se transforman a absolutas automáticamente

return [
    [
        'title' => 'Inicio',
        'url'   => '/',
    ],
    [
        'title' => 'Productos',
        'url'   => '#',
        'children' => [
            [ 'title' => 'Palas',                 'url' => '/palas-de-padel/' ],
            [ 'title' => 'Zapatillas',            'url' => '/zapatillas-padel/' ],
            [ 'title' => 'Ropa',                  'url' => '/ropa-padel/' ],
            [ 'title' => 'Pelotas',               'url' => '/pelotas-padel/' ],
            [ 'title' => 'Accesorios',            'url' => '/accesorios-padel/' ],
            [ 'title' => 'Bolsas y Paleteros',    'url' => '/bolsas-paleteros-padel/' ],
        ],
    ],
    [
        'title' => 'Marcas',
        'url'   => '#',
        'children' => [
            [ 'title' => 'Adidas',       'url' => '/marcas/adidas/' ],
            [ 'title' => 'Bullpadel',    'url' => '/marcas/bullpadel/' ],
            [ 'title' => 'NOX',          'url' => '/marcas/nox/' ],
            [ 'title' => 'Babolat',      'url' => '/marcas/babolat/' ],
            [ 'title' => 'Head',         'url' => '/marcas/head/' ],
            [ 'title' => 'Siux',         'url' => '/marcas/siux/' ],
            [ 'title' => 'Black Crown',  'url' => '/marcas/black-crown/' ],
            [ 'title' => 'Star Vie',     'url' => '/marcas/star-vie/' ],
            [ 'title' => 'Vibor-A',      'url' => '/marcas/vibor-a/' ],
            [ 'title' => 'Wilson',       'url' => '/marcas/wilson/' ],
        ],
    ],
    [
        'title' => 'Ofertas',
        'url'   => '/ofertas/',
    ],
];



