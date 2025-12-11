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
 * BLOG: Todos los posts publicados
 * 
 * Se obtienen todos los posts para que el router SPA pueda
 * renderizar tanto el listado (/blog) como los single posts (/blog/:slug)
 */
ReactContentProvider::register('blogPosts', 'post', [
    'posts_per_page' => -1, // Todos los posts
    'orderby' => 'date',
    'order' => 'DESC',
]);

/**
 * BLOG DESTACADOS: Posts destacados (sticky) o de categoria "caso-exito"
 * 
 * Segun project-extends.md: Seccion "Casos destacados" con 3 posts
 * Prioriza sticky posts, si no hay suficientes, usa categoria "caso-exito"
 */
ReactContentProvider::register('blogFeatured', 'post', [
    'posts_per_page' => 3,
    'ignore_sticky_posts' => false,
    'post__in' => get_option('sticky_posts') ?: [0], // Posts sticky primero
    'orderby' => 'post__in',
    'order' => 'DESC',
]);

/**
 * BLOG RECIENTES: Ultimos 6 posts (excluyendo sticky)
 * 
 * Segun project-extends.md: Seccion "Lo ultimo" con rejilla de 6 posts
 */
ReactContentProvider::register('blogRecent', 'post', [
    'posts_per_page' => 6,
    'ignore_sticky_posts' => true,
    'orderby' => 'date',
    'order' => 'DESC',
]);

/**
 * Inyectar el contenido como variable global de JavaScript.
 * Esto hace que los datos esten disponibles en window.__GLORY_CONTENT__
 * y accesibles via useContent('blogPosts')
 */
ReactContentProvider::injectGlobal();
