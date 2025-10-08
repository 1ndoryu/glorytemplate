<?php

/**
 * Plantilla personalizada para renderizar un item de tipo 'libro'.
 *
 * @param WP_Post $post El objeto del post actual.
 * @param string  $itemClass Las clases CSS para el contenedor del item.
 */
function plantillaLibro(\WP_Post $post, string $itemClass): void
{
    $imagenUrl = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, 'medium') : '';
?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <div class="libro-card">
            <a href="<?php echo esc_url(get_permalink($post)); ?>">
                <?php if ($imagenUrl) : ?>
                    <img src="<?php echo esc_url($imagenUrl); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>" class="libro-portada">
                <?php endif; ?>
                <div class="libro-info">
                    <h3 class="libro-titulo"><?php echo esc_html(get_the_title($post)); ?></h3>
                </div>
            </a>
        </div>
    </div>
<?php
}

?>