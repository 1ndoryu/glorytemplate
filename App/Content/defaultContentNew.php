<?php
/**
 * Prueba del nuevo método DefaultContentManager::build()
 * 
 * Este archivo demuestra cómo simplificar la creación de contenido por defecto.
 * Para probar: incluir este archivo temporalmente en functions.php o reemplazar defaultContent.php
 */
/*
use Glory\Manager\DefaultContentManager;
use Glory\Utility\AssetsUtility;

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO - Usando build() con meta y galería personalizados
// ═══════════════════════════════════════════════════════════════

// Obtener imágenes para galería (archivos que empiezan con "a")
$galeriaPool = [];
$baseDirGaleria = get_stylesheet_directory() . '/App/Assets/images';
$pathsGaleria = glob($baseDirGaleria . '/a*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: [];
$galeriaPool = array_map('basename', $pathsGaleria);

DefaultContentManager::define('portfolio', DefaultContentManager::build([
    // [titulo, imagen, categorías, tiene_pagina]
    ['Sample Project 1', 'project1.jpg', ['Residencial', 'Hospitality'], true],
    ['Sample Project 2', 'project2.jpg', ['Commercial', 'Installations'], true],
    ['Sample Project 3', 'project3.jpg', ['Residencial', 'Commercial'], true],
    ['Sample Project 4', 'project4.jpg', ['Hospitality'], false],
    ['Sample Project 5', 'project5.jpg', ['Installations'], false],
    ['Sample Project 6', 'project6.jpg', ['Residencial', 'Installations'], false],
], [
    'alias' => 'images',
    'extracto' => 'Initial sample portfolio entry.',
    'parrafos' => [
        'This is sample portfolio content intended to showcase structure and styling.',
        'Replace this text with your project description, scope, and outcomes.',
        'Use the featured image as the project cover; gallery can be added later.',
        'All default items are safe to delete or edit as needed.',
    ],
    'meta' => fn($item) => [
        'category' => $item[2] ?? [],
        'portfolio_has_page' => ($item[3] ?? false) ? 'yes' : 'no',
    ],
    'galeria' => function($item, $index) use ($galeriaPool) {
        if (empty($galeriaPool)) return [];
        $seleccion = array_slice($galeriaPool, 0, 5);
        return array_map(fn($img) => "images::{$img}", $seleccion);
    },
]));

// ═══════════════════════════════════════════════════════════════
// POSTS (Blog) - Forma simple con extracto en posición 2
// ═══════════════════════════════════════════════════════════════

DefaultContentManager::define('post', DefaultContentManager::build([
    // [titulo, imagen, extracto]
    ['Welcome to Our Blog', 'blog1.jpg', 'A residential exploration of transparency and light in the countryside.'],
    ['Exploring Modern Design Trends', 'blog2.jpg', 'An urban hospitality prototype celebrating slow living through layered gardens.'],
    ['Tips for Better Content Creation', 'blog3.jpg', 'A tactile workplace concept pairing crafted timber grids with generous daylight.'],
], [
    'alias' => 'images',
    'extractoIndice' => 2,
    'parrafos' => [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
    ],
]));

// ═══════════════════════════════════════════════════════════════
// SERVICES - Contenido desde posición 2 del array
// ═══════════════════════════════════════════════════════════════

DefaultContentManager::define('services', DefaultContentManager::build([
    // [titulo, imagen, descripcion]
    ['Principal Designer', 'service1.jpg', 'We provide the structured leadership required to navigate the Building Safety Act (BSA). As your Registered RIBA Principal Designer, we proactively manage compliance, coordinate all design work, and maintain the golden thread of information.'],
    ['Developers', 'service2.jpg', 'We align design quality with commercial viability to maximise ROI and minimise risk. Our expertise in development appraisals, planning strategy, and buildability protects your investment.'],
    ['Architectural Design', 'service3.jpg', 'We provide a full architectural service, guiding your project through the entire RIBA Plan of Work. Our rigorous, accountable process covers everything from initial briefing to final handover.'],
], [
    'alias' => 'images',
    'contenido' => 2, // Usar posición 2 como contenido
]));

// ═══════════════════════════════════════════════════════════════
// LIBROS - Ejemplo con el contenido actual (compatible)
// ═══════════════════════════════════════════════════════════════

DefaultContentManager::define('libro', DefaultContentManager::build([
    // [titulo, imagen, descripcion]
    ['Las 48 Leyes del Poder', 'elements::libros/48leyesdelpoder.png', 'Un libro de Robert Greene que explora las dinámicas del poder a través de la historia.'],
    ['Alicia en el País de las Maravillas', 'elements::libros/aliciaenelpais.jpg', 'Un clásico de Lewis Carroll sobre las fantásticas aventuras de una niña llamada Alicia.'],
    ['El Principito', 'elements::libros/principito.jpeg', 'Una novela poética de Antoine de Saint-Exupéry que reflexiona sobre la vida, el amor y la amistad.'],
], [
    'contenido' => 2, // Descripción en posición 2
]));
*/