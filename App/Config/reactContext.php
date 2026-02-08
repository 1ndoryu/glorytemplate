<?php

/**
 * Configuración del Contexto React (App Level)
 * 
 * Define qué datos del backend se inyectan en window.GLORY_CONTEXT
 * para ser consumidos por los componentes de React.
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
        // Resolver URL de imagen
        $imgRef = $svc['imagenDestacadaAsset'] ?? '';
        $imgUrl = '';
        if ($imgRef && class_exists(AssetsUtility::class)) {
            $imgUrl = AssetsUtility::imagenUrl($imgRef);
        }

        $meta = $svc['metaEntrada'] ?? [];
        $descripcion = $svc['extracto'] ?? '';

        // Fallback descripción (si no hay extracto)
        if (empty($descripcion)) {
            $contenido = strip_tags($svc['contenido'] ?? '');
            $descripcion = mb_substr($contenido, 0, 120) . '...';
        }

        return [
            'id'          => $svc['slugDefault'],
            'titulo'      => $svc['titulo'],
            'descripcion' => $descripcion,
            'imagen'      => $imgUrl,
            'categorias'  => $meta['categorias'] ?? [],
            'link'        => '/servicios/' . $svc['slugDefault'],
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
       2. Otros contextos futuros...
       ------------------------------------------------------------------------- */
    // $context['usuario'] = ...

    return $context;
});
