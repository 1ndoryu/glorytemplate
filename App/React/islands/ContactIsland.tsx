/**
 * ContactIsland - Pagina de Contacto
 *
 * Estructura segun project-extends.md:
 * - Hero con H1 y CTAs
 * - Seccion "Que necesitas" (5 opciones H3)
 * - Formulario RGPD completo
 * - Seccion "Que pasa despues" (3 pasos)
 * - FAQs (5 preguntas cortas)
 * - Interlinking
 */

import {Calendar, MessageSquare, Clock, CheckCircle, ArrowRight, Zap, FileSpreadsheet, Bot} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {HeroSection, ContactForm, FaqWithCta, InternalLinks} from '../components/sections';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../hooks/useSiteConfig';

// --- TIPOS ---
interface ContactOption {
    icon: React.ElementType;
    title: string;
    description: string;
    cta: string;
    href: string;
}

interface Step {
    number: string;
    title: string;
    description: string;
}

// --- DATOS ESTATICOS ---
const nextSteps: Step[] = [
    {
        number: '01',
        title: 'Te respondo hoy',
        description: 'Reviso tu mensaje y te contacto por tu canal preferido.'
    },
    {
        number: '02',
        title: 'Llamada breve (15-20 min)',
        description: 'Entiendo tu situacion, objetivos y te cuento como puedo ayudarte.'
    },
    {
        number: '03',
        title: 'Propuesta clara',
        description: 'Te envio un presupuesto sin letra pequena en 24-48h.'
    }
];

const contactFaqs = [
    {
        question: 'Cuanto cuesta una consulta inicial?',
        answer: 'La primera llamada es gratuita y sin compromiso. Hablamos sobre tu caso y te doy mi opinion honesta.'
    },
    {
        question: 'En cuanto tiempo me respondes?',
        answer: 'Por WhatsApp, en menos de 30 minutos (de 09:00 a 21:00). Por formulario o email, el mismo dia.'
    },
    {
        question: 'Trabajas solo con empresas grandes?',
        answer: 'No, trabajo con empresas de todos los tamanos. Desde autonomos hasta pymes con equipos de venta.'
    },
    {
        question: 'Puedo ver una demo antes de decidir?',
        answer: 'Si, puedo prepararte un prototipo en 72h para que veas como funcionaria en tu caso concreto.'
    },
    {
        question: 'Que pasa si no me convence?',
        answer: 'Sin problema. La llamada inicial no tiene compromiso y el primer mes es gratis para que pruebes.'
    }
];

// Enlaces internos para contacto
const contactInternalLinks = [
    {text: 'Aun no lo tienes claro: ver demos', href: '/demos'},
    {text: 'Revisar planes y precios', href: '/planes'},
    {text: 'Volver a servicios', href: '/servicios'},
    {text: 'Conocerme mejor', href: '/sobre-mi'}
];

// --- FUNCION PARA CREAR CONTENIDO CON URLS DINAMICAS ---
const createContactOptions = (urls: ReturnType<typeof useSiteUrls>): ContactOption[] => [
    {
        icon: MessageSquare,
        title: 'Contratar chatbot WhatsApp',
        description: 'Atencion de dudas frecuentes y citas automaticas 24/7.',
        cta: 'Solicitar info',
        href: '#formulario'
    },
    {
        icon: Calendar,
        title: 'Agendar demo (WhatsApp / Instagram / Voicebot)',
        description: 'Vemos tu caso en una llamada breve de 15-20 min.',
        cta: 'Agendar ahora',
        href: urls.calendly
    },
    {
        icon: Bot,
        title: 'Solicitar presupuesto: automatizacion de reservas',
        description: 'Reglas de tu negocio + recordatorios y avisos automaticos.',
        cta: 'Pedir presupuesto',
        href: '#formulario'
    },
    {
        icon: FileSpreadsheet,
        title: 'Presupuesto integracion WhatsApp + Calendly / Google Sheets',
        description: 'Conecto y dejo los datos listos para seguimiento.',
        cta: 'Ver opciones',
        href: '#formulario'
    },
    {
        icon: Zap,
        title: 'Consulta general o dudas',
        description: 'Cualquier otra pregunta sobre chatbots o automatizacion.',
        cta: 'Escribir mensaje',
        href: urls.whatsapp
    }
];

const createContactContent = (urls: ReturnType<typeof useSiteUrls>) => ({
    hero: {
        title: (
            <>
                Solicitar presupuesto chatbot WhatsApp <span className="text-subtle">| Contacto (Guillermo)</span>
            </>
        ),
        subtitle: 'Hablemos sobre como un chatbot puede ayudar a tu negocio. Primera llamada gratuita, respuesta en menos de 30 minutos (09-21h), y primer mes gratis si decidimos trabajar juntos.',
        primaryCta: {text: 'Reservar llamada', href: urls.calendly},
        secondaryCta: {text: 'WhatsApp', href: urls.whatsapp}
    }
});

// --- COMPONENTE PRINCIPAL ---
export function ContactIsland(): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();
    // Crear contenido con URLs dinamicas
    const contactContent = createContactContent(urls);
    const contactOptions = createContactOptions(urls);

    return (
        <PageLayout headerCtaText="Reservar llamada" mainClassName="flex-1 flex flex-col justify-start gap-16 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION */}
            <div id="contact-hero">
                <HeroSection title={contactContent.hero.title} subtitle={contactContent.hero.subtitle} primaryCta={contactContent.hero.primaryCta} secondaryCta={contactContent.hero.secondaryCta} />
            </div>

            {/* 2. QUE NECESITAS - Opciones de contacto */}
            <section id="contact-options-section" className="mx-auto w-full max-w-7xl">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Elige como prefieres contactarme</h2>
                    <p className="text-muted mt-2">Respondo en menos de 30 minutos por WhatsApp (09-21h).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contactOptions.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <a key={index} id={`contact-option-${index}`} href={option.href} className="group flex flex-col p-6 rounded-xl border border-primary bg-surface transition-all hover:border-[var(--color-accent-primary)] hover:shadow-lg">
                                <div className="w-12 h-12 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent-primary)]/20 transition-colors">
                                    <Icon className="w-6 h-6 text-[var(--color-accent-primary)]" />
                                </div>
                                <h3 className="text-lg font-semibold text-primary mb-2">{option.title}</h3>
                                <p className="text-sm text-muted flex-1 mb-4">{option.description}</p>
                                <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-primary)] group-hover:underline">
                                    {option.cta}
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            </a>
                        );
                    })}
                </div>
            </section>

            {/* 3. FORMULARIO RGPD */}
            <ContactForm title="O si prefieres escribirme aqui" subtitle="Cuentame tu caso y te respondo hoy mismo" />

            {/* 4. QUE PASA DESPUES */}
            <section id="next-steps-section" className="mx-auto w-full max-w-4xl">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Que pasa despues de contactarme</h2>
                    <p className="text-muted mt-2">Un proceso simple, sin sorpresas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {nextSteps.map((step, index) => (
                        <div key={index} id={`next-step-${index}`} className="relative p-6 rounded-xl border border-primary bg-surface">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl font-bold text-[var(--color-accent-primary)]/30">{step.number}</span>
                                <CheckCircle className="w-5 h-5 text-[var(--color-accent-primary)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-primary mb-2">{step.title}</h3>
                            <p className="text-sm text-muted">{step.description}</p>
                        </div>
                    ))}
                </div>

                {/* Nota de disponibilidad */}
                <div className="mt-8 p-4 rounded-lg bg-secondary border border-primary text-center">
                    <div className="flex items-center justify-center gap-2 text-muted">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Disponible de lunes a viernes, 09:00 - 21:00 (hora Espana).</span>
                    </div>
                </div>
            </section>

            {/* 5. FAQs */}
            <FaqWithCta title="Preguntas sobre contacto" items={contactFaqs} ctaTitle="Listo para empezar?" ctaDescription="Primera llamada gratuita. Te cuento como puedo ayudarte." />

            {/* 6. INTERNAL LINKS - SEO */}
            <InternalLinks title="Tambien te puede interesar" links={contactInternalLinks} />
        </PageLayout>
    );
}
