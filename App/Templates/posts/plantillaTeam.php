<?php

use Glory\Utility\TemplateRegistry;
use Glory\Components\ContentRender;
use Glory\Utility\ImageUtility;

/**
 * Plantilla personalizada para renderizar un item de tipo 'team'.
 * Estructura: imagen, debajo el nombre, luego role y profession.
 *
 * @param WP_Post $post
 * @param string  $itemClass
 */
function plantillaTeam(?\WP_Post $post, string $itemClass): void
{
    if (!($post instanceof \WP_Post)) {
        return;
    }
    $size      = (string) ContentRender::getCurrentOption('imgSize', 'medium');
    $imagenUrl = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, $size) : '';
    $optimize  = (bool) ContentRender::getCurrentOption('imgOptimize', true);
    $quality   = (int)  ContentRender::getCurrentOption('imgQuality', 60);
    $showRole        = (bool) ContentRender::getCurrentOption('teamShowRole', true);
    $showProfession  = (bool) ContentRender::getCurrentOption('teamShowProfession', true);
?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <div class="team-card">
            <a class="glory-cr__link" href="<?php echo esc_url(get_permalink($post)); ?>">
                <div class="glory-cr__stack">
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

                    <div class="post-info">
                        <h3 class="glory-cr__title noResponsiveFont awb-responsive-type__disable"><?php echo esc_html(get_the_title($post)); ?></h3>
                        <?php if ($showRole) : ?>
                            <?php $role = get_post_meta($post->ID, 'role', true); ?>
                            <?php if (!empty($role)) : ?>
                                <div class="team-role glory-cr__title"><?php echo esc_html($role); ?></div>
                            <?php endif; ?>
                        <?php endif; ?>
                        <?php if ($showProfession) : ?>
                            <?php $profession = get_post_meta($post->ID, 'profession', true); ?>
                            <?php if (!empty($profession)) : ?>
                                <div class="team-profession glory-cr__title"><?php echo esc_html($profession); ?></div>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </a>
        </div>
    </div>
<?php
}

// Registrar plantilla en el registro global con id 'plantilla_team'
if (class_exists(TemplateRegistry::class)) {
    TemplateRegistry::register(
        'plantilla_team',
        'Team Template',
        function (?\WP_Post $givenPost = null, string $itemClass = '') {
            $postToRender = $givenPost;
            if (!$postToRender) {
                global $post;
                $postToRender = ($post instanceof \WP_Post) ? $post : null;
            }
            if ($postToRender instanceof \WP_Post) {
                $mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'glory-team-item');
                plantillaTeam($postToRender, $mergedItemClass);
            }
        },
        ['team'],
        [
            'options' => [
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Show role', 'glory-ab'),
                    'param_name' => 'team_show_role',
                    'default' => 'yes',
                    'value' => [ 'yes' => __('Yes','glory-ab'), 'no' => __('No','glory-ab') ],
                    'group' => __('General', 'glory-ab'),
                ],
                [
                    'type' => 'radio_button_set',
                    'heading' => __('Show profession', 'glory-ab'),
                    'param_name' => 'team_show_profession',
                    'default' => 'yes',
                    'value' => [ 'yes' => __('Yes','glory-ab'), 'no' => __('No','glory-ab') ],
                    'group' => __('General', 'glory-ab'),
                ],
            ],
        ]
    );
}
?>


