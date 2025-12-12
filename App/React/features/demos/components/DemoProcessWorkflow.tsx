import {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge} from '../../../components/ui/Badge';
import {Phone, FileText, Play, Rocket, CheckCircle, MessageSquare, Settings} from 'lucide-react';

// Tipos para las simulaciones de proceso
interface DemoProcessStep {
    label: string;
}

interface DemoProcessSimulation {
    badge: string;
    title: string;
    subtitle: string;
}

// Pasos del proceso de demos
const DEMO_STEPS: DemoProcessStep[] = [{label: 'Llamada'}, {label: 'Tu demo'}, {label: 'Prueba'}, {label: 'Lanzamiento'}];

// Simulaciones por cada paso
const DEMO_SIMULATIONS: DemoProcessSimulation[] = [
    {badge: 'PASO 1', title: 'Llamada breve', subtitle: '15-20 min'},
    {badge: 'PASO 2', title: 'Preparo tu demo', subtitle: 'Flujos personalizados'},
    {badge: 'PASO 3', title: 'La probamos juntos', subtitle: 'Ajustes en directo'},
    {badge: 'PASO 4', title: 'Siguiente paso', subtitle: 'Primer mes gratis'}
];

interface DemoProcessWorkflowProps {
    backgroundImage?: string;
}

/**
 * Visualizacion Paso 1: Llamada breve
 * Minimalista: Avatar pulsando + Notas de reunion con checkmarks
 */
function SimulationCall() {
    return (
        <motion.div className="flex flex-col gap-4 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.3}}>
            {/* Tarjeta de Llamada */}
            <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm bg-surface border-[var(--color-border-subtle)]">
                <div className="relative flex-shrink-0">
                    <motion.div className="w-10 h-10 rounded-full flex items-center justify-center border bg-secondary border-primary text-primary" animate={{boxShadow: ['0 0 0 0px var(--color-bg-secondary)', '0 0 0 8px transparent']}} transition={{duration: 2, repeat: Infinity}}>
                        <Phone className="w-5 h-5" />
                    </motion.div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 bg-[var(--color-success)] border-surface"></div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-primary">Llamada de 15-20 min</div>
                        <div className="flex gap-0.5 items-end h-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div key={i} className="w-0.5 rounded-full bg-[var(--color-text-primary)]" animate={{height: ['20%', '100%', '20%']}} transition={{duration: 0.8, repeat: Infinity, delay: i * 0.1}} />
                            ))}
                        </div>
                    </div>
                    <div className="text-xs text-muted">Eliges canal/sector y objetivo</div>
                </div>
            </div>

            {/* Puntos a tratar */}
            <motion.div className="space-y-2 pl-2" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}}>
                {['WhatsApp, Instagram o Web?', 'Tu sector y casos de uso', 'Que debe hacer el bot?'].map((note, i) => (
                    <motion.div key={i} className="flex items-center gap-2 text-xs text-secondary" initial={{opacity: 0, x: -5}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8 + i * 0.2}}>
                        <motion.div className="w-4 h-4 rounded-full flex items-center justify-center border bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)]" initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 1.5 + i * 0.3, type: 'spring'}}>
                            <CheckCircle className="w-2.5 h-2.5 text-[var(--color-success)]" />
                        </motion.div>
                        <span>{note}</span>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 2: Preparo tu demo
 * Minimalista: Editor de flujos con mensajes apareciendo
 */
function SimulationPrepareDemo() {
    return (
        <motion.div className="flex flex-col gap-3 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            {/* Header del editor */}
            <div className="flex items-center gap-2 px-2">
                <FileText className="w-4 h-4 text-muted" />
                <span className="text-xs font-mono text-muted">flujo_barberia.json</span>
                <motion.span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-success)]" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 2.5}}>
                    Guardado
                </motion.span>
            </div>

            {/* Flujo de reglas */}
            <div className="border rounded-md p-3 space-y-3 bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)]">
                {[
                    {trigger: 'Hola / Buenos dias', response: 'Saludo + menu de opciones'},
                    {trigger: 'Quiero cita', response: 'Mostrar huecos disponibles'},
                    {trigger: 'Horarios?', response: 'Info + sugerir reserva'}
                ].map((rule, i) => (
                    <motion.div key={i} className="flex items-center gap-2 text-xs" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3 + i * 0.5}}>
                        <div className="flex-shrink-0 w-3 h-3 rounded-full border-2 flex items-center justify-center border-[var(--color-border-secondary)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)]"></div>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded border bg-surface border-[var(--color-border-subtle)] text-primary">{rule.trigger}</span>
                            <motion.span className="text-muted" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.8 + i * 0.5}}>
                                →
                            </motion.span>
                            <motion.span className="px-2 py-0.5 rounded border bg-secondary border-secondary text-secondary" initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{delay: 1 + i * 0.5}}>
                                {rule.response}
                            </motion.span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 3: La probamos juntos
 * Minimalista: Chat en vivo con ajustes
 */
function SimulationTestTogether() {
    const [adjustmentMade, setAdjustmentMade] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAdjustmentMade(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div className="flex flex-col gap-3 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            {/* Header con indicador de prueba */}
            <div className="flex items-center gap-2 px-2">
                <motion.div className="w-2 h-2 rounded-full bg-[var(--color-success)]" animate={{scale: [1, 1.2, 1]}} transition={{duration: 1.5, repeat: Infinity}} />
                <span className="text-xs font-mono text-muted">Prueba en vivo</span>
                <Play className="w-3 h-3 ml-auto text-[var(--color-success)]" />
            </div>

            {/* Simulacion de chat */}
            <div className="border rounded-md p-3 space-y-2 bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)]">
                <motion.div className="flex gap-2 items-start" initial={{opacity: 0, x: -5}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold bg-secondary text-primary border border-secondary">U</div>
                    <div className="p-2 rounded-lg rounded-tl-none text-xs border bg-surface border-[var(--color-border-subtle)] text-primary">Quiero corte + barba para manana</div>
                </motion.div>

                <motion.div className="flex gap-2 items-start" initial={{opacity: 0, x: -5}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8}}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold bg-secondary text-primary border border-secondary">AI</div>
                    <div className="p-2 rounded-lg rounded-tl-none text-xs border bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-primary">Tengo hueco a las 11:00 y 17:30. Cual prefieres?</div>
                </motion.div>
            </div>

            {/* Ajuste en directo */}
            <AnimatePresence>
                {adjustmentMade && (
                    <motion.div className="flex items-center gap-2 px-2 py-1.5 rounded border bg-[var(--color-bg-tertiary)] border-[var(--color-warning)]" initial={{opacity: 0, y: 5, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0}}>
                        <Settings className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                        <span className="text-xs text-primary">Ajuste: Anadir precio en la respuesta</span>
                        <motion.span className="ml-auto text-[10px] font-bold text-[var(--color-success)]" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.5}}>
                            Aplicado
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 4: Siguiente paso / Lanzamiento
 * Minimalista: Confirmacion + CTA visual
 */
function SimulationLaunch() {
    return (
        <motion.div className="flex flex-col gap-4 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            {/* Tarjeta de confirmacion */}
            <motion.div className="border rounded-md p-4 flex flex-col items-center gap-3 bg-surface border-[var(--color-border-subtle)]" initial={{scale: 0.95}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 200}}>
                <motion.div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-bg-tertiary)] border-2 border-[var(--color-success)]" initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 0.3, type: 'spring'}}>
                    <Rocket className="w-6 h-6 text-[var(--color-success)]" />
                </motion.div>

                <motion.div className="text-center" initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} transition={{delay: 0.6}}>
                    <div className="text-sm font-medium text-primary">Si te encaja, lo lanzamos</div>
                    <div className="text-xs text-muted mt-1">Primer mes gratis para probar</div>
                </motion.div>
            </motion.div>

            {/* Beneficios */}
            <motion.div className="space-y-2 pl-2" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1}}>
                {['Sin compromiso de permanencia', 'Soporte directo conmigo', 'Ajustes ilimitados'].map((benefit, i) => (
                    <motion.div key={i} className="flex items-center gap-2 text-xs text-secondary" initial={{opacity: 0, x: -5}} animate={{opacity: 1, x: 0}} transition={{delay: 1.2 + i * 0.2}}>
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                        <span>{benefit}</span>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}

/**
 * DemoProcessWorkflow - Componente de proceso para la pagina de demos
 * Estructura inspirada en ProcessWorkflow del home con animaciones propias
 */
export function DemoProcessWorkflow({backgroundImage}: DemoProcessWorkflowProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentSimulation = DEMO_SIMULATIONS[activeStep];

    // Manejo del ciclo automatico
    useEffect(() => {
        if (isPaused) return;

        timerRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % DEMO_STEPS.length);
        }, 6000); // 6 segundos por slide

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused]);

    const handleStepClick = (index: number) => {
        setActiveStep(index);
        setIsPaused(true);
    };

    return (
        <section id="demo-process-workflow" className="mx-auto w-full max-w-7xl space-y-8">
            {/* Titulo de seccion */}
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-primary">Como lo hacemos</h2>
                <p className="text-muted mt-2 max-w-xl mx-auto">4 pasos sencillos para tener tu demo funcionando</p>
            </div>

            {/* Indicadores Minimalistas */}
            <div className="flex w-full flex-wrap items-center justify-between gap-6 text-sm md:text-sm font-medium tracking-tight font-mono text-muted">
                {DEMO_STEPS.map((step, index) => {
                    const isActive = index === activeStep;

                    return (
                        <button key={index} onClick={() => handleStepClick(index)} className={`flex items-center gap-2 transition-all ${isActive ? 'hover:opacity-80 cursor-pointer scale-105 text-primary' : 'opacity-50 hover:opacity-70 cursor-pointer'}`}>
                            <div className="relative h-4 w-4 flex items-center justify-center">
                                <div
                                    className={`absolute inset-0 rounded-full border transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-40'} ${isActive ? 'border-[var(--color-warning)]' : 'border-secondary'}`}
                                    style={{
                                        borderStyle: isActive ? 'dotted' : 'solid',
                                        borderWidth: '2px'
                                    }}></div>
                                {isActive && <motion.div layoutId="demo-active-dot" className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" transition={{type: 'spring', stiffness: 300, damping: 20}} />}
                            </div>
                            <span>{step.label}</span>

                            {/* Barra de progreso de tiempo restante */}
                            {isActive && !isPaused && <motion.div className="absolute bottom-[-4px] left-0 h-[1px] bg-current opacity-30" initial={{width: '0%'}} animate={{width: '100%'}} transition={{duration: 6, ease: 'linear'}} />}
                        </button>
                    );
                })}
            </div>

            {/* Area Visual */}
            <div className="border rounded-md overflow-hidden shadow-sm border-primary bg-surface" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                <div className="border-b relative h-[450px] md:h-[500px] overflow-hidden group border-primary bg-secondary">
                    {/* Imagen de fondo opcional */}
                    {backgroundImage && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{backgroundImage: `url(${backgroundImage})`}} />}
                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}></div>

                    {/* Tarjeta Flotante Central */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                        <div className="w-full max-w-xl rounded-lg shadow-sm border p-1.5 transition-transform duration-500 bg-surface border-primary">
                            <div className="rounded border p-4 md:p-5 flex flex-col gap-4 bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]">
                                {/* Header de la Tarjeta */}
                                <div className="flex items-center justify-between border-b pb-3 border-[var(--color-border-subtle)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded border bg-secondary border-secondary flex items-center justify-center">
                                            <MessageSquare className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-primary">{currentSimulation.title}</div>
                                            <div className="text-xs text-muted">{currentSimulation.subtitle}</div>
                                        </div>
                                    </div>
                                    <Badge>{currentSimulation.badge}</Badge>
                                </div>

                                {/* Contenido Dinamico Animado */}
                                <div className="min-h-[160px] flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={activeStep} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                                            {activeStep === 0 && <SimulationCall />}
                                            {activeStep === 1 && <SimulationPrepareDemo />}
                                            {activeStep === 2 && <SimulationTestTogether />}
                                            {activeStep === 3 && <SimulationLaunch />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
