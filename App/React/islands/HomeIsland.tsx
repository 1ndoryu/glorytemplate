import {useState, useEffect} from 'react';
import {MessageSquare, Calendar, ArrowRight, Database, Zap, ShieldCheck, Activity, GitBranch, Layers, Search} from 'lucide-react';

// Hook para manejo de temas
import {useTheme} from '../hooks/useTheme';

// Componentes UI reutilizables
import {Badge, Button, ThemeToggle} from '../components/ui';

// Componentes de seccion reutilizables
import {TopBanner, Header, HeroSection, Footer, FeatureList, GridCards, QuoteSection} from '../components/sections';

// --- CONSTANTES ---
const URL_CALENDLY = '#calendly';

// --- CONFIGURACION DEL SITIO ---
const siteConfig = {
    logoText: 'Guillermo.ai',
    navItems: [
        {label: 'Servicios', href: '#servicios'},
        {label: 'Planes', href: '#planes'},
        {label: 'Demos', href: '#demos'},
        {label: 'Sobre Mi', href: '#sobre-mi'}
    ],
    topBanner: {
        text: 'SIM-1: Consultoria de automatizacion 1:1',
        linkText: 'Ver disponibilidad',
        linkHref: URL_CALENDLY
    },
    hero: {
        title: (
            <>
                AI Support agents that triage and fix <span style={{color: 'var(--color-text-subtle)'}}>every ticket.</span>
            </>
        ),
        subtitle: 'Soy Guillermo. Diseno la automatizacion de tu web y WhatsApp para que atiendas rapido sin perder el trato humano. Trabajo 1:1 contigo.',
        primaryCta: {text: 'Book a demo', href: URL_CALENDLY},
        secondaryCta: {text: 'Learn more', href: '#servicios'},
        statusIndicators: [
            {label: 'Triage', isActive: true, isAnimated: true},
            {label: 'RCA', isActive: false},
            {label: 'Fix', isActive: false},
            {label: 'Test', isActive: false}
        ]
    },
    features: [
        {icon: Activity, title: 'Scale customers without scaling headcount', desc: 'Autonomously triages with full context, deflects L1/L2, and handles L3 in minutes 24/7.'},
        {icon: ShieldCheck, title: 'Operate with governance', desc: 'Approvals, diffs, and an audit trail keep fixes safe and compliant.'},
        {icon: Zap, title: 'Evolving agents', desc: 'Constantly learns your flow and the institutional knowledge embedded in your process.'},
        {icon: ArrowRight, title: 'Perfect handoffs', desc: 'Delivers full context with proposed fixes and RCA so developers dont have to context switch.'}
    ],
    gridCards: [
        {icon: MessageSquare, title: 'Code understanding', description: 'Deep and accurate codebase understanding with semantic graphs.'},
        {icon: Activity, title: 'Runtime telemetry', description: 'Connects to logs, metrics, and traces for real context.'},
        {icon: Calendar, title: 'Form-fit workflows', description: 'Customizable support and triage flows with approvals.'},
        {icon: Layers, title: 'Integrates everywhere', description: 'All code SCMs, 50+ ticketing systems, MCP clients, and more.'},
        {icon: Search, title: 'Deep Research', description: 'Agentic research that explores complex spaces and synthesizes answers.'},
        {icon: ShieldCheck, title: 'Multi-repo at scale', description: 'Supports large monorepos and many repos scales to billions of LOC.'}
    ],
    footer: {
        columns: [
            {
                title: 'Platform',
                links: [
                    {label: 'Agentic debugging', href: '#'},
                    {label: 'Code simulations', href: '#'},
                    {label: 'Enterprise', href: '#'}
                ]
            },
            {
                title: 'Company',
                links: [
                    {label: 'Resources', href: '#'},
                    {label: 'About us', href: '#'},
                    {label: 'Careers', href: '#'}
                ]
            },
            {
                title: 'Legal',
                links: [
                    {label: 'Terms of service', href: '#'},
                    {label: 'Privacy policy', href: '#'}
                ]
            }
        ],
        copyrightText: `© ${new Date().getFullYear()} Guillermo Garcia. SOC 2 Type II & HIPAA Certified`
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

    const tabs = [
        {id: 'whatsapp', label: 'L3 Support'},
        {id: 'auto', label: 'QA'},
        {id: 'dev', label: 'Dev'}
    ];

    const tabContent = {
        whatsapp: {
            icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4 opacity-60" alt="" />,
            label: 'L3 Support',
            title: (
                <>
                    Auto-triage every <span style={{color: 'var(--color-text-subtle)'}}>customer issue 4x faster.</span>
                </>
            ),
            description: 'El bot detecta la intencion de compra, consulta tu agenda en tiempo real y cierra la cita. Genera RCAs tecnicos para cada problema en minutos.'
        },
        auto: {
            icon: <Database className="w-4 h-4" style={{color: 'var(--color-text-subtle)'}} />,
            label: 'QA Data',
            title: (
                <>
                    Zero manual <span style={{color: 'var(--color-text-subtle)'}}>data entry.</span>
                </>
            ),
            description: 'Olvidate de copiar y pegar. Cada lead se guarda automaticamente en tu CRM o Google Sheets con sus etiquetas correspondientes.'
        },
        dev: {
            icon: <GitBranch className="w-4 h-4" style={{color: 'var(--color-text-subtle)'}} />,
            label: 'Workflow',
            title: (
                <>
                    Plug into your <span style={{color: 'var(--color-text-subtle)'}}>existing stack.</span>
                </>
            ),
            description: 'No cambies de herramientas. Me conecto a lo que ya usas: HubSpot, Zoho, Salesforce o un simple Excel.'
        }
    };

    const currentContent = tabContent[activeTab as keyof typeof tabContent];

    return (
        <section className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-4 lg:grid-cols-8 border rounded-md overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                {/* Visual Area - Mockup abstracto */}
                <div className="col-span-4 lg:col-span-8 border-b relative h-64 md:h-[420px] overflow-hidden group" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-secondary)'}}>
                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}></div>

                    {/* Abstract Mockup */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full max-w-3xl rounded-lg shadow-sm border p-1.5 transform transition-transform group-hover:scale-[1.005] duration-1000" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            <div className="rounded border p-6 flex flex-col gap-4" style={{backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)'}}>
                                {/* Fake UI Header */}
                                <div className="flex items-center justify-between border-b pb-4" style={{borderColor: 'var(--color-border-subtle)'}}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded border" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-secondary)'}}></div>
                                        <div className="flex flex-col gap-1">
                                            <div className="h-2 w-24 rounded-sm" style={{backgroundColor: 'var(--color-border-secondary)'}}></div>
                                            <div className="h-2 w-16 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                        </div>
                                    </div>
                                    <Badge>SIMULATING</Badge>
                                </div>

                                {/* Fake Lines */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                        <div className="h-4 w-4 rounded-full border border-orange-400 animate-pulse"></div>
                                        <div className="h-2 w-3/4 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm opacity-60" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                        <div className="h-4 w-4 rounded-full border" style={{borderColor: 'var(--color-border-secondary)'}}></div>
                                        <div className="h-2 w-1/2 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrations Bar */}
                <div className="col-span-4 lg:col-span-8 border-b" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                    <div className="grid grid-cols-2 md:grid-cols-4" style={{borderColor: 'var(--color-border-subtle)'}}>
                        {integrations.map((logo, idx) => (
                            <div key={idx} className="h-24 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all cursor-default">
                                <span className="font-semibold tracking-tight text-lg font-mono" style={{color: 'var(--color-text-primary)'}}>
                                    {logo}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="col-span-4 lg:col-span-8" style={{backgroundColor: 'var(--color-bg-surface)'}}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
                        {/* Dynamic Content */}
                        <div className="col-span-1 lg:col-span-9 p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                            <div className="h-full flex flex-col justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    {currentContent.icon}
                                    <span className="text-xs font-mono uppercase" style={{color: 'var(--color-text-subtle)'}}>
                                        {currentContent.label}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-medium tracking-tighter" style={{color: 'var(--color-text-primary)'}}>
                                    {currentContent.title}
                                </h3>
                                <p className="leading-relaxed text-[15px] max-w-2xl" style={{color: 'var(--color-text-muted)'}}>
                                    {currentContent.description}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-4 mt-8 pt-8 border-t" style={{borderColor: 'var(--color-border-subtle)'}}>
                                <span className="text-sm font-medium" style={{color: 'var(--color-text-muted)'}}>
                                    How Guillermo helps
                                </span>
                                <div className="flex p-1 rounded-md border" style={{backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-primary)'}}>
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
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
                        <div className="col-span-1 lg:col-span-3 p-8 flex flex-col justify-center" style={{backgroundColor: 'var(--color-bg-primary)'}}>
                            <h4 className="font-semibold mb-3 text-sm" style={{color: 'var(--color-text-primary)'}}>
                                Get started in minutes
                            </h4>
                            <p className="text-[13px] mb-8 leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                                Talk to an expert and see how we can supercharge your support, QA, and developer workflows.
                            </p>
                            <Button href={URL_CALENDLY} variant="primary" className="w-full">
                                Book a demo
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
                    An always-on AI support engineer
                </h2>
                <p className="mt-3 max-w-3xl text-sm" style={{color: 'var(--color-text-muted)'}}>
                    An AI support engineer that can triage, RCA, and fix customer problems autonomously.
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
                                    Contract renewal failed with FX rounding error.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-6 flex flex-col justify-center h-full">
                    <FeatureList features={features} />
                    <div className="mt-8">
                        <Button href="#planes" variant="outline" className="h-9 text-xs">
                            Our product
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
            <TopBanner text={siteConfig.topBanner.text} linkText={siteConfig.topBanner.linkText} linkHref={siteConfig.topBanner.linkHref} />

            {/* 2. HEADER */}
            <Header logoText={siteConfig.logoText} navItems={siteConfig.navItems} ctaText="Book a Demo" ctaHref={URL_CALENDLY} loginHref="https://wa.me/34XXXXXXXXX" />

            <main className="flex-1 flex flex-col justify-start gap-12 px-6 py-12 md:py-20">
                {/* 3. HERO SECTION */}
                <HeroSection title={siteConfig.hero.title} subtitle={siteConfig.hero.subtitle} primaryCta={siteConfig.hero.primaryCta} secondaryCta={siteConfig.hero.secondaryCta} statusIndicators={siteConfig.hero.statusIndicators} />

                {/* 4. BENTO GRID COMPLEX */}
                <BentoGrid activeTab={activeTab} onTabChange={setActiveTab} />

                {/* 5. FEATURE SECTION */}
                <FeatureSection />

                {/* 6. QUOTE */}
                <QuoteSection>
                    Guillermo builds a <span style={{color: 'var(--color-text-primary)'}}>memory</span> of every problem, so that the same mistake is <span style={{color: 'var(--color-text-primary)'}}>never made twice</span>.
                </QuoteSection>

                {/* 7. GRID CARDS */}
                <GridCards title="Wide and deep context awareness" subtitle="Purpose-built to deeply understand large software systems." cards={siteConfig.gridCards} />
            </main>

            {/* 8. FOOTER */}
            <Footer columns={siteConfig.footer.columns} copyrightText={siteConfig.footer.copyrightText} />

            {/* THEME TOGGLE - Boton flotante para cambiar de tema */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
    );
}
