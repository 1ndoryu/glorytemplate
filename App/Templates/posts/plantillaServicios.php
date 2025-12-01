<?php

use Glory\Utility\TemplateRegistry;
use Glory\Components\ContentRender;
use Glory\Utility\ImageUtility;

/**
 * Plantilla para servicios con layout numerado y soporte toggle.
 *
 * @param \WP_Post $post
 * @param string   $itemClass
 */
function plantillaServicios(\WP_Post $post, string $itemClass): void
{
    $indice = (int) ContentRender::getCurrentOption('indiceItem', 0);
    $layout = ContentRender::getCurrentOption('internalLayoutOptions', []);
    $modo = ContentRender::getCurrentOption('modoInteraccion', 'normal');
    $separator = (bool) ContentRender::getCurrentOption('toggleSeparator', false);
    $separatorColor = (string) ContentRender::getCurrentOption('toggleSeparatorColor', 'rgba(0,0,0,0.1)');
    $isToggle = ('toggle' === $modo);
    $size      = (string) ContentRender::getCurrentOption('imgSize', 'medium');
    $imagenUrl = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, $size) : '';
    $optimize  = (bool) ContentRender::getCurrentOption('imgOptimize', true);
    $quality   = (int)  ContentRender::getCurrentOption('imgQuality', 60);

    $subtitulo = get_post_meta($post->ID, 'subtitle', true);
    $numero = $indice > 0 ? str_pad((string) $indice, 2, '0', STR_PAD_LEFT) : '';

    $internalClasses = ['servicio-inner', 'glory-cr__internal'];
    if (is_array($layout)) {
        if (! empty($layout['display_mode'])) {
            $internalClasses[] = 'servicio-inner--display-' . $layout['display_mode'];
        }
        if (! empty($layout['flex_direction'])) {
            $internalClasses[] = 'servicio-inner--direction-' . $layout['flex_direction'];
        }
        if (! empty($layout['flex_wrap'])) {
            $internalClasses[] = 'servicio-inner--wrap-' . $layout['flex_wrap'];
        }
        if (! empty($layout['grid_columns_mode'])) {
            $internalClasses[] = 'servicio-inner--grid-' . $layout['grid_columns_mode'];
        }
    }

    $wrapperClasses = [$itemClass, 'servicio-item', 'glory-toggle__item'];
    if ($isToggle) {
        $wrapperClasses[] = 'servicio-item--toggle';
    }
    $wrapperClasses = trim(implode(' ', array_filter(array_unique($wrapperClasses))));

    $wrapperAttrs = '';
    if ($isToggle) {
        $wrapperAttrs .= ' data-glory-toggle-item="true" role="button" tabindex="0" aria-expanded="false"';
    }

    $autoOpen = (array) ContentRender::getCurrentOption('toggleAutoOpen', []);
    $isAutoOpen = $isToggle && ! empty($autoOpen) && in_array($indice, $autoOpen, true);
    if ($isAutoOpen) {
        $wrapperAttrs .= ' data-glory-toggle-open="true"';
    }
?>
    <?php
    // Imprimir CSS responsivo una sola vez para ajustar el min-width del título por dispositivo.
    static $serviciosResponsiveCssPrinted = false;
    if (! $serviciosResponsiveCssPrinted) {
        $serviciosResponsiveCssPrinted = true;
        ?>
        <style>
        @media (min-width: 768px) and (max-width: 979px) {
            .servicio-titulo-wrap { 
                min-width: 130px !important; 
                margin-right: 10px !important; 
            }
        }
        @media (max-width: 767px) {
            .servicio-titulo-wrap { 
                min-width: 60px !important; 
                margin-right: 10px !important; 
            }
            .servicio-inner {
                flex-direction: column !important;
            }
        }
        </style>
        <?php
    }
    ?>
    <div class="<?php echo esc_attr($wrapperClasses); ?>" data-glory-toggle-index="<?php echo esc_attr((string) $indice); ?>" <?php echo $wrapperAttrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
                                                                                                                                ?> style="margin-top: 10px; cursor: pointer;">
        <?php if ($isToggle && $separator) : ?>
            <span class="servicio-separador" aria-hidden="true" style="background-color: <?php echo esc_attr($separatorColor); ?>"></span>
        <?php endif; ?>
        <div class="<?php echo esc_attr(implode(' ', $internalClasses)); ?>" data-glory-internal="true">
            <div class="servicio-meta" style="align-self: self-start;">
                <?php if ($numero) : ?>
                    <?php /*Lo coloco h3 porque en span no tiene la misma altura que el h3 de servicio-subtitulo y necesito que se vea igual, después lo ajustaré*/ ?>
                    <h3 class="glory-cr__title servicio-titulo awb-responsive-type__disable" style="margin: 0 !important;"><?php echo esc_html($numero); ?></h3>
                <?php endif; ?>
                <?php if ($subtitulo) : ?>
                    <h3 class="servicio-subtitulo" style="margin: 0 !important;"><?php echo esc_html($subtitulo); ?></h3>
                <?php endif; ?>
            </div>
            <div class="servicio-titulo-wrap glory-toggle__trigger" data-glory-toggle-trigger="true" style="
            align-self: self-start;
            min-width: 300px;
            margin-right: 40px;">
                <h3 class="glory-cr__title servicio-titulo awb-responsive-type__disable" style="margin: 0 !important; max-width: 600px;"><?php echo esc_html(get_the_title($post)); ?></h3>
            </div>
            <div class="glory-cr__content fusion-text glory-toggle__content" <?php echo $isToggle ? ' data-glory-toggle-content="true"' : ''; ?> style="align-self: self-start; margin-left: auto;">
                <?php echo apply_filters('the_content', $post->post_content); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
                ?>
                <?php if ($imagenUrl) : ?>
                    <?php if ($optimize) : ?>
                        <?php $imgHtml = ImageUtility::optimizar($post, $size, $quality); ?>
                        <?php if (!empty($imgHtml)) : ?>
                            <?php
                            // Asegurar que la imagen optimizada tenga la clase glory-cr__image sin duplicar atributos class
                            if (preg_match('/\sclass=\"([^\"]*)\"/i', $imgHtml)) {
                                $outputImg = preg_replace('/\sclass=\"([^\"]*)\"/i', ' class="$1 glory-cr__image"', $imgHtml, 1);
                            } else {
                                $outputImg = preg_replace('/^<img\s+/i', '<img class="glory-cr__image" ', $imgHtml, 1);
                            }
                            echo $outputImg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                            ?>
                        <?php endif; ?>
                    <?php else : ?>
                        <img src="<?php echo esc_url($imagenUrl); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>" class="glory-cr__image">
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
<?php
}

if (class_exists(TemplateRegistry::class)) {
    TemplateRegistry::register(
        'plantilla_servicios',
        'Plantilla de Servicios',
        function (?\WP_Post $givenPost = null, string $itemClass = '') {
            $postToRender = $givenPost;
            if (! $postToRender) {
                global $post;
                $postToRender = ($post instanceof \WP_Post) ? $post : null;
            }
            if ($postToRender instanceof \WP_Post) {
                $mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'glory-servicio-item');
                plantillaServicios($postToRender, $mergedItemClass);
            }
        },
        ['services'],
        [
            'toggle' => true,
            'internalLayout' => true,
            'options' => [
                [
                    'type' => 'textfield',
                    'heading' => __('Ancho contenido (servicio)', 'glory-ab'),
                    'param_name' => 'servicio_contenido_width',
                    'default' => '',
                    'description' => '',
                    'group' => __('Diseño', 'glory-ab'),
                    'responsive' => ['state' => 'large', 'default_value' => false, 'additional_states' => ['medium', 'small']],
                ],
                [
                    'type' => 'textfield',
                    'heading' => __('Ancho máximo contenido (servicio)', 'glory-ab'),
                    'param_name' => 'servicio_contenido_max_width',
                    'default' => '',
                    'description' => '',
                    'group' => __('Diseño', 'glory-ab'),
                    'responsive' => ['state' => 'large', 'default_value' => false, 'additional_states' => ['medium', 'small']],
                ],
            ],
        ]
    );
}
