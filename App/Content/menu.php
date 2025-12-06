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
        'title' => 'Servicios',
        'url'   => '/servicios/',
    ],
    [
        'title' => 'Casos',
        'url'   => '/casos/',

    ],
    [
        'title' => 'Nosotros',
        'url'   => '/about/',
    ],
];



