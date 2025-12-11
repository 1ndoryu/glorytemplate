import {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {MessageSquare, Smartphone, Globe, Mic, User, CheckCircle, Phone, Utensils, Scissors, Stethoscope, Calendar, FileSpreadsheet, Mail, Database, LucideIcon} from 'lucide-react';
import {Badge, Button} from '../ui';

// --- TIPOS ---
interface TabSection {
    id: string;
    label: string;
    badge: string;
    title: React.ReactNode;
    description: string;
}

interface ScrollTabsShowcaseProps {
    sections: TabSection[];
    cta?: {
        text: string;
        href: string;
    };
}

// ============================================
// ANIMACIONES PARA SECCION: CANALES
// ============================================

function WhatsAppVisual() {
    return (
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <motion.div className="flex gap-2 items-start" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-green)] flex items-center justify-center text-white text-[9px]">
                    <User className="w-3 h-3" />
                </div>
                <div className="p-2 rounded-lg rounded-tl-none text-[10px] bg-white/10 border border-white/20 text-white">Hola, quiero reservar</div>
            </motion.div>
            <motion.div className="flex gap-2 items-start flex-row-reverse" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8}}>
                <div className="w-6 h-6 rounded-full bg-[var(--color-info)] flex items-center justify-center text-white text-[9px]">AI</div>
                <div className="p-2 rounded-lg rounded-tr-none text-[10px] bg-[var(--color-accent-green)]/20 border border-[var(--color-accent-green)]/30 text-white">Perfecto! Tengo huecos...</div>
            </motion.div>
            <motion.div className="flex items-center gap-2 mt-2" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.4}}>
                <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                <span className="text-[9px] text-[var(--color-success)]">Reserva confirmada</span>
            </motion.div>
        </div>
    );
}

function InstagramVisual() {
    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', delay: 0.2}}>
                <Smartphone className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div className="flex gap-1" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.6}}>
                {[1, 2, 3].map(i => (
                    <motion.div key={i} className="text-pink-400 text-sm" animate={{scale: [1, 1.2, 1]}} transition={{delay: 0.8 + i * 0.2, repeat: Infinity, repeatDelay: 2}}>
                        ♥
                    </motion.div>
                ))}
            </motion.div>
            <motion.div className="text-[10px] text-white/70 flex items-center gap-1" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 1.2}}>
                <MessageSquare className="w-3 h-3" />
                DM respondido
            </motion.div>
        </div>
    );
}

function WebVisual() {
    return (
        <div className="relative w-full max-w-[280px]">
            <motion.div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}>
                {/* Barra de navegador */}
                <div className="h-5 bg-white/10 flex items-center gap-1 px-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
                {/* Contenido de la pagina con widget */}
                <div className="h-24 p-2 flex items-end justify-end relative">
                    {/* Contenido placeholder de pagina */}
                    <div className="absolute top-2 left-2 right-16 flex flex-col gap-1">
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>

                    {/* Widget de chat expandido */}
                    <motion.div className="bg-neutral-800 rounded-lg border border-white/20 p-2 w-32" initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{delay: 0.4, type: 'spring'}}>
                        <motion.div className="flex flex-col gap-0.5" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.7}}>
                            <div className="text-[9px] text-[var(--color-info)]">Hola!</div>
                            <div className="text-[9px] text-white">En que puedo ayudarte?</div>
                        </motion.div>
                        <motion.div className="flex justify-center mt-2" initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 1.0, type: 'spring'}}>
                            <div className="w-6 h-6 rounded-md bg-[var(--color-info)] flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-white" />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

function VoicebotVisual() {
    return (
        <div className="flex flex-col items-center gap-4">
            <motion.div className="w-14 h-14 rounded-full bg-[var(--color-warning)] flex items-center justify-center relative" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', delay: 0.2}}>
                <Phone className="w-6 h-6 text-white" />
                <motion.div className="absolute inset-0 rounded-full border-2 border-[var(--color-warning)]" animate={{scale: [1, 1.5], opacity: [0.5, 0]}} transition={{duration: 1.5, repeat: Infinity}} />
            </motion.div>
            <div className="flex items-end gap-0.5 h-6">
                {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                    <motion.div key={i} className="w-1 bg-white/60 rounded-full" animate={{height: [`${h * 3}px`, `${h * 6}px`, `${h * 3}px`]}} transition={{duration: 0.6, repeat: Infinity, delay: i * 0.1}} />
                ))}
            </div>
            <motion.span className="text-[10px] text-white/70" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.8}}>
                Atendiendo llamada...
            </motion.span>
        </div>
    );
}

// ============================================
// ANIMACIONES PARA SECCION: SECTORES
// ============================================

function RestaurantVisual() {
    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', delay: 0.2}}>
                <Utensils className="w-8 h-8 text-white" />
            </motion.div>
            <div className="flex flex-col gap-2 w-full max-w-[180px]">
                <motion.div className="flex items-center gap-2 p-2 rounded bg-white/10 border border-white/20" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.5}}>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-success)]"></div>
                    <span className="text-[10px] text-white">Mesa 4 - 20:00</span>
                </motion.div>
                <motion.div className="flex items-center gap-2 p-2 rounded bg-[var(--color-success)]/20 border border-[var(--color-success)]/30" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8}}>
                    <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                    <span className="text-[10px] text-[var(--color-success)]">Reserva confirmada</span>
                </motion.div>
            </div>
        </div>
    );
}

function BarberVisual() {
    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div className="w-16 h-16 rounded-full bg-neutral-600 flex items-center justify-center" initial={{scale: 0, rotate: -180}} animate={{scale: 1, rotate: 0}} transition={{type: 'spring', delay: 0.2}}>
                <Scissors className="w-8 h-8 text-white" />
            </motion.div>
            <div className="grid grid-cols-3 gap-1">
                {['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'].map((time, i) => (
                    <motion.div key={time} className={`p-1.5 rounded text-[9px] text-center ${i === 2 ? 'bg-[var(--color-info)] text-white' : 'bg-white/10 text-white/60'}`} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.4 + i * 0.1}}>
                        {time}
                    </motion.div>
                ))}
            </div>
            <motion.span className="text-[10px] text-white/70" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.2}}>
                Recordatorio enviado
            </motion.span>
        </div>
    );
}

function HealthVisual() {
    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center relative" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', delay: 0.2}}>
                <Stethoscope className="w-8 h-8 text-white" />
                <motion.div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-success)] flex items-center justify-center" initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 0.6}}>
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                </motion.div>
            </motion.div>
            <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                <motion.div className="h-2 rounded bg-white/20" initial={{width: 0}} animate={{width: '100%'}} transition={{delay: 0.5, duration: 0.5}} />
                <motion.div className="h-2 rounded bg-white/20" initial={{width: 0}} animate={{width: '70%'}} transition={{delay: 0.7, duration: 0.5}} />
                <motion.div className="h-2 rounded bg-teal-400" initial={{width: 0}} animate={{width: '85%'}} transition={{delay: 0.9, duration: 0.5}} />
            </div>
            <motion.span className="text-[10px] text-white/70" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.4}}>
                Triaje completado
            </motion.span>
        </div>
    );
}

// ============================================
// ANIMACIONES PARA SECCION: INTEGRACIONES
// ============================================

function IntegrationVisual() {
    const integrations = [
        {icon: Calendar, label: 'Calendly', color: 'bg-blue-500'},
        {icon: FileSpreadsheet, label: 'Sheets', color: 'bg-green-500'},
        {icon: Mail, label: 'Email', color: 'bg-red-400'},
        {icon: Database, label: 'CRM', color: 'bg-purple-500'}
    ];

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Centro: Logo */}
            <motion.div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring'}}>
                <span className="text-white text-sm font-bold">AI</span>
            </motion.div>

            {/* Lineas hacia integraciones */}
            <div className="grid grid-cols-4 gap-3">
                {integrations.map((int, i) => (
                    <motion.div key={int.label} className="flex flex-col items-center gap-1" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3 + i * 0.15}}>
                        <div className="h-4 w-px bg-white/30"></div>
                        <div className={`w-8 h-8 rounded-lg ${int.color} flex items-center justify-center`}>
                            <int.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[8px] text-white/60">{int.label}</span>
                    </motion.div>
                ))}
            </div>

            <motion.div className="flex items-center gap-2 mt-2" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.2}}>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></div>
                <span className="text-[10px] text-[var(--color-success)]">Sincronizado</span>
            </motion.div>
        </div>
    );
}

// ============================================
// MAPEO DE SECCIONES A VISUALES
// ============================================

interface SectionVisualConfig {
    items: Array<{
        id: string;
        icon: LucideIcon;
        title: string;
        badge: string;
        visual: React.ComponentType;
    }>;
}

const SECTION_VISUALS: Record<string, SectionVisualConfig> = {
    canales: {
        items: [
            {id: 'whatsapp', icon: MessageSquare, title: 'WhatsApp', badge: 'POPULAR', visual: WhatsAppVisual},
            {id: 'instagram', icon: Smartphone, title: 'Instagram', badge: 'VISUAL', visual: InstagramVisual},
            {id: 'web', icon: Globe, title: 'Web', badge: 'WIDGET', visual: WebVisual},
            {id: 'voicebot', icon: Mic, title: 'Voicebot', badge: 'VOZ', visual: VoicebotVisual}
        ]
    },
    sectores: {
        items: [
            {id: 'restaurante', icon: Utensils, title: 'Restaurante', badge: 'RESERVAS', visual: RestaurantVisual},
            {id: 'barberia', icon: Scissors, title: 'Barberia', badge: 'CITAS', visual: BarberVisual},
            {id: 'salud', icon: Stethoscope, title: 'Fisioterapia', badge: 'TRIAJE', visual: HealthVisual}
        ]
    },
    integraciones: {
        items: [{id: 'all', icon: Database, title: 'Tu Software', badge: 'SYNC', visual: IntegrationVisual}]
    }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ScrollTabsShowcase({sections, cta}: ScrollTabsShowcaseProps): JSX.Element {
    const [activeSection, setActiveSection] = useState(0);
    const [activeItem, setActiveItem] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Detectar seccion basada en scroll de la pagina
    useEffect(() => {
        const handleScroll = () => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();

            // Calcular progreso de scroll dentro del contenedor
            const scrollProgress = -rect.top;
            const viewportHeight = window.innerHeight;

            // Determinar seccion activa basada en progreso (1.5 viewports por seccion)
            const sectionHeight = viewportHeight * 1.5;
            const sectionIndex = Math.floor(scrollProgress / sectionHeight);
            const clampedIndex = Math.max(0, Math.min(sectionIndex, sections.length - 1));

            if (clampedIndex !== activeSection) {
                setActiveSection(clampedIndex);
                setActiveItem(0);
            }
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        handleScroll(); // Ejecutar inmediatamente

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections.length, activeSection]);

    // Autoplay items dentro de la seccion activa
    useEffect(() => {
        const currentConfig = SECTION_VISUALS[sections[activeSection]?.id];
        if (!currentConfig || currentConfig.items.length <= 1) return;

        const interval = setInterval(() => {
            setActiveItem(prev => (prev + 1) % currentConfig.items.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [activeSection, sections]);

    // Obtener datos de la seccion activa
    const currentSection = sections[activeSection];
    const config = SECTION_VISUALS[currentSection?.id];
    const currentItem = config?.items[activeItem % (config?.items.length || 1)];
    const VisualComponent = currentItem?.visual;

    return (
        <section id="scroll-tabs-showcase" className="w-full">
            {/* Contenedor con altura para capturar scroll (150vh por seccion para mas tiempo de permanencia) */}
            <div ref={containerRef} style={{height: `${sections.length * 150}vh`}}>
                {/* Contenedor sticky que se queda fijo y centrado verticalmente */}
                <div
                    className="sticky w-full rounded-xl bg-neutral-900 relative overflow-hidden"
                    style={{
                        height: '70vh',
                        minHeight: '550px',
                        maxHeight: '600px',
                        top: 'calc((100vh - min(max(70vh, 550px), 600px)) / 2)'
                    }}>
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-info)]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-accent-green)]/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>

                    {/* Contenido de la seccion activa */}
                    <AnimatePresence mode="wait">
                        <motion.div key={currentSection?.id} className="text-[var(--color-bg-primary)] relative z-10 h-full" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={{duration: 0.4}}>
                            {/* Grid 50/50: Contenido a la izquierda, Visual a la derecha */}
                            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center h-full px-6 py-6 md:px-10 md:py-8">
                                {/* Lado izquierdo: Texto y controles */}
                                <div id={`${currentSection?.id}-content`}>
                                    <Badge className="mb-3 w-fit bg-[var(--color-text-primary)] text-[var(--color-text-subtle)] border-neutral-700">{currentSection?.badge}</Badge>
                                    <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3 text-white">{currentSection?.title}</h2>
                                    <p className="text-neutral-300 mb-6 leading-relaxed text-sm md:text-base">{currentSection?.description}</p>

                                    {/* Items de la seccion */}
                                    {config && config.items.length > 1 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {config.items.map((item, itemIdx) => {
                                                const Icon = item.icon;
                                                const isActive = itemIdx === activeItem % config.items.length;

                                                return (
                                                    <button key={item.id} onClick={() => setActiveItem(itemIdx)} className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${isActive ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-80'}`}>
                                                        <div className={`p-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                                                            <Icon className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-medium text-white">{item.title}</div>
                                                            <div className="text-[9px] text-white/50">{item.badge}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {config?.items.map(item => {
                                                const Icon = item.icon;
                                                return (
                                                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/10 border border-white/20">
                                                        <div className="p-1.5 rounded bg-white/20">
                                                            <Icon className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-medium text-white">{item.title}</div>
                                                            <div className="text-[9px] text-white/50">{item.badge}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* CTA solo en la ultima seccion */}
                                    {activeSection === sections.length - 1 && cta && (
                                        <div className="mt-6">
                                            <Button href={cta.href} variant="white">
                                                {cta.text}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Lado derecho: Visual animado */}
                                <div id={`${currentSection?.id}-visual`} className="relative h-48 md:h-64 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        {VisualComponent && (
                                            <motion.div key={`${currentSection?.id}-${activeItem}`} initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.9}} transition={{duration: 0.3}}>
                                                <VisualComponent />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Progress dots para items (solo si hay multiples) */}
                                    {config && config.items.length > 1 && (
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {config.items.map((_, idx) => (
                                                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeItem % config.items.length ? 'bg-white w-3' : 'bg-white/30'}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
