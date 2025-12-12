import {MessageSquare, Smartphone, Globe, Mic, Calendar, Database, Layout, Scissors, Utensils, Stethoscope} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {HeroSection, FaqWithCta, ContactForm, InternalLinks, CtaBlock, ScrollTabsShowcase} from '../components/sections';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../hooks/useSiteConfig';
// Componente de demo interactivo estilo ProcessWorkflow
import {DemoWorkflow} from '../features/demos/components/DemoWorkflow';
// Componente de features estilo AnalyticsSection
import {DemoFeaturesSection} from '../features/demos/components/DemoFeaturesSection';
// Componente de proceso con animaciones propias para demos
import {DemoProcessWorkflow} from '../features/demos/components/DemoProcessWorkflow';

// Links internos especificos para Demos
const demosInternalLinks = [
    {text: 'Ver servicios en detalle', href: '/servicios'},
    {text: 'Ver planes (primer mes gratis)', href: '/planes'},
    {text: 'Escríbeme por WhatsApp', href: '/contacto'},
    {text: 'Quién soy y cómo trabajo', href: '/sobre-mi'}
];

// --- FUNCION PARA CREAR CONTENIDO CON URLS DINAMICAS ---
const createDemosContent = (urls: ReturnType<typeof useSiteUrls>) => ({
    hero: {
        title: (
            <>
                Demo chatbot WhatsApp: <span className="text-info">pruébalo con tu caso</span>
            </>
        ),
        subtitle: 'Te enseño una demo real de chatbot en WhatsApp (y, si quieres, Instagram/web/voz) aplicada a tu negocio: atender mejor, resolver dudas y gestionar reservas.',
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: urls.calendly},
        secondaryCta: {text: 'WhatsApp', href: urls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'}
    },
    whatYouWillSee: {
        title: 'Qué verás en la demo',
        items: [
            {icon: MessageSquare, text: 'Conversaciones claras que atienden y derivan a humano cuando toca'},
            {icon: Calendar, text: 'Reservas con tu agenda y recordatorios'},
            {icon: Database, text: 'Avisos internos y etiquetas para seguimiento'},
            {icon: Layout, text: 'Integraciones (Calendly, Google Sheets, tu Software/CRM)'}
        ],
        ctaText: 'Agenda en 30 s',
        ctaHref: urls.calendly
    },
    channels: {
        title: (
            <>
                Elige tu <span className="text-info">demo</span>
            </>
        ),
        description: 'Cada canal tiene su propio flujo. Selecciona uno para ver como funciona el chatbot en ese entorno.',
        items: [
            {
                id: 'whatsapp',
                icon: MessageSquare,
                title: 'WhatsApp',
                badge: 'POPULAR',
                description: 'Mensajes utiles, derivacion a persona y seguimiento.'
            },
            {
                id: 'instagram',
                icon: Smartphone,
                title: 'Instagram DM',
                badge: 'VISUAL',
                description: 'Responde en Instagram y propone la reserva.'
            },
            {
                id: 'web',
                icon: Globe,
                title: 'Chatbot Web',
                badge: 'WIDGET',
                description: 'Widget visible, FAQs y pase a humano.'
            },
            {
                id: 'voicebot',
                icon: Mic,
                title: 'Voicebot',
                badge: 'VOZ',
                description: 'Atiende, clasifica y transfiere a agente.'
            }
        ]
    },
    sectors: {
        title: 'Demos por sector (ejemplos rápidos)',
        items: [
            {
                icon: Utensils,
                title: 'Demo chatbot WhatsApp para restaurantes',
                desc: 'Consulta de mesa, reserva y recordatorio.'
            },
            {
                icon: Scissors,
                title: 'Demo chatbot para barbería',
                desc: 'Citas, reprogramaciones y avisos internos.'
            },
            {
                icon: Stethoscope,
                title: 'Demo voicebot para fisioterapia',
                desc: 'Triado rápido, disponibilidad y pase a persona.'
            }
        ]
    },
    // Datos para ScrollTabsShowcase (3 secciones)
    scrollTabsSections: [
        {
            id: 'canales',
            label: 'Canales',
            badge: 'ELIGE TU DEMO',
            title: (
                <>
                    Elige tu <span className="text-info">demo</span>
                </>
            ),
            description: 'Cada canal tiene su propio flujo. Selecciona uno para ver como funciona el chatbot en ese entorno.'
        },
        {
            id: 'sectores',
            label: 'Por sector',
            badge: 'EJEMPLOS RAPIDOS',
            title: (
                <>
                    Demos por <span className="text-info">sector</span>
                </>
            ),
            description: 'Restaurantes, barberias, clinicas... cada sector tiene sus propios flujos y necesidades.'
        },
        {
            id: 'integraciones',
            label: 'Integraciones',
            badge: 'TU SOFTWARE',
            title: (
                <>
                    Integraciones con tu <span className="text-info">software</span>
                </>
            ),
            description: 'Tu agenda, tu CRM, Google Sheets, email... todo conectado y sincronizado automaticamente.'
        }
    ],

    faq: {
        title: 'FAQs (demo y casos)',
        items: [
            {question: '¿Prueba gratis chatbot WhatsApp?', answer: 'Sí. Preparo una demo gratuita con tu caso y vemos si encaja (además, el primer mes es gratis).'},
            {question: '¿Cómo solicitar demo chatbot para reservas?', answer: 'Reserva en el Calendario y dime tu agenda; preparo flujos con reglas de tu negocio y recordatorios.'},
            {question: '¿Puedo probar chatbot WhatsApp para citas?', answer: 'Sí. Propondrá franjas, confirmará y enviará recordatorios; puedes tomar el relevo cuando quieras.'},
            {question: '¿Demo integración WhatsApp con Calendly?', answer: 'Sí. Puedo leer/crear/actualizar citas y mandar recordatorios.'},
            {question: '¿Demo chatbot con Google Sheets?', answer: 'Sí. Desde guardar leads básicos hasta mapear columnas y validaciones.'},
            {question: '¿Casos de éxito chatbots?', answer: 'Te enseño ejemplos reales aplicados a tu sector (restaurantes, barberías, clínicas...) y qué impacto tuvieron.'}
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
export function DemosIsland(): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();
    // Crear contenido con URLs dinamicas
    const demosContent = createDemosContent(urls);

    return (
        <PageLayout headerCtaText="Agendar 1:1" topBanner={{text: 'Primer mes gratis - Prueba tu caso real', linkText: 'Agenda ahora', linkHref: urls.calendly}}>
            {/* 1. HERO SECTION */}
            <HeroSection title={demosContent.hero.title} subtitle={demosContent.hero.subtitle} primaryCta={demosContent.hero.primaryCta} secondaryCta={demosContent.hero.secondaryCta} tertiaryCta={demosContent.hero.tertiaryCta} />

            {/* 2. DEMO WORKFLOW INTERACTIVO - Estilo ProcessWorkflow con simulador WhatsApp */}
            <section id="demo-interactivo" className="py-16 bg-primary">
                <div className="mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-heading font-bold tracking-tight mb-4 text-primary">Prueba la demo en vivo</h2>
                        <p className="text-lg text-secondary max-w-2xl mx-auto">Selecciona un sector y observa como el chatbot gestiona la conversacion en tiempo real.</p>
                    </div>
                    <DemoWorkflow />
                </div>
            </section>

            {/* 3. QUE VERAS EN LA DEMO - Estilo AnalyticsSection */}
            <section id="que-veras" className="py-16">
                <div className="mx-auto">
                    <DemoFeaturesSection title={demosContent.whatYouWillSee.title} description="En cada demo veras como el chatbot gestiona conversaciones reales con tu flujo de negocio." items={demosContent.whatYouWillSee.items} ctaText={demosContent.whatYouWillSee.ctaText} ctaHref={demosContent.whatYouWillSee.ctaHref} />
                </div>
            </section>

            {/* 4. SCROLL TABS: CANALES + SECTORES + INTEGRACIONES */}
            <section id="demos-showcase" className="py-16">
                <div className="mx-auto">
                    <ScrollTabsShowcase sections={demosContent.scrollTabsSections} cta={{text: 'Agenda tu demo', href: urls.calendly}} />
                </div>
            </section>

            {/* 7. COMO LO HACEMOS - Con animaciones propias */}
            <section id="proceso-demos" className="py-16">
                <div className="mx-auto px-4">
                    <DemoProcessWorkflow />
                </div>
            </section>

            {/* 8. HABLAMOS? (CTAs) */}
            <CtaBlock id="cta-final" />

            {/* 9. FAQS */}
            <FaqWithCta title={demosContent.faq.title} items={demosContent.faq.items} />

            {/* 10. FORMULARIO CONTACTO */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rapido con respuesta hoy mismo" />

            {/* 11. INTERLINKING */}
            <InternalLinks title="Te puede interesar" links={demosInternalLinks} />
        </PageLayout>
    );
}
