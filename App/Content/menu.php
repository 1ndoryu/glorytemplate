<?php

// Definicion de menu para modo desarrollo (LOCAL=true)
// Estructura: cada item puede incluir 'children' para desplegables
// Las URLs relativas (p.ej. "/ofertas/") se transforman a absolutas automaticamente
// 'class' opcional para agregar clases CSS al enlace

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
    [
        'title' => 'Contacto',
        'url'   => '/contacto/',
        'class' => 'menu-btn-cta',
    ],
];
