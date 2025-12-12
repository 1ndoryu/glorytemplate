import {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge} from '../ui/Badge';
import {Phone, TrendingUp} from 'lucide-react';

// Tipos para las simulaciones de proceso
interface ProcessStep {
    label: string;
}

interface ProcessSimulation {
    badge: string;
    title: string;
    subtitle: string;
}

interface ProcessWorkflowProps {
    steps: ProcessStep[];
    simulations: ProcessSimulation[];
    backgroundImage?: string;
}

/**
 * Visualizacion Paso 1: Llamada
 * Minimalista: Avatar pulsando suavemente + Ondas de audio + Notas de reunion
 */
function SimulationStepCall() {
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
                        <div className="text-sm font-medium text-primary">Llamada breve de 15-20 min</div>
                        <div className="flex gap-0.5 items-end h-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div key={i} className="w-0.5 rounded-full bg-[var(--color-text-primary)]" animate={{height: ['20%', '100%', '20%']}} transition={{duration: 0.8, repeat: Infinity, delay: i * 0.1}} />
                            ))}
                        </div>
                    </div>
                    <div className="text-xs text-muted">Me cuentas tu situacion y objetivos</div>
                </div>
            </div>

            {/* Notas de Reunion (Puntos Acordados) */}
            <motion.div className="space-y-2 pl-2" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}}>
                {['Definición de objetivos principales', 'Canales a integrar (WhatsApp / Web)', 'Presupuesto y plazos estimados'].map((note, i) => (
                    <motion.div key={i} className="flex items-center gap-2 text-xs text-secondary" initial={{opacity: 0, x: -5}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8 + i * 0.2}}>
                        <div className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]"></div>
                        <span>{note}</span>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 2: Prototipo
 * Minimalista: Burbujas de chat apareciendo
 */
function SimulationStepPrototype() {
    return (
        <motion.div className="space-y-3 py-1" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="flex gap-3 items-start" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.1}}>
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-secondary text-primary border-secondary">AI</div>
                <div className="p-2 rounded-lg rounded-tl-none text-[11px] border max-w-[80%] bg-[var(--color-bg-tertiary)] text-primary border-[var(--color-border-subtle)]">Hola, ¿en qué puedo ayudarte hoy?</div>
            </motion.div>

            <motion.div className="flex gap-3 flex-row-reverse items-start" initial={{opacity: 0, x: 10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.6}}>
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-[var(--color-bg-tertiary)] text-muted border-secondary">Tú</div>
                <div className="p-2 rounded-lg rounded-tr-none text-[11px] border max-w-[80%] shadow-sm bg-surface text-primary border-primary">Quiero reservar una cita para mañana.</div>
            </motion.div>

            <motion.div className="flex gap-3 items-start" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 1.2}}>
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-secondary text-primary border-secondary">AI</div>
                <div className="p-2 rounded-lg rounded-tl-none text-[11px] border max-w-[80%] bg-[var(--color-bg-tertiary)] text-primary border-[var(--color-border-subtle)]">
                    Aquí tienes los huecos libres:
                    <div className="mt-1 h-1.5 w-12 rounded-full opacity-30 bg-[var(--color-text-muted)]"></div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 3: Lanzamiento
 * Minimalista: Consola de despliegue estilo terminal
 */
function SimulationStepLaunch() {
    return (
        <motion.div className="flex flex-col gap-2 py-2 font-mono text-xs" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <div className="flex flex-col gap-1.5 p-3 rounded border bg-[var(--color-bg-tertiary)] border-secondary text-secondary">
                {['Initializing agent core...', 'Connecting to CRM...', 'Syncing WhatsApp Business...', 'Verifying GDPR compliance...'].map((text, i) => (
                    <motion.div key={i} className="flex items-center gap-2" initial={{opacity: 0, x: -5}} animate={{opacity: 1, x: 0}} transition={{delay: i * 0.8}}>
                        <span className="text-muted">{'>'}</span>
                        <span>{text}</span>
                        <motion.span initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: i * 0.8 + 0.6}} className="font-bold ml-auto text-[var(--color-success)]">
                            OK
                        </motion.span>
                    </motion.div>
                ))}

                <motion.div className="mt-2 font-bold flex items-center gap-2 border-t pt-2 text-[var(--color-success)] border-[var(--color-border-subtle)]" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 3.5}}>
                    <span className="w-2 h-2 rounded-full animate-pulse bg-[var(--color-success)]"></span>
                    AI AGENT DEPLOYED SUCCESSFULLY
                </motion.div>
            </div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 4: Mejora Continua
 * Minimalista: Grafica lenta y mensajes de analisis
 */
function SimulationStepImprove() {
    const [statusMsg, setStatusMsg] = useState(0);
    const messages = ['Analizando conversaciones...', 'Detectando fricción...', 'Optimizando respuestas...', 'Aplicando mejoras...'];

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusMsg(prev => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <motion.div className="flex flex-col gap-4 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            {/* Cabecera con mensajes cambiantes */}
            <div className="flex items-center justify-between px-1 h-6">
                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                    <motion.div animate={{rotate: 360}} transition={{duration: 2, repeat: Infinity, ease: 'linear'}}>
                        <div className="w-3 h-3 border-2 rounded-full border-secondary border-t-[var(--color-text-primary)]"></div>
                    </motion.div>
                    <AnimatePresence mode="wait">
                        <motion.span key={statusMsg} initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -5}}>
                            {messages[statusMsg]}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Grafica subiendo LENTO */}
            <div className="flex items-end justify-between gap-1 h-20 px-2 border-b pb-1 overflow-hidden border-secondary">
                {[30, 35, 32, 45, 42, 55, 60, 75, 70, 85].map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-full rounded-t-[1px] opacity-80 bg-[var(--color-text-primary)]"
                        initial={{height: '5%'}}
                        animate={{height: `${h}%`}}
                        transition={{
                            delay: i * 0.5,
                            duration: 1.5,
                            ease: 'easeOut'
                        }}
                    />
                ))}
            </div>

            <div className="flex justify-end px-2">
                <motion.span className="text-[10px] font-bold px-2 py-1 rounded border flex gap-1 items-center bg-secondary text-[var(--color-success)] border-secondary" initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{delay: 5}}>
                    <TrendingUp className="w-3 h-3" />+ Conversión
                </motion.span>
            </div>
        </motion.div>
    );
}

/**
 * Componente unificado que muestra el proceso de trabajo
 * Estructura minimalista con colores normalizados y Autoplay
 */
export function ProcessWorkflow({steps, simulations, backgroundImage}: ProcessWorkflowProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentSimulation = simulations[activeStep];

    // Manejo del ciclo automatico
    useEffect(() => {
        if (isPaused) return;

        timerRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % steps.length);
        }, 6000); // 6 segundos por slide para dar tiempo a ver la animacion

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, steps.length]);

    const handleStepClick = (index: number) => {
        setActiveStep(index);
        setIsPaused(true); // Pausar al interactuar

        // Reiniciar el timer si el usuario quiere seguir viendo
        // Opcional: Podriamos dejarlo pausado para siempre o reanudar despues de un tiempo
    };

    return (
        <section className="mx-auto w-full max-w-7xl space-y-8">
            {/* Indicadores Minimalistas */}
            <div className="flex w-full flex-wrap items-center justify-between gap-6 text-sm md:text-sm font-medium tracking-tight font-mono text-muted">
                {steps.map((step, index) => {
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
                                {isActive && <motion.div layoutId="active-dot" className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" transition={{type: 'spring', stiffness: 300, damping: 20}} />}
                            </div>
                            <span>{step.label}</span>

                            {/* Barra de progreso de tiempo restante (Solo si esta activo y no pausado) */}
                            {isActive && !isPaused && <motion.div className="absolute bottom-[-4px] left-0 h-[1px] bg-current opacity-30" initial={{width: '0%'}} animate={{width: '100%'}} transition={{duration: 6, ease: 'linear'}} />}
                        </button>
                    );
                })}
            </div>

            {/* Area Visual Minimalista */}
            <div
                className="border rounded-md overflow-hidden shadow-sm border-primary bg-surface"
                onMouseEnter={() => setIsPaused(true)} // Pausar al hacer hover sobre la visualizacion
                onMouseLeave={() => setIsPaused(false)} // Reanudar al salir (opcional)
            >
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
                        <div className="w-full max-w-2xl rounded-lg shadow-sm border p-1.5 transition-transform duration-500 bg-surface border-primary">
                            <div className="rounded border p-4 md:p-6 flex flex-col gap-4 bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]">
                                {/* Header de la Tarjeta */}
                                <div className="flex items-center justify-between border-b pb-4 border-[var(--color-border-subtle)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded border bg-secondary border-secondary"></div>
                                        <div className="flex flex-col gap-1">
                                            <div className="h-2 w-24 rounded-sm bg-[var(--color-border-secondary)]"></div>
                                            <div className="h-2 w-16 rounded-sm bg-[var(--color-border-subtle)]"></div>
                                        </div>
                                    </div>
                                    <Badge>{currentSimulation.badge}</Badge>
                                </div>

                                {/* Contenido Dinamico Animado */}
                                <div className="min-h-[140px] flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={activeStep} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                                            {activeStep === 0 && <SimulationStepCall />}
                                            {activeStep === 1 && <SimulationStepPrototype />}
                                            {activeStep === 2 && <SimulationStepLaunch />}
                                            {activeStep === 3 && <SimulationStepImprove />}
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
