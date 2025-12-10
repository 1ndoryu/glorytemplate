<?php

/**
 * @deprecated Este shortcode ya no se usa en las paginas del tema.
 * Se migro al plugin AmazonProduct con los shortcodes [amazon_products] y [amazon_deals].
 * Ver: Glory/src/Plugins/AmazonProduct/Docs/USAGE_GUIDE.md
 * 
 * Este archivo se mantiene por compatibilidad pero puede eliminarse.
 */

namespace App\Shortcodes;

use Glory\Manager\OpcionManager;

\add_action('init', function () {
    \add_shortcode('productos_aawp_pagina', function ($atts = []) {
        $atts = is_array($atts) ? $atts : [];

        $postId = get_queried_object_id();
        if (!$postId) {
            return '';
        }

        $asins = get_post_meta($postId, '_app_aawp_asins', true);
        $asins = is_array($asins) ? array_values(array_filter(array_map('strval', $asins))) : [];
        if (empty($asins)) {
            // Default para no consumir créditos si no hay selección
            $asins = ['B09M56N5C5', 'B09M56N5C5', 'B09M56N5C5'];
        }

        $previewActivo = (bool) OpcionManager::get('aawp_preview_activo', true);
        $aawpActivo = class_exists('AAWP');

        // Si vista previa activa: renderizar HTML completo estático igual al ejemplo
        if ($previewActivo) {
            // Renderizar un bloque por cada ASIN con el HTML de ejemplo
            ob_start();
            echo '<div class="gridAAWP">';
            foreach ($asins as $asin) {
                $asin = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $asin));
                if ($asin === '') {
                    continue;
                }
                echo ProductosAawpShortcode::htmlPreviewProducto($asin);
                echo "\n";
            }
            echo '</div>';
            return (string) ob_get_clean();
        }

        // Vista previa OFF: renderizar los shortcodes AAWP y devolver su HTML dentro del contenedor
        $shortcodes = [];
        foreach ($asins as $asin) {
            $asin = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $asin));
            if ($asin === '') {
                continue;
            }
            $shortcodes[] = '[amazon box="' . esc_attr($asin) . '"]';
        }
        $render = do_shortcode(implode("\n", $shortcodes));
        return '<div class="gridAAWP">' . $render . '</div>';
    });
});

class ProductosAawpShortcode
{
    public static function htmlPreviewProducto(string $asin): string
    {
        $asinAttr = esc_attr($asin);
        $title = 'Palas De Pádel Unisex 228212';
        $titleAttr = esc_attr($title);
        $img = esc_url(plugins_url('aawp/public/image.php?url=YUhSMGNITTZMeTl0TG0xbFpHbGhMV0Z0WVhwdmJpNWpiMjB2YVcxaFoyVnpMMGt2TmpGTVJHVXdPVFZJYWt3dVgwRkRYMU5NTVRNd01GOHVYMU5NTVRZd1h5NXFjR2M9fDE3NjE3NDgzODY', 'aawp'));
        $prime = esc_url(plugins_url('aawp/assets/img/icon-check-prime.svg', 'aawp'));
        $tracking = 'AAWP_PLACEHOLDER_TRACKING_ID';
        $ratingWidth = '90%';

        ob_start();
?>
        <div class="aawp">

            <div class="aawp-product aawp-product--horizontal" data-aawp-product-asin="<?php echo $asinAttr; ?>" data-aawp-product-id="3" data-aawp-product-title="<?php echo $titleAttr; ?>">

                <div class="aawp-product__thumb">
                    <a class="aawp-product__image-link" href="https://www.amazon.es/dp/<?php echo $asinAttr; ?>?tag=<?php echo esc_attr($tracking); ?>" title="<?php echo $titleAttr; ?>" rel="nofollow noopener sponsored" target="_blank">
                        <img decoding="async" class="aawp-product__image" src="<?php echo $img; ?>" alt="<?php echo $titleAttr; ?>">
                    </a>
                    <div class="aawp-product__rating">
                        <a class="aawp-star-rating aawp-star-rating--small aawp-star-rating--v1" href="https://www.amazon.es/product-reviews/<?php echo $asinAttr; ?>?tag=<?php echo esc_attr($tracking); ?>" title="Reviews on Amazon" rel="nofollow noopener sponsored" target="_blank"><span style="width: <?php echo $ratingWidth; ?>;"></span></a>
                    </div>
                </div>

                <div class="aawp-product__content">
                    <a class="aawp-product__title" href="https://www.amazon.es/dp/<?php echo $asinAttr; ?>?tag=<?php echo esc_attr($tracking); ?>" title="<?php echo $titleAttr; ?>" rel="nofollow noopener sponsored" target="_blank">
                        <?php echo esc_html($title); ?> </a>
                    <div class="aawp-product__description">
                        <ul>
                            <li>La ZEPHYR es para jugadores avanzados que quieren llevar su juego al siguiente nivel y se ha diseñado para una mayor maniobrabilidad</li>
                            <li>Tecnología: Innegra</li>
                            <li>Peso: 345 G</li>
                            <li>Tamaño de Cabeza: 490 cm²</li>
                        </ul>
                    </div>
                </div>

                <div class="aawp-product__footer">
                    <div class="aawp-product__pricing">
                        <span class="aawp-product__price aawp-product__price--current"></span>
                        <a href="https://www.amazon.es/gp/prime/" title="Amazon Prime" rel="nofollow noopener sponsored" target="_blank" class="aawp-check-prime"><img decoding="async" src="<?php echo $prime; ?>" height="16" width="55" alt="Amazon Prime"></a>
                    </div>
                    <a class="aawp-button aawp-button--buy rounded aawp-button--icon aawp-button--icon-black" href="https://www.amazon.es/dp/<?php echo $asinAttr; ?>?tag=<?php echo esc_attr($tracking); ?>" title="Consultar precio en Amazon" target="_blank" rel="nofollow noopener sponsored">Consultar precio en Amazon</a>
                </div>

            </div>

        </div>
        <script type="application/ld+json">
            {
                "@context": "https://schema.org/",
                "@graph": [{
                    "@type": "Product",
                    "name": "<?php echo $titleAttr; ?>",
                    "image": "https://m.media-amazon.com/images/I/61LDe095HjL._AC_SL1300_._SL160_.jpg",
                    "description": "<ul><li>La ZEPHYR es para jugadores avanzados que quieren llevar su juego al siguiente nivel y se ha diseñado para una mayor maniobrabilidad</li><li>Tecnología: Innegra</li><li>Peso: 345 G</li><li>Tamaño de Cabeza: 490 cm²</li></ul>",
                    "sku": "<?php echo $asinAttr; ?>",
                    "brand": {
                        "@type": "Brand",
                        "name": ""
                    },
                    "offers": {
                        "@type": "Offer",
                        "url": "https://www.amazon.es/dp/<?php echo $asinAttr; ?>?tag=<?php echo esc_attr($tracking); ?>",
                        "priceCurrency": "",
                        "price": 0,
                        "availability": "https://schema.org/OutOfStock",
                        "itemCondition": "https://schema.org/NewCondition",
                        "seller": {
                            "@type": "Organization",
                            "name": ""
                        }
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": "4.6",
                        "reviewCount": "199"
                    }
                }]
            }
        </script><br>
<?php
        return (string) ob_get_clean();
    }
}
