<?php

use Glory\Utility\AssetsUtility;

/**
 * Plantilla simple para CPT 'brand'.
 * Muestra título, logo (thumbnail o asset referenciado) y contenido breve.
 * Compatible con modo copia: si $GLOBALS['gloryCopyContext'] está presente, respeta clases mínimas.
 *
 * @param \WP_Post $post
 * @param string   $itemClass
 */
function plantillaBrands(\WP_Post $post, string $itemClass = 'glory-brands-item'): void
{
    $logoUrl = '';
    if (has_post_thumbnail($post)) {
        $logoUrl = get_the_post_thumbnail_url($post, 'full') ?: '';
    }
    if ($logoUrl === '') {
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
        <a class="brandLink" href="<?php echo esc_url(get_permalink($post)); ?>">
            <div class="brandStack">
                <h3 class="brandTitle"><?php echo esc_html(get_the_title($post)); ?></h3>
                <?php if ($logoUrl): ?>
                    <img class="brandLogo" src="<?php echo esc_url($logoUrl); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>" draggable="false">
                <?php endif; ?>
            </div>
            <div class="brandExcerpt">
                <?php echo wp_kses_post(wpautop(get_the_content(null, false, $post))); ?>
            </div>
        </a>
    </div>
    <?php
}


