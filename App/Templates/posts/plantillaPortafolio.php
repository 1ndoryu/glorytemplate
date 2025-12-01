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
    // Opciones específicas de contenido para portafolio
    $mostrarContenidoRaw  = strtolower((string) ContentRender::getCurrentOption('portafolioMostrarContenido', 'no'));
    $mostrarContenido     = in_array($mostrarContenidoRaw, ['yes', 'true', '1'], true);
    $maxContenidoPalabras = max(0, (int) ContentRender::getCurrentOption('portafolioContenidoMaxPalabras', 40));
    $categoriesFromRender = ContentRender::getCurrentOption('currentCategories', null);
    if (!is_array($categoriesFromRender)) {
        $metaCategories = maybe_unserialize(get_post_meta($post->ID, 'category', true));
        $categoriesFromRender = [];
        if (is_array($metaCategories)) {
            foreach ($metaCategories as $metaCat) {
                $label = trim((string) $metaCat);
                if ('' === $label) {
                    continue;
                }
                $categoriesFromRender[] = [
                    'label' => $label,
                    'slug'  => sanitize_title($label),
                ];
            }
        }
    }
    $categoryLabels = [];
    $categorySlugs  = [];
    foreach ((array) $categoriesFromRender as $catRow) {
        if (!is_array($catRow)) {
            $label = trim((string) $catRow);
            $slug  = sanitize_title($label);
        } else {
            $label = trim((string) ($catRow['label'] ?? ''));
            $slug  = sanitize_title($catRow['slug'] ?? $label);
        }
        if ('' === $label) {
            continue;
        }
        $categoryLabels[] = $label;
        if ('' !== $slug) {
            $categorySlugs[] = $slug;
        }
    }
    if (empty($categorySlugs)) {
        $categorySlugs[] = 'uncategorized';
    }
    $categoriesAttr = implode(' ', array_unique($categorySlugs));
    $mostrarCategorias = (bool) ContentRender::getCurrentOption('portafolioMostrarCategorias', true);
    $hasPageMeta = strtolower((string) get_post_meta($post->ID, 'portfolio_has_page', true));
    $tienePagina = '' === $hasPageMeta ? true : in_array($hasPageMeta, ['yes', 'true', '1'], true);
    $buttonOptions = ContentRender::getCurrentOption('portafolioButton', []);
    $mostrarBoton  = $tienePagina && !empty($buttonOptions['show']);
    $botonTexto    = is_array($buttonOptions) ? (string) ($buttonOptions['text'] ?? __('View project', 'glory-ab')) : __('View project', 'glory-ab');
?>
    <div class="<?php echo esc_attr($itemClass); ?>" data-glory-categories="<?php echo esc_attr($categoriesAttr); ?>">
        <div class="portafolio-card">
            <?php if ($tienePagina) : ?>
                <a class="glory-cr__link" href="<?php echo esc_url(get_permalink($post)); ?>">
            <?php else : ?>
                <div class="glory-cr__link glory-cr__link--disabled" role="presentation">
            <?php endif; ?>
                <div class="glory-cr__stack glory-cr__internal" data-glory_internal="true">
                    <div class="portafolio-info portafolio-inner">
                        <h3 class="glory-cr__title noResponsiveFont awb-responsive-type__disable"><?php echo esc_html(get_the_title($post)); ?></h3>
                        <?php if ($mostrarCategorias && !empty($categoryLabels)) : ?>
                            <div class="portafolio-categorias">
                                <span><?php echo esc_html(implode(' • ', $categoryLabels)); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if ($mostrarContenido) : ?>
                            <?php
                            $contenidoFuente = has_excerpt($post)
                                ? (string) get_post_field('post_excerpt', $post)
                                : (string) get_post_field('post_content', $post);

                            if ($maxContenidoPalabras > 0) {
                                $contenido = wp_trim_words($contenidoFuente, $maxContenidoPalabras, '…');
                            } else {
                                $contenido = apply_filters('the_content', $contenidoFuente);
                            }
                            ?>
                            <div class="glory-cr__content fusion-text">
                                <?php echo wp_kses_post($contenido); ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($mostrarBoton) : ?>
                            <div class="glory-cr__actions">
                                <span class="glory-cr__button" role="button"><?php echo esc_html($botonTexto); ?></span>
                            </div>
                        <?php endif; ?>
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
            <?php if ($tienePagina) : ?>
                </a>
            <?php else : ?>
                </div>
            <?php endif; ?>
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
            'internalLayout' => true,
            'options' => [
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Categories', 'glory-ab'),
                    'param_name' => 'portafolio_mostrar_categorias',
                    'default' => 'yes',
                    'value' => [
                        'yes' => __('Show categories','glory-ab'),
                        'no'  => __('Hide categories','glory-ab'),
                    ],
                    'group' => __('General', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Category typography override', 'glory-ab'),
                    'param_name' => 'portafolio_categoria_typography_enable',
                    'default' => 'no',
                    'value' => [
                        'yes' => __('Enabled','glory-ab'),
                        'no'  => __('Disabled','glory-ab'),
                    ],
                    'dependency' => [
                        [ 'element' => 'portafolio_mostrar_categorias', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'typography',
                    'heading' => __('Category typography', 'glory-ab'),
                    'param_name' => 'portafolio_categoria_typography',
                    'remove_from_atts' => true,
                    'choices' => [
                        'font-family' => 'portafolio_categoria_font',
                        'variant'     => 'portafolio_categoria_font',
                        'font-size'   => 'portafolio_categoria_font_size',
                        'line-height' => 'portafolio_categoria_line_height',
                        'letter-spacing' => 'portafolio_categoria_letter_spacing',
                    ],
                    'default' => [
                        'font-family' => '',
                        'variant' => '',
                        'font-size' => '',
                        'line-height' => '',
                        'letter-spacing' => '',
                    ],
                    'dependency' => [
                        [ 'element' => 'portafolio_mostrar_categorias', 'value' => 'yes', 'operator' => '==' ],
                        [ 'element' => 'portafolio_categoria_typography_enable', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Category color', 'glory-ab'),
                    'param_name' => 'portafolio_categoria_color',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_mostrar_categorias', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Category text transform', 'glory-ab'),
                    'param_name' => 'portafolio_categoria_text_transform',
                    'default' => '',
                    'value' => [
                        '' => __('Default', 'glory-ab'),
                        'uppercase' => __('Uppercase', 'glory-ab'),
                        'lowercase' => __('Lowercase', 'glory-ab'),
                        'capitalize' => __('Capitalize', 'glory-ab'),
                    ],
                    'dependency' => [
                        [ 'element' => 'portafolio_mostrar_categorias', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Category margin top', 'glory-ab'),
                    'param_name' => 'portafolio_categoria_margin_top',
                    'default' => '',
                    'description' => __('CSS length, e.g. 10px', 'glory-ab'),
                    'dependency' => [
                        [ 'element' => 'portafolio_mostrar_categorias', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Category margin bottom', 'glory-ab'),
                    'param_name' => 'portafolio_categoria_margin_bottom',
                    'default' => '',
                    'description' => __('CSS length, e.g. 10px', 'glory-ab'),
                    'dependency' => [
                        [ 'element' => 'portafolio_mostrar_categorias', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Content', 'glory-ab'),
                    'param_name' => 'portafolio_mostrar_contenido',
                    'default' => 'no',
                    'value' => [
                        'yes' => __('Show content', 'glory-ab'),
                        'no'  => __('Hide content', 'glory-ab'),
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Text length', 'glory-ab'),
                    'param_name' => 'portafolio_contenido_max_palabras',
                    'description' => __('Maximum number of words shown when content is enabled. Use 0 to show all.', 'glory-ab'),
                    'default' => '40',
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Show button', 'glory-ab'),
                    'param_name' => 'portafolio_boton_mostrar',
                    'default' => 'yes',
                    'value' => [
                        'yes' => __('Show', 'glory-ab'),
                        'no'  => __('Hide', 'glory-ab'),
                    ],
                    'group' => __('General', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Button label', 'glory-ab'),
                    'param_name' => 'portafolio_boton_text',
                    'default' => 'View project',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('General', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Button typography override', 'glory-ab'),
                    'param_name' => 'portafolio_boton_typography_enable',
                    'default' => 'no',
                    'value' => [
                        'yes' => __('Enabled', 'glory-ab'),
                        'no'  => __('Disabled', 'glory-ab'),
                    ],
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'typography',
                    'heading' => __('Button typography', 'glory-ab'),
                    'param_name' => 'portafolio_boton_typography',
                    'remove_from_atts' => true,
                    'choices' => [
                        'font-family' => 'portafolio_boton_font',
                        'variant'     => 'portafolio_boton_font',
                        'font-size'   => 'portafolio_boton_font_size',
                        'line-height' => 'portafolio_boton_line_height',
                        'letter-spacing' => 'portafolio_boton_letter_spacing',
                    ],
                    'default' => [
                        'font-family' => '',
                        'variant' => '',
                        'font-size' => '',
                        'line-height' => '',
                        'letter-spacing' => '',
                    ],
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                        [ 'element' => 'portafolio_boton_typography_enable', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Button text transform', 'glory-ab'),
                    'param_name' => 'portafolio_boton_text_transform',
                    'default' => '',
                    'value' => [
                        '' => __('Default','glory-ab'),
                        'uppercase' => __('Uppercase','glory-ab'),
                        'lowercase' => __('Lowercase','glory-ab'),
                        'capitalize' => __('Capitalize','glory-ab'),
                    ],
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Button padding', 'glory-ab'),
                    'param_name' => 'portafolio_boton_padding',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Button border radius', 'glory-ab'),
                    'param_name' => 'portafolio_boton_border_radius',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Button border width', 'glory-ab'),
                    'param_name' => 'portafolio_boton_border_width',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Button text color', 'glory-ab'),
                    'param_name' => 'portafolio_boton_text_color',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Button hover text color', 'glory-ab'),
                    'param_name' => 'portafolio_boton_text_color_hover',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Button background', 'glory-ab'),
                    'param_name' => 'portafolio_boton_background',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Button hover background', 'glory-ab'),
                    'param_name' => 'portafolio_boton_background_hover',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Button border color', 'glory-ab'),
                    'param_name' => 'portafolio_boton_border_color',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
                [
                    'type' => 'colorpickeralpha',
                    'heading' => __('Button hover border color', 'glory-ab'),
                    'param_name' => 'portafolio_boton_border_color_hover',
                    'default' => '',
                    'dependency' => [
                        [ 'element' => 'portafolio_boton_mostrar', 'value' => 'yes', 'operator' => '==' ],
                    ],
                    'group' => __('Design', 'glory-ab'),
                ],
            ],
        ]
    );
}
?>