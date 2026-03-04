<?php

/**
 * Cresta Campers — Configuración de páginas
 * 
 * Todas las páginas se definen como React Islands con SPA navigation.
 * El framework crea automáticamente las páginas en WordPress y registra
 * las rutas en __GLORY_ROUTES__ para navegación cliente.
 */

use Glory\Manager\PageManager;

PageManager::setDefaultContentMode('code');

/* PAGINAS PUBLICAS */

// Página principal — Hero, catálogo destacado, cómo funciona
PageManager::reactPage('home', 'HomeIsland');

// Catálogo de vehículos — Grid con filtros y ordenación
// También actúa como contenedor para rutas dinámicas /flota/{slug}
PageManager::reactPage('flota', 'FlotaIsland');
PageManager::registrarRutaDinamica('flota');

// Proceso de reserva — Multistep: vehículo → fechas → datos → pago
PageManager::reactPage('reservar', 'ReservarIsland');

// Confirmación post-pago — Detalle de reserva verificado por email
PageManager::reactPage('confirmacion', 'ConfirmacionIsland');

// Contacto — Formulario + info empresa
PageManager::reactPage('contacto', 'ContactoIsland');

// Sobre nosotros — Misión, valores, CTA
PageManager::reactPage('sobre-nosotros', 'SobreNosotrosIsland');

/* PAGINAS LEGALES */

PageManager::reactPage('condiciones', 'CondicionesIsland');
PageManager::reactPage('privacidad', 'PrivacidadIsland');
PageManager::reactPage('aviso-legal', 'AvisoLegalIsland');
PageManager::reactPage('cookies', 'CookiesIsland');

/* SEO DEFAULTS */

PageManager::setDefaultSeoMap([
    'home' => [
        'title' => 'Cresta Campers — Alquiler de Camper Vans en Barcelona',
        'desc'  => 'Alquila tu camper van equipada y recorre España a tu ritmo. Recogida en Barcelona. Reserva online con confirmación inmediata.',
    ],
    'flota' => [
        'title' => 'Nuestra Flota — Camper Vans de Alquiler | Cresta Campers',
        'desc'  => 'Descubre nuestras camper vans totalmente equipadas. Cocina, cama, ducha y todo lo que necesitas para tu aventura.',
    ],
    'reservar' => [
        'title' => 'Reservar Camper Van — Cresta Campers',
        'desc'  => 'Reserva tu camper van en pocos pasos. Elige fechas, vehículo y paga de forma segura con Stripe.',
    ],
    'confirmacion' => [
        'title' => 'Confirmación de Reserva — Cresta Campers',
        'desc'  => 'Tu reserva ha sido confirmada. Consulta los detalles y prepárate para tu aventura.',
    ],
    'contacto' => [
        'title' => 'Contacto — Cresta Campers',
        'desc'  => 'Escríbenos para resolver cualquier duda sobre el alquiler de camper vans. Estamos en Barcelona.',
    ],
    'sobre-nosotros' => [
        'title' => 'Sobre Nosotros — Cresta Campers',
        'desc'  => 'Conoce al equipo de Cresta Campers. Nuestra misión es hacer el vanlife accesible para todos.',
    ],
    'condiciones' => [
        'title' => 'Condiciones de Alquiler — Cresta Campers',
        'desc'  => 'Consulta las condiciones generales de alquiler de camper vans de Cresta Campers.',
    ],
    'privacidad' => [
        'title' => 'Política de Privacidad — Cresta Campers',
        'desc'  => 'Información sobre el tratamiento de tus datos personales en Cresta Campers.',
    ],
    'aviso-legal' => [
        'title' => 'Aviso Legal — Cresta Campers',
        'desc'  => 'Información legal y datos identificativos de Cresta Campers.',
    ],
    'cookies' => [
        'title' => 'Política de Cookies — Cresta Campers',
        'desc'  => 'Información sobre el uso de cookies en crestacampers.com.',
    ],
]);