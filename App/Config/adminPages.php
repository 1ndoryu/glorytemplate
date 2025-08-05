<?php

use Glory\Manager\AdminPageManager;

AdminPageManager::defineTopLevel(
    'Reservas Barbería',
    'Barbería',
    'manage_options',
    'barberia-reservas',
    'renderPaginaReservas',
    'dashicons-store'
);

AdminPageManager::defineSubmenu(
    'barberia-reservas',
    'Visualización Calendario',
    'Visualización',
    'manage_options',
    'barberia-visualizacion',
    'renderPaginaVisualizacion'
);

AdminPageManager::defineSubmenu(
    'barberia-reservas',
    'Análisis de Ganancias',
    'Ganancias',
    'manage_options',
    'barberia-ganancias',
    'renderPaginaGanancias'
);

AdminPageManager::defineSubmenu(
    'barberia-reservas',
    'Historial de Clientes',
    'Historial',
    'manage_options',
    'barberia-historial',
    'renderPaginaHistorial'
);