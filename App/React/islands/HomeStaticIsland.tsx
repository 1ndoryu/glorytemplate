/**
 * HomeStaticIsland - Landing Page SIN Page Builder
 *
 * Esta pagina demuestra que el Page Builder es COMPLETAMENTE OPCIONAL.
 * Usa el mismo PageLayout para nav/footer, pero el contenido
 * se renderiza directamente sin bloques editables.
 *
 * CUANDO USAR ESTO:
 * - Paginas con contenido estatico que no necesita edicion
 * - Paginas con layouts muy custom que no encajan en bloques
 * - Cuando quieres control total del markup
 *
 * La diferencia con HomeIsland:
 * - HomeIsland: usa bloques editables via PageBuilder
 * - HomeStaticIsland: contenido hardcodeado, no editable visualmente
 */

import {PageLayout} from '@/pageBuilder';

interface HomeStaticIslandProps {
    siteName?: string;
    stripeUrl?: string;
}

export function HomeStaticIsland({siteName = 'Glory', stripeUrl = 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c'}: HomeStaticIslandProps): JSX.Element {
    return (
        <PageLayout
            siteName={siteName}
            navLinks={[
                {text: 'Caracteristicas', href: '#features', hideOnMobile: true},
                {text: 'Precios', href: '#pricing', hideOnMobile: true}
            ]}
            navCtaText="Login"
            navCtaUrl={stripeUrl}
            socialLinks={[
                {type: 'twitter', href: '#'},
                {type: 'github', href: '#'},
                {type: 'mail', href: '#'}
            ]}
            /* SIN PAGE BUILDER - contenido como children */
            usePageBuilder={false}>
            {/* Hero Section - contenido estatico */}
            <header id="hero-section" className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div
                    className="absolute w-[600px] h-[600px] top-[-200px] left-1/2 -translate-x-1/2 z-[-1] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(5,5,5,0) 70%)'
                    }}
                />

                <div className="max-w-[1200px] mx-auto text-center space-y-8">
                    <span className="px-3 py-1 rounded-full bg-[#0f0f0f] text-xs text-gray-400 border border-white/5">v2.0 Disponible Ahora</span>

                    <h1
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                        style={{
                            background: 'linear-gradient(180deg, #fff, #888)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                        Importa productos de Amazon.
                        <br />
                        Sin complicaciones.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">Olvidate de las API Keys de Amazon, los proxies y los bloqueos. Glory maneja la infraestructura compleja para que tu solo tengas que vender.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a href={stripeUrl} className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm w-full sm:w-auto hover:bg-gray-200 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Prueba 30 dias gratis
                        </a>
                        <a href="#features" className="px-8 py-3.5 rounded-full font-medium text-sm text-gray-400 hover:text-white transition-colors w-full sm:w-auto">
                            Como funciona
                        </a>
                    </div>
                </div>
            </header>

            {/* Features Section - contenido estatico */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-[1200px] mx-auto">
                    <div className="text-center mb-16">
                        <h2
                            className="text-4xl md:text-5xl font-bold mb-4"
                            style={{
                                background: 'linear-gradient(180deg, #fff, #666)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                            Ingenieria compleja.
                        </h2>
                        <p className="text-xl text-gray-500">Experiencia simple.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon="⚡" title="Importacion Instantanea" description="Busca por palabra clave o ASIN directamente desde tu panel. Importa titulos, precios, descripciones e imagenes en un clic." />
                        <FeatureCard icon="🛡️" title="Infraestructura Gestionada" description="Manejamos los servidores, los proxies rotativos y las licencias. Tu no necesitas configurar nada tecnico." />
                        <FeatureCard icon="🖼️" title="Imagenes Locales" description="Las imagenes se descargan a tu biblioteca de medios automaticamente. Sin hotlinking, sin riesgos." />
                    </div>
                </div>
            </section>

            {/* Pricing Section - contenido estatico */}
            <section id="pricing" className="py-24 px-6 bg-[#0a0a0a]">
                <div className="max-w-[1200px] mx-auto">
                    <div className="text-center mb-16">
                        <h2
                            className="text-4xl md:text-5xl font-bold mb-4"
                            style={{
                                background: 'linear-gradient(180deg, #fff, #666)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                            Elige tu velocidad.
                        </h2>
                        <p className="text-xl text-gray-500">Comienza gratis con herramientas manuales o automatiza todo con Pro.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <PricingCard name="Starter" price="$0" description="Para empezar a vender manualmente." features={['Importacion Manual', 'Renderizado de Productos', 'Agregar productos manualmente', 'Soporte Tag de Afiliados']} ctaText="Descargar Plugin" ctaUrl="#" />
                        <PricingCard name="Pro" price="$20" description="Automatizacion completa y soporte." features={['Todo lo del plan Gratis', 'Importacion Automatica', '4GB Ancho de Banda', 'Descarga automatica de imagenes', 'Soporte Prioritario']} ctaText="Prueba 30 dias gratis" ctaUrl={stripeUrl} isRecommended />
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}

/*
 * Componente local para feature cards (no es un bloque del Page Builder)
 */
function FeatureCard({icon, title, description}: {icon: string; title: string; description: string}): JSX.Element {
    return (
        <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/5">
            <div className="text-3xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}

/*
 * Componente local para pricing cards (no es un bloque del Page Builder)
 */
function PricingCard({name, price, description, features, ctaText, ctaUrl, isRecommended = false}: {name: string; price: string; description: string; features: string[]; ctaText: string; ctaUrl: string; isRecommended?: boolean}): JSX.Element {
    return (
        <div className={`p-8 rounded-2xl border ${isRecommended ? 'border-white/20 bg-[#111]' : 'border-white/5 bg-[#0a0a0a]'}`} style={isRecommended ? {boxShadow: '0 0 40px rgba(255,255,255,0.05)'} : {}}>
            {isRecommended && <span className="text-xs text-gray-400 uppercase tracking-wider">Recomendado</span>}

            <h3 className="text-2xl font-bold mt-2">{name}</h3>
            <p className="text-gray-500 mt-1">{description}</p>

            <div className="mt-6 mb-8">
                <span className="text-5xl font-bold">{price}</span>
                <span className="text-gray-500">/mes</span>
            </div>

            <ul className="space-y-3 mb-8">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                        <span className="text-green-400">✓</span>
                        {feature}
                    </li>
                ))}
            </ul>

            <a href={ctaUrl} className={`block w-full text-center py-3 rounded-full font-medium transition-all ${isRecommended ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-[#222]'}`}>
                {ctaText}
            </a>
        </div>
    );
}

export default HomeStaticIsland;
