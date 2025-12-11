import {Play, MessageSquare, Smartphone, Globe, Mic, Calendar, Database, Mail, Layout, CheckCircle, Scissors, Utensils, Stethoscope} from 'lucide-react';
import {Button, FeatureCard} from '../components/ui';
import {PageLayout} from '../components/layout';
import {HeroSection, ProcessTimeline, IntegrationsSection, FaqWithCta, ContactForm, InternalLinks} from '../components/sections';
import {siteUrls} from '../config';

// Links internos especificos para Demos
const demosInternalLinks = [
    {text: 'Ver servicios en detalle', href: '/servicios'},
    {text: 'Ver planes (primer mes gratis)', href: '/planes'},
    {text: 'Escríbeme por WhatsApp', href: '/contacto'}, // Apunta a contacto segun doc
    {text: 'Quién soy y cómo trabajo', href: '/sobre-mi'}
];

// --- CONFIGURACION DE CONTENIDO ESPECIFICO DE DEMOS ---
const demosContent = {
    hero: {
        title: (
            <>
                Demo chatbot WhatsApp: <span className="text-blue-600">pruébalo con tu caso</span>
            </>
        ),
        subtitle: 'Te enseño una demo real de chatbot en WhatsApp (y, si quieres, Instagram/web/voz) aplicada a tu negocio: atender mejor, resolver dudas y gestionar reservas.',
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: siteUrls.calendly},
        secondaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: siteUrls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'}
    },
    whatYouWillSee: {
        title: 'Qué verás en la demo',
        items: [
            {icon: MessageSquare, text: 'Conversaciones claras que atienden y derivan a humano cuando toca'},
            {icon: Calendar, text: 'Reservas con tu agenda y recordatorios'},
            {icon: Database, text: 'Avisos internos y etiquetas para seguimiento'},
            {icon: Layout, text: 'Integraciones (Calendly, Google Sheets, tu Software/CRM)'}
        ],
        ctaText: 'Agenda en 30 s',
        ctaHref: siteUrls.calendly
    },
    channels: {
        title: 'Elige tu demo (Canales)',
        items: [
            {
                icon: MessageSquare,
                title: 'Demo chatbot WhatsApp',
                badge: 'POPULAR',
                desc: 'Mensajes útiles, derivación a persona y seguimiento.'
            },
            {
                icon: Smartphone,
                title: 'Demo chatbot Instagram (DM)',
                badge: 'VISUAL',
                desc: 'Responde en Instagram y, si procede, propone y confirma la reserva.'
            },
            {
                icon: Globe,
                title: 'Demo chatbot web',
                badge: 'WIDGET',
                desc: 'Widget visible, FAQs transaccionales y pase a humano.'
            },
            {
                icon: Mic,
                title: 'Demo voicebot (llamadas)',
                badge: 'VOZ',
                desc: 'Atiende, clasifica, reserva y transfiere a agente.'
            }
        ]
    },
    sectors: {
        title: 'Demos por sector (ejemplos rápidos)',
        items: [
            {
                icon: Utensils,
                title: 'Demo chatbot WhatsApp para restaurantes',
                desc: 'Consulta de mesa, reserva y recordatorio.'
            },
            {
                icon: Scissors,
                title: 'Demo chatbot para barbería',
                desc: 'Citas, reprogramaciones y avisos internos.'
            },
            {
                icon: Stethoscope,
                title: 'Demo voicebot para fisioterapia',
                desc: 'Triado rápido, disponibilidad y pase a persona.'
            }
        ]
    },
    integrations: ['Tu agenda (si ya usas Calendly, lo conecto)', 'Google Sheets (leads básicos o mapeo avanzado)', 'Email (avisos/notificaciones)', 'Tu Software/CRM'],
    process: {
        title: 'Cómo lo hacemos',
        steps: [
            {title: '1. Llamada breve (15-20 min)', desc: 'Eliges canal/sector y objetivo.'},
            {title: '2. Preparo tu demo', desc: 'Flujos y mensajes con tus "reglas".'},
            {title: '3. La probamos juntos', desc: 'Ajustes en directo.'},
            {title: '4. Siguiente paso', desc: 'Si te encaja, lo lanzamos (primer mes gratis).'}
        ]
    },
    faq: {
        title: 'FAQs (demo y casos)',
        items: [
            {question: '¿Prueba gratis chatbot WhatsApp?', answer: 'Sí. Preparo una demo gratuita con tu caso y vemos si encaja (además, el primer mes es gratis).'},
            {question: '¿Cómo solicitar demo chatbot para reservas?', answer: 'Reserva en el Calendario y dime tu agenda; preparo flujos con reglas de tu negocio y recordatorios.'},
            {question: '¿Puedo probar chatbot WhatsApp para citas?', answer: 'Sí. Propondrá franjas, confirmará y enviará recordatorios; puedes tomar el relevo cuando quieras.'},
            {question: '¿Demo integración WhatsApp con Calendly?', answer: 'Sí. Puedo leer/crear/actualizar citas y mandar recordatorios.'},
            {question: '¿Demo chatbot con Google Sheets?', answer: 'Sí. Desde guardar leads básicos hasta mapear columnas y validaciones.'},
            {question: '¿Casos de éxito chatbots?', answer: 'Te enseño ejemplos reales aplicados a tu sector (restaurantes, barberías, clínicas...) y qué impacto tuvieron.'}
        ],
        ctaTitle: '¿Hablamos?',
        ctaItems: [
            {text: 'Agenda en 30 s', href: siteUrls.calendly, variant: 'primary'},
            {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: siteUrls.whatsapp, variant: 'outline'},
            {text: 'Te leo y te respondo hoy', href: '#formulario', variant: 'ghost'}
        ]
    }
};

// --- ISLAND PRINCIPAL ---
export function DemosIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Agendar 1:1" topBanner={{text: 'Primer mes gratis - Prueba tu caso real', linkText: 'Agenda ahora', linkHref: siteUrls.calendly}}>
            {/* 1. HERO SECTION */}
            <HeroSection title={demosContent.hero.title} subtitle={demosContent.hero.subtitle} primaryCta={demosContent.hero.primaryCta} secondaryCta={demosContent.hero.secondaryCta} tertiaryCta={demosContent.hero.tertiaryCta} />

            {/* 2. QUE VERAS EN LA DEMO */}
            <section className="py-12 bg-white">
                <div className="mx-auto max-w-7xl px-6">
                    <h2 className="text-3xl font-bold text-center mb-10">{demosContent.whatYouWillSee.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {demosContent.whatYouWillSee.items.map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-4">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <p className="font-medium text-gray-800">{item.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-10">
                        <Button href={demosContent.whatYouWillSee.ctaHref} icon={Calendar}>
                            {demosContent.whatYouWillSee.ctaText}
                        </Button>
                    </div>
                </div>
            </section>

            {/* 3. ELIGE TU DEMO (CANALES) */}
            <section className="py-16 bg-gray-50">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight mb-2" style={{color: 'var(--color-text-primary)'}}>
                            {demosContent.channels.title}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {demosContent.channels.items.map((item, idx) => (
                            <FeatureCard key={idx} icon={item.icon} title={item.title} badge={item.badge} description={item.desc} />
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. DEMOS POR SECTOR */}
            <section className="py-16 bg-white">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight mb-2" style={{color: 'var(--color-text-primary)'}}>
                            {demosContent.sectors.title}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {demosContent.sectors.items.map((item, idx) => (
                            <FeatureCard key={idx} icon={item.icon} title={item.title} description={item.desc} />
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. INTEGRACIONES */}
            <IntegrationsSection title={demosContent.integrations.title} items={demosContent.integrations.items} />
            {/* CTA Integraciones */}
            <div className="flex justify-center pb-12 bg-white">
                <Button href={siteUrls.whatsapp} variant="outline" icon={MessageSquare}>
                    Hablame ahora y respondo en menos de 30 min (09-21h)
                </Button>
            </div>

            {/* 6. COMO LO HACEMOS */}
            <ProcessTimeline title={demosContent.process.title} steps={demosContent.process.steps} />

            {/* 7. HABLAMOS? (CTAs) */}
            <section className="py-16 text-center">
                <h2 className="text-3xl font-bold mb-8">¿Hablamos?</h2>
                <p className="mb-8 text-lg text-gray-600">Elige cómo prefieres:</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button href={siteUrls.calendly} icon={Calendar}>
                        Agenda en 30 s
                    </Button>
                    <Button href={siteUrls.whatsapp} variant="outline" icon={MessageSquare}>
                        Hablame ahora
                    </Button>
                    <Button href="#formulario" variant="ghost">
                        Te leo y te respondo hoy
                    </Button>
                </div>
            </section>

            {/* 8. FAQS */}
            <FaqWithCta title={demosContent.faq.title} items={demosContent.faq.items} />

            {/* 9. FORMULARIO CONTACTO */}
            <ContactForm title="Si prefieres escribirme ahora" subtitle="Formulario rápido con respuesta hoy mismo" id="formulario" />

            {/* 10. INTERLINKING */}
            <InternalLinks title="Te puede interesar" links={demosInternalLinks} />
        </PageLayout>
    );
}
