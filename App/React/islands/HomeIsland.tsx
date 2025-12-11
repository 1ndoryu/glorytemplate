import {MessageSquare, Calendar, Database, Zap, FileText, Workflow, HelpCircle, MousePointer, ClipboardCheck} from 'lucide-react';

// Layout compartido
import {PageLayout} from '../components/layout';

// Componentes de seccion reutilizables
import {HeroSection, QuoteSection, ProcessWorkflow, FeatureSection, ContactForm, InternalLinks, homeInternalLinks, WhatsAppShowcase, AutomationFlow, IntegrationsSection, AnalyticsSection} from '../components/sections';

// Configuracion centralizada
import {siteUrls} from '../config';

// --- CONFIGURACION DE CONTENIDO ESPECIFICO DE HOME ---
// Textos exactos segun project-extends.md para SEO optimizado
const homeContent = {
    topBanner: {
        text: 'Primer mes gratis - Respuesta en menos de 30 min (09-21h)',
        linkText: 'Agenda ahora',
        linkHref: siteUrls.calendly
    },
    hero: {
        // H1 exacto segun project-extends.md
        title: (
            <>
                Chatbot para empresas que atiende a tus clientes <span className="text-subtle">24/7 y gestiona reservas</span>
            </>
        ),
        // Subhero segun project-extends.md
        subtitle: 'Soy Guillermo. Creo el chatbot para tu empresa en tu web y en WhatsApp Business para que atiendas mas rapido a tus clientes. Trabajamos tu y yo, 1:1, con respuesta en menos de 30 min (09-21h), primer mes gratis y mantenimiento continuo.',
        // CTAs en orden: Calendario > WhatsApp > Formulario (project-extends.md)
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min', href: siteUrls.calendly},
        secondaryCta: {text: 'WhatsApp', href: siteUrls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'}
    },
    // Seccion "Lo que voy a conseguir contigo" (project-extends.md) - 4 beneficios exactos
    features: [
        {icon: Zap, title: 'Mas oportunidades en menos horas', description: 'Respuestas en segundos, 24/7.'},
        {icon: Calendar, title: 'Reservas directas', description: 'El bot propone dia/hora y confirma por email/WhatsApp.'},
        {icon: Database, title: 'Menos tareas repetitivas', description: 'Envia los datos al Software/CRM que uses.'},
        {icon: MessageSquare, title: 'Mejor experiencia', description: 'Conversacion con tono cuidado y, cuando haga falta, dejo paso a ti o tu equipo, con todo el historial a mano.'}
    ],
    // Seccion "WhatsApp Business" (project-extends.md) - 3 H3 exactos
    whatsAppFeatures: [
        {title: 'Detecto, clasifico y doy seguimiento', desc: 'El bot pide lo necesario (nombre, interes, urgencia, etc), etiqueta la oportunidad y te avisa para que entres cuando quieras.'},
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
    integrations: ['Tu web actual (sea cual sea)', 'WhatsApp Business', 'Instagram', 'Tu agenda (Google Calendar, Outlook, ...)', 'Tu Software/CRM (ERP, facturacion, HubSpot, Zoho...)', 'Email y avisos internos para que no se escape nada', 'Si no tienes CRM, empezamos con una hoja compartida.', 'Automatización (Make/n8n)'],
    // Seccion "Medimos lo importante" (project-extends.md) - Lista exacta
    analytics: [
        {icon: MousePointer, text: 'Clic en WhatsApp (click_whatsapp)'},
        {icon: Calendar, text: 'Cita creada (schedule_calendly)'},
        {icon: ClipboardCheck, text: 'Formulario enviado (lead_form_submit)'}
    ]
};

// --- COMPONENTE PRINCIPAL ---
export function HomeIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Hablame ahora" topBanner={homeContent.topBanner} mainClassName="flex-1 flex flex-col justify-start gap-16 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION - Con 3 CTAs segun project-extends.md */}
            <div id="hero">
                <HeroSection title={homeContent.hero.title} subtitle={homeContent.hero.subtitle} primaryCta={homeContent.hero.primaryCta} secondaryCta={homeContent.hero.secondaryCta} tertiaryCta={homeContent.hero.tertiaryCta} />
            </div>

            {/* 3. WHATSAPP SHOWCASE - "WhatsApp Business" (H2 + 3 H3) segun project-extends.md */}
            <WhatsAppShowcase badge="CANAL PRINCIPAL" title="WhatsApp Business" features={homeContent.whatsAppFeatures} ctaText="Hablame ahora y respondo en menos de 30 min (09-21h)" ctaHref={siteUrls.whatsapp} />

            {/* 4. AUTOMATION FLOW - "Automatizacion de procesos pymes" (H2 + descripcion) */}
            <AutomationFlow
                badge="PYMES"
                title={
                    <>
                        Automatizacion de <span className="text-info">procesos pymes</span>
                    </>
                }
                description="Todo lo que el bot recoge (contacto, interes, canal preferido, origen/UTM, etc) va directo a tu Software/CRM. Si lo prefieres, te preparo una hoja compartida. Integro el chatbot con tu web y agenda. Confirmaciones y recordatorios automaticos."
                features={homeContent.automationFeatures}
            />

            {/* 5. PROCESS WORKFLOW - "Trabajo contigo, sin intermediarios" (H2 + 3 H3) */}
            <section id="proceso" className="mx-auto w-full max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-8 text-primary">Trabajo contigo, sin intermediarios</h2>
                <ProcessWorkflow steps={homeContent.processWorkflow.steps} simulations={homeContent.processWorkflow.simulations} />
            </section>

            {/* 6. INTEGRACIONES - Lista clara segun project-extends.md */}
            <IntegrationsSection title="Integraciones" items={homeContent.integrations} />

            {/* 7. MEDIMOS LO IMPORTANTE - Lista clara segun project-extends.md */}
            <AnalyticsSection title="Medimos lo importante" description="Vas a ver quien te escribe, quien reserva y desde donde llegan. Configuro tres cosas clave:" metrics={homeContent.analytics} footerText="Ademas registro: fecha, pagina, origen/UTM, y consentimiento para poder mejorar." />

            {/* 8. QUOTE - Propuesta de valor diferenciadora */}
            <div id="quote">
                <QuoteSection>
                    Trabajo <span className="text-primary">contigo, sin intermediarios</span>. Llamada breve, prototipo en 72h y <span className="text-primary">mejora continua</span> cada mes.
                </QuoteSection>
            </div>

            {/* MOVED: 2. FEATURE SECTION - "Lo que voy a conseguir contigo" (Ahora al final) */}
            <FeatureSection features={homeContent.features} />

            {/* 9. CONTACT FORM - "Si prefieres escribirme ahora" (project-extends.md) */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rapido con respuesta hoy mismo" />

            {/* 10. INTERNAL LINKS - Interlinking SEO antes del footer (project-extends.md) */}
            <InternalLinks title="Te puede interesar" links={homeInternalLinks} />
        </PageLayout>
    );
}
