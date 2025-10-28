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
    $brandSlug = $post->post_name ?: '';
    $brandUrl = $brandSlug !== '' ? home_url(trailingslashit('marcas/' . $brandSlug)) : get_permalink($post);
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
    // Si hay URL de destacada pero el archivo físico falta, ignorar y forzar fallback a SVG
    if ($logoUrl !== '') {
        $pathRel = parse_url($logoUrl, PHP_URL_PATH);
        if (is_string($pathRel) && $pathRel !== '') {
            $pathLocal = ABSPATH . ltrim($pathRel, '/');
            if (!is_file($pathLocal)) {
                $logoUrl = '';
            }
        }
    }
    // Soporte extra para SVG de logos por slug: intenta 'logos::{slug}.svg' si no hay logo aún
    if ($logoUrl === '' && $brandSlug !== '') {
        $svgRef = 'logos::' . $brandSlug . '.svg';
        $svgUrl = AssetsUtility::imagenUrl($svgRef);
        if ($svgUrl) {
            $logoUrl = $svgUrl;
        }
    }
    ?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <a class="brandLink" href="<?php echo esc_url($brandUrl); ?>">
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


