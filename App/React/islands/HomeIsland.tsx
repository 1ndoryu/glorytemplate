import {useState} from 'react';
import {MessageSquare, Calendar, Database, Zap, ShieldCheck, Activity, GitBranch, Layers, Search} from 'lucide-react';

// Layout compartido
import {PageLayout} from '../components/layout';

// Componentes de seccion reutilizables
import {HeroSection, GridCards, QuoteSection, ProcessWorkflow, BentoGrid, FeatureSection} from '../components/sections';

// Configuracion centralizada
import {siteUrls} from '../config';

// --- CONFIGURACION DE CONTENIDO ESPECIFICO DE HOME ---
const homeContent = {
    topBanner: {
        text: 'Primer mes gratis - Respuesta en menos de 30 min (09-21h)',
        linkText: 'Agenda ahora',
        linkHref: siteUrls.calendly
    },
    hero: {
        title: (
            <>
                Chatbot para empresas que atiende a tus clientes <span style={{color: 'var(--color-text-subtle)'}}>24/7 y gestiona reservas</span>
            </>
        ),
        subtitle: 'Soy Guillermo. Creo el chatbot para tu empresa en tu web y en WhatsApp Business para que atiendas mas rapido a tus clientes. Trabajamos tu y yo, 1:1, con respuesta en menos de 30 min (09-21h), primer mes gratis y mantenimiento continuo.',
        primaryCta: {text: 'Hablame ahora', href: siteUrls.calendly},
        secondaryCta: {text: 'WhatsApp', href: siteUrls.whatsapp}
    },
    processWorkflow: {
        steps: [{label: 'Llamada'}, {label: 'Prototipo 72h'}, {label: 'Lanzamiento'}, {label: 'Mejora continua'}],
        simulations: [
            {badge: 'CONECTANDO', title: 'Llamada breve de 15-20 min', subtitle: 'Me cuentas tu situacion y objetivos'},
            {badge: 'DISENANDO', title: 'Prototipo en 72 horas', subtitle: 'Flujo real: dudas + datos + propuesta de reserva'},
            {badge: 'INTEGRANDO', title: 'Integracion y lanzamiento', subtitle: 'Conecto con tu web, agenda y CRM'},
            {badge: 'OPTIMIZANDO', title: 'Mejora continua mensual', subtitle: 'Reviso conversaciones y optimizo respuestas'}
        ]
    },
    features: [
        {icon: Zap, title: 'Mas oportunidades en menos horas', description: 'Respuestas en segundos, 24/7. Tu chatbot atiende cuando tu no puedes.'},
        {icon: Calendar, title: 'Reservas directas', description: 'El bot propone dia/hora y confirma por email/WhatsApp. Sin llamadas, sin esperas.'},
        {icon: Database, title: 'Menos tareas repetitivas', description: 'Envia los datos al Software/CRM que uses. Si no tienes, empezamos con hoja compartida.'},
        {icon: MessageSquare, title: 'Mejor experiencia', description: 'Conversacion con tono cuidado y, cuando haga falta, dejo paso a ti o tu equipo con todo el historial.'}
    ],
    gridCards: [
        {icon: MessageSquare, title: 'WhatsApp Business', description: 'Detecto, clasifico y doy seguimiento. Derivacion humana sin perder contexto.'},
        {icon: Activity, title: 'Automatizacion pymes', description: 'Formularios a CRM, flujos con tu web y agenda, FAQs transaccionales.'},
        {icon: Layers, title: 'Integraciones', description: 'Tu web, WhatsApp, Instagram, Google Calendar, HubSpot, Zoho y mas.'},
        {icon: ShieldCheck, title: 'RGPD y permisos', description: 'Incluyo opt-in/opt-out y aviso de privacidad. Todo en regla.'},
        {icon: Search, title: 'Medimos lo importante', description: 'Clics en WhatsApp, citas creadas, formularios enviados. Analytics real.'},
        {icon: GitBranch, title: 'Trabajo 1:1 contigo', description: 'Llamada breve, prototipo en 72h, mejora continua cada mes.'}
    ]
};

// --- COMPONENTE PRINCIPAL ---
export function HomeIsland(): JSX.Element {
    const [activeTab, setActiveTab] = useState('whatsapp');

    return (
        <PageLayout headerCtaText="Hablame ahora" topBanner={homeContent.topBanner} mainClassName="flex-1 flex flex-col justify-start gap-12 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION */}
            <div id="hero">
                <HeroSection title={homeContent.hero.title} subtitle={homeContent.hero.subtitle} primaryCta={homeContent.hero.primaryCta} secondaryCta={homeContent.hero.secondaryCta} />
            </div>

            {/* 2. PROCESS WORKFLOW - Indicadores + Simulacion Visual */}
            <ProcessWorkflow steps={homeContent.processWorkflow.steps} simulations={homeContent.processWorkflow.simulations} />

            {/* 3. BENTO GRID - Tabs de Servicios */}
            <BentoGrid activeTab={activeTab} onTabChange={setActiveTab} />

            {/* 4. FEATURE SECTION - Mockup visual + lista de beneficios */}
            <FeatureSection features={homeContent.features} />

            {/* 5. QUOTE - Propuesta de valor diferenciadora */}
            <div id="quote">
                <QuoteSection>
                    Trabajo <span style={{color: 'var(--color-text-primary)'}}>contigo, sin intermediarios</span>. Llamada breve, prototipo en 72h y <span style={{color: 'var(--color-text-primary)'}}>mejora continua</span> cada mes.
                </QuoteSection>
            </div>

            {/* 6. GRID CARDS - Servicios principales */}
            <div id="grid-servicios">
                <GridCards title="Todo lo que necesitas para automatizar" subtitle="WhatsApp, automatizacion, integraciones y RGPD. Trabajo 1:1 contigo." cards={homeContent.gridCards} />
            </div>
        </PageLayout>
    );
}
