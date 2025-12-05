<?php
/**
 * Contenido por defecto para probar PostRender
 * 
 * Este archivo crea posts de ejemplo para probar el nuevo componente.
 * Para activar: descomentar el contenido y asegurar que DefaultContentManager esté disponible.
 */

use Glory\Manager\DefaultContentManager;

// ═══════════════════════════════════════════════════════════════
// POSTS DE EJEMPLO - Para probar el componente PostRender
// ═══════════════════════════════════════════════════════════════

DefaultContentManager::define('post', DefaultContentManager::build([
    // [titulo, imagen, extracto]
    [
        'Introducción a la Arquitectura Moderna',
        'elements::blog/architecture.jpg',
        'Exploramos los principios fundamentales de la arquitectura contemporánea y cómo influyen en el diseño de espacios habitables.'
    ],
    [
        'El Arte del Diseño Minimalista',
        'elements::blog/minimal.jpg',
        'Descubre cómo el minimalismo ha transformado nuestra forma de vivir y diseñar interiores con menos elementos.'
    ],
    [
        'Tendencias de Diseño Web 2025',
        'elements::blog/webdesign.jpg',
        'Las últimas tendencias en diseño web que dominarán el próximo año: glassmorphism, micro-animaciones y más.'
    ],
    [
        'Fotografía de Producto: Guía Completa',
        'elements::blog/photography.jpg',
        'Todo lo que necesitas saber para capturar imágenes de producto profesionales con equipo básico.'
    ],
    [
        'Tipografía y Legibilidad en UX',
        'elements::blog/typography.jpg',
        'Cómo elegir las fuentes adecuadas para mejorar la experiencia de usuario y la accesibilidad.'
    ],
    [
        'El Futuro del Desarrollo Frontend',
        'elements::blog/frontend.jpg',
        'Nuevas herramientas, frameworks y metodologías que están cambiando la forma de construir interfaces.'
    ],
], [
    'alias' => 'images',
    'extractoIndice' => 2,
    'parrafos' => [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    ],
    'meta' => fn($item) => [
        'category' => ['Design', 'Development'],
    ],
]));


// ═══════════════════════════════════════════════════════════════
// PORTFOLIO DE EJEMPLO
// ═══════════════════════════════════════════════════════════════

DefaultContentManager::define('portfolio', DefaultContentManager::build([
    ['Proyecto Residencial Aurora', 'elements::portfolio/project1.jpg', ['Residencial', 'Diseño Interior'], true],
    ['Centro Comercial Vista', 'elements::portfolio/project2.jpg', ['Comercial', 'Arquitectura'], true],
    ['Hotel Boutique Sereno', 'elements::portfolio/project3.jpg', ['Hospitalidad', 'Diseño Interior'], true],
    ['Oficinas Tech Hub', 'elements::portfolio/project4.jpg', ['Comercial', 'Arquitectura'], false],
    ['Casa de Playa Horizonte', 'elements::portfolio/project5.jpg', ['Residencial'], false],
    ['Restaurante Fusión', 'elements::portfolio/project6.jpg', ['Hospitalidad', 'Diseño Interior'], false],
], [
    'alias' => 'images',
    'extracto' => 'Proyecto de diseño que combina funcionalidad y estética moderna.',
    'parrafos' => [
        'Este proyecto representa nuestra visión de diseño contemporáneo, donde cada elemento tiene un propósito.',
        'Trabajamos en estrecha colaboración con el cliente para entender sus necesidades y superar sus expectativas.',
        'El resultado es un espacio que refleja identidad y cultura organizacional.',
    ],
    'meta' => fn($item) => [
        'category' => $item[2] ?? [],
        'portfolio_has_page' => ($item[3] ?? false) ? 'yes' : 'no',
    ],
]));