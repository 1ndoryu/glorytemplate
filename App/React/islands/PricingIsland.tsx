import {MessageSquare, Zap, Database, ShieldCheck} from 'lucide-react';

// Componentes UI reutilizables
import {Button, FaqItem, PricingCard} from '../components/ui';

// Layout compartido
import {PageLayout} from '../components/layout';

// Componentes de seccion reutilizables
import {PricingBreakdown, ComparisonSection} from '../components/sections';

// Configuracion centralizada
import {siteUrls} from '../config';

// --- CONFIGURACION DE CONTENIDO ESPECIFICO DE PRICING ---
const pricingContent = {
    plans: [
        {
            title: 'Basico',
            price: 'Consultar',
            description: 'Para empresas que quieren empezar a automatizar lo esencial.',
            features: ['1 Canal (WhatsApp, Web o IG)', 'Respuestas a FAQs frecuentes', 'Derivacion a humano con historial', 'Formularios a CRM o Sheet basico', '1 Automatizacion simple', 'Mantenimiento incluido'],
            ctaText: 'Empezar Gratis'
        },
        {
            title: 'Avanzado',
            price: 'Consultar',
            description: 'Automatizacion completa de reservas y seguimiento de clientes.',
            recommended: true,
            features: ['1-2 Canales Integrados', 'Reservas automaticas (Agenda/Calendly)', 'Recordatorios y confirmaciones', 'Etiquetado de leads automatico', 'Integracion CRM completa', '3 Automatizaciones avanzadas', 'Soporte Prioritario'],
            ctaText: 'Agendar Consultoria'
        },
        {
            title: 'Total',
            price: 'A medida',
            description: 'Ecosistema multicanal con voz y procesos complejos.',
            features: ['Omnicanal (WhatsApp + Web + Voz)', 'Voicebot para llamadas entrantes', 'Integracion ERP/Facturacion', 'Dashboards de metricas a medida', 'Automatizaciones ilimitadas', 'Auditoria mensual de conversion', 'Mantenimiento Premium'],
            ctaText: 'Hablar con Guillermo'
        }
    ],
    breakdownItems: [
        {icon: MessageSquare, title: 'Canales', desc: 'Solo WhatsApp o tambien Instagram y Web? Mas canales, mas puntos de entrada.'},
        {icon: Zap, title: 'Automatizacion', desc: "No es lo mismo responder 'Hola' que consultar tu stock en tiempo real y reservar."},
        {icon: Database, title: 'Integraciones', desc: 'Conectamos con un Google Sheet simple o con un Salesforce/ERP complejo?'},
        {icon: ShieldCheck, title: 'Mantenimiento', desc: 'Incluye ajustes de respuestas, revision de conversaciones y soporte tecnico.'}
    ],
    comparisonItems: ['Configuracion tecnica', 'Diseno de flujos', 'Alta en WhatsApp API', 'Soporte directo (WhatsApp)'],
    faqItems: [
        {question: 'Puedo cambiar de plan mas adelante?', answer: 'Si, totalmente. Sin permanencias. Si tu negocio crece y necesitas añadir Instagram o Voz, ajustamos el plan y listo.'},
        {question: "Que incluye exactamente el 'Primer Mes Gratis'?", answer: 'Incluye el uso de la licencia del software del bot y mi soporte durante 30 dias tras el lanzamiento. Solo pagas (si aplica) los costes directos de WhatsApp API (meta cobra centimos por conversacion), pero mi servicio es gratuito para que veas el valor.'},
        {question: 'Cual es el coste de WhatsApp API?', answer: 'Meta cobra una pequeña tarifa por conversacion (aprox 0.05 en España) iniciada por el negocio. Las primeras 1000 conversaciones de servicio al mes suelen ser gratuitas. Yo te ayudo a configurarlo en tu propia tarjeta.'},
        {question: 'Haces factura?', answer: 'Por supuesto. Soy autonomo registrado en España y emito factura valida con todos los impuestos correspondientes.'}
    ]
};

// --- ISLAND PRINCIPAL ---
export function PricingIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Agendar 1:1" copyrightType="consultoria">
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
                    Diseno a medida, no suscripciones enlatadas. Defines que necesitas, lo construyo, y luego pago mensual por mantenimiento y mejoras.
                </p>
            </section>

            {/* 2. PRICING GRID */}
            <section id="pricing-grid" className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
                    {pricingContent.plans.map((plan, i) => (
                        <PricingCard key={i} title={plan.title} price={plan.price} description={plan.description} features={plan.features} recommended={plan.recommended} ctaText={plan.ctaText} ctaHref={siteUrls.calendly} />
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs font-mono" style={{color: 'var(--color-text-subtle)'}}>
                        * El precio final depende de la complejidad de los flujos. El mantenimiento asegura que tu bot nunca deje de funcionar.
                    </p>
                </div>
            </section>

            {/* 3. COMO CALCULO EL PRECIO */}
            <PricingBreakdown items={pricingContent.breakdownItems} />

            {/* 4. COMPARATIVA 1:1 VS SAAS */}
            <ComparisonSection includedItems={pricingContent.comparisonItems} />

            {/* 5. FAQS PRECIO */}
            <section id="pricing-faq" className="mx-auto w-full max-w-2xl pb-12">
                <h2 className="text-xl font-medium tracking-tight mb-6 md:text-center" style={{color: 'var(--color-text-primary)'}}>
                    Preguntas sobre Precios
                </h2>
                <div className="space-y-1 mb-12">
                    {pricingContent.faqItems.map((item, i) => (
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
        </PageLayout>
    );
}
