<?php

/**
 * Configuracion de contenido para React
 * 
 * Este archivo define que contenido de WordPress se inyecta a React.
 * Usa ReactContentProvider para registrar queries que se ejecutan
 * y pasan datos a los componentes React.
 * 
 * Los posts se definen en defaultContent.php usando DefaultContentManager,
 * que los sincroniza automaticamente con WordPress.
 * 
 * En React, usa el hook useContent para acceder a los datos:
 *   const posts = useContent<WordPressPost[]>('blogPosts');
 */

use Glory\Services\ReactContentProvider;

// Solo cargar si ReactContentProvider existe
if (!class_exists(ReactContentProvider::class)) {
    return;
}

/**
 * BLOG: Todos los posts definidos en defaultContent.php
 * 
 * Los 3 posts de blog:
 * - caso-barberia-chatbot-whatsapp
 * - chatbot-vs-formulario-comparativa
 * - guia-recordatorios-whatsapp-automaticos
 */
ReactContentProvider::register('blogPosts', 'post', [
    'posts_per_page' => 10,
    'orderby' => 'date',
    'order' => 'DESC',
]);

/**
 * Inyectar el contenido como variable global de JavaScript.
 * Esto hace que los datos esten disponibles en window.__GLORY_CONTENT__
 * y accesibles via useContent('blogPosts')
 */
ReactContentProvider::injectGlobal();
