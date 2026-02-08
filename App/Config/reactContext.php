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
       1. Servicios (Desde DefaultContentRegistry)
       ------------------------------------------------------------------------- */
    $serviciosConfig = DefaultContentRegistry::getDefinicion('servicio');
    $rawServices = $serviciosConfig['definicionesPost'] ?? [];

    $servicios = array_map(function ($svc) {
        $imgRef = $svc['imagenDestacadaAsset'] ?? '';
        $imgUrl = '';
        if ($imgRef && class_exists(AssetsUtility::class)) {
            $imgUrl = AssetsUtility::imagenUrl($imgRef);
        }

        $meta = $svc['metaEntrada'] ?? [];
        $descripcion = $svc['extracto'] ?? '';

        if (empty($descripcion)) {
            $contenido = strip_tags($svc['contenido'] ?? '');
            $descripcion = mb_substr($contenido, 0, 120) . '...';
        }

        /* Skills del servicio: cada skill tiene titulo y descripcion */
        $skillsRaw = $meta['skills'] ?? $svc['skills'] ?? [];
        $skills = array_map(function ($skill, $idx) {
            return [
                'id'          => $idx + 1,
                'titulo'      => $skill['titulo'] ?? $skill,
                'descripcion' => $skill['descripcion'] ?? '',
            ];
        }, $skillsRaw, array_keys($skillsRaw));

        /*
         * Obtener el slug real del post WP.
         * El permalink debe coincidir con la URL real que WP genera,
         * no con el slugDefault que puede diferir (WP sanitiza títulos).
         */
        $slugReal = $svc['slugDefault'];
        $postReal = get_posts([
            'post_type'      => 'servicio',
            'name'           => $svc['slugDefault'],
            'posts_per_page' => 1,
            'post_status'    => 'publish',
        ]);

        if (!empty($postReal)) {
            $slugReal = $postReal[0]->post_name;
        }

        return [
            'id'          => $slugReal,
            'titulo'      => $svc['titulo'],
            'descripcion' => $descripcion,
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? [],
            'link'        => '/servicios/' . $slugReal,
            'skills'      => $skills,
            'cta'         => [
                'titulo'      => $meta['cta_titulo'] ?? '',
                'descripcion' => $meta['cta_descripcion'] ?? '',
                'precio'      => $meta['precio_desde'] ?? '',
                'botones'     => [
                    'primario'   => 'Contratar desde ' . ($meta['precio_desde'] ?? ''),
                    'secundario' => 'Contactar',
                ]
            ]
        ];
    }, $rawServices);

    $context['servicios'] = $servicios;

    /* -------------------------------------------------------------------------
       2. Proyectos (Portfolio / Showcase)
       ------------------------------------------------------------------------- */
    $proyectosConfig = DefaultContentRegistry::getDefinicion('proyecto');
    $rawProyectos = $proyectosConfig['definicionesPost'] ?? [];

    $proyectos = array_map(function ($proy) {
        $imgRef = $proy['imagenDestacadaAsset'] ?? '';
        $imgUrl = '';
        if ($imgRef && class_exists(AssetsUtility::class)) {
            $imgUrl = AssetsUtility::imagenUrl($imgRef);
        }

        $meta = $proy['metaEntrada'] ?? [];

        $skillsRaw = $meta['skills'] ?? $proy['skills'] ?? [];
        $skills = array_map(function ($skill, $idx) {
            if (is_string($skill)) {
                return ['id' => $idx + 1, 'titulo' => $skill, 'descripcion' => ''];
            }
            return [
                'id'          => $idx + 1,
                'titulo'      => $skill['titulo'] ?? $skill,
                'descripcion' => $skill['descripcion'] ?? '',
            ];
        }, $skillsRaw, array_keys($skillsRaw));

        /* Obtener slug real del post WP para coincidir con URL real */
        $slugReal = $proy['slugDefault'];
        $postReal = get_posts([
            'post_type'      => 'proyecto',
            'name'           => $proy['slugDefault'],
            'posts_per_page' => 1,
            'post_status'    => 'publish',
        ]);

        if (!empty($postReal)) {
            $slugReal = $postReal[0]->post_name;
        }

        return [
            'id'          => $slugReal,
            'titulo'      => $proy['titulo'],
            'descripcion' => $proy['extracto'] ?? mb_substr(strip_tags($proy['contenido'] ?? ''), 0, 160),
            'contenido'   => $proy['contenido'] ?? '',
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? $proy['categorias'] ?? [],
            'cliente'     => $meta['cliente'] ?? $proy['cliente'] ?? '',
            'link'        => '/proyectos/' . $slugReal,
            'skills'      => $skills,
        ];
    }, $rawProyectos);

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
