<?php

use Glory\Utility\TemplateRegistry;
use Glory\Components\ContentRender;
use Glory\Utility\ImageUtility;

/**
 * Plantilla "Service Kura"
 * Estructura: contenedor con 2 divs, izquierda imagen y derecha título + contenido.
 *
 * @param \WP_Post $post
 * @param string   $itemClass
 */
function plantillaServiceKura(\WP_Post $post, string $itemClass): void
{
	$size     = (string) ContentRender::getCurrentOption('imgSize', 'medium');
	$optimize = (bool) ContentRender::getCurrentOption('imgOptimize', true);
	$quality  = (int) ContentRender::getCurrentOption('imgQuality', 60);

	// Opciones específicas de esta plantilla
	$borderShow  = (bool) ContentRender::getCurrentOption('serviceKuraBorderShow', true);
	$borderColor = (string) ContentRender::getCurrentOption('serviceKuraBorderColor', 'rgba(0,0,0,0.15)');
	$borderWidth = (string) ContentRender::getCurrentOption('serviceKuraBorderWidth', '1px');

	$imgUrl = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, $size) : '';

	$item = trim($itemClass . ' service-kura-item');
	?>
	<div class="<?php echo esc_attr($item); ?>">
		<a href="<?php echo esc_url(get_permalink($post)); ?>">
			<div class="service-kura__inner glory-cr__internal" style="display:flex;gap:20px;align-items: flex-end;">
				<?php if ($imgUrl) : ?>
					<div class="service-kura__image">
						<?php if ($optimize) : ?>
							<?php $imgHtml = ImageUtility::optimizar($post, $size, $quality); ?>
							<?php if (! empty($imgHtml)) : ?>
								<?php
								// Asegurar clase glory-cr__image sin duplicar atributos class
								if (preg_match('/\sclass=\"([^\"]*)\"/i', $imgHtml)) {
									$outputImg = preg_replace('/\sclass=\"([^\"]*)\"/i', ' class="$1 glory-cr__image"', $imgHtml, 1);
								} else {
									$outputImg = preg_replace('/^<img\s+/i', '<img class="glory-cr__image" ', $imgHtml, 1);
								}
								echo $outputImg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
								?>
							<?php endif; ?>
						<?php else : ?>
							<img class="glory-cr__image" src="<?php echo esc_url($imgUrl); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>">
						<?php endif; ?>
					</div>
				<?php endif; ?>

				<div class="service-kura__info">
					<div class="glory-cr__stack">
						<h3 class="glory-cr__title"><?php echo esc_html(get_the_title($post)); ?></h3>
					</div>
					<div class="glory-cr__content fusion-text" style="<?php echo $borderShow ? 'border-bottom: ' . esc_attr($borderWidth) . ' solid ' . esc_attr($borderColor) . ';' : ''; ?>">
						<?php echo apply_filters('the_content', $post->post_content); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</div>
				</div>
			</div>
		</a>
	</div>
	<?php
}

// Registro en el TemplateRegistry
if (class_exists(TemplateRegistry::class)) {
	TemplateRegistry::register(
		'serviceKura',
		'Service Kura',
		function (?\WP_Post $givenPost = null, string $itemClass = '') {
			$postToRender = $givenPost;
			if (! $postToRender) {
				global $post;
				$postToRender = ($post instanceof \WP_Post) ? $post : null;
			}
			if ($postToRender instanceof \WP_Post) {
				$mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'service-kura-item');
				plantillaServiceKura($postToRender, $mergedItemClass);
			}
		},
		['services'],
		[
			// Permite controlar el layout interno (2 columnas) por instancia desde el builder.
			'internalLayout' => true,
			// Forzar/ocultar controles del contenedor y visibilidad de título/imagen
			'containerOverrides' => [
				'display_mode'   => 'flex',
				'flex_direction' => 'column',
				'flex_wrap'      => 'nowrap',
			],
			'hideControls' => [ 'display_mode', 'flex_direction', 'flex_wrap', 'title_show', 'img_show' ],
			'forceArgs' => [
				'title_show' => 'yes',
				'img_show'   => 'yes',
			],
			// Opciones propias de la plantilla
			'options' => [
				[
					'type'       => 'radio_button_set',
					'heading'    => __('Mostrar borde inferior (contenido)', 'glory-ab'),
					'param_name' => 'service_kura_border_show',
					'default'    => 'yes',
					'value'      => [ 'yes' => __('Sí','glory-ab'), 'no' => __('No','glory-ab') ],
					'group'      => __('Design', 'glory-ab'),
				],
				[
					'type'       => 'colorpickeralpha',
					'heading'    => __('Color borde (contenido)', 'glory-ab'),
					'param_name' => 'service_kura_border_color',
					'default'    => 'rgba(0,0,0,0.15)',
					'group'      => __('Design', 'glory-ab'),
					'dependency' => [ [ 'element' => 'service_kura_border_show', 'value' => 'yes', 'operator' => '==' ] ],
				],
				[
					'type'       => 'textfield',
					'heading'    => __('Grosor borde (contenido)', 'glory-ab'),
					'param_name' => 'service_kura_border_width',
					'default'    => '1px',
					'description'=> __('Ej.: 1px, 2px', 'glory-ab'),
					'group'      => __('Design', 'glory-ab'),
					'dependency' => [ [ 'element' => 'service_kura_border_show', 'value' => 'yes', 'operator' => '==' ] ],
				],
			],
		]
	);
}


