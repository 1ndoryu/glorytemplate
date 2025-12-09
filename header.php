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
    <!-- Google Fonts con display=swap para evitar FOIT -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Source+Sans+3:wght@200..900&display=swap">
    <!-- Assets encolados por AssetManager: GSAP y Highlight.js (controlados por features) -->
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>
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
            width: 60px;
            height: 60px;
            color: #8d926f;
            animation: cosmoPulse 1.5s ease-in-out infinite
        }

        @keyframes cosmoPulse {

            0%,
            100% {
                transform: scale(1);
                opacity: 1
            }

            50% {
                transform: scale(1.1);
                opacity: .7
            }
        }
    </style>
    <div id="cosmoPageLoader" class="cosmoPageLoader">
        <div class="cosmoPageLoaderLogo">
            <svg class="cosmoLoaderLogo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 325.47 325.47">
                <path fill="currentColor" d="m207.36,202.38c-9.46,8.95-18.95,17.55-28.01,26.58-13.44,13.41-26.64,27.07-39.81,40.75-3.57,3.71-6.82,5.45-11.61,1.86-3.04-2.28-5.92-.66-8.38,1.85-7.1,7.27-14.22,14.52-21.42,21.69-4.3,4.28-6.52,4.21-10.96-.05-3.24-3.12-6.51-6.22-9.67-9.41-3.24-3.27-6.39-3.13-9.55.02-3.3,3.29-6.61,6.59-9.86,9.93-3.35,3.44-6.74,3.29-10.03.07-15.33-15.05-30.63-30.14-45.93-45.24-2.91-2.88-2.8-5.93-.01-8.78,15.11-15.51,30.24-31.01,45.42-46.46,3.13-3.19,6.38-3.05,9.57.17,2.93,2.96,5.97,5.8,8.97,8.69,5.28,5.1,7.36,5.12,12.47.06,2.6-2.58,5.14-5.22,7.74-7.81,4.52-4.52,7.08-4.49,11.74.14,3.9,3.87,7.75,7.8,11.69,11.63,6.24,6.06,8.58,5.85,14.3-1.64-2.66-2.71-5.36-5.55-8.16-8.29-20.35-19.93-40.7-39.86-61.11-59.73-3.1-3.02-3.83-6.03-1.25-9.7,2.45-3.49,1.51-6.39-1.47-9.23-7.34-7.02-14.53-14.21-21.74-21.38-4.02-4-4.01-6.61-.12-10.57,2.92-2.97,5.83-5.94,8.74-8.93,4.6-4.73,4.55-7.21-.13-11.69-3.01-2.88-5.94-5.84-8.91-8.76-3.16-3.1-3.5-6.35-.32-9.6,15.14-15.49,30.28-30.96,45.48-46.39,2.78-2.83,5.95-2.95,8.84-.12,15.59,15.26,31.17,30.55,46.68,45.89,3.12,3.08,2.34,6.38-.4,9.3-3.31,3.52-6.75,6.91-10.16,10.33-3.21,3.21-3.14,6.44-.02,9.61,2.8,2.85,5.67,5.64,8.57,8.39,5.27,5.01,5.32,7.58.11,12.86-3.74,3.79-7.51,7.57-11.27,11.35-5.96,6.01-5.73,8.63,2.02,14.42,4.12-4.29,8.3-8.73,12.57-13.09,18.18-18.56,36.42-37.07,54.54-55.69,3.41-3.5,6.61-4.63,10.89-1.51,3.43,2.49,6.26.63,8.78-1.94,6.99-7.14,13.96-14.3,21-21.39,4.27-4.3,6.67-4.3,10.94-.16,3.35,3.24,6.58,6.62,10.01,9.78,3.02,2.79,6.21,2.96,9.25-.12,3.39-3.44,6.75-6.91,10.19-10.3,3.16-3.11,6.29-3.18,9.57.04,15.08,14.84,30.24,29.59,45.31,44.43,4.02,3.96,4.02,6.62.06,10.67-14.69,15-29.41,29.95-44.18,44.87-3.78,3.81-6.37,3.77-10.26.09-3.38-3.21-6.62-6.57-10.04-9.75-3.66-3.41-6.35-3.4-9.97.1-3.11,3.01-5.98,6.27-9.05,9.32-4.11,4.1-6.82,4.13-11.09.02-4.2-4.04-8.23-8.26-12.4-12.33-6-5.86-8.59-5.55-13.51,1.12,7.16,7.49,14.12,15.08,21.42,22.32,15.48,15.37,31.13,30.59,46.75,45.82,3.25,3.17,4.65,6.36,1.59,10.5-2.47,3.34-1.14,6.18,1.55,8.8,7.16,6.97,14.25,14.02,21.35,21.05,4.58,4.53,4.65,6.76.32,11.28-3.11,3.25-6.26,6.46-9.36,9.72-3.21,3.37-3.38,6.59.24,9.91,3.43,3.15,6.67,6.52,9.97,9.81,3.02,3.01,3.09,6.33.2,9.28-15.24,15.62-30.54,31.18-45.92,46.66-2.58,2.6-5.65,2.65-8.43-.07-15.59-15.26-31.22-30.49-46.74-45.82-3-2.96-2.67-6.2.37-9.2,3.32-3.27,6.65-6.55,9.8-9.98,3.73-4.07,3.6-6.93-.26-10.77-2.95-2.94-5.99-5.79-8.96-8.71-3.89-3.81-3.99-6.72-.17-10.71,4.14-4.34,8.42-8.54,12.65-12.79,5.77-5.81,5.3-9.29-1.03-13.07Zm-45.13-71.49c-1.96,1.39-3.88,2.38-5.33,3.84-7.63,7.65-15.17,15.39-22.68,23.16-3.92,4.06-3.86,6.41.29,10.52,7.91,7.83,15.93,15.56,23.86,23.39,3.05,3.01,6.06,3.22,9.1.13,8.16-8.29,16.31-16.59,24.41-24.94,2.92-3.01,3-6.16-.09-9.17-8.21-8-16.4-16.04-24.69-23.96-1.24-1.19-2.99-1.84-4.86-2.96Z" />
            </svg>
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