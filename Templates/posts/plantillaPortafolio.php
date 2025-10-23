<?php

use Glory\Utility\TemplateRegistry;
use Glory\Components\ContentRender;
use Glory\Utility\ImageUtility;

/**
 * Plantilla personalizada para renderizar un item de tipo 'portafolio'.
 *
 * @param WP_Post $post El objeto del post actual.
 * @param string  $itemClass Las clases CSS para el contenedor del item.
 */
function plantillaPortafolio(\WP_Post $post, string $itemClass): void
{
    $size      = (string) ContentRender::getCurrentOption('imgSize', 'medium');
    $imagenUrl = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, $size) : '';
    $optimize  = (bool) ContentRender::getCurrentOption('imgOptimize', true);
    $quality   = (int)  ContentRender::getCurrentOption('imgQuality', 60);
?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <div class="portafolio-card">
            <a class="glory-cr__link" href="<?php echo esc_url(get_permalink($post)); ?>">
                <div class="glory-cr__stack">
                    <div class="portafolio-info">
                        <h3 class="glory-cr__title noResponsiveFont awb-responsive-type__disable"><?php echo esc_html(get_the_title($post)); ?></h3>
                        <?php
                        $mostrarCategorias = (bool) ContentRender::getCurrentOption('portafolioMostrarCategorias', false);
                        if (!$mostrarCategorias && false !== strpos($itemClass, 'glory-portafolio--show-categories')) {
                            $mostrarCategorias = true;
                        }
                        
                        if ($mostrarCategorias) {
                            $categories = maybe_unserialize(get_post_meta($post->ID, 'category', true));
                            if (is_array($categories) && !empty($categories)) : ?>
                                <div class="glory-cr__title portafolio-categorias" style=" display: flex; gap: 5px; margin-top: 5px;">
                                    <?php
                                    $escaped = array_map(function ($c) {
                                        return esc_html(strtoupper((string) $c));
                                    }, $categories);
                                    echo '<span>' . implode(' - ', $escaped) . '</span>';
                                    ?>
                                </div>
                            <?php endif; ?>
                        <?php } ?>
                    </div>
                    <?php if ($imagenUrl) : ?>
                        <?php if ($optimize) : ?>
                            <?php $imgHtml = ImageUtility::optimizar($post, $size, $quality); ?>
                            <?php if (!empty($imgHtml)) : ?>
                                <?php echo preg_replace('/^<img\s+/i', '<img class="glory-cr__image" ', $imgHtml); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                            <?php endif; ?>
                        <?php else : ?>
                            <img src="<?php echo esc_url($imagenUrl); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>" class="glory-cr__image">
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </a>
        </div>
    </div>
<?php
}

// Registrar plantilla en el registro global con id 'plantilla_portafolio'
if (class_exists(TemplateRegistry::class)) {
    TemplateRegistry::register(
        'plantilla_portafolio',
        'Plantilla de Portafolio',
        function (?\WP_Post $givenPost = null, string $itemClass = '') {
            $postToRender = $givenPost;
            if (!$postToRender) {
                global $post;
                $postToRender = ($post instanceof \WP_Post) ? $post : null;
            }
            if ($postToRender instanceof \WP_Post) {
                $mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'glory-portafolio-item');
                plantillaPortafolio($postToRender, $mergedItemClass);
            }
        },
        ['portafolio'],
        [
            'options' => [
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Mostrar categorías', 'glory-ab'),
                    'param_name' => 'portafolio_mostrar_categorias',
                    'default' => 'no',
                    'value' => [ 'yes' => __('Sí','glory-ab'), 'no' => __('No','glory-ab') ],
                    'group' => __('General', 'glory-ab'),
                ],
            ],
        ]
    );
}
?>