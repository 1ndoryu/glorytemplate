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
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>
    <?php wp_head(); ?>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const header = document.querySelector('.siteMenuW, [gloryHeader]');
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

                // Burger menu toggle para header GBN
                const burger = header.querySelector('.burger, .cosmoHeaderBurger');
                if (burger) {
                    burger.addEventListener('click', function() {
                        header.classList.toggle('open');
                        document.body.classList.toggle('menu-open');
                    });

                    // Cerrar menu al hacer clic en el backdrop
                    const backdrop = header.querySelector('.background, .cosmoHeaderBackground');
                    if (backdrop) {
                        backdrop.addEventListener('click', function() {
                            header.classList.remove('open');
                            document.body.classList.remove('menu-open');
                        });
                    }
                }
            }
        });
    </script>
</head>

<?php

use Glory\Components\HeaderRenderer;
use Glory\Manager\OpcionManager;
use Glory\Integration\Compatibility;
use Glory\Components\ThemeToggle;
use Glory\Core\GloryFeatures;
use Glory\Gbn\Services\TemplateService;

?>


<body>
    <div id="loadingBar"></div>

    <main id="main" class="main">
        <?php

        $funcionRenderizar = \Glory\Manager\PageManager::getFuncionParaRenderizar();

        // Fase 15: Verificar si GBN esta activado
        $useGbnHeader = false;
        if (class_exists(GloryFeatures::class) && method_exists(GloryFeatures::class, 'isActive')) {
            $useGbnHeader = GloryFeatures::isActive('gbn', 'glory_gbn_activado');
        }

        // Si GBN esta activo, usar header GBN (guardado o por defecto)
        if ($useGbnHeader && class_exists(TemplateService::class)) {
            // Intentar obtener template guardado
            $gbnHeader = TemplateService::renderHeader();

            if ($gbnHeader !== false) {
                // Hay template guardado, usarlo
                echo $gbnHeader;
            } else {
                // No hay template guardado, usar el template por defecto de GBN
                echo TemplateService::getDefaultHeaderTemplate();
            }
        } else {
            // GBN no esta activo: usar header tradicional de Glory
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