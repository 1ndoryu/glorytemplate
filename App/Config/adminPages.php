<?php

// App/Config/adminPages.php

use Glory\Manager\AdminPageManager;

// 1. Añadir el menú principal para la barbería
AdminPageManager::defineTopLevel(
    'Reservas Barbería',    // Título de la página
    'Barbería',             // Título del menú
    'manage_options',       // Capacidad requerida para verla
    'barberia-reservas',    // Slug único para el menú
    'renderPaginaReservas', // Función que renderizará el contenido
    'dashicons-store'       // Icono del menú
);

// 2. Añadir un submenú para la visualización del calendario
AdminPageManager::defineSubmenu(
    'barberia-reservas',        // Slug del menú padre
    'Visualización Calendario', // Título de la página
    'Visualización',            // Título del submenú
    'manage_options',           // Capacidad requerida
    'barberia-visualizacion',   // Slug único para el submenú
    'renderPaginaVisualizacion' // Función que renderizará el contenido
);

// 3. Añadir otro submenú para las ganancias
AdminPageManager::defineSubmenu(
    'barberia-reservas',
    'Análisis de Ganancias',
    'Ganancias',
    'manage_options',
    'barberia-ganancias',
    'renderPaginaGanancias'
);


function renderPaginaReservas()
{
    echo '<h1>Panel de Reservas</h1><p>Aquí irá la tabla de reservas (DataGridRenderer).</p>';
}

function renderPaginaVisualizacion()
{
    echo '<h1>Visualización de Citas</h1><p>Aquí irá la cuadrícula visual de citas (SchedulerRenderer).</p>';
}

function renderPaginaGanancias()
{
    echo '<h1>Análisis de Ganancias</h1><p>Aquí irá el panel de analíticas (AnalyticsEngine).</p>';
}
