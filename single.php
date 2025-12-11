<?php

/**
 * Template para single posts.
 * 
 * Renderiza posts individuales usando la aplicacion React SPA.
 * El router de React (AppRouter) detecta la URL /blog/:slug
 * y renderiza SinglePostIsland con el contenido del post.
 * 
 * El contenido del post se inyecta via ReactContentProvider en
 * App/Content/reactContent.php
 */

// Cargar el handler React si no está cargado
require_once get_template_directory() . '/App/Templates/handlers/reactApp.php';

get_header();

// Renderizar la aplicacion React (el router detectará que es un single post)
renderReactApp();

get_footer();
