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
        'skills'      => [
            ['titulo' => 'Responsive Design', 'descripcion' => 'Diseño adaptativo para que tu sitio se vea perfecto en cualquier dispositivo, mejorando la experiencia y el SEO.'],
            ['titulo' => 'Performance', 'descripcion' => 'Optimización de velocidad de carga para retener visitantes y mejorar posicionamiento en buscadores.'],
            ['titulo' => 'SEO On-page', 'descripcion' => 'Estructura semántica y meta tags optimizados para maximizar la visibilidad orgánica.'],
            ['titulo' => 'CMS Integration', 'descripcion' => 'Integración con WordPress u otros CMS para que gestiones tu contenido de forma autónoma.'],
        ],
    ],
    [
        'slugDefault' => 'desarrollo-apps',
        'titulo'      => 'Desarrollo de Aplicaciones',
        'contenido'   => 'Software a medida para optimizar tu negocio. Nuestras aplicaciones son escalables, seguras y centradas en el usuario. Transformamos tus ideas en herramientas digitales potentes, sean apps móviles o web.',
        'categorias'  => ['software'],
        'ctaTitulo'   => '¿Tienes una idea de app en mente?',
        'ctaDescripcion' => 'Convierte tu visión en un producto digital robusto y escalable con nuestro equipo.',
        'skills'      => [
            ['titulo' => 'React / React Native', 'descripcion' => 'Framework principal para apps web y móviles con rendimiento nativo y código compartido.'],
            ['titulo' => 'API Development', 'descripcion' => 'Diseño de APIs REST y GraphQL robustas para conectar frontend con backend de forma eficiente.'],
            ['titulo' => 'Cloud Architecture', 'descripcion' => 'Infraestructura en la nube escalable que crece con tu negocio sin interrupciones.'],
            ['titulo' => 'Testing & QA', 'descripcion' => 'Suite de tests automatizados para garantizar estabilidad y calidad en cada release.'],
        ],
    ],
    [
        'slugDefault' => 'agentes-ia',
        'titulo'      => 'Agentes de IA',
        'contenido'   => 'Asistentes inteligentes que revolucionan tu operación. Desde chatbots hasta análisis predictivo, integramos IA para mejorar la interacción con clientes y potenciar la eficiencia de tu negocio.',
        'categorias'  => ['ai', 'software'],
        'ctaTitulo'   => 'Automatiza tu negocio con IA',
        'ctaDescripcion' => 'Descubre cómo los agentes inteligentes pueden optimizar tus operaciones hoy mismo.',
        'skills'      => [
            ['titulo' => 'NLP / LLMs', 'descripcion' => 'Procesamiento de lenguaje natural con modelos avanzados para conversaciones fluidas y contextuales.'],
            ['titulo' => 'RAG Systems', 'descripcion' => 'Retrieval-Augmented Generation para respuestas precisas basadas en tu conocimiento empresarial.'],
            ['titulo' => 'Workflow Automation', 'descripcion' => 'Automatización de flujos complejos donde el agente toma decisiones inteligentes en cada paso.'],
            ['titulo' => 'Integration APIs', 'descripcion' => 'Conexión con tus herramientas existentes (CRM, ERP, email) para un ecosistema unificado.'],
        ],
    ],
    [
        'slugDefault' => 'branding',
        'titulo'      => 'Identidad de Marca',
        'contenido'   => 'Identidad visual coherente que comunica tu esencia. Desarrollamos logotipos y guías de estilo para asegurar que tu marca sea reconocible y transmita los valores correctos siempre.',
        'categorias'  => ['branding'],
        'ctaTitulo'   => 'Haz que tu marca sea inolvidable',
        'ctaDescripcion' => 'Construyamos una identidad visual que conecte emocionalmente con tu audiencia.',
        'skills'      => [
            ['titulo' => 'Logo Design', 'descripcion' => 'Creación de logotipos memorables que sintetizan la esencia de tu marca en una forma visual.'],
            ['titulo' => 'Brand Guidelines', 'descripcion' => 'Manual de marca completo con colores, tipografías, tono de voz y aplicaciones.'],
            ['titulo' => 'Visual Strategy', 'descripcion' => 'Estrategia visual coherente que diferencia tu marca en un mercado saturado.'],
            ['titulo' => 'Brand Audit', 'descripcion' => 'Análisis profundo de tu marca actual para identificar oportunidades de mejora y diferenciación.'],
        ],
    ],
    [
        'slugDefault' => 'ecommerce',
        'titulo'      => 'E-commerce',
        'contenido'   => 'Tiendas online optimizadas para vender. Nos enfocamos en experiencia de compra, seguridad y pagos, creando plataformas robustas y fáciles de gestionar para convertir visitantes en clientes.',
        'categorias'  => ['web', 'software'],
        'ctaTitulo'   => 'Vende más online',
        'ctaDescripcion' => 'Lanza una tienda online rápida, segura y diseñada para maximizar conversiones.',
        'skills'      => [
            ['titulo' => 'Payment Integration', 'descripcion' => 'Integración segura con Stripe, PayPal y otros procesadores para pagos sin fricción.'],
            ['titulo' => 'Conversion Optimization', 'descripcion' => 'Diseño de checkout y funnel optimizados para maximizar la tasa de conversión.'],
            ['titulo' => 'Inventory Management', 'descripcion' => 'Sistema de gestión de inventario en tiempo real conectado con tus proveedores.'],
            ['titulo' => 'Analytics & Tracking', 'descripcion' => 'Dashboard de métricas clave para tomar decisiones basadas en datos reales de ventas.'],
        ],
    ],
    [
        'slugDefault' => 'chatbots',
        'titulo'      => 'Chatbots Personalizados',
        'contenido'   => 'Bots conversacionales 24/7 que mejoran la atención. Entienden lenguaje natural, resuelven consultas frecuentes y guían a los usuarios, liberando a tu equipo para tareas estratégicas.',
        'categorias'  => ['ai'],
        'ctaTitulo'   => 'Mejora tu atención al cliente 24/7',
        'ctaDescripcion' => 'Implementa chatbots inteligentes que atiendan a tus usuarios en cualquier momento.',
        'skills'      => [
            ['titulo' => 'Conversational Design', 'descripcion' => 'Diseño de flujos conversacionales naturales que guían al usuario hacia su objetivo.'],
            ['titulo' => 'Multi-channel', 'descripcion' => 'Despliegue en web, WhatsApp, Telegram y redes sociales desde una sola plataforma.'],
            ['titulo' => 'Knowledge Base', 'descripcion' => 'Base de conocimiento entrenada con tu información para respuestas precisas y actualizadas.'],
            ['titulo' => 'Human Handoff', 'descripcion' => 'Escalación inteligente a agentes humanos cuando la consulta lo requiere.'],
        ],
    ],
    [
        'slugDefault' => 'ux-ui',
        'titulo'      => 'Diseño UX/UI',
        'contenido'   => 'Interfaces intuitivas centradas en el usuario. Investigación y prototipado para asegurar interacciones fluidas que mejoran la retención y fidelización de tus clientes en cada punto de contacto.',
        'categorias'  => ['web', 'software'],
        'ctaTitulo'   => 'Mejora la experiencia de tus usuarios',
        'ctaDescripcion' => 'Diseñamos interfaces que enamoran y retienen a tus clientes.',
        'skills'      => [
            ['titulo' => 'User Research', 'descripcion' => 'Investigación con usuarios reales para entender necesidades, frustraciones y oportunidades.'],
            ['titulo' => 'Wireframing', 'descripcion' => 'Prototipado de baja fidelidad para validar la arquitectura de información rápidamente.'],
            ['titulo' => 'Interaction Design', 'descripcion' => 'Diseño de micro-interacciones que hacen la experiencia fluida y memorable.'],
            ['titulo' => 'Usability Testing', 'descripcion' => 'Tests con usuarios para validar decisiones de diseño antes del desarrollo.'],
        ],
    ],
    [
        'slugDefault' => 'automatizacion',
        'titulo'      => 'Automatización de Procesos',
        'contenido'   => 'Elimina tareas repetitivas y optimiza flujos. Conectamos aplicaciones y creamos automatizaciones que ahorran tiempo y reducen errores, permitiéndote enfocarte en hacer crecer tu negocio.',
        'categorias'  => ['software', 'ai'],
        'ctaTitulo'   => 'Libérate de tareas repetitivas',
        'ctaDescripcion' => 'Optimiza tus flujos de trabajo con automatización inteligente.',
        'skills'      => [
            ['titulo' => 'Process Mapping', 'descripcion' => 'Mapeo detallado de tus procesos actuales para identificar puntos de automatización.'],
            ['titulo' => 'Integration', 'descripcion' => 'Conexión entre tus herramientas (Zapier, Make, APIs custom) para flujos sin fricción.'],
            ['titulo' => 'RPA', 'descripcion' => 'Automatización robótica de procesos para tareas repetitivas en interfaces legacy.'],
            ['titulo' => 'Monitoring', 'descripcion' => 'Dashboard de monitoreo en tiempo real para asegurar que las automatizaciones funcionan correctamente.'],
        ],
    ],
    [
        'slugDefault' => 'consultoria',
        'titulo'      => 'Consultoría Digital',
        'contenido'   => 'Estrategia para tu transformación digital. Analizamos tu situación, identificamos oportunidades y trazamos un plan claro para adoptar tecnologías que te ayuden a alcanzar tus objetivos.',
        'categorias'  => ['branding'],
        'ctaTitulo'   => 'Define tu hoja de ruta digital',
        'ctaDescripcion' => 'Agenda una sesión para trazar la estrategia tecnológica de tu crecimiento.',
        'skills'      => [
            ['titulo' => 'Digital Strategy', 'descripcion' => 'Planificación estratégica para adoptar tecnología alineada con tus objetivos de negocio.'],
            ['titulo' => 'Tech Stack Advisory', 'descripcion' => 'Recomendación de herramientas y tecnologías óptimas para tu caso específico.'],
            ['titulo' => 'Growth Planning', 'descripcion' => 'Plan de crecimiento digital con métricas, hitos y roadmap ejecutable.'],
            ['titulo' => 'Team Training', 'descripcion' => 'Capacitación a tu equipo para adoptar nuevas herramientas y procesos digitales.'],
        ],
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
        'extracto' => $servicio['contenido'],
        'imagenDestacadaAsset' => $imgRef,
        'metaEntrada' => [
            'precio_desde' => '$' . rand(500, 5000),
            'categorias'   => $servicio['categorias'] ?? [],
            'cta_titulo'   => $servicio['ctaTitulo'] ?? '',
            'cta_descripcion' => $servicio['ctaDescripcion'] ?? '',
            'skills' => $servicio['skills'] ?? [],
        ]
    ]);
}

DefaultContentManager::define('servicio', $definicionesServicios);

/* =====================================================
 * PROYECTOS (Portfolio / Showcase)
 * ===================================================== */

$poolShowcase = AssetsUtility::listImagesForAliasWithMinSize('showcase', 100 * 1024);
if (empty($poolShowcase)) {
    $poolShowcase = AssetsUtility::listImagesForAlias('showcase');
}
if (empty($poolShowcase)) {
    $poolShowcase = $poolImagenes;
}
shuffle($poolShowcase);

$proyectosBase = [
    [
        'slugDefault' => 'aureva',
        'titulo'      => 'AUREVA',
        'contenido'   => 'Diseño de marca e identidad visual para Aureva, una firma de diseño de interiores de lujo. El proyecto abarcó branding completo, diseño web y una guía de estilo que refleja la elegancia y sofisticación de la marca.',
        'categorias'  => ['branding', 'web'],
        'cliente'     => 'Luxury Interior Design',
        'skills'      => ['Branding', 'Web Design', 'UI/UX', 'Photography Direction'],
    ],
    [
        'slugDefault' => 'venture',
        'titulo'      => 'VENTURE',
        'contenido'   => 'Producto digital completo para Venture, una plataforma de inversiones. Diseño de la interfaz, experiencia de usuario y el sistema de diseño que permite escalar el producto rápidamente.',
        'categorias'  => ['web', 'app'],
        'cliente'     => 'Digital Product Design',
        'skills'      => ['Product Design', 'Design System', 'Prototyping', 'User Research'],
    ],
    [
        'slugDefault' => 'payby',
        'titulo'      => 'PAYBY',
        'contenido'   => 'Aplicación móvil de banca para PayBy, una fintech emergente. Diseño centrado en simplicidad y confianza, con flujos de pago intuitivos y una experiencia segura para el usuario final.',
        'categorias'  => ['app', 'web'],
        'cliente'     => 'Banking Mobile App',
        'skills'      => ['App Design', 'Fintech', 'Motion Design', 'Accessibility'],
    ],
    [
        'slugDefault' => 'kinetic',
        'titulo'      => 'KINETIC',
        'contenido'   => 'Estrategia de marca e identidad para Kinetic, un startup de vehículos eléctricos. Desarrollamos una identidad que transmite innovación, velocidad y sostenibilidad desde el primer contacto.',
        'categorias'  => ['branding'],
        'cliente'     => 'EV Startup',
        'skills'      => ['Strategy', 'Identity', 'Brand Guidelines', 'Copywriting'],
    ],
    [
        'slugDefault' => 'lumos',
        'titulo'      => 'LUMOS',
        'contenido'   => 'Diseño integral para Lumos, marca de iluminación inteligente. Incluyó packaging, diseño web y una campaña de lanzamiento que posicionó la marca en el mercado premium.',
        'categorias'  => ['branding', 'web'],
        'cliente'     => 'Smart Lighting',
        'skills'      => ['Packaging', 'Web Design', 'Campaign', 'Visual Identity'],
    ],
    [
        'slugDefault' => 'elevate',
        'titulo'      => 'ELEVATE',
        'contenido'   => 'Campaña digital y gestión de redes sociales para Elevate, una marca de fitness premium. Creamos contenido visual cohesivo que aumentó el engagement un 340% en 3 meses.',
        'categorias'  => ['branding', 'ai'],
        'cliente'     => 'Fitness Brand',
        'skills'      => ['Social Media', 'Campaign', 'Content Strategy', 'Analytics'],
    ],
];

$definicionesProyectos = [];
$totalShowcase = count($poolShowcase);

foreach ($proyectosBase as $index => $proyecto) {
    $imgRef = '';
    if ($totalShowcase > 0) {
        $img = $poolShowcase[$index % $totalShowcase];
        $imgRef = 'showcase::' . $img;
    } elseif ($totalImagenes > 0) {
        $img = $poolImagenes[$index % $totalImagenes];
        $imgRef = 'colors::' . $img;
    }

    $definicionesProyectos[] = array_merge($proyecto, [
        'extracto' => mb_substr($proyecto['contenido'], 0, 160),
        'imagenDestacadaAsset' => $imgRef,
        'metaEntrada' => [
            'categorias' => $proyecto['categorias'] ?? [],
            'cliente'    => $proyecto['cliente'] ?? '',
            'skills'     => $proyecto['skills'] ?? [],
        ]
    ]);
}

DefaultContentManager::define('proyecto', $definicionesProyectos);

/* =====================================================
 * TESTIMONIOS
 * ===================================================== */

$testimoniosBase = [
    [
        'slugDefault' => 'rory-codrington',
        'titulo'      => 'Rory Codrington',
        'contenido'   => 'I would highly, highly recommend Nakomi. They took our often naively lofty aspirations for our new website, creative visuals, and brand touch up and overdelivered on all of them.',
        'metaEntrada' => [
            'cargo'   => 'CEO, Trust Keith',
            'avatar'  => 'https://i.pravatar.cc/150?u=rory',
            'rating'  => 5,
        ]
    ],
    [
        'slugDefault' => 'naz-malik',
        'titulo'      => 'Naz Malik',
        'contenido'   => 'Nakomi is a fantastic quality designer. His communication is top notch, making him a breeze to work with. We worked together on onfolk.com and have confidence that the result will help us.',
        'metaEntrada' => [
            'cargo'   => 'Founder, Onfolk',
            'avatar'  => 'https://i.pravatar.cc/150?u=naz',
            'rating'  => 5,
        ]
    ],
    [
        'slugDefault' => 'alex-smith',
        'titulo'      => 'Alex Smith',
        'contenido'   => "It's a 10/10 experience working with the team. They bring a deep understanding of early stage startups and used that to our advantage to create a brand that punched way above its weight.",
        'metaEntrada' => [
            'cargo'   => 'CTO, TechStart',
            'avatar'  => 'https://i.pravatar.cc/150?u=alex',
            'rating'  => 5,
        ]
    ],
    [
        'slugDefault' => 'sarah-johnson',
        'titulo'      => 'Sarah Johnson',
        'contenido'   => 'The attention to detail and creative solutions provided were outstanding. Our clear choice for any future design work.',
        'metaEntrada' => [
            'cargo'   => 'Product Lead, Innovate',
            'avatar'  => 'https://i.pravatar.cc/150?u=sarah',
            'rating'  => 5,
        ]
    ],
];

DefaultContentManager::define('testimonio', $testimoniosBase);

/* =====================================================
 * MARCAS / CLIENTES
 * ===================================================== */

$marcasBase = [
    [
        'slugDefault' => 'trust-keith',
        'titulo'      => 'Trust Keith',
        'contenido'   => 'Empresa de consultoría y confianza digital.',
        'metaEntrada' => [
            'url'  => 'https://trustkeith.com',
            'logo' => 'logos::adidas.svg',
        ]
    ],
    [
        'slugDefault' => 'onfolk',
        'titulo'      => 'Onfolk',
        'contenido'   => 'Plataforma de gestión de nóminas moderna.',
        'metaEntrada' => [
            'url'  => 'https://onfolk.com',
            'logo' => 'logos::slack.svg',
        ]
    ],
    [
        'slugDefault' => 'techstart',
        'titulo'      => 'TechStart',
        'contenido'   => 'Aceleradora de startups tecnológicas.',
        'metaEntrada' => [
            'url'  => 'https://techstart.com',
            'logo' => 'logos::gitlab.svg',
        ]
    ],
    [
        'slugDefault' => 'innovate',
        'titulo'      => 'Innovate',
        'contenido'   => 'Consultora de innovación y diseño de producto.',
        'metaEntrada' => [
            'url'  => 'https://innovate.io',
            'logo' => 'logos::dropbox.svg',
        ]
    ],
    [
        'slugDefault' => 'playzone',
        'titulo'      => 'PlayZone',
        'contenido'   => 'Entretenimiento y gaming digital.',
        'metaEntrada' => [
            'url'  => 'https://playzone.com',
            'logo' => 'logos::playstation.svg',
        ]
    ],
    [
        'slugDefault' => 'visualdev',
        'titulo'      => 'VisualDev',
        'contenido'   => 'Herramientas de desarrollo visual.',
        'metaEntrada' => [
            'url'  => 'https://visualdev.io',
            'logo' => 'logos::visual-studio.svg',
        ]
    ],
    [
        'slugDefault' => 'sportline',
        'titulo'      => 'SportLine',
        'contenido'   => 'Equipamiento deportivo premium.',
        'metaEntrada' => [
            'url'  => 'https://sportline.com',
            'logo' => 'logos::head.svg',
        ]
    ],
    [
        'slugDefault' => 'dribblex',
        'titulo'      => 'DribbleX',
        'contenido'   => 'Comunidad de diseñadores creativos.',
        'metaEntrada' => [
            'url'  => 'https://dribblex.com',
            'logo' => 'logos::dribble.svg',
        ]
    ],
    [
        'slugDefault' => 'crown-sports',
        'titulo'      => 'Crown Sports',
        'contenido'   => 'Marca deportiva de alto rendimiento.',
        'metaEntrada' => [
            'url'  => 'https://crownsports.com',
            'logo' => 'logos::black-crown.svg',
        ]
    ],
    [
        'slugDefault' => 'vibora-tech',
        'titulo'      => 'Vibora Tech',
        'contenido'   => 'Tecnología de punta para deportes.',
        'metaEntrada' => [
            'url'  => 'https://viboratech.com',
            'logo' => 'logos::vibor-a.svg',
        ]
    ],
    [
        'slugDefault' => 'nox-digital',
        'titulo'      => 'Nox Digital',
        'contenido'   => 'Agencia digital de marketing.',
        'metaEntrada' => [
            'url'  => 'https://noxdigital.com',
            'logo' => 'logos::nox.svg',
        ]
    ],
    [
        'slugDefault' => 'wilson-brand',
        'titulo'      => 'Wilson Brand',
        'contenido'   => 'Marca global de artículos deportivos.',
        'metaEntrada' => [
            'url'  => 'https://wilsonbrand.com',
            'logo' => 'logos::wilson.svg',
        ]
    ],
];

DefaultContentManager::define('marca', $marcasBase);

/* =====================================================
 * MIEMBROS DEL EQUIPO
 * ===================================================== */

$miembrosBase = [
    [
        'slugDefault' => 'carlos-nakomi',
        'titulo'      => 'Carlos Nakomi',
        'contenido'   => 'Fundador y director creativo con más de 10 años de experiencia en diseño digital y desarrollo de software. Apasionado por la intersección entre estética y tecnología.',
        'metaEntrada' => [
            'cargo'    => 'CEO & Director Creativo',
            'avatar'   => 'https://i.pravatar.cc/300?u=carlos',
            'linkedin' => '#',
            'twitter'  => '#',
        ]
    ],
    [
        'slugDefault' => 'maria-design',
        'titulo'      => 'María López',
        'contenido'   => 'Diseñadora UX/UI senior especializada en sistemas de diseño y accesibilidad. Lidera los proyectos de experiencia de usuario garantizando interfaces intuitivas.',
        'metaEntrada' => [
            'cargo'    => 'Lead UX/UI Designer',
            'avatar'   => 'https://i.pravatar.cc/300?u=maria',
            'linkedin' => '#',
            'twitter'  => '#',
        ]
    ],
    [
        'slugDefault' => 'andres-dev',
        'titulo'      => 'Andrés Rivero',
        'contenido'   => 'Ingeniero de software full-stack con expertise en React, TypeScript y arquitecturas serverless. Construye las soluciones técnicas que dan vida a los diseños.',
        'metaEntrada' => [
            'cargo'    => 'Lead Software Engineer',
            'avatar'   => 'https://i.pravatar.cc/300?u=andres',
            'linkedin' => '#',
            'github'   => '#',
        ]
    ],
    [
        'slugDefault' => 'lucia-ai',
        'titulo'      => 'Lucía Fernández',
        'contenido'   => 'Especialista en inteligencia artificial y machine learning. Diseña e implementa los agentes de IA y chatbots que potencian los proyectos del estudio.',
        'metaEntrada' => [
            'cargo'    => 'AI & ML Engineer',
            'avatar'   => 'https://i.pravatar.cc/300?u=lucia',
            'linkedin' => '#',
            'github'   => '#',
        ]
    ],
];

DefaultContentManager::define('miembro', $miembrosBase);
