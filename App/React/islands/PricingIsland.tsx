import {useTheme} from '../hooks/useTheme';
import {useFontLoader, fontFamilyByTheme} from '../hooks/useFontLoader';

// Componentes UI reutilizables
import {Button, ThemeToggle, FaqItem, PricingCard} from '../components/ui';

// Componentes de seccion reutilizables
import {Header, Footer} from '../components/sections';

// Configuracion centralizada
import {siteUrls, mainNavItems, logoText, footerColumns, getCopyrightText} from '../config';

// --- ISLAND PRINCIPAL ---

export function PricingIsland(): JSX.Element {
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
                <section id="pricing-hero" className="mx-auto w-full max-w-7xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium mb-6 border" style={{backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-primary)'}}>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Sin permanencias - Primer mes gratis
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-balance mb-6 max-w-4xl mx-auto" style={{color: 'var(--color-text-primary)'}}>
                        Planes flexibles con <span style={{color: 'var(--color-text-subtle)'}}>mantenimiento incluido.</span>
                    </h1>
                    <p className="text-lg leading-relaxed max-w-2xl mx-auto font-light mb-8" style={{color: 'var(--color-text-muted)'}}>
                        Diseño a medida, no suscripciones enlatadas. Defines que necesitas, lo construyo, y luego pago mensual por mantenimiento y mejoras.
                    </p>
                </section>

                {/* 2. PRICING GRID */}
                <section id="pricing-grid" className="mx-auto w-full max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
                        <PricingCard title="Basico" price="Consultar" description="Para empresas que quieren empezar a automatizar lo esencial." features={['1 Canal (WhatsApp, Web o IG)', 'Respuestas a FAQs frecuentes', 'Derivacion a humano con historial', 'Formularios a CRM o Sheet basico', '1 Automatizacion simple', 'Mantenimiento incluido']} ctaText="Empezar Gratis" ctaHref={siteUrls.calendly} />

                        <PricingCard title="Avanzado" price="Consultar" description="Automatizacion completa de reservas y seguimiento de clientes." recommended={true} features={['1-2 Canales Integrados', 'Reservas automaticas (Agenda/Calendly)', 'Recordatorios y confirmaciones', 'Etiquetado de leads automatico', 'Integracion CRM completa', '3 Automatizaciones avanzadas', 'Soporte Prioritario']} ctaText="Agendar Consultoria" ctaHref={siteUrls.calendly} />

                        <PricingCard title="Total" price="A medida" description="Ecosistema multicanal con voz y procesos complejos." features={['Omnicanal (WhatsApp + Web + Voz)', 'Voicebot para llamadas entrantes', 'Integracion ERP/Facturacion', 'Dashboards de metricas a medida', 'Automatizaciones ilimitadas', 'Auditoria mensual de conversion', 'Mantenimiento Premium']} ctaText="Hablar con Guillermo" ctaHref={siteUrls.calendly} />
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-mono" style={{color: 'var(--color-text-subtle)'}}>
                            * El precio final depende de la complejidad de los flujos. El mantenimiento asegura que tu bot nunca deje de funcionar.
                        </p>
                    </div>
                </section>

                {/* 3. COMO CALCULO EL PRECIO */}
                <PricingBreakdownSection />

                {/* 4. COMPARATIVA 1:1 VS SAAS */}
                <ComparisonSection />

                {/* 5. FAQS PRECIO */}
                <PricingFaqSection />
            </main>

            {/* FOOTER */}
            <div id="footer-wrapper">
                <Footer columns={footerColumns} copyrightText={getCopyrightText('consultoria')} />
            </div>

            {/* THEME TOGGLE */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
    );
}

// --- SECCIONES LOCALES (especificas de esta pagina) ---

import {MessageSquare, Zap, Database, ShieldCheck, Check} from 'lucide-react';

function PricingBreakdownSection() {
    const breakdownItems = [
        {icon: MessageSquare, title: 'Canales', desc: 'Solo WhatsApp o tambien Instagram y Web? Mas canales, mas puntos de entrada.'},
        {icon: Zap, title: 'Automatizacion', desc: "No es lo mismo responder 'Hola' que consultar tu stock en tiempo real y reservar."},
        {icon: Database, title: 'Integraciones', desc: 'Conectamos con un Google Sheet simple o con un Salesforce/ERP complejo?'},
        {icon: ShieldCheck, title: 'Mantenimiento', desc: 'Incluye ajustes de respuestas, revision de conversaciones y soporte tecnico.'}
    ];

    return (
        <section id="pricing-breakdown" className="mx-auto w-full max-w-7xl">
            <div className="mb-8 md:text-center max-w-3xl mx-auto">
                <h2 className="text-2xl font-medium tracking-tight" style={{color: 'var(--color-text-primary)'}}>
                    Que determina el precio?
                </h2>
                <p className="text-sm mt-2" style={{color: 'var(--color-text-muted)'}}>
                    No cobro por usuario ni por mensaje. Cobro por la complejidad de la solucion.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {breakdownItems.map((item, i) => (
                    <div key={i} className="p-6 border rounded-lg hover:shadow-sm transition-shadow" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                        <div className="w-8 h-8 rounded-md flex items-center justify-center mb-4" style={{backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)'}}>
                            <item.icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold mb-2" style={{color: 'var(--color-text-primary)'}}>
                            {item.title}
                        </h3>
                        <p className="text-xs leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ComparisonSection() {
    const includedItems = ['Configuracion tecnica', 'Diseno de flujos', 'Alta en WhatsApp API', 'Soporte directo (WhatsApp)'];

    return (
        <section id="comparison-section" className="mx-auto w-full max-w-4xl rounded-xl p-8 md:p-12 border" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)'}}>
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-4" style={{color: 'var(--color-text-primary)'}}>
                        Por que no contratar una herramienta SaaS?
                    </h2>
                    <p className="text-sm leading-relaxed mb-4" style={{color: 'var(--color-text-muted)'}}>
                        Las herramientas de "hazlo tu mismo" (SaaS) te cobran una mensualidad pero te dejan solo con la configuracion. Si algo falla, eres tu quien debe arreglarlo.
                    </p>
                    <p className="text-sm leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                        <strong>Conmigo contratas una solucion llave en mano.</strong> Yo diseño, conecto y mantengo. Tu solo atiendes a los clientes que llegan.
                    </p>
                </div>
                <div className="flex-none w-full md:w-auto">
                    <div className="p-6 rounded-lg shadow-sm border w-full md:w-72" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                        <h4 className="text-xs font-mono uppercase mb-4 tracking-wide" style={{color: 'var(--color-text-subtle)'}}>
                            Incluido en el servicio
                        </h4>
                        <ul className="space-y-3">
                            {includedItems.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm" style={{color: 'var(--color-text-secondary)'}}>
                                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

function PricingFaqSection() {
    const faqItems = [
        {question: 'Puedo cambiar de plan mas adelante?', answer: 'Si, totalmente. Sin permanencias. Si tu negocio crece y necesitas añadir Instagram o Voz, ajustamos el plan y listo.'},
        {question: "Que incluye exactamente el 'Primer Mes Gratis'?", answer: 'Incluye el uso de la licencia del software del bot y mi soporte durante 30 dias tras el lanzamiento. Solo pagas (si aplica) los costes directos de WhatsApp API (meta cobra centimos por conversacion), pero mi servicio es gratuito para que veas el valor.'},
        {question: 'Cual es el coste de WhatsApp API?', answer: 'Meta cobra una pequeña tarifa por conversacion (aprox 0.05 en España) iniciada por el negocio. Las primeras 1000 conversaciones de servicio al mes suelen ser gratuitas. Yo te ayudo a configurarlo en tu propia tarjeta.'},
        {question: 'Haces factura?', answer: 'Por supuesto. Soy autonomo registrado en España y emito factura valida con todos los impuestos correspondientes.'}
    ];

    return (
        <section id="pricing-faq" className="mx-auto w-full max-w-2xl pb-12">
            <h2 className="text-xl font-medium tracking-tight mb-6 md:text-center" style={{color: 'var(--color-text-primary)'}}>
                Preguntas sobre Precios
            </h2>
            <div className="space-y-1 mb-12">
                {faqItems.map((item, i) => (
                    <FaqItem key={i} question={item.question} answer={item.answer} />
                ))}
            </div>

            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>
                    Dudas con el presupuesto?
                </h3>
                <p className="text-sm mb-6" style={{color: 'var(--color-text-muted)'}}>
                    Hagamos una llamada rapida de 15 minutos y te doy una cifra exacta.
                </p>
                <div className="flex justify-center gap-3">
                    <Button href={siteUrls.calendly} className="border-0">
                        Agendar llamada
                    </Button>
                    <Button href={siteUrls.whatsapp} variant="outline">
                        Preguntar por WhatsApp
                    </Button>
                </div>
            </div>
        </section>
    );
}
