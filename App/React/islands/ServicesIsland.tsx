import {Smartphone, Globe, Mic, Calendar, Database, Zap, Phone, MessageSquare, Instagram, Mail, FileSpreadsheet, Workflow} from 'lucide-react';
import {FeatureCard} from '../components/ui';
import {PageLayout} from '../components/layout';
import {WhatsAppShowcase, AutomationFlow, FaqWithCta, ProcessTimeline, HeroSection, InternalLinks, ContactForm} from '../components/sections';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../hooks/useSiteConfig';
// Utilidad para optimizar imagenes (WebP/CDN)
import {getBackgroundImageUrl} from '../utils/imageOptimizer';

// Links internos especificos para Servicios
const servicesInternalLinks = [
    {text: 'Mira planes y precios', href: '/planes'},
    {text: 'Ver demos por canal', href: '/demos'},
    {text: 'Contacto para presupuesto', href: '/contacto'},
    {text: 'Saber más sobre mí', href: '/sobre-mi'}
];

// --- FUNCION PARA CREAR CONTENIDO CON URLS DINAMICAS ---
const createServicesContent = (urls: ReturnType<typeof useSiteUrls>) => ({
    hero: {
        title: (
            <>
                Servicios de chatbots y automatizacion <span className="text-info">para empresas, conmigo 1:1</span>
            </>
        ),
        subtitle: 'Diseño, implanto y mantengo chatbot WhatsApp, Instagram y tu web, además de voicebots (llamadas). Trabajo contigo, de tú a tú, para que atiendas mejor, resuelvas dudas y, cuando toca, gestiones reservas sin cargar a tu equipo. Respuesta en menos de 30 min (09–21h), primer mes gratis y mantenimiento continuo.',
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: urls.calendly},
        secondaryCta: {text: 'WhatsApp', href: urls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'}
    },
    whatsapp: {
        badge: 'PILAR PRINCIPAL',
        title: 'WhatsApp Business',
        features: [
            {title: 'Flujo de conversación útil', desc: 'Preguntas claras (nombre, motivo, urgencia), etiquetas de interés y mensajes que ayudan de verdad.'},
            {title: 'Derivación a humano + avisos', desc: 'Cuando conviene, entras tú o tu equipo con el historial a mano.'},
            {title: 'Permisos y cumplimiento', desc: 'Incluyo opt-in/opt-out y aviso de privacidad.'},
            {title: 'API de WhatsApp Business', desc: 'Te acompaño en el alta con proveedor oficial cuando aporta (plantillas y escalado).'}
        ],
        ctaText: 'Hablame ahora y respondo en menos de 30 min (09-21h)',
        ctaHref: urls.calendly
    },
    multichannel: {
        title: 'Instagram y Web (UChat multicanal)',
        cards: [
            {
                icon: Smartphone,
                title: 'Instagram DM',
                badge: 'META',
                description: 'Respondo en tus mensajes de IG, derivo a persona y, si encaja, lanzo reserva.'
            },
            {
                icon: Globe,
                title: 'Chatbot en tu web',
                badge: 'WIDGET',
                description: 'Widget visible, FAQs transaccionales y derivación a humano.'
            },
            {
                icon: Database,
                title: 'Una sola base de conocimiento',
                badge: 'SYNC',
                description: 'Mismo tono y respuestas en todos los canales.'
            }
        ]
    },
    voice: {
        title: 'Voz (llamadas) cuando prefieren hablar',
        cards: [
            {
                icon: Mic,
                title: 'Voicebot que atiende y clasifica',
                badge: 'AI VOZ',
                description: 'Saluda, entiende el motivo y dirige la llamada.'
            },
            {
                icon: Phone,
                title: 'Pase a agente',
                badge: 'TRANSFER',
                description: 'Transfiere a persona cuando lo pide el caso o el cliente.'
            },
            {
                icon: Calendar,
                title: 'Horarios y mensajes',
                badge: 'CONFIG',
                description: 'Horarios, festivos y buzón bien configurados.'
            }
        ]
    },
    automation: {
        badge: 'MAKE & N8N',
        title: (
            <>
                Automatización de <span className="text-info">reservas y tareas</span>
            </>
        ),
        description: 'No es solo responder chats. Es conectar tu negocio. Cuando un cliente reserva, el bot actualiza tu agenda, envia un email de confirmacion y crea el contacto en tu CRM. Sin que toques nada.',
        features: [
            {icon: Calendar, label: 'Recordatorios'}, // Mapeado de 'Recordatorios y confirmaciones' - El componente features recibe iconos+label, no H3 completo. Ajustaré esto.
            {icon: Database, label: 'Volcado de datos'},
            {icon: Zap, label: 'Etiquetas y avisos'}
            // El doc tiene 3 H3. AutomationFlow usa lista de features simples.
        ]
    },
    integrations: [
        {
            icon: Globe,
            title: 'Tu web actual',
            badge: 'WEB',
            description: 'Sea cual sea (WordPress, Shopify, a medida...).'
        },
        {
            icon: MessageSquare,
            title: 'WhatsApp Business',
            badge: 'META',
            description: 'Canal principal. Respuesta 24/7 y seguimiento.'
        },
        {
            icon: Instagram,
            title: 'Instagram',
            badge: 'SOCIAL',
            description: 'Respondo en mensajes y cazo oportunidades.'
        },
        {
            icon: Calendar,
            title: 'Tu agenda',
            badge: 'SYNC',
            description: 'Google Calendar, Outlook, iCloud...'
        },
        {
            icon: Database,
            title: 'Tu Software/CRM',
            badge: 'DATA',
            description: 'ERP, facturación, HubSpot, Zoho...'
        },
        {
            icon: Mail,
            title: 'Email y avisos',
            badge: 'NOTIFY',
            description: 'Notificaciones internas para que no se escape nada.'
        },
        {
            icon: FileSpreadsheet,
            title: '¿Sin CRM?',
            badge: 'START',
            description: 'Empezamos con una hoja compartida.'
        },
        {
            icon: Workflow,
            title: 'Automatización',
            badge: 'AUTO',
            description: 'Make/n8n para conectar todo entre sí.'
        }
    ],
    process: {
        title: 'Proceso de trabajo (simple y sin jerga)',
        steps: [
            {title: '1. Llamada breve (15-20 min)', desc: 'Fijamos objetivos y 2-3 casos iniciales.'},
            {title: '2. Prototipo en 72 h', desc: 'Flujo real: dudas + datos + (si aplica) reserva.'},
            {title: '3. Integración y lanzamiento', desc: 'Conecto con tu web, tu agenda y tu Software/CRM.'},
            {title: '4. Mejora continua', desc: 'Reviso conversaciones y optimizo respuestas/conversión cada mes.'}
        ]
    },
    faq: {
        title: 'Preguntas Frecuentes',
        items: [
            {question: '¿Trabajas con cualquier web o CRM?', answer: 'Sí. Me adapto a tu web actual y a tu Software/CRM. Si no tienes, empezamos con hoja compartida.'},
            {question: '¿Solo WhatsApp o también Instagram y web?', answer: 'También Instagram DM y tu web, con la misma base de respuestas.'},
            {question: '¿Automatizas reservas por WhatsApp/Instagram?', answer: 'Sí: propuestas de franjas, confirmaciones y recordatorios. Uso tu agenda; si ya usas Calendly, también lo integro.'},
            {question: '¿Precio del servicio?', answer: 'Depende de los casos de uso y canales (WhatsApp/IG/Web/Voz). Primer mes gratis para verlo en marcha y ajustar.'},
            {question: '¿Incluye mantenimiento?', answer: 'Sí. Revisión de conversaciones, mejoras en respuestas y soporte continuo.'}
        ],
        ctaTitle: '¿Hablamos?',
        ctaItems: [
            {text: 'Agenda en 30 s', href: urls.calendly, variant: 'primary'},
            {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: urls.whatsapp, variant: 'outline'},
            {text: 'Te leo y te respondo hoy', href: '#formulario', variant: 'ghost'}
        ]
    }
});

// --- ISLAND PRINCIPAL ---
export function ServicesIsland(): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();
    // Crear contenido con URLs dinamicas
    const servicesContent = createServicesContent(urls);

    return (
        <PageLayout headerCtaText="Agendar 1:1" topBanner={{text: 'Primer mes gratis - Respuesta en menos de 30 min', linkText: 'Agenda ahora', linkHref: urls.calendly}}>
            {/* 1. HERO SECTION */}
            <HeroSection title={servicesContent.hero.title} subtitle={servicesContent.hero.subtitle} primaryCta={servicesContent.hero.primaryCta} secondaryCta={servicesContent.hero.secondaryCta} tertiaryCta={servicesContent.hero.tertiaryCta} />

            {/* 2. WHATSAPP BUSINESS */}
            <WhatsAppShowcase badge={servicesContent.whatsapp.badge} title={servicesContent.whatsapp.title} features={servicesContent.whatsapp.features} ctaText={servicesContent.whatsapp.ctaText} ctaHref={servicesContent.whatsapp.ctaHref} backgroundImage={getBackgroundImageUrl('bc2241ad92399a7545184ea5856f3fc6.jpg')} />

            {/* 3. MULTICANAL (Instagram y Web) */}
            <section id="multichannel-section" className="mx-auto w-full max-w-7xl py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-4 text-primary">{servicesContent.multichannel.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {servicesContent.multichannel.cards.map((card, idx) => (
                        <FeatureCard key={idx} icon={card.icon} title={card.title} badge={card.badge} description={card.description} />
                    ))}
                </div>
            </section>

            {/* 4. VOZ (Llamadas) */}
            <section id="voice-section" className="mx-auto w-full max-w-7xl py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-4 text-primary">{servicesContent.voice.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {servicesContent.voice.cards.map((card, idx) => (
                        <FeatureCard key={idx} icon={card.icon} title={card.title} badge={card.badge} description={card.description} />
                    ))}
                </div>
            </section>

            {/* 5. AUTOMATIZACION */}
            <AutomationFlow badge={servicesContent.automation.badge} title={servicesContent.automation.title} description={servicesContent.automation.description} features={servicesContent.automation.features} cta={{text: 'Agenda en 30 s', href: urls.calendly}} />

            {/* 6. INTEGRACIONES */}
            <section id="integrations-section" className="mx-auto w-full max-w-7xl py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-4 text-primary">Integraciones con tu software</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {servicesContent.integrations.map((card, idx) => (
                        <FeatureCard key={idx} icon={card.icon} title={card.title} badge={card.badge} description={card.description} />
                    ))}
                </div>
            </section>

            {/* 7. PROCESO DE TRABAJO */}
            <ProcessTimeline title={servicesContent.process.title} steps={servicesContent.process.steps} />

            {/* 9. FAQS */}
            <FaqWithCta title={servicesContent.faq.title} items={servicesContent.faq.items} />

            {/* 10. FORMULARIO CONTACTO */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rápido con respuesta hoy mismo" />

            {/* 11. INTERLINKING */}
            <InternalLinks title="Te puede interesar" links={servicesInternalLinks} />
        </PageLayout>
    );
}
