import {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {CheckCircle2, Utensils, Stethoscope, ShoppingBag} from 'lucide-react';
import {Badge} from '../../../components/ui/Badge';
import {SCENARIOS} from '../data/scenarios';
import {AnimatedChat} from './AnimatedChat';

// Iconos por sector para los tabs
const SECTOR_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
    restaurant: Utensils,
    clinic: Stethoscope,
    ecommerce: ShoppingBag
};

// Orden de los escenarios para el ciclo
const SCENARIO_ORDER = ['restaurant', 'clinic', 'ecommerce'];

// Mismos delays que usa AnimatedChat para los mensajes
const getMessageDelay = (index: number): number => {
    const delays = [0.5, 2.0, 3.5, 5.0, 6.5, 8.0];
    return delays[index] || index * 1.5;
};

// Tiempo extra despues del ultimo mensaje antes de cambiar (en ms)
const PAUSE_AFTER_CONVERSATION = 3000;

interface DemoWorkflowProps {
    backgroundImage?: string;
}

/**
 * DemoWorkflow - Componente de demo interactivo estilo ProcessWorkflow
 * Muestra una simulacion de chat por sector con autoplay y animaciones
 */
export function DemoWorkflow({backgroundImage}: DemoWorkflowProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeScenarioId = SCENARIO_ORDER[activeIndex];
    const currentScenario = SCENARIOS[activeScenarioId];

    // Calcular duracion basada en los mensajes del escenario actual
    const calculateDuration = (scenarioId: string): number => {
        const scenario = SCENARIOS[scenarioId];
        const lastMessageIndex = scenario.messages.length - 1;
        const lastMessageDelay = getMessageDelay(lastMessageIndex);
        // Tiempo del ultimo mensaje + tiempo de animacion + pausa
        return lastMessageDelay * 1000 + 500 + PAUSE_AFTER_CONVERSATION;
    };

    // Autoplay con timeout dinamico
    useEffect(() => {
        if (isPaused) return;

        const duration = calculateDuration(activeScenarioId);

        timerRef.current = setTimeout(() => {
            setActiveIndex(prev => (prev + 1) % SCENARIO_ORDER.length);
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPaused, activeScenarioId]);

    const handleTabClick = (index: number) => {
        setActiveIndex(index);
        setIsPaused(true);
    };

    return (
        <section id="demo-workflow" className="mx-auto w-full max-w-7xl space-y-8">
            {/* Tabs de Sectores - Estilo ProcessWorkflow */}
            <div className="flex w-full flex-wrap items-center justify-center gap-6 md:gap-12 text-sm font-medium tracking-tight font-mono text-muted">
                {SCENARIO_ORDER.map((scenarioId, index) => {
                    const scenario = SCENARIOS[scenarioId];
                    const Icon = SECTOR_ICONS[scenarioId];
                    const isActive = index === activeIndex;

                    return (
                        <button key={scenarioId} onClick={() => handleTabClick(index)} className={`relative flex items-center gap-3 py-2 px-1 transition-all ${isActive ? 'text-primary scale-105' : 'opacity-50 hover:opacity-70'}`}>
                            {/* Indicador circular animado */}
                            <div className="relative h-5 w-5 flex items-center justify-center">
                                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${isActive ? 'border-[var(--color-warning)] border-dotted scale-100 opacity-100' : 'border-secondary scale-90 opacity-40'}`} />
                                {isActive && <motion.div layoutId="demo-active-dot" className="h-2 w-2 rounded-full bg-[var(--color-warning)]" transition={{type: 'spring', stiffness: 300, damping: 20}} />}
                            </div>

                            {/* Icono del sector */}
                            <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />

                            {/* Label del sector */}
                            <span className="hidden sm:inline">{scenario.title}</span>

                            {/* Barra de progreso (solo activo y no pausado) */}
                            {isActive && !isPaused && <motion.div key={scenarioId + '-progress'} className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-warning)] opacity-50" initial={{width: '0%'}} animate={{width: '100%'}} transition={{duration: calculateDuration(scenarioId) / 1000, ease: 'linear'}} />}
                        </button>
                    );
                })}
            </div>

            {/* Area Visual Principal */}
            <div className="border rounded-md overflow-hidden shadow-sm border-primary bg-surface" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                <div className="border-b relative min-h-[520px] md:min-h-[600px] overflow-hidden border-primary bg-secondary">
                    {/* Imagen de fondo opcional */}
                    {backgroundImage && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{backgroundImage: `url(${backgroundImage})`}} />}
                    {/* Grid Pattern de fondo */}
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Contenedor principal con chat y contexto */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
                        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                            {/* Panel de informacion del escenario - Oculto en movil */}
                            <AnimatePresence mode="wait">
                                <motion.div key={activeScenarioId + '-info'} className="hidden lg:block lg:col-span-5 space-y-4" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} transition={{duration: 0.3}}>
                                    <div className="bg-surface border border-primary rounded-lg p-5 shadow-sm">
                                        <Badge>{currentScenario.title}</Badge>
                                        <h3 className="text-lg font-heading font-semibold text-primary mt-3 mb-2">{currentScenario.name}</h3>
                                        <p className="text-sm text-secondary leading-relaxed mb-4">{currentScenario.desc}</p>

                                        {/* Features del escenario */}
                                        <div className="space-y-2">
                                            {currentScenario.features.map((feature, idx) => (
                                                <motion.div key={feature} className="flex items-center gap-2 text-xs text-muted" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2 + idx * 0.1}}>
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                                                    <span>{feature}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Backend log flotante */}
                                    <motion.div className="bg-surface border border-primary shadow-lg p-3 rounded-lg" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 1.5}}>
                                        <div className="text-[10px] font-mono text-subtle mb-1">BACKEND LOG</div>
                                        <div className="text-xs font-medium text-[var(--color-success)] flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Accion completada
                                        </div>
                                        <div className="text-[10px] text-muted mt-1">Synced w/ Calendar + CRM</div>
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Simulador de chat animado - Ocupa todo el ancho en movil */}
                            <AnimatePresence mode="wait">
                                <motion.div key={activeScenarioId + '-chat'} className="col-span-12 lg:col-span-7 flex justify-center" initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} transition={{duration: 0.4}}>
                                    <AnimatedChat scenario={currentScenario} />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
