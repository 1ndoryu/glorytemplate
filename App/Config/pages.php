<?php

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');

// Configuracion SEO para todas las paginas
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
        'desc' => 'Conoce los casos de éxito de hoteles que han transformado su rentabilidad con nuestras estrategias de revenue management. Resultados medibles y comprobados.',
        'canonical' => 'https://cosmorevenue.com/casos/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Casos de Éxito', 'url' => 'https://cosmorevenue.com/casos/'],
        ],
    ],
    'about' => [
        'title' => 'Sobre Cosmo Revenue | Consultoría Boutique de Revenue Hotelero',
        'desc' => 'Cosmo Revenue es una consultoría boutique de revenue y RevOps para hotelería. Conoce nuestra metodología y enfoque personalizado para cada hotel.',
        'canonical' => 'https://cosmorevenue.com/about/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Sobre Nosotros', 'url' => 'https://cosmorevenue.com/about/'],
        ],
    ],
    'contacto' => [
        'title' => 'Contacto | Reserva tu Auditoría Gratuita | Cosmo Revenue',
        'desc' => 'Contacta con Cosmo Revenue para una auditoría gratuita de tu hotel. Analizamos tu situación actual y te proponemos un plan de acción personalizado.',
        'canonical' => 'https://cosmorevenue.com/contacto/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Contacto', 'url' => 'https://cosmorevenue.com/contacto/'],
        ],
    ],
    // Servicios individuales
    'servicio-comet' => [
        'title' => 'Servicio Comet | Auditoría de Revenue | Cosmo Revenue',
        'desc' => 'El servicio Comet ofrece una auditoría técnica completa de tu estrategia de revenue. Diagnóstico inicial para identificar oportunidades de mejora.',
        'canonical' => 'https://cosmorevenue.com/servicio-comet/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Comet', 'url' => 'https://cosmorevenue.com/servicio-comet/'],
        ],
    ],
    'servicio-nebula' => [
        'title' => 'Servicio Nebula | Estrategia de Precios | Cosmo Revenue',
        'desc' => 'El servicio Nebula diseña tu estrategia de precios óptima. Análisis de competencia, segmentación y reglas de pricing para maximizar ingresos.',
        'canonical' => 'https://cosmorevenue.com/servicio-nebula/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Nebula', 'url' => 'https://cosmorevenue.com/servicio-nebula/'],
        ],
    ],
    'servicio-quasar' => [
        'title' => 'Servicio Quasar | Revenue Management Mensual | Cosmo Revenue',
        'desc' => 'El servicio Quasar ofrece gestión de revenue mensual. Optimización continua de precios, distribución y estrategia comercial para tu hotel.',
        'canonical' => 'https://cosmorevenue.com/servicio-quasar/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Quasar', 'url' => 'https://cosmorevenue.com/servicio-quasar/'],
        ],
    ],
    'servicio-orbit' => [
        'title' => 'Servicio Orbit | Marketing Hotelero | Cosmo Revenue',
        'desc' => 'El servicio Orbit impulsa tu visibilidad y venta directa. Estrategia de marketing digital, SEO hotelero y campañas de adquisición.',
        'canonical' => 'https://cosmorevenue.com/servicio-orbit/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Orbit', 'url' => 'https://cosmorevenue.com/servicio-orbit/'],
        ],
    ],
    'servicio-galaxy' => [
        'title' => 'Servicio Galaxy | Gestión 360 de Revenue | Cosmo Revenue',
        'desc' => 'El servicio Galaxy ofrece gestión integral de revenue: pricing, distribución, marketing y análisis. Tu departamento de revenue externalizado.',
        'canonical' => 'https://cosmorevenue.com/servicio-galaxy/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Galaxy', 'url' => 'https://cosmorevenue.com/servicio-galaxy/'],
        ],
    ],
    'servicio-universe' => [
        'title' => 'Servicio Universe | Consultoría Estratégica Premium | Cosmo Revenue',
        'desc' => 'El servicio Universe es nuestra consultoría premium. Transformación completa de tu operación de revenue con acompañamiento ejecutivo.',
        'canonical' => 'https://cosmorevenue.com/servicio-universe/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://cosmorevenue.com/'],
            ['name' => 'Servicios', 'url' => 'https://cosmorevenue.com/servicios/'],
            ['name' => 'Universe', 'url' => 'https://cosmorevenue.com/servicio-universe/'],
        ],
    ],
]);

PageManager::define('home', 'landing_render');
PageManager::define('servicios', 'services_render');
PageManager::define('casos', 'casos_render');
PageManager::define('about', 'about_render');
PageManager::define('contacto', 'contact_render');
PageManager::define('contructor', 'contructor');

// Paginas de servicios individuales
PageManager::define('servicio-comet', 'service_comet_render');
PageManager::define('servicio-nebula', 'service_nebula_render');
PageManager::define('servicio-quasar', 'service_quasar_render');
PageManager::define('servicio-orbit', 'service_orbit_render');
PageManager::define('servicio-galaxy', 'service_galaxy_render');
PageManager::define('servicio-universe', 'service_universe_render');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
