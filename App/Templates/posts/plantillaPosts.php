<?php

use Glory\Utility\TemplateRegistry;
use Glory\Components\ContentRender;
use Glory\Utility\ImageUtility;

/**
 * Plantilla personalizada para renderizar un item de tipo 'post'.
 *
 * @param WP_Post $post El objeto del post actual.
 * @param string  $itemClass Las clases CSS para el contenedor del item.
 */
function plantillaPosts(\WP_Post $post, string $itemClass): void
{
    $size            = (string) ContentRender::getCurrentOption('imgSize', 'medium');
    $imagenUrl       = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, $size) : '';
    $optimize        = (bool) ContentRender::getCurrentOption('imgOptimize', true);
    $quality         = (int)  ContentRender::getCurrentOption('imgQuality', 60);
    $layout          = ContentRender::getCurrentOption('internalLayoutOptions', []);

    // Opciones específicas de esta plantilla (Posts)
    $mostrarContenidoRaw  = strtolower((string) ContentRender::getCurrentOption('mostrar_contenido', 'yes'));
    $mostrarContenido     = in_array($mostrarContenidoRaw, ['yes', 'si', 'true', '1'], true);
    $maxContenidoPalabras = max(0, (int) ContentRender::getCurrentOption('contenido_max_palabras', 55));
    $mostrarFechaRaw      = strtolower((string) ContentRender::getCurrentOption('mostrar_fecha', 'yes'));
    $mostrarFecha         = in_array($mostrarFechaRaw, ['yes', 'si', 'true', '1'], true);

    $internalClasses = ['post-inner', 'glory-cr__internal'];
    if (is_array($layout)) {
        if (!empty($layout['display_mode'])) {
            $internalClasses[] = 'post-inner--display-' . $layout['display_mode'];
        }
        // No aplicamos flex_direction aquí porque interferiría con title_position
        if (!empty($layout['flex_wrap'])) {
            $internalClasses[] = 'post-inner--wrap-' . $layout['flex_wrap'];
        }
        if (!empty($layout['grid_columns_mode'])) {
            $internalClasses[] = 'post-inner--grid-' . $layout['grid_columns_mode'];
        }
    }
?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <div class="post-card">
            <a class="glory-cr__link" href="<?php echo esc_url(get_permalink($post)); ?>">
                <div class="glory-cr__stack">
                    <div class="post-info">
                        <div class="<?php echo esc_attr(implode(' ', $internalClasses)); ?>" data-glory-internal="true">
                            <h3 class="glory-cr__title noResponsiveFont awb-responsive-type__disable"><?php echo esc_html(get_the_title($post)); ?></h3>
                            <?php if ($mostrarContenido) : ?>
                                <?php
                                // Usar el excerpt manual si existe; si no, usar el contenido completo.
                                $contenidoFuente = has_excerpt($post)
                                    ? (string) get_post_field('post_excerpt', $post)
                                    : (string) get_post_field('post_content', $post);

                                if ($maxContenidoPalabras > 0) {
                                    // Cuando hay un límite, recortamos por palabras sobre texto plano.
                                    $contenido = wp_trim_words($contenidoFuente, $maxContenidoPalabras, '…');
                                } else {
                                    // 0 palabras = sin límite: mostramos el contenido completo con filtros de WordPress.
                                    $contenido = apply_filters('the_content', $contenidoFuente);
                                }
                                ?>
                                <div class="glory-cr__content fusion-text">
                                    <?php echo wp_kses_post($contenido); ?>
                                </div>
                            <?php endif; ?>
                            <?php if ($mostrarFecha) : ?>
                                <div class="glory-cr__title" style="text-transform: uppercase; font-size: 0.875rem; opacity: 0.8; margin-top: 5px;">
                                    <?php echo esc_html(get_the_date('F j, Y', $post)); ?>
                                </div>
                            <?php endif; ?>
                        </div>
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

// Registrar plantilla en el registro global con id 'plantilla_posts'
TemplateRegistry::register(
    'plantilla_posts',
    'Plantilla de Posts',
    function (?\WP_Post $givenPost = null, string $itemClass = '') {
        $postToRender = $givenPost;
        if (!$postToRender) {
            global $post;
            $postToRender = ($post instanceof \WP_Post) ? $post : null;
        }
        if ($postToRender instanceof \WP_Post) {
            $mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'glory-posts-item');
            plantillaPosts($postToRender, $mergedItemClass);
        }
    },
    ['post'],
    [
        'internalLayout' => true,
        'options' => [
            [
                'type' => 'radio_button_set',
                'heading' => __('Content', 'glory-ab'),
                'param_name' => 'mostrar_contenido',
                'default' => 'yes',
                'value' => [
                    'yes' => __('Show content', 'glory-ab'),
                    'no' => __('Hide content', 'glory-ab'),
                ],
                'group' => __('Design', 'glory-ab'),
            ],
            [
                'type' => 'radio_button_set',
                'heading' => __('Date', 'glory-ab'),
                'param_name' => 'mostrar_fecha',
                'default' => 'yes',
                'value' => [
                    'yes' => __('Show date', 'glory-ab'),
                    'no' => __('Hide date', 'glory-ab'),
                ],
                'group' => __('Design', 'glory-ab'),
            ],
            [
                'type' => 'textfield',
                'heading' => __('Text length', 'glory-ab'),
                'param_name' => 'contenido_max_palabras',
                'description' => __('Maximum number of words shown in the excerpt when content is active.', 'glory-ab'),
                'default' => '55',
                'group' => __('Design', 'glory-ab'),
            ],
        ],
    ]
);
?>