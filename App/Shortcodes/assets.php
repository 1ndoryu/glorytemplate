<?php

namespace App\Shortcodes;

use Glory\Utility\AssetsUtility;
use Glory\Core\GloryLogger;

\add_action('init', function () {
    \add_shortcode('glory_image', function ($atts = []): string {
        $atts = is_array($atts) ? $atts : [];
        $ref = isset($atts['ref']) ? (string) $atts['ref'] : '';
        if ($ref === '') return '';

        $imgAttrs = [];
        foreach (['alt','class','style','width','height','loading','decoding','fetchpriority'] as $key) {
            if (!empty($atts[$key])) $imgAttrs[$key] = (string) $atts[$key];
        }

        ob_start();
        // Si existe variación copy-context, solo imprime etiqueta <img> con URL para editor
        $url = AssetsUtility::imagenUrl($ref);
        if ($url) {
            $attrStr = '';
            foreach ($imgAttrs as $k => $v) { $attrStr .= ' ' . esc_attr($k) . '="' . esc_attr($v) . '"'; }
            echo '<img src="' . esc_url($url) . '"' . $attrStr . ' />';
        }
        return (string) ob_get_clean();
    });

    \add_shortcode('hero_page', function ($atts = []): string {
        $atts = is_array($atts) ? $atts : [];
        $titulo = isset($atts['titulo']) ? (string) $atts['titulo'] : '';
        $imagen = isset($atts['imagen']) ? (string) $atts['imagen'] : '';
        $sr_only = isset($atts['sr_only']) ? (string) $atts['sr_only'] : '';

        ob_start();
        ?>
        <section class="hero page">
            <?php
            if ($imagen && function_exists('App\\Templates\\Helpers\\renderAssetImage')) {
                GloryLogger::info('hero_page: resolviendo imagen de fondo', [ 'ref' => $imagen ]);
                $bgUrl = '';
                // Intentar reparar/obtener adjunto del asset; si existe el registro pero falta el fichero, se repara
                $adjuntoId = AssetsUtility::get_attachment_id_from_asset($imagen);
                GloryLogger::info('hero_page: resultado get_attachment_id_from_asset', [ 'ref' => $imagen, 'attachmentId' => $adjuntoId ]);
                if ($adjuntoId) {
                    $urlAdjunto = wp_get_attachment_image_url($adjuntoId, 'full');
                    if (is_string($urlAdjunto)) {
                        $bgUrl = $urlAdjunto;
                        GloryLogger::info('hero_page: usando URL de adjunto', [ 'ref' => $imagen, 'attachmentId' => $adjuntoId, 'url' => $urlAdjunto ]);
                    }
                }
                // Fallback directo al asset del tema si no hay adjunto utilizable
                if ($bgUrl === '' || $bgUrl === null) {
                    $altUrl = AssetsUtility::imagenUrl($imagen);
                    if (is_string($altUrl)) {
                        $bgUrl = $altUrl;
                        GloryLogger::info('hero_page: usando fallback imagenUrl desde assets del tema', [ 'ref' => $imagen, 'url' => $altUrl ]);
                    }
                }
                if ($bgUrl) {
                    echo '<div class="heroBg" style="background-image:url(' . esc_url($bgUrl) . ');"></div>';
                } else {
                    GloryLogger::warning('hero_page: no se pudo resolver URL de fondo', [ 'ref' => $imagen ]);
                }
            }
            ?>
            <div class="heroInner">
                <h1><span><?php echo esc_html($titulo); ?></span><?php if ($sr_only): ?><span class="sr-only"><?php echo esc_html($sr_only); ?></span><?php endif; ?></h1>
            </div>
        </section>
        <?php
        return (string) ob_get_clean();
    });
});


