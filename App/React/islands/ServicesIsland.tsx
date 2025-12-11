import {Smartphone, Globe, Mic, Calendar, Database, Workflow, Zap, MessageSquare} from 'lucide-react';

// Componentes UI reutilizables
import {Button, FeatureCard} from '../components/ui';

// Layout compartido
import {PageLayout} from '../components/layout';

// Componentes de seccion reutilizables
import {WhatsAppShowcase, AutomationFlow, FaqWithCta, ProcessTimeline} from '../components/sections';

// Configuracion centralizada
import {siteUrls} from '../config';

// --- CONFIGURACION DE CONTENIDO ESPECIFICO DE SERVICES ---
const servicesContent = {
    hero: {
        badge: 'Disponible para nuevos proyectos',
        title: (
            <>
                Servicios de automatizacion y chatbots, <span style={{color: 'var(--color-text-subtle)'}}>trabajando 1:1 contigo.</span>
            </>
        ),
        description: 'Diseno, implanto y mantengo la tecnologia que tu empresa necesita para atender mejor y vender mas. Sin intermediarios, directo al grano.'
    },
    whatsapp: {
        badge: 'CANAL PRINCIPAL',
        title: 'WhatsApp Business API',
        features: [
            {title: 'Flujo de conversacion util', desc: 'Preguntas claras, botones rapidos y logica condicional. Nada de bucles infinitos que frustran al cliente.'},
            {title: 'Derivacion a humano (Handoff)', desc: 'Si el bot no sabe, te avisa. Entras al chat con todo el contexto anterior visible. Cero friccion.'},
            {title: 'RGPD y Permisos', desc: 'Gestion automatica de Opt-in/Opt-out para que cumplas la ley sin pensarlo.'}
        ]
    },
    multichannel: {
        title: 'Mas alla de WhatsApp',
        subtitle: 'Misma inteligencia, diferentes puntos de contacto.',
        cards: [
            {
                icon: Smartphone,
                title: 'Instagram DM',
                badge: 'META API',
                description: 'Responde a stories y menciones automaticamente. Ideal para captar leads que reaccionan a tu contenido visual.'
            },
            {
                icon: Globe,
                title: 'Web Chatbot',
                badge: 'WIDGET',
                description: 'Un asistente en tu web que sabe que pagina esta mirando el cliente. FAQs transaccionales y captura de leads.'
            },
            {
                icon: Mic,
                title: 'Voicebot (Llamadas)',
                badge: 'IA VOZ',
                description: 'Atiende el telefono 24/7. Clasifica la urgencia, responde dudas simples o transfiere a un agente si es critico.'
            }
        ]
    },
    automation: {
        badge: 'BACKEND & LOGIC',
        title: (
            <>
                Automatizacion de procesos <br />
                <span style={{color: 'var(--color-text-muted)'}}>Make & n8n</span>
            </>
        ),
        description: 'No es solo responder chats. Es conectar tu negocio. Cuando un cliente reserva, el bot actualiza tu agenda, envia un email de confirmacion y crea el contacto en tu CRM. Sin que toques nada.',
        features: [
            {icon: Calendar, label: 'Sync Agenda'},
            {icon: Database, label: 'CRM Update'},
            {icon: Workflow, label: 'Avisos Internos'},
            {icon: Zap, label: 'Pagos Stripe'}
        ]
    },
    process: {
        title: 'Como trabajo contigo',
        steps: [
            {title: '1. Llamada breve (15 min)', desc: 'Sin compromiso. Me cuentas tu situacion y vemos si te puedo ayudar.'},
            {title: '2. Prototipo en 72h', desc: 'No te vendo humo. Te enseno un flujo real con tus datos para que decidas.'},
            {title: '3. Integracion y Lanzamiento', desc: 'Conecto el bot a tu web, agenda y CRM. Todo listo para funcionar.'},
            {title: '4. Mejora Continua', desc: 'Mes a mes reviso las conversaciones y optimizo las respuestas para vender mas.'}
        ]
    },
    faq: {
        title: 'Preguntas Frecuentes',
        items: [
            {question: 'Trabajas con cualquier web o CRM?', answer: 'Si. Me adapto a tu web actual (WordPress, Shopify, etc.) y a tu Software (HubSpot, Zoho, Salesforce). Si no tienes CRM, empezamos con una hoja de calculo compartida.'},
            {question: 'El bot incluye inteligencia artificial real?', answer: 'Si. Utilizamos modelos LLM (como GPT-4) entrenados con tus datos para que las respuestas sean naturales, no roboticas. Nada de "pulsa 1 para ventas".'},
            {question: 'Que pasa si el bot no sabe la respuesta?', answer: 'El sistema detecta la duda y deriva la conversacion a un humano (a ti o a tu equipo) enviando una alerta por WhatsApp o email con el resumen de la charla.'}
        ]
    }
};

// --- ISLAND PRINCIPAL ---
export function ServicesIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Agendar 1:1">
            {/* 1. HERO SECTION */}
            <section id="hero-section" className="mx-auto w-full max-w-7xl">
                <div id="hero-content" className="max-w-3xl">
                    <div id="hero-badge" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium mb-6 border" style={{backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-primary)'}}>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {servicesContent.hero.badge}
                    </div>
                    <h1 id="hero-title" className="text-4xl md:text-6xl font-semibold tracking-tighter text-balance mb-6" style={{color: 'var(--color-text-primary)'}}>
                        {servicesContent.hero.title}
                    </h1>
                    <p id="hero-description" className="text-lg md:text-xl leading-relaxed max-w-2xl font-light" style={{color: 'var(--color-text-muted)'}}>
                        {servicesContent.hero.description}
                    </p>

                    <div id="hero-actions" className="flex flex-col sm:flex-row gap-4 mt-8">
                        <Button href={siteUrls.calendly} icon={Calendar}>
                            Agendar consultoria (30 min)
                        </Button>
                        <Button href="#whatsapp" variant="outline" icon={MessageSquare}>
                            Ver solucion WhatsApp
                        </Button>
                    </div>
                </div>
            </section>

            {/* 2. WHATSAPP BUSINESS (FEATURE DESTACADA) */}
            <WhatsAppShowcase badge={servicesContent.whatsapp.badge} title={servicesContent.whatsapp.title} features={servicesContent.whatsapp.features} />

            {/* 3. MULTICANAL (GRID DE TARJETAS) */}
            <section id="multichannel-section" className="mx-auto w-full max-w-7xl">
                <div className="mb-8">
                    <h2 className="text-2xl font-medium tracking-tight" style={{color: 'var(--color-text-primary)'}}>
                        {servicesContent.multichannel.title}
                    </h2>
                    <p className="text-sm mt-2" style={{color: 'var(--color-text-muted)'}}>
                        {servicesContent.multichannel.subtitle}
                    </p>
                </div>
                <div id="multichannel-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {servicesContent.multichannel.cards.map((card, idx) => (
                        <FeatureCard key={idx} icon={card.icon} title={card.title} badge={card.badge} description={card.description} />
                    ))}
                </div>
            </section>

            {/* 4. AUTOMATIZACION (VISUAL FLOW) */}
            <AutomationFlow badge={servicesContent.automation.badge} title={servicesContent.automation.title} description={servicesContent.automation.description} features={servicesContent.automation.features} />

            {/* 5. PROCESO DE TRABAJO (TIMELINE) */}
            <ProcessTimeline title={servicesContent.process.title} steps={servicesContent.process.steps} />

            {/* 6. FAQS & CTA FINAL */}
            <FaqWithCta title={servicesContent.faq.title} items={servicesContent.faq.items} />
        </PageLayout>
    );
}
