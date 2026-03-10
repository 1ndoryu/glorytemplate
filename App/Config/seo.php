<?php

/**
 * App SEO Configuration
 *
 * Configuracion de SEO para Kamples:
 * - Registro de resolvers dinamicos (sample, perfil, coleccion)
 * - Defaults de SEO por pagina estatica
 * - Registro de proveedores de sitemap
 *
 * Se carga durante el boot de la app (incluirArchivos('App/')).
 */

use Glory\Seo\DynamicSeoResolver;
use Glory\Manager\PageManager;
use App\Kamples\Services\SeoKamples;
use App\Kamples\Services\SeoSitemapProvider;

/*
 * RESOLVERS DINAMICOS
 * Cada resolver se ejecuta en hook `wp` cuando la ruta
 * coincide con el prefijo registrado.
 */

DynamicSeoResolver::registerResolver('sample', [SeoKamples::class, 'resolverSample']);
DynamicSeoResolver::registerResolver('perfil', [SeoKamples::class, 'resolverPerfil']);
DynamicSeoResolver::registerResolver('coleccion', [SeoKamples::class, 'resolverColeccion']);

/*
 * SEO DEFAULTS — PAGINAS ESTATICAS
 * title, desc, robots para paginas que no son dinamicas.
 */

PageManager::setDefaultSeoMap([
    'home' => [
        'title' => 'Kamples - Samples y Loops Gratuitos para Produccion Musical',
        'desc'  => 'Descubre miles de samples, loops y one-shots gratuitos. Descarga WAV de alta calidad para tu produccion musical. Algoritmo de descubrimiento IA personalizado.',
        'faq'   => [
            [
                'q' => 'Es gratis descargar samples en Kamples?',
                'a' => 'Si, Kamples ofrece un plan gratuito con 5 descargas diarias en formato WAV. Tambien hay planes Pro ($5/mes) y Premium ($19.99/mes) con mas descargas y mejores condiciones de monetizacion.',
            ],
            [
                'q' => 'Puedo usar los samples en mis producciones comerciales?',
                'a' => 'Si, todos los samples descargados de Kamples incluyen licencia libre para uso en producciones musicales, incluyendo uso comercial. Cada sample tiene su propia licencia visible en la pagina de detalle.',
            ],
            [
                'q' => 'Como funciona la monetizacion para creadores?',
                'a' => 'Los creadores reciben un porcentaje de los ingresos generados por sus samples. El split varia segun el plan: 50/50 (Free), 70/30 (Pro) y 80/20 (Premium) a favor del creador.',
            ],
            [
                'q' => 'Que formatos de audio soporta Kamples?',
                'a' => 'Kamples soporta archivos WAV de alta calidad. Las descargas siempre son en formato WAV original sin compresion. Los previews de escucha usan MP3 optimizado.',
            ],
        ],
    ],
    'descubrir' => [
        'title' => 'Descubrir Samples - Algoritmo IA | Kamples',
        'desc'  => 'Encuentra samples perfectos para tu proyecto. Nuestro algoritmo de IA analiza tu estilo y te recomienda loops, one-shots y efectos personalizados.',
    ],
    'comunidad' => [
        'title' => 'Comunidad de Productores Musicales | Kamples',
        'desc'  => 'Conecta con productores musicales. Comparte tu trabajo, descubre nuevos artistas y colabora en la comunidad de Kamples.',
    ],
    'planes' => [
        'title' => 'Planes y Precios - Free, Pro y Premium | Kamples',
        'desc'  => 'Descarga samples gratis o hazte Pro. Desde 0 hasta $19.99/mes. WAV de alta calidad, monetizacion para creadores, descargas ilimitadas.',
        'faq'   => [
            [
                'q' => 'Cual es la diferencia entre los planes?',
                'a' => 'Free ofrece 5 descargas/dia con split 50/50. Pro ($5/mes) sube a 50 descargas/dia con split 70/30. Premium ($19.99/mes) tiene descargas ilimitadas con split 80/20.',
            ],
            [
                'q' => 'Puedo cancelar en cualquier momento?',
                'a' => 'Si, todos los planes de suscripcion se pueden cancelar en cualquier momento sin penalizacion. Tu plan permanece activo hasta el final del ciclo de facturacion.',
            ],
            [
                'q' => 'Que metodos de pago aceptan?',
                'a' => 'Aceptamos tarjetas de credito y debito (Visa, Mastercard, American Express) a traves de Stripe, la plataforma de pagos mas segura del mundo.',
            ],
        ],
    ],
    'auth/registro' => [
        'title' => 'Crear Cuenta Gratis | Kamples',
        'desc'  => 'Crea tu cuenta gratuita en Kamples. Descarga samples WAV, sube tu musica y monetiza tu trabajo como productor musical.',
    ],

    /* Paginas que NO deben indexarse */
    'libreria' => [
        'title'  => 'Mi Libreria de Samples | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'favoritos' => [
        'title'  => 'Mis Favoritos | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'descargas' => [
        'title'  => 'Mis Descargas | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'mensajes' => [
        'title'  => 'Mensajes | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'auth/login' => [
        'title'  => 'Iniciar Sesion | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'perfil/editar' => [
        'title'  => 'Editar Perfil | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'admin/dashboard' => [
        'title'  => 'Dashboard Creador | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'admin/panel' => [
        'title'  => 'Panel Admin | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'componentes' => [
        'title'  => 'Componentes Dev | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'dev/componentes' => [
        'title'  => 'Componentes Dev | Kamples',
        'robots' => 'noindex,nofollow',
    ],
    'reproductor' => [
        'title'  => 'Reproductor | Kamples',
        'robots' => 'noindex,nofollow',
    ],
]);

/*
 * SITEMAP
 * Registra proveedores de sitemap para contenido dinamico
 */

SeoSitemapProvider::register();
