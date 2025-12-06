<?php
$usuarioId = get_current_user_id();

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Source+Sans+3:wght@200..900&display=swap');
    </style>
    <!-- Assets encolados por AssetManager: GSAP y Highlight.js (controlados por features) -->
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const header = document.querySelector('.siteMenuW');
            if (header) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 20) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                }, {
                    passive: true
                });
            }
        });
    </script>
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
    $funcionRenderizar = \Glory\Manager\PageManager::getFuncionParaRenderizar();
    
    // Modificación para GBN: Permitir header personalizado incluso en 'contructor' si GBN está activo.
    // El usuario solicitó explícitamente probar el header en el constructor.
    
    $gbnActive = \Glory\Gbn\GbnManager::isBuilderActive() || (class_exists(\Glory\Core\GloryFeatures::class) && \Glory\Core\GloryFeatures::isActive('gbn', 'glory_gbn_activado'));
    
    // Si GBN está activo, tiene prioridad absoluta sobre la lógica legacy ('contructor').
    if ($gbnActive && class_exists(\Glory\Gbn\Services\TemplateService::class)) {
            // Render GBN Header
            echo '<header id="gbn-header" class="gbn-header-wrapper">';
            echo \Glory\Gbn\Services\TemplateService::getHeaderContent();
            echo '</header>';
    } 
    // Si GBN NO está activo, mantenemos la lógica original de ocultar en 'contructor'
    elseif ($funcionRenderizar !== 'contructor') {
            // Render Default Glory Header
            $defaultMode = Compatibility::avadaActivo() ? 'default' : 'image';
            $configHeader = [
                'modoLogo'    => OpcionManager::get('glory_logo_mode', $defaultMode),
                'textoLogo'   => OpcionManager::get('glory_logo_text', get_bloginfo('name', 'display')),
                'logoImageId' => OpcionManager::get('glory_logo_image'),
                'idMenu'      => 'mainMenu' 
            ];
            HeaderRenderer::render($configHeader);
            echo ThemeToggle::render();
    }
    ?>
    <main id="main" class="main">