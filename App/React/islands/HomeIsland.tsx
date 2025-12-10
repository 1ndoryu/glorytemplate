import {useState, useEffect} from 'react';
import {MessageSquare, Calendar, ArrowRight, Database, Zap, ShieldCheck, Activity, GitBranch, Layers, Search} from 'lucide-react';

// Hook para manejo de temas
import {useTheme} from '../hooks/useTheme';

// Componentes UI reutilizables
import {Badge, Button, ThemeToggle} from '../components/ui';

// Componentes de seccion reutilizables
import {TopBanner, Header, HeroSection, Footer, FeatureList, GridCards, QuoteSection, ProcessWorkflow} from '../components/sections';

// --- CONSTANTES ---
const URL_CALENDLY = '#calendly';
const URL_WHATSAPP = 'https://wa.me/34XXXXXXXXX';

// --- CONFIGURACION DEL SITIO (Basado en project.md - HOME) ---
const siteConfig = {
    logoText: 'Guillermo',
    navItems: [
        {label: 'Servicios', href: '/servicios'},
        {label: 'Planes', href: '/planes'},
        {label: 'Demos', href: '/demos'},
        {label: 'Blog', href: '/blog'},
        {label: 'Sobre Mi', href: '/sobre-mi'}
    ],
    topBanner: {
        text: 'Primer mes gratis - Respuesta en menos de 30 min (09-21h)',
        linkText: 'Agenda ahora',
        linkHref: URL_CALENDLY
    },
    hero: {
        // H1 segun project.md
        title: (
            <>
                Chatbot para empresas que atiende a tus clientes <span style={{color: 'var(--color-text-subtle)'}}>24/7 y gestiona reservas</span>
            </>
        ),
        // Subhero segun project.md
        subtitle: 'Soy Guillermo. Creo el chatbot para tu empresa en tu web y en WhatsApp Business para que atiendas mas rapido a tus clientes. Trabajamos tu y yo, 1:1, con respuesta en menos de 30 min (09-21h), primer mes gratis y mantenimiento continuo.',
        // CTAs segun project.md (orden: Calendario, WhatsApp, Formulario)
        primaryCta: {text: 'Hablame ahora', href: URL_CALENDLY},
        secondaryCta: {text: 'WhatsApp', href: URL_WHATSAPP}
    },
    // Proceso de trabajo (unificado: indicadores + simulaciones)
    processWorkflow: {
        steps: [{label: 'Llamada'}, {label: 'Prototipo 72h'}, {label: 'Lanzamiento'}, {label: 'Mejora continua'}],
        simulations: [
            {
                // Paso 1: Llamada
                badge: 'CONECTANDO',
                title: 'Llamada breve de 15-20 min',
                subtitle: 'Me cuentas tu situacion y objetivos'
            },
            {
                // Paso 2: Prototipo 72h
                badge: 'DISEÑANDO',
                title: 'Prototipo en 72 horas',
                subtitle: 'Flujo real: dudas + datos + propuesta de reserva'
            },
            {
                // Paso 3: Lanzamiento
                badge: 'INTEGRANDO',
                title: 'Integracion y lanzamiento',
                subtitle: 'Conecto con tu web, agenda y CRM'
            },
            {
                // Paso 4: Mejora continua
                badge: 'OPTIMIZANDO',
                title: 'Mejora continua mensual',
                subtitle: 'Reviso conversaciones y optimizo respuestas'
            }
        ]
    },
    // H2: Lo que voy a conseguir contigo
    features: [
        {icon: Zap, title: 'Mas oportunidades en menos horas', desc: 'Respuestas en segundos, 24/7. Tu chatbot atiende cuando tu no puedes.'},
        {icon: Calendar, title: 'Reservas directas', desc: 'El bot propone dia/hora y confirma por email/WhatsApp. Sin llamadas, sin esperas.'},
        {icon: Database, title: 'Menos tareas repetitivas', desc: 'Envia los datos al Software/CRM que uses. Si no tienes, empezamos con hoja compartida.'},
        {icon: MessageSquare, title: 'Mejor experiencia', desc: 'Conversacion con tono cuidado y, cuando haga falta, dejo paso a ti o tu equipo con todo el historial.'}
    ],
    // Secciones de contenido para GridCards
    gridCards: [
        {icon: MessageSquare, title: 'WhatsApp Business', description: 'Detecto, clasifico y doy seguimiento. Derivacion humana sin perder contexto.'},
        {icon: Activity, title: 'Automatizacion pymes', description: 'Formularios a CRM, flujos con tu web y agenda, FAQs transaccionales.'},
        {icon: Layers, title: 'Integraciones', description: 'Tu web, WhatsApp, Instagram, Google Calendar, HubSpot, Zoho y mas.'},
        {icon: ShieldCheck, title: 'RGPD y permisos', description: 'Incluyo opt-in/opt-out y aviso de privacidad. Todo en regla.'},
        {icon: Search, title: 'Medimos lo importante', description: 'Clics en WhatsApp, citas creadas, formularios enviados. Analytics real.'},
        {icon: GitBranch, title: 'Trabajo 1:1 contigo', description: 'Llamada breve, prototipo en 72h, mejora continua cada mes.'}
    ],
    // Interlinking segun project.md
    interlinking: [
        {label: 'Servicios de chatbots y automatizacion', href: '/servicios'},
        {label: 'Ver planes y empezar gratis', href: '/planes'},
        {label: 'Probar una demo real', href: '/demos'},
        {label: 'Articulos practicos', href: '/blog'},
        {label: 'Quien soy y como trabajo', href: '/sobre-mi'},
        {label: 'Escribeme o reserva', href: '/contacto'}
    ],
    footer: {
        columns: [
            {
                title: 'Servicios',
                links: [
                    {label: 'Chatbot WhatsApp', href: '/servicios#whatsapp'},
                    {label: 'Automatizacion', href: '/servicios#automatizacion'},
                    {label: 'Integraciones', href: '/servicios#integraciones'}
                ]
            },
            {
                title: 'Recursos',
                links: [
                    {label: 'Planes', href: '/planes'},
                    {label: 'Demos', href: '/demos'},
                    {label: 'Blog', href: '/blog'}
                ]
            },
            {
                title: 'Legal',
                links: [
                    {label: 'Politica de Privacidad', href: '/privacidad'},
                    {label: 'Politica de Cookies', href: '/cookies'}
                ]
            }
        ],
        copyrightText: `© ${new Date().getFullYear()} Guillermo Garcia. Chatbots y Automatizacion.`
    }
};

// --- COMPONENTE BENTO GRID ---
// Este componente es especifico de la pagina Home, por eso se mantiene aqui
interface BentoGridProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

function BentoGrid({activeTab, onTabChange}: BentoGridProps) {
    const integrations = ['WhatsApp', 'Calendly', 'Sheets', 'HubSpot'];

    // Tabs segun secciones de project.md
    const tabs = [
        {id: 'whatsapp', label: 'WhatsApp'},
        {id: 'auto', label: 'Automatizacion'},
        {id: 'integraciones', label: 'Integraciones'}
    ];

    // Contenido basado en secciones H2 de project.md HOME
    const tabContent = {
        whatsapp: {
            icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4 opacity-60" alt="" />,
            label: 'WhatsApp Business',
            title: (
                <>
                    Detecto, clasifico y <span style={{color: 'var(--color-text-subtle)'}}>doy seguimiento.</span>
                </>
            ),
            description: 'El bot pide lo necesario (nombre, interes, urgencia), etiqueta la oportunidad y te avisa para que entres cuando quieras. Derivacion humana sin perder contexto.'
        },
        auto: {
            icon: <Database className="w-4 h-4" style={{color: 'var(--color-text-subtle)'}} />,
            label: 'Automatizacion',
            title: (
                <>
                    Formularios al CRM, <span style={{color: 'var(--color-text-subtle)'}}>sin copiar y pegar.</span>
                </>
            ),
            description: 'Todo lo que el bot recoge va directo a tu Software/CRM. Flujos con tu web y agenda, confirmaciones y recordatorios automaticos.'
        },
        integraciones: {
            icon: <Layers className="w-4 h-4" style={{color: 'var(--color-text-subtle)'}} />,
            label: 'Integraciones',
            title: (
                <>
                    Conecto con <span style={{color: 'var(--color-text-subtle)'}}>lo que ya usas.</span>
                </>
            ),
            description: 'Tu web actual, WhatsApp Business, Instagram, Google Calendar, Outlook, HubSpot, Zoho, ERP. Si no tienes CRM, empezamos con hoja compartida.'
        }
    };

    const currentContent = tabContent[activeTab as keyof typeof tabContent];

    return (
        <section id="bento-grid" className="mx-auto w-full max-w-7xl">
            <div id="bento-grid-container" className="grid grid-cols-4 lg:grid-cols-8 border rounded-md overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                {/* Visual Area - Mockup abstracto */}
                <div id="bento-visual-area" className="col-span-4 lg:col-span-8 border-b relative h-64 md:h-[420px] overflow-hidden group" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-secondary)'}}>
                    {/* Grid Pattern */}
                    <div
                        id="bento-grid-pattern"
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}></div>

                    {/* Abstract Mockup */}
                    <div id="bento-mockup-container" className="absolute inset-0 flex items-center justify-center p-6">
                        <div id="bento-mockup-wrapper" className="w-full max-w-3xl rounded-lg shadow-sm border p-1.5 transform transition-transform group-hover:scale-[1.005] duration-1000" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            <div id="bento-mockup-card" className="rounded border p-6 flex flex-col gap-4" style={{backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)'}}>
                                {/* Fake UI Header */}
                                <div id="bento-ui-header" className="flex items-center justify-between border-b pb-4" style={{borderColor: 'var(--color-border-subtle)'}}>
                                    <div id="bento-header-content" className="flex items-center gap-3">
                                        <div id="bento-avatar" className="w-8 h-8 rounded border" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-secondary)'}}></div>
                                        <div id="bento-text-placeholders" className="flex flex-col gap-1">
                                            <div id="bento-text-line-1" className="h-2 w-24 rounded-sm" style={{backgroundColor: 'var(--color-border-secondary)'}}></div>
                                            <div id="bento-text-line-2" className="h-2 w-16 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                        </div>
                                    </div>
                                    <Badge>SIMULATING</Badge>
                                </div>

                                {/* Fake Lines */}
                                <div id="bento-fake-lines" className="space-y-3">
                                    <div id="bento-fake-line-1" className="flex items-center gap-4 p-3 border rounded-md shadow-sm" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                        <div id="bento-pulse-dot" className="h-4 w-4 rounded-full border border-orange-400 animate-pulse"></div>
                                        <div id="bento-line-1-text" className="h-2 w-3/4 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                    </div>
                                    <div id="bento-fake-line-2" className="flex items-center gap-4 p-3 border rounded-md shadow-sm opacity-60" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                        <div id="bento-static-dot" className="h-4 w-4 rounded-full border" style={{borderColor: 'var(--color-border-secondary)'}}></div>
                                        <div id="bento-line-2-text" className="h-2 w-1/2 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrations Bar */}
                <div id="bento-integrations-bar" className="col-span-4 lg:col-span-8 border-b" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                    <div id="bento-integrations-grid" className="grid grid-cols-2 md:grid-cols-4" style={{borderColor: 'var(--color-border-subtle)'}}>
                        {integrations.map((logo, idx) => (
                            <div key={idx} id={`bento-integration-${logo.toLowerCase()}`} className="h-24 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all cursor-default">
                                <span className="font-semibold tracking-tight text-lg font-mono" style={{color: 'var(--color-text-primary)'}}>
                                    {logo}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Content */}
                <div id="bento-bottom-content" className="col-span-4 lg:col-span-8" style={{backgroundColor: 'var(--color-bg-surface)'}}>
                    <div id="bento-bottom-grid" className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
                        {/* Dynamic Content */}
                        <div id="bento-dynamic-content" className="col-span-1 lg:col-span-9 p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                            <div id="bento-content-wrapper" className="h-full flex flex-col justify-center gap-4">
                                <div id="bento-icon-label" className="flex items-center gap-2">
                                    {currentContent.icon}
                                    <span className="text-xs font-mono uppercase" style={{color: 'var(--color-text-subtle)'}}>
                                        {currentContent.label}
                                    </span>
                                </div>
                                <h3 id="bento-content-title" className="text-2xl md:text-3xl font-medium tracking-tighter" style={{color: 'var(--color-text-primary)'}}>
                                    {currentContent.title}
                                </h3>
                                <p id="bento-content-description" className="leading-relaxed text-[15px] max-w-2xl" style={{color: 'var(--color-text-muted)'}}>
                                    {currentContent.description}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div id="bento-tabs-container" className="flex items-center gap-4 mt-8 pt-8 border-t" style={{borderColor: 'var(--color-border-subtle)'}}>
                                <span id="bento-tabs-label" className="text-sm font-medium" style={{color: 'var(--color-text-muted)'}}>
                                    How Guillermo helps
                                </span>
                                <div id="bento-tabs-wrapper" className="flex p-1 rounded-md border" style={{backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-primary)'}}>
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            id={`bento-tab-${tab.id}`}
                                            onClick={() => onTabChange(tab.id)}
                                            className="px-4 py-1.5 rounded text-[13px] font-medium transition-all"
                                            style={{
                                                backgroundColor: activeTab === tab.id ? 'var(--color-bg-surface)' : 'transparent',
                                                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                border: activeTab === tab.id ? '1px solid var(--color-border-primary)' : 'none',
                                                boxShadow: activeTab === tab.id ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
                                            }}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar CTA */}
                        <div id="bento-sidebar-cta" className="col-span-1 lg:col-span-3 p-8 flex flex-col justify-center" style={{backgroundColor: 'var(--color-bg-primary)'}}>
                            <h4 id="bento-cta-title" className="font-semibold mb-3 text-sm" style={{color: 'var(--color-text-primary)'}}>
                                Empezamos en minutos
                            </h4>
                            <p id="bento-cta-description" className="text-[13px] mb-8 leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                                Hablamos 15-20 min, te enseno un prototipo en 72h y decidimos juntos. Primer mes gratis.
                            </p>
                            <Button href={URL_CALENDLY} variant="primary" className="w-full">
                                Hablame ahora
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- COMPONENTE FEATURE SECTION ---
// Seccion de caracteristicas con imagen mockup a la izquierda
function FeatureSection() {
    const features = siteConfig.features.map(f => ({
        icon: f.icon,
        title: f.title,
        description: f.desc
    }));

    return (
        <section id="servicios" className="mx-auto w-full max-w-7xl pt-12">
            <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight" style={{color: 'var(--color-text-primary)'}}>
                    Lo que voy a conseguir contigo
                </h2>
                <p className="mt-3 max-w-3xl text-sm" style={{color: 'var(--color-text-muted)'}}>
                    Mas oportunidades, reservas directas, menos tareas repetitivas y mejor experiencia para tus clientes.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="col-span-12 lg:col-span-6">
                    <div className="rounded-sm border shadow-sm overflow-hidden aspect-[4/3] relative flex items-center justify-center group" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-secondary)'}}>
                        <div className="absolute inset-0 opacity-20" style={{backgroundColor: 'var(--color-border-secondary)'}}></div>
                        <div className="relative w-[85%] border rounded p-3 shadow-lg transition-transform group-hover:-translate-y-1" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-6 w-6 rounded-full" style={{backgroundColor: 'var(--color-border-primary)'}}></div>
                                <div className="text-[11px] font-medium" style={{color: 'var(--color-text-primary)'}}>
                                    Nuevo lead: Maria quiere reservar cita para manana.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-6 flex flex-col justify-center h-full">
                    <FeatureList features={features} />
                    <div className="mt-8">
                        <Button href="#planes" variant="outline" className="h-9 text-xs">
                            Ver planes
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- COMPONENTE PRINCIPAL ---
export function HomeIsland(): JSX.Element {
    const [activeTab, setActiveTab] = useState('whatsapp');
    const {theme, toggleTheme} = useTheme();

    // Inyeccion dinamica de fuentes segun el tema activo
    // Tema default: Geist Sans/Mono
    // Tema project: Inter + Manrope
    useEffect(() => {
        const fontsToLoad: {id: string; href: string}[] = [];

        if (theme === 'project') {
            // Fuentes del tema project (Inter + Manrope)
            fontsToLoad.push({id: 'font-inter', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'}, {id: 'font-manrope', href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700&display=swap'});
        } else {
            // Fuentes del tema default (Geist)
            fontsToLoad.push({id: 'font-geist-sans', href: 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css'}, {id: 'font-geist-mono', href: 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-mono/style.css'});
        }

        // Agregar fuentes al head
        const addedLinks: HTMLLinkElement[] = [];
        fontsToLoad.forEach(({id, href}) => {
            // Evitar duplicados
            if (!document.getElementById(id)) {
                const link = document.createElement('link');
                link.id = id;
                link.href = href;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
                addedLinks.push(link);
            }
        });

        // Cleanup: remover fuentes del tema anterior si cambia
        return () => {
            addedLinks.forEach(link => {
                if (document.head.contains(link)) {
                    document.head.removeChild(link);
                }
            });
        };
    }, [theme]);

    // Determinar la familia de fuentes segun el tema
    const fontFamily = theme === 'project' ? "'Inter', system-ui, sans-serif" : "'Geist Sans', sans-serif";

    return (
        <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontFamily}}>
            {/* 1. TOP BANNER */}
            <div id="top-banner">
                <TopBanner text={siteConfig.topBanner.text} linkText={siteConfig.topBanner.linkText} linkHref={siteConfig.topBanner.linkHref} />
            </div>

            {/* 2. HEADER */}
            <div id="header">
                <Header logoText={siteConfig.logoText} navItems={siteConfig.navItems} ctaText="Hablame ahora" ctaHref={URL_CALENDLY} loginHref={URL_WHATSAPP} />
            </div>

            <main className="flex-1 flex flex-col justify-start gap-12 px-6 py-12 md:py-20">
                {/* 3. HERO SECTION */}
                <div id="hero">
                    <HeroSection title={siteConfig.hero.title} subtitle={siteConfig.hero.subtitle} primaryCta={siteConfig.hero.primaryCta} secondaryCta={siteConfig.hero.secondaryCta} />
                </div>

                {/* 4. PROCESS WORKFLOW - Indicadores + Simulacion Visual */}
                <ProcessWorkflow steps={siteConfig.processWorkflow.steps} simulations={siteConfig.processWorkflow.simulations} />

                {/* 5. BENTO GRID - Tabs de Servicios */}
                <BentoGrid activeTab={activeTab} onTabChange={setActiveTab} />

                {/* 6. FEATURE SECTION */}
                <FeatureSection />

                {/* 7. QUOTE - Propuesta de valor diferenciadora */}
                <div id="quote">
                    <QuoteSection>
                        Trabajo <span style={{color: 'var(--color-text-primary)'}}>contigo, sin intermediarios</span>. Llamada breve, prototipo en 72h y <span style={{color: 'var(--color-text-primary)'}}>mejora continua</span> cada mes.
                    </QuoteSection>
                </div>

                {/* 8. GRID CARDS - Servicios principales */}
                <div id="grid-servicios">
                    <GridCards title="Todo lo que necesitas para automatizar" subtitle="WhatsApp, automatizacion, integraciones y RGPD. Trabajo 1:1 contigo." cards={siteConfig.gridCards} />
                </div>
            </main>

            {/* 9. FOOTER */}
            <div id="footer">
                <Footer columns={siteConfig.footer.columns} copyrightText={siteConfig.footer.copyrightText} />
            </div>

            {/* THEME TOGGLE - Boton flotante para cambiar de tema */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
    );
}
