<?php
$usuarioId = get_current_user_id();

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="preload" as="font" href="<?php echo get_template_directory_uri(); ?>/App/Assets/fonts/PPNeueMontreal-Medium.woff2" type="font/woff2" crossorigin>
    <?php if (is_front_page()) {
        $heroBg = \Glory\Utility\AssetsUtility::imagenUrl('tema::s3.jpg');
        if ($heroBg) {
            $m  = \Glory\Utility\ImageUtility::jetpack_photon_url($heroBg, ['w' => 768,  'quality' => 60, 'strip' => 'all', 'format' => 'webp']);
            $d  = \Glory\Utility\ImageUtility::jetpack_photon_url($heroBg, ['w' => 1280, 'quality' => 60, 'strip' => 'all', 'format' => 'webp']);
            $xl = \Glory\Utility\ImageUtility::jetpack_photon_url($heroBg, ['w' => 1920, 'quality' => 60, 'strip' => 'all', 'format' => 'webp']);
            $srcset = esc_attr($m . ' 768w, ' . $d . ' 1280w, ' . $xl . ' 1920w');
            echo '<link rel="preload" as="image" imagesrcset="' . $srcset . '" imagesizes="100vw">';
        }
    } ?>

    <!-- Assets encolados por AssetManager: GSAP y Highlight.js (controlados por features) -->
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php if (class_exists('Glory\\Manager\\AssetManager')) {
        \Glory\Manager\AssetManager::imprimirCssCritico();
    } ?>
    <?php wp_head(); ?>
</head>

<?php

use Glory\Components\HeaderRenderer;
use Glory\Manager\OpcionManager;
use Glory\Integration\Compatibility;
use Glory\Components\ThemeToggle;

?>


<body>
    <div id="loadingBar"></div>


    <?php
    $defaultMode = Compatibility::avadaActivo() ? 'default' : 'svg';
    $configHeader = [
        'modoLogo'    => OpcionManager::get('glory_logo_mode', $defaultMode),
        'textoLogo'   => OpcionManager::get('glory_logo_text', get_bloginfo('name', 'display')),
        'logoImageId' => OpcionManager::get('glory_logo_image'),
        'idMenu'      => 'mainMenu'
    ];
    HeaderRenderer::render($configHeader);
    ?>
    <main id="main" class="main">