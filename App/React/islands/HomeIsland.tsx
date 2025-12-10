import {useState, useEffect} from 'react';
import {MessageSquare, Calendar, ArrowRight, Database, Zap, ShieldCheck, Activity, GitBranch, Layers, Search} from 'lucide-react';

// Componentes UI reutilizables
import {Badge, Button} from '../components/ui';

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
                AI Support agents that triage and fix <span className="text-[#a8a29e]">every ticket.</span>
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
                    Auto-triage every <span className="text-[#a8a29e]">customer issue 4x faster.</span>
                </>
            ),
            description: 'El bot detecta la intencion de compra, consulta tu agenda en tiempo real y cierra la cita. Genera RCAs tecnicos para cada problema en minutos.'
        },
        auto: {
            icon: <Database className="w-4 h-4 text-[#a8a29e]" />,
            label: 'QA Data',
            title: (
                <>
                    Zero manual <span className="text-[#a8a29e]">data entry.</span>
                </>
            ),
            description: 'Olvidate de copiar y pegar. Cada lead se guarda automaticamente en tu CRM o Google Sheets con sus etiquetas correspondientes.'
        },
        dev: {
            icon: <GitBranch className="w-4 h-4 text-[#a8a29e]" />,
            label: 'Workflow',
            title: (
                <>
                    Plug into your <span className="text-[#a8a29e]">existing stack.</span>
                </>
            ),
            description: 'No cambies de herramientas. Me conecto a lo que ya usas: HubSpot, Zoho, Salesforce o un simple Excel.'
        }
    };

    const currentContent = tabContent[activeTab as keyof typeof tabContent];

    return (
        <section className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-4 lg:grid-cols-8 border border-[#e5e5e0] rounded-md overflow-hidden bg-white shadow-sm">
                {/* Visual Area - Mockup abstracto */}
                <div className="col-span-4 lg:col-span-8 border-b border-[#e5e5e0] bg-[#f0efeb] relative h-64 md:h-[420px] overflow-hidden group">
                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(#e5e5e0 1px, transparent 1px), linear-gradient(to right, #e5e5e0 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}></div>

                    {/* Abstract Mockup */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full max-w-3xl bg-white rounded-lg shadow-sm border border-[#e5e5e0] p-1.5 transform transition-transform group-hover:scale-[1.005] duration-1000">
                            <div className="bg-[#fcfcfc] rounded border border-[#f5f5f4] p-6 flex flex-col gap-4">
                                {/* Fake UI Header */}
                                <div className="flex items-center justify-between border-b border-[#f5f5f4] pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-[#f0efeb] border border-[#e7e5e4]"></div>
                                        <div className="flex flex-col gap-1">
                                            <div className="h-2 w-24 bg-[#e7e5e4] rounded-sm"></div>
                                            <div className="h-2 w-16 bg-[#f5f5f4] rounded-sm"></div>
                                        </div>
                                    </div>
                                    <Badge className="bg-[#f5f5f4] border-[#e7e5e4] text-[#a8a29e]">SIMULATING</Badge>
                                </div>

                                {/* Fake Lines */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-3 bg-white border border-[#f5f5f4] rounded-md shadow-sm">
                                        <div className="h-4 w-4 rounded-full border border-orange-400 animate-pulse"></div>
                                        <div className="h-2 w-3/4 bg-[#f5f5f4] rounded-sm"></div>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-white border border-[#f5f5f4] rounded-md shadow-sm opacity-60">
                                        <div className="h-4 w-4 rounded-full border border-[#e7e5e4]"></div>
                                        <div className="h-2 w-1/2 bg-[#f5f5f4] rounded-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrations Bar */}
                <div className="col-span-4 lg:col-span-8 bg-white border-b border-[#e5e5e0]">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#f5f5f4]">
                        {integrations.map((logo, idx) => (
                            <div key={idx} className="h-24 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all cursor-default">
                                <span className="font-semibold text-[#292524] tracking-tight text-lg font-mono">{logo}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="col-span-4 lg:col-span-8 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
                        {/* Dynamic Content */}
                        <div className="col-span-1 lg:col-span-9 p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#e5e5e0] bg-white">
                            <div className="h-full flex flex-col justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    {currentContent.icon}
                                    <span className="text-xs font-mono text-[#a8a29e] uppercase">{currentContent.label}</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-medium tracking-tighter text-[#292524]">{currentContent.title}</h3>
                                <p className="text-[#79716b] leading-relaxed text-[15px] max-w-2xl">{currentContent.description}</p>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-[#f5f5f4]">
                                <span className="text-sm font-medium text-[#79716b]">How Guillermo helps</span>
                                <div className="flex bg-[#f5f5f4] p-1 rounded-md border border-[#e5e5e0]">
                                    {tabs.map(tab => (
                                        <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`px-4 py-1.5 rounded text-[13px] font-medium transition-all ${activeTab === tab.id ? 'bg-white text-[#292524] shadow-sm border border-[#e5e5e0]' : 'text-[#79716b] hover:text-[#57534e]'}`}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar CTA */}
                        <div className="col-span-1 lg:col-span-3 p-8 flex flex-col justify-center bg-[#f8f8f6]">
                            <h4 className="font-semibold text-[#292524] mb-3 text-sm">Get started in minutes</h4>
                            <p className="text-[13px] text-[#79716b] mb-8 leading-relaxed">Talk to an expert and see how we can supercharge your support, QA, and developer workflows.</p>
                            <Button href={URL_CALENDLY} variant="primary" className="w-full bg-[#292524] border-0 text-white">
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
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-[#292524]">An always-on AI support engineer</h2>
                <p className="mt-3 text-[#79716b] max-w-3xl text-sm">An AI support engineer that can triage, RCA, and fix customer problems autonomously.</p>
            </div>

            <div className="grid grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="col-span-12 lg:col-span-6">
                    <div className="rounded-sm border border-[#e5e5e0] shadow-sm overflow-hidden bg-[#f0efeb] aspect-[4/3] relative flex items-center justify-center group">
                        <div className="absolute inset-0 bg-[#e7e5e4] opacity-20"></div>
                        <div className="relative w-[85%] bg-white border border-[#e5e5e0] rounded p-3 shadow-lg transition-transform group-hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-6 w-6 rounded-full bg-[#e5e5e0]"></div>
                                <div className="text-[11px] font-medium text-[#292524]">Contract renewal failed with FX rounding error.</div>
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

    // Inyeccion de fuentes Geist Sans y Geist Mono
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
        link.rel = 'stylesheet';

        const linkMono = document.createElement('link');
        linkMono.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-mono/style.css';
        linkMono.rel = 'stylesheet';

        document.head.appendChild(link);
        document.head.appendChild(linkMono);

        return () => {
            document.head.removeChild(link);
            document.head.removeChild(linkMono);
        };
    }, []);

    return (
        <div className="min-h-screen text-[#292524] selection:bg-[#e7e5e4]" style={{backgroundColor: '#f8f8f6', fontFamily: "'Geist Sans', sans-serif"}}>
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
                    Guillermo builds a <span className="text-[#292524]">memory</span> of every problem, so that the same mistake is <span className="text-[#292524]">never made twice</span>.
                </QuoteSection>

                {/* 7. GRID CARDS */}
                <GridCards title="Wide and deep context awareness" subtitle="Purpose-built to deeply understand large software systems." cards={siteConfig.gridCards} />
            </main>

            {/* 8. FOOTER */}
            <Footer columns={siteConfig.footer.columns} copyrightText={siteConfig.footer.copyrightText} />
        </div>
    );
}
