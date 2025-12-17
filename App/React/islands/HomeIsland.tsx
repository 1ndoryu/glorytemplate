/**
 * HomeIsland - Landing Page Glory SaaS
 * Estilo Vercel con animaciones de scroll y efectos de glow
 */

import {useEffect, useRef, useState} from 'react';
import {Zap, ShieldCheck, Image, Server, Check, CheckCircle, Headphones, LifeBuoy, Twitter, Github, Mail} from 'lucide-react';

interface HomeIslandProps {
    siteName?: string;
    stripeUrl?: string;
}

export function HomeIsland({siteName = 'Glory', stripeUrl = 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c'}: HomeIslandProps): JSX.Element {
    return (
        <div id="home-landing" className="min-h-screen bg-[#050505] text-white font-sans antialiased overflow-x-hidden selection:bg-white selection:text-black">
            <Navigation siteName={siteName} stripeUrl={stripeUrl} />
            <HeroSection stripeUrl={stripeUrl} />
            <FeaturesSection />
            <WorkflowSection />
            <PricingSection stripeUrl={stripeUrl} />
            <Footer />
        </div>
    );
}

/*
 * Navigation Component
 */
function Navigation({siteName, stripeUrl}: {siteName: string; stripeUrl: string}): JSX.Element {
    return (
        <nav className="fixed w-full z-50 top-0 backdrop-blur-md border-b border-white/5 bg-[#050505]/80">
            <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                    <div className="w-5 h-5 bg-white rounded-full"></div>
                    {siteName}
                </div>
                <div className="flex items-center gap-6">
                    <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
                        Caracteristicas
                    </a>
                    <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
                        Precios
                    </a>
                    <a href={stripeUrl} className="text-sm bg-[#1a1a1a] hover:bg-[#222] text-white px-4 py-2 rounded-full transition-colors border border-white/5">
                        Login
                    </a>
                </div>
            </div>
        </nav>
    );
}

/*
 * Hero Section Component
 */
function HeroSection({stripeUrl}: {stripeUrl: string}): JSX.Element {
    return (
        <header className="relative pt-40 pb-20 px-6 overflow-hidden">
            {/* Hero Glow Effect */}
            <div
                className="absolute w-[600px] h-[600px] top-[-200px] left-1/2 -translate-x-1/2 z-[-1] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(5,5,5,0) 70%)'
                }}
            />

            <div className="max-w-[1200px] mx-auto text-center space-y-8">
                <RevealElement>
                    <span className="px-3 py-1 rounded-full bg-[#0f0f0f] text-xs text-gray-400 border border-white/5">v2.0 Disponible Ahora</span>
                </RevealElement>

                <RevealElement delay={100}>
                    <h1
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                        style={{
                            background: 'linear-gradient(180deg, #fff, #888)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                        Importa productos de Amazon.
                        <br />
                        Sin complicaciones.
                    </h1>
                </RevealElement>

                <RevealElement delay={200}>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">Olvidate de las API Keys de Amazon, los proxies y los bloqueos. Glory maneja la infraestructura compleja para que tu solo tengas que vender.</p>
                </RevealElement>

                <RevealElement delay={300}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a href={stripeUrl} className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm w-full sm:w-auto hover:bg-gray-200 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Prueba 30 dias gratis
                        </a>
                        <a href="#features" className="px-8 py-3.5 rounded-full font-medium text-sm text-gray-400 hover:text-white transition-colors w-full sm:w-auto">
                            Como funciona
                        </a>
                    </div>
                </RevealElement>
            </div>

            {/* UI Mockup */}
            <RevealElement delay={400} className="mt-20 max-w-[1200px] mx-auto">
                <UIMockup />
            </RevealElement>
        </header>
    );
}

/*
 * UI Mockup Component
 */
function UIMockup(): JSX.Element {
    return (
        <div className="bg-[#090909] rounded-xl p-1 shadow-2xl overflow-hidden relative">
            {/* Mockup Header */}
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-[#050505]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                <div className="ml-4 text-[10px] text-gray-600 font-mono">wp-admin / glory / import</div>
            </div>

            {/* Mockup Body */}
            <div className="p-8 grid md:grid-cols-4 gap-8">
                {/* Sidebar Mock */}
                <div className="hidden md:block space-y-3 col-span-1 border-r border-white/5 pr-6">
                    <div className="h-8 bg-white/5 rounded w-full" />
                    <div className="h-8 bg-transparent rounded w-3/4" />
                    <div className="h-8 bg-transparent rounded w-5/6" />
                </div>

                {/* Content Mock */}
                <div className="col-span-3 space-y-6">
                    <div className="flex gap-4">
                        <div className="h-10 bg-[#111] rounded flex-1 flex items-center px-4 text-gray-500 text-sm">sony wh-1000xm5...</div>
                        <div className="h-10 w-24 bg-white text-black rounded flex items-center justify-center text-sm font-bold">Buscar</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Product Card Mock 1 */}
                        <div className="bg-[#0c0c0c] p-4 rounded-lg space-y-3">
                            <div className="w-full h-32 bg-[#151515] rounded flex items-center justify-center">
                                <Headphones className="text-gray-700" size={32} />
                            </div>
                            <div className="h-2 rounded bg-[#222] w-3/4" />
                            <div className="h-2 rounded bg-white/20 w-1/4" />
                            <div className="flex justify-between items-center pt-2">
                                <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
                                <div className="h-8 w-24 bg-white/10 rounded" />
                            </div>
                        </div>

                        {/* Product Card Mock 2 */}
                        <div className="bg-[#0c0c0c] p-4 rounded-lg space-y-3 opacity-50">
                            <div className="w-full h-32 bg-[#151515] rounded" />
                            <div className="h-2 rounded bg-[#222] w-2/3" />
                            <div className="h-2 rounded bg-white/20 w-1/3" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
        </div>
    );
}

/*
 * Features Section Component
 */
function FeaturesSection(): JSX.Element {
    const features = [
        {
            icon: Zap,
            title: 'Importacion Instantanea',
            description: 'Busca por palabra clave o ASIN directamente desde tu panel. Importa titulos, precios, descripciones e imagenes en un clic.'
        },
        {
            icon: ShieldCheck,
            title: 'Infraestructura Gestionada',
            description: 'Manejamos los servidores, los proxies rotativos y las licencias. Tu no necesitas configurar nada tecnico.'
        },
        {
            icon: Image,
            title: 'Imagenes Locales',
            description: 'Las imagenes se descargan a tu biblioteca de medios automaticamente. Sin hotlinking, sin riesgos.'
        }
    ];

    return (
        <section id="features" className="py-32 relative">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="mb-20">
                    <RevealElement>
                        <h2 className="text-3xl font-bold mb-4">
                            Ingenieria compleja.
                            <br />
                            <span className="text-gray-500">Experiencia simple.</span>
                        </h2>
                    </RevealElement>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <RevealElement key={feature.title} delay={index * 100}>
                            <div className="bg-[#090909] p-8 rounded-2xl flex flex-col justify-between h-64 transition-all duration-300 hover:bg-[#0c0c0c] hover:-translate-y-0.5">
                                <div>
                                    <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center mb-4 text-white">
                                        <feature.icon size={20} />
                                    </div>
                                    <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        </RevealElement>
                    ))}
                </div>
            </div>
        </section>
    );
}

/*
 * Workflow Section Component
 */
function WorkflowSection(): JSX.Element {
    const steps = [
        {
            number: '01',
            title: 'Instala el Plugin',
            description: 'Sube el archivo .zip a tu WordPress y activa tu licencia unica.'
        },
        {
            number: '02',
            title: 'Busca Productos',
            description: 'Escribe lo que quieres vender (ej. "auriculares sony") y ve los resultados en tiempo real.'
        },
        {
            number: '03',
            title: 'Publica y Monetiza',
            description: 'Glory crea el post, asigna la categoria y descarga las imagenes. Listo para vender.'
        }
    ];

    return (
        <section className="py-20 border-t border-white/5">
            <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                <RevealElement className="space-y-8">
                    <h2 className="text-3xl font-bold">Un flujo de trabajo disenado para la velocidad.</h2>
                    <div className="space-y-6">
                        {steps.map(step => (
                            <div key={step.number} className="flex gap-4">
                                <span className="text-gray-600 font-mono text-sm pt-1">{step.number}</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">{step.title}</h4>
                                    <p className="text-sm text-gray-400">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </RevealElement>

                <RevealElement delay={200}>
                    <div className="bg-[#090909] aspect-square rounded-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}} />
                        <div className="text-center space-y-4 relative z-10">
                            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                                <Server className="text-black" size={24} />
                            </div>
                            <div className="h-12 w-[1px] bg-gradient-to-b from-white to-transparent mx-auto" />
                            <div className="flex gap-4 justify-center">
                                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-white/10">
                                    <span className="text-gray-400 text-xs font-bold">WP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </RevealElement>
            </div>
        </section>
    );
}

/*
 * Pricing Section Component
 */
function PricingSection({stripeUrl}: {stripeUrl: string}): JSX.Element {
    return (
        <section id="pricing" className="py-32">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="text-center mb-16">
                    <RevealElement>
                        <h2 className="text-3xl font-bold mb-4">Elige tu velocidad.</h2>
                    </RevealElement>
                    <RevealElement delay={100}>
                        <p className="text-gray-400">Comienza gratis con herramientas manuales o automatiza todo con Pro.</p>
                    </RevealElement>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <StarterPlan />
                    <ProPlan stripeUrl={stripeUrl} />
                </div>
            </div>
        </section>
    );
}

function StarterPlan(): JSX.Element {
    return (
        <RevealElement>
            <div className="bg-[#090909] rounded-3xl p-8 border border-white/5 relative transition-all duration-300 hover:bg-[#0c0c0c] hover:-translate-y-0.5">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-sm text-gray-400 mb-6">Para empezar a vender manualmente.</p>

                <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-4xl font-bold text-white">$0</span>
                    <span className="text-gray-500">/mes</span>
                </div>

                <a href="#" className="block w-full bg-[#1a1a1a] hover:bg-[#222] text-white py-3 rounded-xl font-medium text-center transition-colors mb-8 border border-white/10">
                    Descargar Plugin
                </a>

                <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <Check className="text-white mt-0.5 flex-shrink-0" size={16} />
                        <span>
                            <strong>Importacion Manual</strong>
                            <br />
                            <span className="text-xs text-gray-500">Copia y pega HTML de Amazon</span>
                        </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <Check className="text-white mt-0.5 flex-shrink-0" size={16} />
                        <span>
                            <strong>Renderizado de Productos</strong>
                            <br />
                            <span className="text-xs text-gray-500">Diseno limpio y optimizado</span>
                        </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="text-white flex-shrink-0" size={16} />
                        Agregar productos manualmente
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="text-white flex-shrink-0" size={16} />
                        Soporte Tag de Afiliados
                    </li>
                </ul>
            </div>
        </RevealElement>
    );
}

function ProPlan({stripeUrl}: {stripeUrl: string}): JSX.Element {
    return (
        <RevealElement delay={100}>
            <div className="bg-[#090909] rounded-3xl p-8 border border-white/20 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                {/* Highlight Gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40" />

                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">Pro</h3>
                    <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Recomendado</span>
                </div>
                <p className="text-sm text-gray-400 mb-6">Automatizacion completa y soporte.</p>

                <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-4xl font-bold text-white">$20</span>
                    <span className="text-gray-500">/mes</span>
                </div>

                <a href={stripeUrl} className="block w-full bg-white text-black py-3 rounded-xl font-medium text-center mb-8 hover:bg-gray-200 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    Prueba 30 dias gratis
                </a>

                <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm text-white font-medium">
                        <CheckCircle className="text-white flex-shrink-0" size={16} />
                        Todo lo del plan Gratis
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <Zap className="text-white mt-0.5 flex-shrink-0" size={16} />
                        <span>
                            <strong>Importacion Automatica</strong>
                            <br />
                            <span className="text-xs text-gray-500">Busca por API sin salir de WP</span>
                        </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <Server className="text-white mt-0.5 flex-shrink-0" size={16} />
                        <span>
                            <strong>4GB Ancho de Banda</strong>
                            <br />
                            <span className="text-xs text-gray-500">Infraestructura gestionada (~15k prods)</span>
                        </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                        <Image className="text-white flex-shrink-0" size={16} />
                        Descarga automatica de imagenes
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                        <LifeBuoy className="text-white flex-shrink-0" size={16} />
                        Soporte Prioritario
                    </li>
                </ul>
            </div>
        </RevealElement>
    );
}

/*
 * Footer Component
 */
function Footer(): JSX.Element {
    return (
        <footer className="py-12 border-t border-white/5">
            <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-sm text-gray-500">&copy; 2025 Glory SaaS. Todos los derechos reservados.</div>
                <div className="flex gap-6">
                    <a href="#" className="text-gray-500 hover:text-white transition-colors">
                        <Twitter size={18} />
                    </a>
                    <a href="#" className="text-gray-500 hover:text-white transition-colors">
                        <Github size={18} />
                    </a>
                    <a href="#" className="text-gray-500 hover:text-white transition-colors">
                        <Mail size={18} />
                    </a>
                </div>
            </div>
        </footer>
    );
}

/*
 * Reveal Animation Component
 * Usa Intersection Observer para animar elementos cuando entran en viewport
 */
function RevealElement({children, delay = 0, className = ''}: {children: React.ReactNode; delay?: number; className?: string}): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {threshold: 0.1}
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
            }}>
            {children}
        </div>
    );
}

export default HomeIsland;
