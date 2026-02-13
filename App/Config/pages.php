<?php

/*
 * Cosmo Revenue - Configuracion de Paginas
 * Todas las paginas usan reactPage() para renderizar islands React.
 * Los servicios individuales reciben el slug del plan como prop.
 */

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');

/* SEO Map global */
PageManager::setDefaultSeoMap([
    'home' => [
        'title' => 'Cosmo Revenue | Consultoría de Revenue Management para Hoteles',
        'desc' => 'Maximiza la rentabilidad de tu hotel con estrategias de revenue management, marketing hotelero y consultoría especializada. Auditoría gratuita disponible.',
        'canonical' => 'https://cosmorevenue.com/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
        ],
    ],
    'servicios' => [
        'title' => 'Servicios de Revenue Management | Cosmo Revenue',
        'desc' => 'Descubre nuestros servicios de revenue management, marketing hotelero y consultoría estratégica diseñados para potenciar la rentabilidad de tu alojamiento.',
        'canonical' => 'https://cosmorevenue.com/servicios/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
        ],
    ],
    'casos' => [
        'title' => 'Casos de Éxito | Resultados Reales en Hoteles | Cosmo Revenue',
        'desc' => 'Conoce los casos de éxito de hoteles que han transformado su rentabilidad con nuestras estrategias de revenue management.',
        'canonical' => 'https://cosmorevenue.com/casos/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Casos de Éxito', 'url' => 'https://cosmorevenue.com/casos/'],
        ],
    ],
    'about' => [
        'title' => 'Sobre Cosmo Revenue | Consultoría Boutique de Revenue Hotelero',
        'desc' => 'Cosmo Revenue es una consultoría boutique de revenue y RevOps para hotelería. Conoce nuestra metodología.',
        'canonical' => 'https://cosmorevenue.com/about/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Sobre Nosotros', 'url' => 'https://cosmorevenue.com/about/'],
        ],
    ],
    'contacto' => [
        'title' => 'Contacto | Reserva tu Auditoría Gratuita | Cosmo Revenue',
        'desc' => 'Contacta con Cosmo Revenue para una auditoría gratuita de tu hotel.',
        'canonical' => 'https://cosmorevenue.com/contacto/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Contacto', 'url' => 'https://cosmorevenue.com/contacto/'],
        ],
    ],
    'servicio-comet' => [
        'title' => 'Servicio Comet | Impulso Inicial de Marketing | Cosmo Revenue',
        'desc' => 'Auditoría de redes sociales, gestión y publicaciones semanales para impulsar la visibilidad de tu hotel.',
        'canonical' => 'https://cosmorevenue.com/servicio-comet/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Comet', 'url' => 'https://cosmorevenue.com/servicio-comet/'],
        ],
    ],
    'servicio-nebula' => [
        'title' => 'Servicio Nebula | Atracción y Nutrición | Cosmo Revenue',
        'desc' => 'Ads en redes, email marketing y gestión de comunidad para atraer y fidelizar huéspedes.',
        'canonical' => 'https://cosmorevenue.com/servicio-nebula/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Nebula', 'url' => 'https://cosmorevenue.com/servicio-nebula/'],
        ],
    ],
    'servicio-quasar' => [
        'title' => 'Servicio Quasar | Aceleración Total | Cosmo Revenue',
        'desc' => 'Google Hotel Ads, plan de comunicación anual y análisis de ROI para acelerar tus resultados.',
        'canonical' => 'https://cosmorevenue.com/servicio-quasar/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Quasar', 'url' => 'https://cosmorevenue.com/servicio-quasar/'],
        ],
    ],
    'servicio-orbit' => [
        'title' => 'Servicio Orbit | Consultoría Estratégica | Cosmo Revenue',
        'desc' => 'Consultoría estratégica, auditoría PMS/OTAs y mapeo de canales para empezar con claridad.',
        'canonical' => 'https://cosmorevenue.com/servicio-orbit/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Orbit', 'url' => 'https://cosmorevenue.com/servicio-orbit/'],
        ],
    ],
    'servicio-galaxy' => [
        'title' => 'Servicio Galaxy | Gestión Externa Continua | Cosmo Revenue',
        'desc' => 'Control de channel mix y revisión de tarifas continua para gestión externa de revenue.',
        'canonical' => 'https://cosmorevenue.com/servicio-galaxy/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Galaxy', 'url' => 'https://cosmorevenue.com/servicio-galaxy/'],
        ],
    ],
    'servicio-universe' => [
        'title' => 'Servicio Universe | Departamento 360 | Cosmo Revenue',
        'desc' => 'Estrategia de fidelización, mapeos ilimitados y formación de equipo. Tu departamento de revenue completo.',
        'canonical' => 'https://cosmorevenue.com/servicio-universe/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Universe', 'url' => 'https://cosmorevenue.com/servicio-universe/'],
        ],
    ],
]);

/* Paginas principales */
PageManager::reactPage('home', 'LandingIsland');
PageManager::reactPage('servicios', 'ServiciosIsland');
PageManager::reactPage('casos', 'CasosIsland');
PageManager::reactPage('about', 'AboutIsland');
PageManager::reactPage('contacto', 'ContactoIsland');

/* Paginas de servicios individuales: reciben slug del plan */
PageManager::reactPage('servicio-comet', 'ServicioDetalleIsland', ['planSlug' => 'comet']);
PageManager::reactPage('servicio-nebula', 'ServicioDetalleIsland', ['planSlug' => 'nebula']);
PageManager::reactPage('servicio-quasar', 'ServicioDetalleIsland', ['planSlug' => 'quasar']);
PageManager::reactPage('servicio-orbit', 'ServicioDetalleIsland', ['planSlug' => 'orbit']);
PageManager::reactPage('servicio-galaxy', 'ServicioDetalleIsland', ['planSlug' => 'galaxy']);
PageManager::reactPage('servicio-universe', 'ServicioDetalleIsland', ['planSlug' => 'universe']);

/* Constructor (Page Builder) */
PageManager::reactPage('constructor', 'ConstructorIsland');

/* Paginas condicionales */
/*
if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
*/