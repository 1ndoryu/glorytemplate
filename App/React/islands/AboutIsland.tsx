import {MessageSquare, Globe, Mic, Zap, Link, Calendar} from 'lucide-react';
import {Button} from '../components/ui';
import {PageLayout} from '../components/layout';
import {ProcessTimeline, ContactForm, InternalLinks, CtaBlock} from '../components/sections';
import {siteUrls} from '../config';

// Links internos especificos para Sobre Mi
const aboutInternalLinks = [
    {text: 'Ver servicios en detalle', href: '/servicios'},
    {text: 'Ver planes (primer mes gratis)', href: '/planes'},
    {text: 'Probar una demo real', href: '/demos'},
    {text: 'Escríbeme por WhatsApp', href: '/contacto'},
    {text: 'Reservar una llamada', href: '/contacto'},
    {text: 'Formulario de contacto', href: '/contacto'},
    {text: 'Blog: casos y noticias', href: '/blog'}
];

// --- CONFIGURACION DE CONTENIDO ESPECIFICO ---
const aboutContent = {
    hero: {
        title: 'Consultor de chatbots: trabajo 1:1 contigo',
        subtitle: 'Soy Guillermo, de Madrid. Vengo del mundo audiovisual y me enganché a la IA desde ChatGPT. Hoy ayudo a pymes a atender mejor y automatizar con chatbots (WhatsApp Business, Instagram, web y voz), en remoto por toda España. Estoy en Madrid; trabajo en toda España.',
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: siteUrls.calendly},
        secondaryCta: {text: 'WhatsApp', href: siteUrls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'},
        imageSrc: 'https://placehold.co/400x500/png',
        imageAlt: 'Guillermo, consultor de chatbots en Madrid, en videollamada'
    },
    bio: {
        title: 'Quién soy',
        text: (
            <>
                <p className="mb-4">
                    Me llamo Guillermo, tengo 28 años y he vivido siempre en Madrid. La primera vez que probé ChatGPT pensé: <strong>“esto cambia la forma de trabajar”</strong>. Desde entonces me puse manos a la obra y hoy soy consultor de chatbots y consultor de automatización de procesos para pymes.
                </p>
                <p>Trabajo 1:1 y en remoto: me cuentas tu caso, lo traduzco a flujos simples y me ocupo de que funcione a diario. Mi objetivo es claro: que tú trabajes menos y tu negocio rinda más (mejor atención, menos interrupciones y reservas sin fricción).</p>
            </>
        )
    },
    services: {
        title: 'Lo que hago contigo',
        subtitle: '(directo y sin jerga)',
        items: [
            {icon: MessageSquare, title: 'WhatsApp Business para empresas', desc: 'Responder dudas, derivar a humano y agendar citas.'},
            {icon: Globe, title: 'Instagram / Web', desc: 'DM y widget con FAQs útiles.'},
            {icon: Mic, title: 'Voz (llamadas)', desc: 'Voicebot sencillo que atiende, clasifica y pasa a persona.'},
            {icon: Zap, title: 'Automatización (Make / n8n)', desc: 'Recordatorios, etiquetas y avisos internos.'},
            {icon: Link, title: 'Integraciones', desc: 'Calendly, Google Sheets, email y tu Software/CRM.'}
        ]
    },
    caseStudy: {
        title: 'Un caso (barbería)',
        text: 'En MVP Barber me contaron que no podían contestar los WhatsApp mientras cortaban el pelo y lo hacían en sus ratos libres, fuera del horario. Montamos un chatbot para dudas típicas y citas. Resultado: ahora cortan en paz y el bot se encarga del resto.'
    },
    process: {
        title: 'Cómo trabajo',
        steps: [
            {title: 'Llamada breve', desc: 'Objetivo y 2-3 casos.'},
            {title: 'Prototipo', desc: 'Flujo real con tus reglas.'},
            {title: 'Lanzamos', desc: 'Conecto con tu web/agenda/CRM.'},
            {title: 'Mantenimiento', desc: 'Reviso chats y mejoro cada mes.'}
        ]
    },
    workingImage: {
        src: '/img/sobre-mi-guillermo-trabajando.jpg',
        alt: 'Guillermo configurando automatizaciones en UChat y Make'
    },
    tools: {
        title: 'Herramientas que uso',
        text: 'UChat para el bot, Make (y cuando conviene n8n) para automatizar, más Google Sheets, Calendly, WhatsApp, Instagram y tu CRM. Si no tienes CRM, empezamos con hoja compartida y listo.',
        ctaText: 'Hablame ahora y respondo en menos de 30 min (09-21h)',
        ctaHref: siteUrls.whatsapp
    }
};

// --- ISLAND PRINCIPAL ---
export function AboutIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Agendar 1:1" mainClassName="flex-1 flex flex-col gap-0 px-6 py-12 md:py-20">
            {/* 1. HERO PROFILE con Imagen Lateral */}
            <section id="hero" className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="col-span-1 lg:col-span-7 flex flex-col gap-6 text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.1] text-primary">{aboutContent.hero.title}</h1>
                        <p className="text-lg md:text-xl max-w-2xl leading-relaxed tracking-tight font-normal text-muted">{aboutContent.hero.subtitle}</p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
                            <Button href={aboutContent.hero.primaryCta.href} icon={Calendar} className="h-10 px-6">
                                {aboutContent.hero.primaryCta.text}
                            </Button>
                            <Button href={aboutContent.hero.secondaryCta.href} variant="outline" icon={MessageSquare} className="h-10 px-6">
                                WhatsApp
                            </Button>
                            <Button href={aboutContent.hero.tertiaryCta.href} variant="outline" className="h-10 px-6">
                                Agenda en 30 s
                            </Button>
                        </div>
                    </div>
                    <div className="col-span-1 lg:col-span-5 relative w-full flex justify-center lg:justify-end">
                        <div className="relative rounded-2xl overflow-hidden shadow-xl w-full max-w-[400px] aspect-[4/5]">
                            <img src={aboutContent.hero.imageSrc} alt={aboutContent.hero.imageAlt} className="object-cover w-full h-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. QUIEN SOY */}
            <section id="quien-soy" className="bg-primary py-16 px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold mb-8 text-primary">{aboutContent.bio.title}</h2>
                    <div className="text-lg text-secondary leading-relaxed">{aboutContent.bio.text}</div>
                </div>
            </section>

            {/* 3. LO QUE HAGO CONTIGO */}
            <section id="servicios" className="py-16 bg-surface px-6">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-primary">{aboutContent.services.title}</h2>
                        <p className="text-muted mt-2">{aboutContent.services.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {aboutContent.services.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center p-4">
                                <div className="p-3 bg-[var(--color-selection-bg)] text-[var(--color-accent-primary)] rounded-full mb-3">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-primary mb-1 text-sm">{item.title}</h3>
                                <p className="text-xs text-muted">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-10">
                        <Button href={siteUrls.calendly} icon={Calendar}>
                            Agenda en 30 s
                        </Button>
                    </div>
                </div>
            </section>

            {/* 4. UN CASO (BARBERIA) */}
            <section id="caso-estudio" className="py-16 bg-[var(--color-surface-inverse)] text-[var(--color-text-inverse)] px-6">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-6 text-[var(--color-text-inverse)]">{aboutContent.caseStudy.title}</h2>
                    <p className="text-xl leading-relaxed text-[var(--color-text-inverse)] opacity-90">"{aboutContent.caseStudy.text}"</p>
                </div>
            </section>

            {/* 5. COMO TRABAJO */}
            <ProcessTimeline title={aboutContent.process.title} steps={aboutContent.process.steps} />

            {/* 7. HERRAMIENTAS QUE USO */}
            <section id="herramientas" className="py-16 bg-surface px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold mb-6 text-primary">{aboutContent.tools.title}</h2>
                    <p className="text-lg text-secondary mb-8">{aboutContent.tools.text}</p>
                    <Button href={aboutContent.tools.ctaHref} variant="outline" icon={MessageSquare}>
                        {aboutContent.tools.ctaText}
                    </Button>
                </div>
            </section>

            {/* 8. HABLAMOS? (CTAs) */}
            <CtaBlock id="cta-final" className="bg-primary" />

            {/* 9. FORMULARIO CONTACTO (Ancla manejada internamente por el componente) */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rápido con respuesta hoy mismo" />

            {/* 10. INTERLINKING */}
            <InternalLinks title="Te puede interesar" links={aboutInternalLinks} />
        </PageLayout>
    );
}
