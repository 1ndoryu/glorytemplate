import {motion} from 'framer-motion';
import {MessageSquare, Smartphone, Globe, Mic, Workflow, Database, Calendar, Check, Zap} from 'lucide-react';

import {useTheme} from '../hooks/useTheme';
import {useFontLoader, fontFamilyByTheme} from '../hooks/useFontLoader';

// Componentes UI reutilizables
import {Button, Badge, ThemeToggle, FaqItem, FeatureCard} from '../components/ui';

// Componentes de seccion reutilizables
import {Header, Footer} from '../components/sections';

// Configuracion centralizada
import {siteUrls, mainNavItems, logoText, footerColumns, getCopyrightText} from '../config';

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
    const {theme, toggleTheme} = useTheme();

    // Carga dinamica de fuentes segun tema (hook reutilizable)
    useFontLoader(theme);

    const fontFamily = fontFamilyByTheme[theme];

    return (
        <div className="min-h-screen selection:bg-[#e7e5e4]" style={{backgroundColor: 'var(--color-bg-primary)', fontFamily, color: 'var(--color-text-primary)'}}>
            {/* HEADER COMPARTIDO */}
            <div id="header-wrapper">
                <Header logoText={logoText} navItems={mainNavItems} ctaText="Agendar 1:1" ctaHref={siteUrls.calendly} loginHref={siteUrls.whatsapp} />
            </div>

            <main className="flex-1 flex flex-col gap-16 md:gap-24 px-6 py-12 md:py-20">
                {/* 1. HERO SECTION */}
                <HeroSection />

                {/* 2. WHATSAPP BUSINESS (FEATURE DESTACADA) */}
                <WhatsAppSection />

                {/* 3. MULTICANAL (GRID DE TARJETAS) */}
                <MultichannelSection />

                {/* 4. AUTOMATIZACION (VISUAL FLOW) */}
                <AutomationSection />

                {/* 5. PROCESO DE TRABAJO (TIMELINE) */}
                <ProcessSection />

                {/* 6. FAQS & CTA FINAL */}
                <FaqSection />
            </main>

            {/* FOOTER */}
            <div id="footer-wrapper">
                <Footer columns={footerColumns} copyrightText={getCopyrightText()} />
            </div>

            {/* THEME TOGGLE */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
    );
}

// --- SECCIONES LOCALES (especificas de esta pagina) ---

function HeroSection() {
    return (
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
    );
}

function WhatsAppSection() {
    return (
        <section id="whatsapp-section" className="mx-auto w-full max-w-7xl">
            <div className="border rounded-xl overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Visual Mockup (Izquierda) */}
                    <div id="whatsapp-visual" className="p-8 md:p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r relative overflow-hidden" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)'}}>
                        {/* Abstract Grid Background */}
                        <div className="absolute inset-0 opacity-[0.4]" style={{backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`, backgroundSize: '40px 40px'}}></div>

                        <div className="relative w-full max-w-md rounded-lg border shadow-lg p-4 space-y-4 z-10" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            {/* Mensaje Bot */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{backgroundColor: 'var(--color-accent-primary)'}}>
                                    AI
                                </div>
                                <div className="p-3 rounded-lg rounded-tl-none text-xs max-w-[80%]" style={{backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)'}}>
                                    Hola - En que puedo ayudarte hoy?
                                </div>
                            </div>
                            {/* Mensaje Usuario */}
                            <div className="flex gap-3 flex-row-reverse">
                                <div className="p-3 rounded-lg rounded-tr-none text-xs text-white max-w-[80%]" style={{backgroundColor: 'var(--color-accent-primary)'}}>
                                    Quiero reservar una mesa para el viernes.
                                </div>
                            </div>
                            {/* Accion Sistema */}
                            <div className="flex justify-center py-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-100 bg-[#f0fdf4]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-mono text-green-700">INTENCION DETECTADA: RESERVA</span>
                                </div>
                            </div>
                            {/* Respuesta Bot */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{backgroundColor: 'var(--color-accent-primary)'}}>
                                    AI
                                </div>
                                <div className="p-3 rounded-lg rounded-tl-none text-xs max-w-[80%]" style={{backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)'}}>
                                    Perfecto. Tengo hueco a las 20:30 o 21:00. Cual prefieres?
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Texto (Derecha) */}
                    <div id="whatsapp-content" className="p-8 md:p-12 flex flex-col justify-center">
                        <Badge className="w-fit mb-4 text-[#25D366] border-green-100 bg-green-50">{servicesContent.whatsapp.badge}</Badge>
                        <h2 className="text-3xl font-semibold tracking-tight mb-6" style={{color: 'var(--color-text-primary)'}}>
                            {servicesContent.whatsapp.title}
                        </h2>
                        <div className="space-y-8">
                            {servicesContent.whatsapp.features.map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-none mt-1">
                                        <Check className="w-5 h-5" style={{color: 'var(--color-text-primary)'}} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold" style={{color: 'var(--color-text-primary)'}}>
                                            {item.title}
                                        </h3>
                                        <p className="text-sm mt-1" style={{color: 'var(--color-text-muted)'}}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-6 border-t" style={{borderColor: 'var(--color-bg-tertiary)'}}>
                            <Button href={siteUrls.calendly} variant="outline" className="w-full sm:w-auto">
                                Solicitar demo WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MultichannelSection() {
    return (
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
    );
}

function AutomationSection() {
    return (
        <section id="automation-section" className="mx-auto w-full max-w-7xl">
            <div className="rounded-xl p-8 md:p-12 text-[#f8f8f6] relative overflow-hidden" style={{backgroundColor: '#1c1917'}}>
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div id="automation-content">
                        <Badge className="mb-4 bg-[#292524] text-[#a8a29e] border-[#44403c]">{servicesContent.automation.badge}</Badge>
                        <h2 className="text-3xl font-semibold tracking-tight mb-6 text-white">{servicesContent.automation.title}</h2>
                        <p className="text-[#d6d3d1] mb-8 leading-relaxed font-light">{servicesContent.automation.description}</p>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                            {servicesContent.automation.features.map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white/5 border border-white/10">
                                        <feat.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span>{feat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visual Flow Abstracto */}
                    <div id="automation-visual" className="relative h-64 md:h-80 bg-white/5 rounded-lg border border-white/10 p-6 flex flex-col justify-center items-center">
                        {/* Node 1 */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono text-[#a8a29e]">TRIGGER: NUEVO MENSAJE</span>
                        </motion.div>

                        {/* Line */}
                        <div className="h-8 w-px bg-gradient-to-b from-[#25D366] to-[#3b82f6] my-1"></div>

                        {/* Node 2 */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                <Workflow className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono text-[#a8a29e]">MAKE SCENARIO</span>
                        </motion.div>

                        {/* Line Split */}
                        <div className="w-32 h-px bg-[#3b82f6] my-4 relative">
                            <div className="absolute left-1/2 top-0 h-4 w-px bg-[#3b82f6] -translate-x-1/2"></div>
                            <div className="absolute left-0 top-0 h-4 w-px bg-[#3b82f6]"></div>
                            <div className="absolute right-0 top-0 h-4 w-px bg-[#3b82f6]"></div>
                        </div>

                        {/* Nodes 3 (Row) */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.4}} className="flex justify-between w-48">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                <Database className="w-4 h-4 text-white" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProcessSection() {
    return (
        <section id="process-section" className="mx-auto w-full max-w-4xl py-12">
            <h2 className="text-2xl font-medium tracking-tight text-center mb-12" style={{color: 'var(--color-text-primary)'}}>
                {servicesContent.process.title}
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:from-transparent before:via-[#e5e5e0] before:to-transparent" style={{background: 'linear-gradient(to bottom, transparent, var(--color-border-primary), transparent)'}}>
                {servicesContent.process.steps.map((step, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xs font-bold" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)'}}>
                            {i + 1}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-lg border shadow-sm transition-colors hover:border-[#d6d3d1]" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            <div className="font-bold mb-1 text-sm" style={{color: 'var(--color-text-primary)'}}>
                                {step.title}
                            </div>
                            <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>
                                {step.desc}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function FaqSection() {
    return (
        <section id="faq-section" className="mx-auto w-full max-w-2xl pb-12">
            <h2 className="text-xl font-medium tracking-tight mb-6" style={{color: 'var(--color-text-primary)'}}>
                {servicesContent.faq.title}
            </h2>
            <div id="faq-list" className="space-y-1 mb-12">
                {servicesContent.faq.items.map((item, i) => (
                    <FaqItem key={i} question={item.question} answer={item.answer} />
                ))}
            </div>

            <div id="cta-card" className="rounded-lg p-8 text-center border" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)'}}>
                <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>
                    Hablamos?
                </h3>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{color: 'var(--color-text-muted)'}}>
                    Elige como prefieres empezar. Respuesta en menos de 30 minutos (09-21h).
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button href={siteUrls.calendly} className="border-0">
                        Agenda en 30s
                    </Button>
                    <Button href={siteUrls.whatsapp} variant="ghost">
                        Escribeme por WhatsApp
                    </Button>
                </div>
            </div>
        </section>
    );
}
