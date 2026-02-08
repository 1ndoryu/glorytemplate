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

        return [
            'id'          => $svc['slugDefault'],
            'titulo'      => $svc['titulo'],
            'descripcion' => $descripcion,
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? [],
            'link'        => '/servicios/' . $svc['slugDefault'],
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

        return [
            'id'          => $proy['slugDefault'],
            'titulo'      => $proy['titulo'],
            'descripcion' => $proy['extracto'] ?? mb_substr(strip_tags($proy['contenido'] ?? ''), 0, 160),
            'contenido'   => $proy['contenido'] ?? '',
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? $proy['categorias'] ?? [],
            'cliente'     => $meta['cliente'] ?? $proy['cliente'] ?? '',
            'link'        => '/proyectos/' . $proy['slugDefault'],
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

    return $context;
});
