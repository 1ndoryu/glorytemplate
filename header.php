<?php
$usuarioId = get_current_user_id();

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Preconnect para Google Fonts (optimiza tiempo de conexion) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://unpkg.com">
    <!-- Google Fonts asincrono para no bloquear renderizado -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Source+Sans+3:wght@200..900&display=swap" media="print" onload="this.media='all'">
    <noscript>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Source+Sans+3:wght@200..900&display=swap">
    </noscript>
    <!-- Assets encolados por AssetManager: GSAP y Highlight.js (controlados por features) -->
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
    <script>
        // Funcion de inicializacion del header y burger menu
        // Compatible con gloryAjaxNav - se reinicializa tras navegacion AJAX
        (function() {
            // Scroll handler - solo se registra una vez
            let scrollHandlerRegistered = false;

            function initHeaderBurger() {
                const header = document.querySelector('.siteMenuW, [gloryHeader]');
                if (!header) return;

                // Registrar scroll handler solo una vez
                if (!scrollHandlerRegistered) {
                    window.addEventListener('scroll', () => {
                        const h = document.querySelector('.siteMenuW, [gloryHeader]');
                        if (h) {
                            if (window.scrollY > 20) {
                                h.classList.add('scrolled');
                            } else {
                                h.classList.remove('scrolled');
                            }
                        }
                    }, {
                        passive: true
                    });
                    scrollHandlerRegistered = true;
                }

                // Burger menu toggle para header GBN
                const burger = header.querySelector('.burger, .cosmoHeaderBurger');
                if (burger && !burger._burgerInitialized) {
                    burger._burgerInitialized = true;

                    burger.addEventListener('click', function() {
                        header.classList.toggle('open');
                        document.body.classList.toggle('menu-open');
                    });

                    // Cerrar menu al hacer clic en el backdrop
                    const backdrop = header.querySelector('.background, .cosmoHeaderBackground');
                    if (backdrop && !backdrop._backdropInitialized) {
                        backdrop._backdropInitialized = true;
                        backdrop.addEventListener('click', function() {
                            header.classList.remove('open');
                            document.body.classList.remove('menu-open');
                        });
                    }
                }
            }

            // Inicializacion en carga de pagina
            document.addEventListener('DOMContentLoaded', initHeaderBurger);

            // Re-inicializacion despues de navegacion AJAX (gloryAjaxNav)
            document.addEventListener('gloryRecarga', initHeaderBurger);
        })();
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
    <!-- Cosmo Page Loader: Embebido en HTML para carga instantanea -->
    <style>
        .cosmoPageLoader {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background-color: #141414;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
            visibility: visible;
            transition: opacity .3s ease, visibility .3s ease
        }

        .cosmoPageLoader.isHidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none
        }

        .cosmoPageLoaderLogo {
            display: flex;
            align-items: center;
            justify-content: center
        }

        .cosmoLoaderLogo {
            width: auto;
            max-width: 200px;
            height: auto;
            animation: cosmoPulse 1.5s ease-in-out infinite
        }

        @keyframes cosmoPulse {

            0%,
            100% {
                transform: scale(1);
                opacity: 1
            }

            50% {
                transform: scale(1.05);
                /* Reduced scale slightly for larger images */
                opacity: .8
            }
        }
    </style>
    <div id="cosmoPageLoader" class="cosmoPageLoader">
        <div class="cosmoPageLoaderLogo">
            <img src="<?php echo get_template_directory_uri(); ?>/App/Assets/images/LogoBlancoLetras.png" alt="Logo" class="cosmoLoaderLogo">
        </div>
    </div>
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