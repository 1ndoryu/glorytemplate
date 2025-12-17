import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {MessageSquare, Globe, Mic, Zap, Link, Calendar, CheckCircle, Scissors, Workflow, Database, FileSpreadsheet, Instagram} from 'lucide-react';
import {Button, Badge, SimulationCard} from '../components/ui';
import {PageLayout} from '../components/layout';
import {ProcessTimeline, ContactForm, InternalLinks, CtaBlock, SplitSection} from '../components/sections';
// Configuracion dinamica desde Theme Options
import {useSiteUrls, useSiteImages} from '../hooks/useSiteConfig';
// Utilidad para optimizar imagenes (WebP/CDN)
import {getBackgroundImageUrl} from '../utils/imageOptimizer';

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

// --- SIMULACION DE CHAT PARA BARBERIA ---
/**
 * BarberSimulationContent: Animacion de chat para caso de estudio de barberia.
 * Ciclo: Chat con cliente pidiendo cita -> Procesando -> Confirmado -> Lista de citas
 */
function BarberSimulationContent() {
    const [step, setStep] = useState<'chat' | 'list'>('chat');
    const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const runCycle = () => {
            // Reiniciar ciclo
            setStep('chat');
            setStatus('idle');

            // 1. Procesando a los 2.5s
            timeout = setTimeout(() => setStatus('processing'), 2500);

            // 2. Confirmado a los 5.5s
            setTimeout(() => setStatus('confirmed'), 5500);

            // 3. Cambiar a lista de citas a los 9s
            setTimeout(() => setStep('list'), 9000);

            // 4. Reiniciar todo a los 15s (6s viendo la lista)
            setTimeout(runCycle, 15000);
        };

        runCycle();

        return () => clearTimeout(timeout);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {step === 'chat' ? (
                <motion.div key="chat" className="flex flex-col gap-3" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10, scale: 0.95}} transition={{duration: 0.4}}>
                    {/* Mensaje cliente */}
                    <motion.div className="flex gap-2 items-start" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-secondary text-primary border-secondary">CR</div>
                        <div className="p-2 rounded-lg rounded-tl-none text-[11px] border max-w-[85%] bg-[var(--color-bg-tertiary)] text-primary border-[var(--color-border-subtle)]">Hola! Quiero corte + barba para manana por la tarde</div>
                    </motion.div>

                    {/* Respuesta bot */}
                    <motion.div className="flex gap-2 flex-row-reverse items-start" initial={{opacity: 0, x: 10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8}}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]">AI</div>
                        <div className="p-2 rounded-lg rounded-tr-none text-[11px] border max-w-[85%] shadow-sm bg-surface text-primary border-primary">Perfecto Carlos! Tengo huecos a las 16:00 y 18:30. Cual te viene mejor?</div>
                    </motion.div>

                    {/* Status Footer */}
                    <div className="pt-2 border-t border-[var(--color-border-subtle)] min-h-[28px] flex items-center">
                        <AnimatePresence mode="wait">
                            {status === 'idle' && (
                                <motion.span key="idle" className="text-[10px] text-subtle" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                                    Esperando respuesta...
                                </motion.span>
                            )}

                            {status === 'processing' && (
                                <motion.div key="proc" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] bg-[var(--color-bg-tertiary)] text-secondary">
                                    <span>Bot: Reservando hueco...</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse"></span>
                                </motion.div>
                            )}

                            {status === 'confirmed' && (
                                <motion.div key="conf" initial={{opacity: 0}} animate={{opacity: 1}} className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] bg-[var(--color-success)]/10 text-[var(--color-success)]">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Cita Agendada: 18:30 - Corte + Barba</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ) : (
                <motion.div key="list" className="flex flex-col" initial={{opacity: 0, y: 10, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: -10}} transition={{duration: 0.4}}>
                    {/* Header mini agenda */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border-subtle)]">
                        <div className="flex items-center gap-1.5">
                            <Scissors className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] font-bold text-secondary">Agenda MVP Barber</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-[var(--color-success)]">
                            <div className="w-1 h-1 rounded-full bg-[var(--color-success)] animate-pulse"></div>
                            LIVE
                        </div>
                    </div>

                    {/* Lista Citas */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 p-1.5 rounded border border-[var(--color-border-subtle)] opacity-50">
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px]">JP</div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-secondary">Juan Perez</div>
                                <div className="text-[9px] text-subtle">15:00 - Solo corte</div>
                            </div>
                        </div>

                        {/* Nueva cita - Highlight */}
                        <motion.div className="flex items-center gap-2 p-1.5 rounded border border-[var(--color-border-primary)] bg-[var(--color-success)]/5" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                            <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-[9px]">CR</div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-primary">Carlos Ruiz</div>
                                <div className="text-[9px] text-[var(--color-success)] font-medium">18:30 - Corte + Barba</div>
                            </div>
                            <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                        </motion.div>

                        <div className="flex items-center gap-2 p-1.5 rounded border border-[var(--color-border-subtle)] opacity-50">
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px]">LM</div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-secondary">Luis Martinez</div>
                                <div className="text-[9px] text-subtle">19:00 - Degradado</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// --- DIAGRAMA VISUAL DE HERRAMIENTAS CONECTADAS ---
/**
 * ToolsHubDiagram: Diagrama visual tipo hub mostrando herramientas conectadas.
 * Estructura: Hub central (Make) con 4 herramientas satelite conectadas
 */
function ToolsHubDiagram() {
    // Herramientas satelite con posiciones
    const satellites = [
        {icon: MessageSquare, label: 'WhatsApp', color: 'var(--color-accent-green)', position: 'top-left'},
        {icon: Calendar, label: 'Calendly', color: 'var(--color-info)', position: 'top-right'},
        {icon: FileSpreadsheet, label: 'Sheets', color: '#0F9D58', position: 'bottom-left'},
        {icon: Database, label: 'CRM', color: 'var(--color-warning)', position: 'bottom-right'}
    ];

    return (
        <div className="relative h-64 md:h-72 bg-white/5 rounded-lg border border-white/10 p-4 flex items-center justify-center">
            {/* Lineas conectoras (fondo) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                {/* Lineas desde el centro a cada satelite */}
                <motion.line x1="100" y1="100" x2="45" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 2" initial={{pathLength: 0}} whileInView={{pathLength: 1}} viewport={{once: true}} transition={{delay: 0.5, duration: 0.4}} />
                <motion.line x1="100" y1="100" x2="155" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 2" initial={{pathLength: 0}} whileInView={{pathLength: 1}} viewport={{once: true}} transition={{delay: 0.6, duration: 0.4}} />
                <motion.line x1="100" y1="100" x2="45" y2="145" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 2" initial={{pathLength: 0}} whileInView={{pathLength: 1}} viewport={{once: true}} transition={{delay: 0.7, duration: 0.4}} />
                <motion.line x1="100" y1="100" x2="155" y2="145" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 2" initial={{pathLength: 0}} whileInView={{pathLength: 1}} viewport={{once: true}} transition={{delay: 0.8, duration: 0.4}} />
            </svg>

            {/* Hub Central - Make/UChat */}
            <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" initial={{opacity: 0, scale: 0.5}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 0.2, duration: 0.4, type: 'spring'}}>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-info)] to-[var(--color-accent-primary)] flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
                        <Workflow className="w-7 h-7" />
                    </div>
                    <span className="text-[9px] font-mono text-white/70 mt-1">MAKE / N8N</span>
                </div>
            </motion.div>

            {/* Satelite: WhatsApp (top-left) */}
            <motion.div className="absolute left-[15%] top-[20%] z-10" initial={{opacity: 0, scale: 0.5}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 0.9, duration: 0.3, type: 'spring'}}>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-green)] flex items-center justify-center text-white shadow-md">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-mono text-white/60">WHATSAPP</span>
                </div>
            </motion.div>

            {/* Satelite: Calendly (top-right) */}
            <motion.div className="absolute right-[15%] top-[20%] z-10" initial={{opacity: 0, scale: 0.5}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 1.0, duration: 0.3, type: 'spring'}}>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-info)] flex items-center justify-center text-white shadow-md">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-mono text-white/60">CALENDLY</span>
                </div>
            </motion.div>

            {/* Satelite: Google Sheets (bottom-left) */}
            <motion.div className="absolute left-[15%] bottom-[20%] z-10" initial={{opacity: 0, scale: 0.5}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 1.1, duration: 0.3, type: 'spring'}}>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg bg-[#0F9D58] flex items-center justify-center text-white shadow-md">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-mono text-white/60">SHEETS</span>
                </div>
            </motion.div>

            {/* Satelite: CRM (bottom-right) */}
            <motion.div className="absolute right-[15%] bottom-[20%] z-10" initial={{opacity: 0, scale: 0.5}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 1.2, duration: 0.3, type: 'spring'}}>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)] flex items-center justify-center text-white shadow-md">
                        <Database className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-mono text-white/60">TU CRM</span>
                </div>
            </motion.div>

            {/* Indicador de flujo de datos */}
            <motion.div className="absolute bottom-3 left-1/2 -translate-x-1/2" initial={{opacity: 0}} whileInView={{opacity: 1}} viewport={{once: true}} transition={{delay: 1.5}}>
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></div>
                    <span className="text-[8px] font-mono text-white/50">CONECTADO</span>
                </div>
            </motion.div>
        </div>
    );
}

// --- FUNCION PARA CREAR CONTENIDO CON URLS DINAMICAS ---
interface AboutContentDeps {
    urls: ReturnType<typeof useSiteUrls>;
    images: ReturnType<typeof useSiteImages>;
}

const createAboutContent = ({urls, images}: AboutContentDeps) => ({
    hero: {
        title: 'Consultor de chatbots: trabajo 1:1 contigo',
        subtitle: 'Soy Guillermo, de Madrid. Vengo del mundo audiovisual y me enganché a la IA desde ChatGPT. Hoy ayudo a pymes a atender mejor y automatizar con chatbots (WhatsApp Business, Instagram, web y voz), en remoto por toda España. Estoy en Madrid; trabajo en toda España.',
        primaryCta: {text: 'Hablame ahora y respondo en menos de 30 min (09-21h)', href: urls.calendly},
        secondaryCta: {text: 'WhatsApp', href: urls.whatsapp},
        tertiaryCta: {text: 'Agenda en 30 s', href: '#formulario'},
        imageSrc: images.hero || 'https://placehold.co/400x500/e5e7eb/6b7280?text=Foto+Perfil',
        imageAlt: 'Guillermo, consultor de chatbots en Madrid, en videollamada'
    },
    bio: {
        title: 'Quién soy',
        text: (
            <>
                <p className="mb-4">
                    Me llamo Guillermo, tengo 28 años y he vivido siempre en Madrid. La primera vez que probé ChatGPT pensé: <strong>"esto cambia la forma de trabajar"</strong>. Desde entonces me puse manos a la obra y hoy soy consultor de chatbots y consultor de automatización de procesos para pymes.
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
        src: images.secondary || 'https://placehold.co/800x450/e5e7eb/6b7280?text=Foto+Trabajando',
        alt: 'Guillermo configurando automatizaciones en UChat y Make'
    },
    tools: {
        title: 'Herramientas que uso',
        text: 'UChat para el bot, Make (y cuando conviene n8n) para automatizar, más Google Sheets, Calendly, WhatsApp, Instagram y tu CRM. Si no tienes CRM, empezamos con hoja compartida y listo.',
        ctaText: 'Hablame ahora y respondo en menos de 30 min (09-21h)',
        ctaHref: urls.whatsapp
    }
});

export function AboutIsland(): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();
    // Obtener imagenes dinamicas desde Theme Options
    const images = useSiteImages();
    // Crear contenido con URLs e imagenes dinamicas
    const aboutContent = createAboutContent({urls, images});

    return (
        <PageLayout headerCtaText="Agendar 1:1" mainClassName="flex-1 flex flex-col gap-0 px-6 py-12 md:py-20">
            {/* 1. HERO PROFILE con Imagen Lateral */}
            <section id="hero" className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="col-span-1 lg:col-span-7 flex flex-col gap-6 text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.1] text-primary">{aboutContent.hero.title}</h1>
                        <p className="text-lg md:text-xl max-w-2xl leading-relaxed tracking-tight font-normal text-muted">{aboutContent.hero.subtitle}</p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
                            <Button href={aboutContent.hero.primaryCta.href} icon={Calendar} className="h-11 px-6">
                                {aboutContent.hero.primaryCta.text}
                            </Button>
                            <Button href={aboutContent.hero.secondaryCta.href} variant="outline" icon={MessageSquare} className="h-11 px-6">
                                WhatsApp
                            </Button>
                            <Button href={aboutContent.hero.tertiaryCta.href} variant="outline" className="h-11 px-6">
                                Agenda en 30 s
                            </Button>
                        </div>
                    </div>
                    <div className="col-span-1 lg:col-span-5 relative w-full flex justify-center lg:justify-end">
                        <div className="relative rounded-2xl overflow-hidden shadow-xl w-full max-w-[400px] aspect-[4/5]">
                            <img src={aboutContent.hero.imageSrc} alt={aboutContent.hero.imageAlt} className="object-cover w-full h-full" loading="eager" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. QUIEN SOY */}
            <section id="quien-soy" className="bg-primary py-16 px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold mb-8 text-primary">{aboutContent.bio.title}</h2>
                    <div className="text-base text-secondary leading-relaxed">{aboutContent.bio.text}</div>
                </div>
            </section>

            {/* 3. LO QUE HAGO CONTIGO */}
            <section id="servicios" className="py-16 px-6">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-primary">{aboutContent.services.title}</h2>
                        <p className="text-muted mt-2">{aboutContent.services.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {aboutContent.services.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center p-4">
                                <div className="w-12 h-12 flex items-center justify-center bg-[var(--color-selection-bg)] text-[var(--color-accent-primary)] rounded-full mb-3">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-primary mb-1 text-sm">{item.title}</h3>
                                <p className="text-xs text-muted">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-10">
                        <Button href={urls.calendly} icon={Calendar}>
                            Agenda en 30 s
                        </Button>
                    </div>
                </div>
            </section>

            {/* 4. UN CASO (BARBERIA) - Con animacion tipo FeatureSection */}
            <SplitSection
                id="caso-estudio"
                visual={
                    <SimulationCard badge="BARBERIA" minHeight="180px">
                        <BarberSimulationContent />
                    </SimulationCard>
                }
                content={
                    <>
                        <Badge className="w-fit mb-4 text-[var(--color-warning)] border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10">CASO REAL</Badge>
                        <h2 className="text-3xl font-medium tracking-tight mb-6 text-primary">{aboutContent.caseStudy.title}</h2>
                        <p className="text-base mb-6 leading-relaxed text-muted">En MVP Barber me contaron que no podían contestar los WhatsApp mientras cortaban el pelo y lo hacían en sus ratos libres, fuera del horario.</p>
                        <p className="text-base mb-6 leading-relaxed text-muted">
                            Montamos un chatbot para dudas típicas y citas. <strong className="text-primary">Resultado: ahora cortan en paz y el bot se encarga del resto.</strong>
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                                <CheckCircle className="w-4 h-4" />
                                <span>Chatbot para dudas y precios</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                                <CheckCircle className="w-4 h-4" />
                                <span>Gestión de citas automática</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                                <CheckCircle className="w-4 h-4" />
                                <span>Cortan en paz, el bot agenda</span>
                            </div>
                        </div>
                    </>
                }
                visualPosition="right"
                backgroundImage={getBackgroundImageUrl('0e258aa6aca4067b3402bc82aac0798f.jpg')}
            />

            {/* 5. COMO TRABAJO */}
            <ProcessTimeline title={aboutContent.process.title} steps={aboutContent.process.steps} />

            {/* 6. FOTO 2 (Guillermo trabajando) - segun project-extends.md */}
            <section id="foto-trabajo" className="py-16 bg-primary px-6">
                <div className="mx-auto max-w-4xl">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video">
                        <img src={aboutContent.workingImage.src} alt={aboutContent.workingImage.alt} className="object-cover w-full h-full" loading="lazy" />
                    </div>
                </div>
            </section>

            {/* 7. HERRAMIENTAS QUE USO - Con diagrama visual tipo hub */}
            <section id="herramientas" className="mx-auto w-full max-w-7xl py-12">
                <div className="rounded-xl p-8 md:p-12 text-[var(--color-bg-primary)] relative overflow-hidden bg-neutral-900">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-info)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div id="tools-content">
                            <Badge className="mb-4 bg-[var(--color-text-primary)] text-[var(--color-text-subtle)] border-neutral-700">MI CAJA DE HERRAMIENTAS</Badge>
                            <h2 className="text-3xl font-medium tracking-tight mb-6 text-white">
                                Herramientas que uso <span className="text-[var(--color-info)]">conectadas entre si</span>
                            </h2>
                            <p className="text-neutral-300 mb-8 leading-relaxed">UChat para el bot, Make (y cuando conviene n8n) para automatizar, más Google Sheets, Calendly, WhatsApp, Instagram y tu CRM. Si no tienes CRM, empezamos con hoja compartida y listo.</p>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white/5 border border-white/10">
                                        <MessageSquare className="w-4 h-4 text-white" />
                                    </div>
                                    <span>UChat (Bot)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white/5 border border-white/10">
                                        <Workflow className="w-4 h-4 text-white" />
                                    </div>
                                    <span>Make / n8n</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white/5 border border-white/10">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <span>Calendly</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white/5 border border-white/10">
                                        <Database className="w-4 h-4 text-white" />
                                    </div>
                                    <span>Tu CRM / ERP</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button href={aboutContent.tools.ctaHref} variant="white" icon={Calendar}>
                                    {aboutContent.tools.ctaText}
                                </Button>
                            </div>
                        </div>

                        {/* Visual: Diagrama de herramientas conectadas */}
                        <ToolsHubDiagram />
                    </div>
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
