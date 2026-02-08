<?php

use Glory\Manager\DefaultContentManager;
use Glory\Utility\AssetsUtility;

// Obtener imagenes de alta resolucion (min 200KB) para asegurar calidad
$poolImagenes = AssetsUtility::listImagesForAliasWithMinSize('colors', 200 * 1024);
if (empty($poolImagenes)) {
    $poolImagenes = AssetsUtility::listImagesForAlias('colors');
}

// Aleatorizar para variedad
shuffle($poolImagenes);

$serviciosBase = [
    [
        'slugDefault' => 'diseno-web',
        'titulo'      => 'Diseño de Sitios Web',
        'contenido'   => 'Sitios web únicos que destacan tu marca. Combinamos estética y funcionalidad para que tu presencia digital convierta visitantes en clientes. Desde landing pages hasta sitios corporativos, diseñamos a medida.',
        'categorias'  => ['web', 'branding'],
        'ctaTitulo'   => '¿Listo para renovar tu presencia digital?',
        'ctaDescripcion' => 'Hablemos sobre cómo un diseño web estratégico puede transformar tu negocio.',
    ],
    [
        'slugDefault' => 'desarrollo-apps',
        'titulo'      => 'Desarrollo de Aplicaciones',
        'contenido'   => 'Software a medida para optimizar tu negocio. Nuestras aplicaciones son escalables, seguras y centradas en el usuario. Transformamos tus ideas en herramientas digitales potentes, sean apps móviles o web.',
        'categorias'  => ['software'],
        'ctaTitulo'   => '¿Tienes una idea de app en mente?',
        'ctaDescripcion' => 'Convierte tu visión en un producto digital robusto y escalable con nuestro equipo.',
    ],
    [
        'slugDefault' => 'agentes-ia',
        'titulo'      => 'Agentes de IA',
        'contenido'   => 'Asistentes inteligentes que revolucionan tu operación. Desde chatbots hasta análisis predictivo, integramos IA para mejorar la interacción con clientes y potenciar la eficiencia de tu negocio.',
        'categorias'  => ['ai', 'software'],
        'ctaTitulo'   => 'Automatiza tu negocio con IA',
        'ctaDescripcion' => 'Descubre cómo los agentes inteligentes pueden optimizar tus operaciones hoy mismo.',
    ],
    [
        'slugDefault' => 'branding',
        'titulo'      => 'Identidad de Marca',
        'contenido'   => 'Identidad visual coherente que comunica tu esencia. Desarrollamos logotipos y guías de estilo para asegurar que tu marca sea reconocible y transmita los valores correctos siempre.',
        'categorias'  => ['branding'],
        'ctaTitulo'   => 'Haz que tu marca sea inolvidable',
        'ctaDescripcion' => 'Construyamos una identidad visual que conecte emocionalmente con tu audiencia.',
    ],
    [
        'slugDefault' => 'ecommerce',
        'titulo'      => 'E-commerce',
        'contenido'   => 'Tiendas online optimizadas para vender. Nos enfocamos en experiencia de compra, seguridad y pagos, creando plataformas robustas y fáciles de gestionar para convertir visitantes en clientes.',
        'categorias'  => ['web', 'software'],
        'ctaTitulo'   => 'Vende más online',
        'ctaDescripcion' => 'Lanza una tienda online rápida, segura y diseñada para maximizar conversiones.',
    ],
    [
        'slugDefault' => 'chatbots',
        'titulo'      => 'Chatbots Personalizados',
        'contenido'   => 'Bots conversacionales 24/7 que mejoran la atención. Entienden lenguaje natural, resuelven consultas frecuentes y guían a los usuarios, liberando a tu equipo para tareas estratégicas.',
        'categorias'  => ['ai'],
        'ctaTitulo'   => 'Mejora tu atención al cliente 24/7',
        'ctaDescripcion' => 'Implementa chatbots inteligentes que atiendan a tus usuarios en cualquier momento.',
    ],
    [
        'slugDefault' => 'ux-ui',
        'titulo'      => 'Diseño UX/UI',
        'contenido'   => 'Interfaces intuitivas centradas en el usuario. Investigación y prototipado para asegurar interacciones fluidas que mejoran la retención y fidelización de tus clientes en cada punto de contacto.',
        'categorias'  => ['web', 'software'],
        'ctaTitulo'   => 'Mejora la experiencia de tus usuarios',
        'ctaDescripcion' => 'Diseñamos interfaces que enamoran y retienen a tus clientes.',
    ],
    [
        'slugDefault' => 'automatizacion',
        'titulo'      => 'Automatización de Procesos',
        'contenido'   => 'Elimina tareas repetitivas y optimiza flujos. Conectamos aplicaciones y creamos automatizaciones que ahorran tiempo y reducen errores, permitiéndote enfocarte en hacer crecer tu negocio.',
        'categorias'  => ['software', 'ai'],
        'ctaTitulo'   => 'Libérate de tareas repetitivas',
        'ctaDescripcion' => 'Optimiza tus flujos de trabajo con automatización inteligente.',
    ],
    [
        'slugDefault' => 'consultoria',
        'titulo'      => 'Consultoría Digital',
        'contenido'   => 'Estrategia para tu transformación digital. Analizamos tu situación, identificamos oportunidades y trazamos un plan claro para adoptar tecnologías que te ayuden a alcanzar tus objetivos.',
        'categorias'  => ['branding'],
        'ctaTitulo'   => 'Define tu hoja de ruta digital',
        'ctaDescripcion' => 'Agenda una sesión para trazar la estrategia tecnológica de tu crecimiento.',
    ],
];

$definicionesServicios = [];
$totalImagenes = count($poolImagenes);

foreach ($serviciosBase as $index => $servicio) {
    // Asignacion ciclica de imagenes del pool
    $imgRef = '';
    if ($totalImagenes > 0) {
        $img = $poolImagenes[$index % $totalImagenes];
        $imgRef = 'colors::' . $img;
    }

    $definicionesServicios[] = array_merge($servicio, [
        'extracto' => $servicio['contenido'], // Usamos el contenido extendido como extracto por ahora
        'imagenDestacadaAsset' => $imgRef,
        'metaEntrada' => [
            'precio_desde' => '$' . rand(500, 5000), // Precio aleatorio como ejemplo meta
            'categorias'   => $servicio['categorias'] ?? [],
            'cta_titulo'   => $servicio['ctaTitulo'] ?? '',
            'cta_descripcion' => $servicio['ctaDescripcion'] ?? '',
        ]
    ]);
}

DefaultContentManager::define('servicio', $definicionesServicios);
