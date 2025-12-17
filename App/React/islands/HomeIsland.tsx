import {MessageSquare, Calendar, Database, Zap, FileText, Workflow, HelpCircle, MousePointer, ClipboardCheck, Globe, Instagram, Mail, FileSpreadsheet} from 'lucide-react';
import {FeatureCard} from '../components/ui';

// Layout compartido
import {PageLayout} from '../components/layout';

// Componentes de seccion reutilizables
import {HeroSection, QuoteSection, ProcessWorkflow, FeatureSection, ContactForm, InternalLinks, homeInternalLinks, WhatsAppShowcase, AutomationFlow, AnalyticsSection, CtaBlock} from '../components/sections';

// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../hooks/useSiteConfig';
// Utilidad para optimizar imagenes (WebP/CDN)
import {getBackgroundImageUrl} from '../utils/imageOptimizer';

// --- CONFIGURACION DE CONTENIDO ESPECIFICO DE HOME ---
// Textos exactos segun project-extends.md para SEO optimizado
const homeContent = {
    hero: {
        // H1 exacto segun project-extends.md
        title: (
            <>
                Chatbot para empresas que atiende a tus clientes <span className="text-info">24/7 y gestiona reservas</span>
            </>
        ),
        // Subhero segun project-extends.md
        subtitle: 'Soy Guillermo. Creo el chatbot para tu empresa en tu web y en WhatsApp Business para que atiendas más rápido a tus clientes. Trabajamos tú y yo, 1:1, con respuesta en menos de 30 min (09-21h), primer mes gratis y mantenimiento continuo.'
    },
    // Seccion "Lo que voy a conseguir contigo" (project-extends.md) - 4 beneficios exactos
    features: [
        {icon: Zap, title: 'Más oportunidades en menos horas', description: 'Respuestas en segundos, 24/7.'},
        {icon: Calendar, title: 'Reservas directas', description: 'El bot propone dia/hora y confirma por email/WhatsApp.'},
        {icon: Database, title: 'Menos tareas repetitivas', description: 'Envia los datos al Software/CRM que uses.'},
        {icon: MessageSquare, title: 'Mejor experiencia', description: 'Conversacion con tono cuidado y, cuando haga falta, dejo paso a ti o tu equipo, con todo el historial a mano.'}
    ],
    // Seccion "WhatsApp Business" (project-extends.md) - 3 H3 exactos
    whatsAppFeatures: [
        {title: 'Detecto, clasifico y doy seguimiento', desc: 'El bot pide lo necesario (nombre, interés, urgencia, etc), etiqueta la oportunidad y te avisa para que entres cuando quieras.'},
        {title: 'Derivacion humana sin perder contexto', desc: 'Si el tema lo requiere, dejo paso a ti o a tu equipo, con todo el historial a mano.'},
        {title: 'Permisos claros y RGPD', desc: 'Incluyo opt-in/opt-out y aviso de privacidad.'}
    ],
    // Seccion "Automatizacion de procesos pymes" (project-extends.md) - 3 H3 exactos
    automationFeatures: [
        {icon: FileText, label: 'Formularios a CRM'},
        {icon: Workflow, label: 'Flujos web y agenda'},
        {icon: HelpCircle, label: 'FAQs transaccionales'},
        {icon: Calendar, label: 'Recordatorios'}
    ],
    // Seccion "Trabajo contigo, sin intermediarios" (project-extends.md) - 3 H3 exactos
    // NOTA: ProcessWorkflow requiere 4 simulations para coincidir con sus 4 visualizaciones internas
    processWorkflow: {
        steps: [{label: 'Llamada'}, {label: 'Prototipo 72h'}, {label: 'Lanzamiento'}, {label: 'Mejora continua'}],
        simulations: [
            {badge: 'PASO 1', title: 'Llamada breve (15-20 min)', subtitle: 'Me cuentas tu situacion y objetivos.'},
            {badge: 'PASO 2', title: 'Prototipo en 72 h', subtitle: 'Te enseno un flujo real (preguntas frecuentes + datos de contacto + propuesta de cita) para decidir juntos.'},
            {badge: 'PASO 3', title: 'Integracion y lanzamiento', subtitle: 'Conecto con tu web, tu agenda y tu Software/CRM.'},
            {badge: 'PASO 4', title: 'Mejora continua', subtitle: 'Reviso conversaciones y optimizo respuestas y conversiones cada mes.'}
        ]
    },
    // Seccion "Integraciones" (project-extends.md) - Lista exacta
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
    // Seccion "Medimos lo importante" (project-extends.md) - Lista exacta
    analytics: [
        {icon: MousePointer, text: 'Clic en WhatsApp (click_whatsapp)'},
        {icon: Calendar, text: 'Cita creada (schedule_calendly)'},
        {icon: ClipboardCheck, text: 'Formulario enviado (lead_form_submit)'}
    ]
};

// --- COMPONENTE PRINCIPAL ---
export function HomeIsland(): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();

    // Contenido con URLs dinamicas
    const topBanner = {
        text: 'Primer mes gratis - Respuesta en menos de 30 min (09-21h)',
        linkText: 'Agenda ahora',
        linkHref: urls.calendly
    };

    const heroCtAs = {
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min', href: urls.calendly},
        secondaryCta: {text: 'WhatsApp', href: urls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'}
    };

    return (
        <PageLayout headerCtaText="Hablame ahora" topBanner={topBanner} mainClassName="flex-1 flex flex-col justify-start gap-16 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION - Con 3 CTAs segun project-extends.md */}
            <div id="hero">
                <HeroSection title={homeContent.hero.title} subtitle={homeContent.hero.subtitle} primaryCta={heroCtAs.primaryCta} secondaryCta={heroCtAs.secondaryCta} tertiaryCta={heroCtAs.tertiaryCta} />
            </div>

            {/* 2. FEATURE SECTION - "Lo que voy a conseguir contigo" (4 beneficios) segun project-extends.md */}
            <FeatureSection features={homeContent.features} backgroundImage={getBackgroundImageUrl('316d9c253af59840f793c2d6d6d2f15b.jpg')} />

            {/* 3. WHATSAPP SHOWCASE - "WhatsApp Business" (H2 + 3 H3) segun project-extends.md */}
            <WhatsAppShowcase badge="CANAL PRINCIPAL" title="WhatsApp Business" features={homeContent.whatsAppFeatures} ctaText="Hablame ahora y respondo en menos de 30 min (09-21h)" ctaHref={urls.whatsapp} backgroundImage={getBackgroundImageUrl('e0157b5927a898a9e9df9d988b27fafc.jpg')} />

            {/* 4. AUTOMATION FLOW - "Automatizacion de procesos pymes" (H2 + descripcion) */}
            <AutomationFlow
                badge="PYMES"
                title={
                    <>
                        Automatizacion de <span className="text-info">procesos pymes</span>
                    </>
                }
                description="Todo lo que el bot recoge (contacto, interés, canal preferido, origen/UTM, etc) va directo a tu Software/CRM. Si lo prefieres, te preparo una hoja compartida. Integro el chatbot con tu web y agenda. Confirmaciones y recordatorios automáticos."
                features={homeContent.automationFeatures}
            />

            {/* 5. PROCESS WORKFLOW - "Trabajo contigo, sin intermediarios" (H2 + 3 H3) */}
            <section id="proceso" className="mx-auto w-full max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-8 text-primary">Trabajo contigo, sin intermediarios</h2>
                <ProcessWorkflow steps={homeContent.processWorkflow.steps} simulations={homeContent.processWorkflow.simulations} backgroundImage={getBackgroundImageUrl('7edd0f69949fcb2662528c5af952b6a2.jpg')} />
            </section>

            {/* CTA INTERMEDIO - Bloque de conversion despues del proceso (FASE 5.2) */}
            <CtaBlock id="cta-proceso" />

            {/* 6. INTEGRACIONES - Mismo estilo que en Servicios */}
            <section id="integrations-section" className="mx-auto w-full max-w-7xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-4 text-primary">Integraciones con tu software</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {homeContent.integrations.map((card, idx) => (
                        <FeatureCard key={idx} icon={card.icon} title={card.title} badge={card.badge} description={card.description} />
                    ))}
                </div>
            </section>

            {/* 7. MEDIMOS LO IMPORTANTE - Lista clara segun project-extends.md */}
            <AnalyticsSection title="Medimos lo importante" description="Vas a ver quién te escribe, quién reserva y desde dónde llegan. Configuro tres cosas clave:" metrics={homeContent.analytics} footerText="Además registro: fecha, página, origen/UTM, y consentimiento para poder mejorar." backgroundImage={getBackgroundImageUrl('f0ac5f498b5d6a0cfaac8caa87cb7f00.jpg')} />

            {/* 8. QUOTE - Propuesta de valor diferenciadora */}
            <div id="quote">
                <QuoteSection>
                    Trabajo <span className="text-primary">contigo, sin intermediarios</span>. Llamada breve, prototipo en 72h y <span className="text-primary">mejora continua</span> cada mes.
                </QuoteSection>
            </div>

            {/* 9. CONTACT FORM - "Si prefieres escribirme ahora" (project-extends.md) */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rápido con respuesta hoy mismo" />

            {/* 10. INTERNAL LINKS - Interlinking SEO antes del footer (project-extends.md) */}
            <InternalLinks title="Te puede interesar" links={homeInternalLinks} />
        </PageLayout>
    );
}
