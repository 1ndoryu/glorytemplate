<?php

/**
 * Configuración del Contexto React (App Level)
 * 
 * Define qué datos del backend se inyectan en window.GLORY_CONTEXT
 * para ser consumidos por los componentes de React.
 * Cada PostType tiene su propio bloque de contexto.
 */

use Glory\Core\DefaultContentRegistry;
use Glory\Utility\AssetsUtility;

add_filter('glory_react_context', function ($context) {

    /* -------------------------------------------------------------------------
       1. Servicios (Desde DefaultContentRegistry + WP Real)
       ------------------------------------------------------------------------- */
    $serviciosConfig = DefaultContentRegistry::getDefinicion('servicio');
    $rawServices = $serviciosConfig['definicionesPost'] ?? [];

    /* Indexar definiciones por slug y título para búsqueda rápida */
    $servicesBySlug = [];
    foreach ($rawServices as $svc) {
        if (!empty($svc['slugDefault'])) {
            $servicesBySlug[$svc['slugDefault']] = $svc;
        }
        if (!empty($svc['titulo'])) {
            $servicesBySlug[sanitize_title($svc['titulo'])] = $svc;
        }
    }

    /* Obtener posts reales de WP */
    $wpServices = get_posts([
        'post_type'      => 'servicio',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ]);

    $servicios = array_map(function ($post) use ($servicesBySlug) {
        $slugReal = $post->post_name;

        /* Buscar definición coincidente en registro (por slug o título sanitizado) */
        $def = $servicesBySlug[$slugReal] ?? $servicesBySlug[sanitize_title($post->post_title)] ?? [];

        /* Datos base desde WP (Fuente de la verdad para slugs y títulos) */
        $titulo      = $post->post_title;
        $contenido   = $post->post_content;
        $descripcion = $post->post_excerpt ?: wp_trim_words(strip_tags($contenido), 20);

        /* Meta y Assets (Prioridad: WP > Registry) */
        $meta   = $def['metaEntrada'] ?? [];
        $imgRef = $def['imagenDestacadaAsset'] ?? '';
        $imgUrl = '';

        if (has_post_thumbnail($post->ID)) {
            $imgUrl = get_the_post_thumbnail_url($post->ID, 'large');
        } elseif ($imgRef && class_exists(AssetsUtility::class)) {
            $imgUrl = AssetsUtility::imagenUrl($imgRef);
        }

        /* Skills */
        $skillsRaw = $meta['skills'] ?? $def['skills'] ?? [];
        if (empty($skillsRaw)) {
            /* Fallback a meta de WP si existe */
            $skillsRaw = get_post_meta($post->ID, 'skills', true) ?: [];
        }

        $skills = array_map(function ($skill, $idx) {
            $t = is_array($skill) ? ($skill['titulo'] ?? '') : (is_string($skill) ? $skill : '');
            $d = is_array($skill) ? ($skill['descripcion'] ?? '') : '';
            return [
                'id'          => $idx + 1,
                'titulo'      => $t,
                'descripcion' => $d,
            ];
        }, $skillsRaw, array_keys($skillsRaw));

        return [
            'id'          => $slugReal,
            'titulo'      => $titulo,
            'descripcion' => $descripcion,
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? [],
            'link'        => '/servicios/' . $slugReal,
            'skills'      => $skills,
            'cta'         => [
                'titulo'      => $meta['cta_titulo'] ?? '',
                'descripcion' => $meta['cta_descripcion'] ?? '',
                'precio'      => $meta['precio_desde'] ?? get_post_meta($post->ID, 'precio_desde', true) ?: '',
                'botones'     => [
                    'primario'   => 'Contratar desde ' . ($meta['precio_desde'] ?? get_post_meta($post->ID, 'precio_desde', true) ?: ''),
                    'secundario' => 'Contactar',
                ]
            ]
        ];
    }, $wpServices);

    $context['servicios'] = $servicios;

    /* -------------------------------------------------------------------------
       2. Proyectos (Desde DefaultContentRegistry + WP Real)
       ------------------------------------------------------------------------- */
    $proyectosConfig = DefaultContentRegistry::getDefinicion('proyecto');
    $rawProyectos = $proyectosConfig['definicionesPost'] ?? [];

    $projectsBySlug = [];
    foreach ($rawProyectos as $proy) {
        if (!empty($proy['slugDefault'])) {
            $projectsBySlug[$proy['slugDefault']] = $proy;
        }
        if (!empty($proy['titulo'])) {
            $projectsBySlug[sanitize_title($proy['titulo'])] = $proy;
        }
    }

    $wpProyectos = get_posts([
        'post_type'      => 'proyecto',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ]);

    $proyectos = array_map(function ($post) use ($projectsBySlug) {
        $slugReal = $post->post_name;
        $def      = $projectsBySlug[$slugReal] ?? $projectsBySlug[sanitize_title($post->post_title)] ?? [];

        $titulo      = $post->post_title;
        $contenido   = $post->post_content;
        $descripcion = $post->post_excerpt ?: wp_trim_words(strip_tags($contenido), 30);

        $meta   = $def['metaEntrada'] ?? [];
        $imgRef = $def['imagenDestacadaAsset'] ?? '';
        $imgUrl = '';

        if (has_post_thumbnail($post->ID)) {
            $imgUrl = get_the_post_thumbnail_url($post->ID, 'large');
        } elseif ($imgRef && class_exists(AssetsUtility::class)) {
            $imgUrl = AssetsUtility::imagenUrl($imgRef);
        }

        $skillsRaw = $meta['skills'] ?? $def['skills'] ?? [];
        $skills = array_map(function ($skill, $idx) {
            $t = is_array($skill) ? ($skill['titulo'] ?? '') : (is_string($skill) ? $skill : '');
            $d = is_array($skill) ? ($skill['descripcion'] ?? '') : '';
            return [
                'id'          => $idx + 1,
                'titulo'      => $t,
                'descripcion' => $d,
            ];
        }, $skillsRaw, array_keys($skillsRaw));

        return [
            'id'          => $slugReal,
            'titulo'      => $titulo,
            'descripcion' => $descripcion,
            'contenido'   => $contenido,
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? $def['categorias'] ?? [],
            'cliente'     => $meta['cliente'] ?? $def['cliente'] ?? '',
            'link'        => '/proyectos/' . $slugReal,
            'skills'      => $skills,
        ];
    }, $wpProyectos);

    $context['proyectos'] = $proyectos;

    /* -------------------------------------------------------------------------
       3. Testimonios
       ------------------------------------------------------------------------- */
    $testimoniosConfig = DefaultContentRegistry::getDefinicion('testimonio');
    $rawTestimonios = $testimoniosConfig['definicionesPost'] ?? [];

    $testimonios = array_map(function ($test) {
        $meta = $test['metaEntrada'] ?? [];
        return [
            'id'     => $test['slugDefault'] ?? '',
            'texto'  => $test['contenido'] ?? '',
            'autor'  => $test['titulo'] ?? '',
            'cargo'  => $meta['cargo'] ?? '',
            'avatar' => $meta['avatar'] ?? '',
        ];
    }, $rawTestimonios);

    $context['testimonios'] = $testimonios;

    /* -------------------------------------------------------------------------
       4. Marcas / Clientes
       ------------------------------------------------------------------------- */
    $marcasConfig = DefaultContentRegistry::getDefinicion('marca');
    $rawMarcas = $marcasConfig['definicionesPost'] ?? [];

    $marcas = array_map(function ($marca) {
        $meta = $marca['metaEntrada'] ?? [];

        /* Resolver logo SVG si tiene referencia de asset */
        $logoUrl = '';
        $logoRef = $meta['logo'] ?? '';
        if ($logoRef && class_exists(AssetsUtility::class)) {
            $logoUrl = AssetsUtility::imagenUrl($logoRef);
        }

        return [
            'id'     => $marca['slugDefault'] ?? '',
            'nombre' => $marca['titulo'] ?? '',
            'url'    => $meta['url'] ?? '',
            'logo'   => $logoUrl,
        ];
    }, $rawMarcas);

    $context['marcas'] = $marcas;

    /* -------------------------------------------------------------------------
       5. Miembros del equipo
       ------------------------------------------------------------------------- */
    $miembrosConfig = DefaultContentRegistry::getDefinicion('miembro');
    $rawMiembros = $miembrosConfig['definicionesPost'] ?? [];

    $miembros = array_map(function ($miembro) {
        $meta = $miembro['metaEntrada'] ?? [];
        return [
            'id'       => $miembro['slugDefault'] ?? '',
            'nombre'   => $miembro['titulo'] ?? '',
            'bio'      => $miembro['contenido'] ?? '',
            'cargo'    => $meta['cargo'] ?? '',
            'avatar'   => $meta['avatar'] ?? '',
            'linkedin' => $meta['linkedin'] ?? '',
            'twitter'  => $meta['twitter'] ?? '',
            'github'   => $meta['github'] ?? '',
        ];
    }, $rawMiembros);

    $context['miembros'] = $miembros;

    /* -------------------------------------------------------------------------
       6. Blog Posts (nativos de WP)
       ------------------------------------------------------------------------- */
    $blogPosts = get_posts([
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => 10,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);

    $blog = array_map(function ($post) {
        $categorias = get_the_category($post->ID);
        $categoriaNombre = !empty($categorias) ? $categorias[0]->name : 'General';

        $imagen = '';
        if (has_post_thumbnail($post->ID)) {
            $imagen = get_the_post_thumbnail_url($post->ID, 'large');
        }

        return [
            'id'        => $post->ID,
            'titulo'    => $post->post_title,
            'resumen'   => get_the_excerpt($post) ?: wp_trim_words(strip_tags($post->post_content), 30),
            'fecha'     => get_the_date('M j, Y', $post),
            'categoria' => $categoriaNombre,
            'link'      => get_permalink($post),
            'imagen'    => $imagen,
        ];
    }, $blogPosts);

    $context['blog'] = $blog;

    /* -------------------------------------------------------------------------
       7. Estado de autenticación del usuario
       ------------------------------------------------------------------------- */
    $context['isLoggedIn'] = is_user_logged_in();
    if (is_user_logged_in()) {
        $usuario = wp_get_current_user();
        $context['usuarioActual'] = [
            'id'     => $usuario->ID,
            'nombre' => $usuario->display_name,
            'email'  => $usuario->user_email,
            'avatar' => get_avatar_url($usuario->ID, ['size' => 48]),
            'rol'    => !empty($usuario->roles) ? $usuario->roles[0] : 'subscriber',
        ];
    }

    return $context;
});
