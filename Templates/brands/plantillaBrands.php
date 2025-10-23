<?php

use Glory\Utility\TemplateRegistry;
use Glory\Utility\AssetsUtility;

/**
 * Plantilla para 'brand': muestra logo (imagen destacada o asset) y contenido.
 * @param WP_Post $post
 * @param string  $itemClass
 */
function plantillaBrands(\WP_Post $post, string $itemClass): void
{
    $logoUrl = '';
    if (has_post_thumbnail($post)) {
        // Intento usar tamaño completo, soporta SVG si está subido a la biblioteca
        $logoUrl = get_the_post_thumbnail_url($post, 'full') ?: '';
    }
    if ($logoUrl === '') {
        // Fallback: si en contenido por defecto se usó 'logos::archivo.ext'
        $asset = get_post_meta($post->ID, '_glory_featured_asset', true);
        if (is_string($asset) && $asset !== '') {
            $resolved = AssetsUtility::imagenUrl($asset);
            if ($resolved) {
                $logoUrl = $resolved;
            }
        }
    }
?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <a class="glory-cr__link" href="<?php echo esc_url(get_permalink($post)); ?>">
            <div class="glory-cr__stack">
                <div class="glory-cr__internal" data-glory-internal="true">
                    <h3 class="glory-cr__title noResponsiveFont awb-responsive-type__disable" style="margin: 15px 0px;"><?php echo esc_html(get_the_title($post)); ?></h3>
                </div>
                <?php if ($logoUrl): ?>
                    <img class="glory-cr__image" src="<?php echo esc_url($logoUrl); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>" draggable="false">
                <?php endif; ?>
            </div>
            <div class="glory-cr__internal" data-glory-internal="true">
                <div class="glory-cr__content" style="opacity:.9;margin-top:10px; font-size:0.9375rem; text-transform:none;">
                    <?php echo wp_kses_post(wpautop(get_the_content(null, false, $post))); ?>
                </div>
            </div>
        </a>
    </div>
<?php }

// Registrar plantilla en el registro global con id 'plantilla_brands'
if (class_exists(TemplateRegistry::class)) {
    TemplateRegistry::register(
        'plantilla_brands',
        'Plantilla de Brands',
        function (?\WP_Post $givenPost = null, string $itemClass = '') {
            $postToRender = $givenPost;
            if (!$postToRender) {
                global $post;
                $postToRender = ($post instanceof \WP_Post) ? $post : null;
            }
            if ($postToRender instanceof \WP_Post) {
                $mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'glory-brands-item');
                plantillaBrands($postToRender, $mergedItemClass);
            }
        },
        ['brand'],
        [
            'internalLayout' => true,
        ]
    );
}
?>