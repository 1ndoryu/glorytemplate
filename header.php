<?php
$usuarioId = get_current_user_id();

// El tema "project" (azul) es ahora el DEFAULT en CSS (:root)
// Solo necesitamos agregar data-theme="default" si se solicita explícitamente
$themeFromUrl = isset($_GET['theme']) && $_GET['theme'] === 'default' ? 'default' : 'project';
$dataThemeAttr = $themeFromUrl === 'default' ? ' data-theme="default"' : '';
?>
<!doctype html>
<html <?php language_attributes(); ?><?php echo $dataThemeAttr; ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Google Fonts (Manrope/Inter) se cargan desde performance.php con font-display:swap -->
    <!-- Assets encolados por AssetManager: GSAP y Highlight.js (controlados por features) -->
    <link rel="profile" href="https://gmpg.org/xfn/11">
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
    $defaultMode = Compatibility::avadaActivo() ? 'default' : 'image';
    $configHeader = [
        'modoLogo'    => OpcionManager::get('glory_logo_mode', $defaultMode),
        'textoLogo'   => OpcionManager::get('glory_logo_text', get_bloginfo('name', 'display')),
        'logoImageId' => OpcionManager::get('glory_logo_image'),
        'idMenu'      => 'mainMenu'
    ];
    HeaderRenderer::render($configHeader);
    echo ThemeToggle::render();
    ?>
    <main id="main" class="main">