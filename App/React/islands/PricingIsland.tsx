import {Zap, Database, Smartphone, Calendar, Users} from 'lucide-react';
import {Button, PricingCard} from '../components/ui';
import {PageLayout} from '../components/layout';
import {PricingBreakdown, HeroSection, FaqWithCta, ContactForm, InternalLinks, PricingComparisonAnimation} from '../components/sections';
/* Configuracion dinamica desde Theme Options */
import {useSiteUrls, usePricingConfig} from '../hooks/useSiteConfig';
import type {PricingConfig} from '../hooks/useSiteConfig';

// Links internos especificos para Planes
const pricingInternalLinks = [
    {text: 'Ver servicios detallados', href: '/servicios'},
    {text: '¿Prefieres ver una demo primero?', href: '/demos'},
    {text: 'Contacto (presupuesto en 30s)', href: '/contacto'}
];

/* FUNCION PARA CREAR CONTENIDO CON URLS DINAMICAS */
const createPricingContent = (urls: ReturnType<typeof useSiteUrls>, pricing: PricingConfig) => {
    const formatPrice = (amount: string) => `${amount}${pricing.currency}${pricing.period}`;

    return {
        hero: {
            title: (
                <>
                    Precio chatbot: planes con <span className="text-info">mantenimiento incluido y primer mes gratis</span>
                </>
            ),
            subtitle: 'Te presento tres planes pensados para atender mejor, resolver dudas y, cuando proceda, gestionar reservas. El primer mes es gratis y, luego, hay una cuota mensual que incluye mantenimiento y mejoras continuas.',
            primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: urls.calendly},
            secondaryCta: {text: 'WhatsApp', href: urls.whatsapp},
            tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'}
        },
        breakdown: {
            title: '¿Cómo calculo el precio del chatbot y qué lo determina?',
            description: 'Si buscas referencias de precios chatbot para empresas, te explico qué factores los determinan para que pagues solo por lo que necesitas.',
            items: [
                {icon: Smartphone, title: 'Canales', desc: 'WhatsApp, Instagram DM, tu web y voz (llamadas) — uno o varios.'},
                {icon: Zap, title: 'Automatización', desc: 'Reservas, recordatorios, confirmaciones, etiquetas y avisos.'},
                {icon: Database, title: 'Integraciones', desc: 'Tu agenda (si ya usas Calendly, lo conecto), Google Sheets, email y tu Software/CRM.'},
                {icon: Users, title: 'Volumen y soporte', desc: 'Actividad mensual y mantenimiento (revisión de conversiones y mejoras).'}
            ]
        },
        plans: {
            title: 'Planes chatbot (elige y ajustamos juntos)',
            subtitle: 'Sin permanencias. Puedes cambiar de plan en cualquier momento.',
            cards: [
                {
                    title: 'Basico',
                    price: formatPrice(pricing.basico),
                    description: 'Ideal para empezar con un solo canal y automatizar lo esencial.',
                    features: ['1 canal a elegir (WhatsApp o Web o Instagram DM)', 'FAQs utiles + derivacion a humano con historial', 'Formularios a tu Software/CRM (o hoja compartida)', '1 automatizacion ligera (recordatorio o control)', 'Mantenimiento incluido - primer mes gratis'],
                    ctaText: 'Agenda en 30 s',
                    ctaHref: urls.calendly,
                    recommended: false
                },
                {
                    title: 'Avanzado',
                    price: formatPrice(pricing.avanzado),
                    description: 'Automatizacion de reservas y conexion completa de datos.',
                    features: ['1-2 canales (WhatsApp/IG/Web)', 'Reservas automaticas con tu agenda (incl. Calendly)', '3 automatizaciones (confirmaciones, etiquetas, avisos)', 'Integraciones: tu Software/CRM, Google Sheets, email', 'Mantenimiento incluido - primer mes gratis'],
                    ctaText: 'Hablame ahora',
                    ctaHref: urls.calendly,
                    recommended: true
                },
                {
                    title: 'Total',
                    price: formatPrice(pricing.total),
                    description: 'La solucion completa para todos los puntos de contacto.',
                    features: ['2-3 canales (WhatsApp, IG, Web) + voz (llamadas)', '5-6 automatizaciones (recordatorios, cambios estado)', 'Integraciones avanzadas con Software/CRM y ERP', 'Auditoria mensual de conversion', 'Mantenimiento incluido - primer mes gratis'],
                    ctaText: 'Agenda en 30 s',
                    ctaHref: urls.calendly,
                    recommended: false
                }
            ]
        },
        marketComparison: {
            title: 'Qué verás en el mercado y por qué lo hago distinto',
            text: 'Muchos proveedores muestran planes por suscripción con features cerrados y otros estiman precio según alcance e integraciones. Yo prefiero definir juntos el/los canal(es), las automatizaciones y las integraciones para se adapten totalmente a lo que quieres conseguir, y, después, mantenerlo mensualmente y mejorarlo.'
        },
        faq: {
            title: 'FAQs (responden a dudas de precio)',
            items: [
                {question: '¿Precios chatbot WhatsApp y tarifas?', answer: 'Depende de los canales, la automatización y las integraciones que necesites. En cuanto a tarifas chatbot whatsapp, ajusto el alcance a tu caso y te paso propuesta clara tras una llamada breve. Primer mes gratis para verlo en marcha.'},
                {question: '¿Puedo cambiar de plan cuando quiera?', answer: 'Sí. Sin permanencias: puedes subir o bajar entre mis planes chatbot según tu carga y objetivos del mes. Ajusto el alcance y el soporte; el mantenimiento sigue activo para no perder tracción.'},
                {question: '¿Precios chatbot Instagram empresas?', answer: 'Si IG DM es clave, puedo incluirlo en Básico/Avanzado/Total. Ajusto el alcance (respuestas, derivación y, si encaja, reservas).'},
                {question: '¿Precio chatbot web para empresas?', answer: 'Varía según alcance (FAQs, derivación a humano, automatizaciones e integraciones con tu web/agenda/Sheets/CRM). En mis planes chatbot el widget y las FAQs básicas van incluidos.'},
                {question: '¿Precio automatizar reservas por WhatsApp?', answer: 'Depende de las reglas de tu negocio (horarios, duración/buffer, antelación, cancelación y asignación por profesional/sede) y de si conecto con tu agenda. Yo implementaré tus reglas e incluiré recordatorios. Tras una llamada breve te paso propuesta. Primer mes gratis.'},
                {question: '¿Precio integración WhatsApp + Calendly/Google Sheets?', answer: 'Depende del alcance: en Calendly puedo solo leer citas o también crear/actualizar/cancelar y enviar recordatorios, y en Google Sheets desde guardar leads básico hasta mapear columnas con validaciones y envíos automáticos, y tras una llamada te doy precio cerrado con primer mes gratis.'},
                {question: '¿Planes chatbot con mantenimiento incluido?', answer: 'Sí. Todos. Revisión de conversaciones y mejoras continuas cada mes.'},
                {question: '¿Precio voicebot (para empresas)?', answer: 'Si el canal de voz te aporta, lo añado en el Plan Total y ajusto la propuesta.'}
            ],
            ctaTitle: '¿Hablamos?',
            ctaItems: [
                {text: 'Agenda en 30 s', href: urls.calendly, variant: 'primary'},
                {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: urls.whatsapp, variant: 'outline'},
                {text: 'Te leo y te respondo hoy', href: '#formulario', variant: 'ghost'}
            ]
        }
    };
};

/* ISLAND PRINCIPAL */
export function PricingIsland(): JSX.Element {
    /* Obtener URLs dinamicas desde Theme Options (configurables en WP Admin) */
    const urls = useSiteUrls();
    /* Obtener precios dinamicos desde Theme Options */
    const pricing = usePricingConfig();
    /* Crear contenido con URLs y precios dinamicos */
    const pricingContent = createPricingContent(urls, pricing);

    return (
        <PageLayout headerCtaText="Agendar 1:1" topBanner={{text: 'Primer mes gratis - Mantenimiento incluido', linkText: 'Agenda ahora', linkHref: urls.calendly}}>
            {/* 1. HERO SECTION */}
            <HeroSection title={pricingContent.hero.title} subtitle={pricingContent.hero.subtitle} primaryCta={pricingContent.hero.primaryCta} secondaryCta={pricingContent.hero.secondaryCta} tertiaryCta={pricingContent.hero.tertiaryCta} />

            {/* 2. COMO CALCULO EL PRECIO */}
            <section id="como-calculo" className="py-12 bg-surface p-6">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{pricingContent.breakdown.title}</h2>
                        <p className="mt-4 text-lg leading-8 text-secondary mb-8">{pricingContent.breakdown.description}</p>
                        <div className="flex justify-center">
                            <Button href={urls.calendly} icon={Calendar}>
                                Hablame ahora y respondo en menos de 30 min
                            </Button>
                        </div>
                    </div>
                </div>
                <PricingBreakdown items={pricingContent.breakdown.items} />
            </section>

            {/* 3. PLANES GRID */}
            <section id="pricing-grid" className="py-16 mx-auto w-full max-w-7xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xlmb-4">{pricingContent.plans.title}</h2>
                    <p className="text-secondary">{pricingContent.plans.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
                    {pricingContent.plans.cards.map((plan, i) => (
                        <PricingCard key={i} title={plan.title} price={plan.price} description={plan.description} features={plan.features} recommended={plan.recommended} ctaText={plan.ctaText} ctaHref={plan.ctaHref} />
                    ))}
                </div>
                <p className="text-center text-secondary text-sm mt-8 italic">Los precios son aproximados y pueden variar ligeramente en función de la complejidad de la solución.</p>
            </section>

            {/* 4. COMPARATIVA DE MERCADO (TEXTO + ANIMACION) */}
            <section id="comparativa" className="py-16 bg-primary">
                <div className="mx-auto max-w-3xl px-6 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-6">{pricingContent.marketComparison.title}</h2>
                    <p className="text-lg leading-relaxed text-secondary">{pricingContent.marketComparison.text}</p>
                </div>
                <PricingComparisonAnimation />
            </section>

            {/* 6. FAQS */}
            <FaqWithCta title={pricingContent.faq.title} items={pricingContent.faq.items} />

            {/* 7. FORMULARIO CONTACTO */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rápido con respuesta hoy mismo" />

            {/* 8. INTERLINKING */}
            <InternalLinks title="Te puede interesar" links={pricingInternalLinks} />
        </PageLayout>
    );
}
