import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge} from '../ui/Badge';
import {Phone, Mic, Layout, Database, CheckCircle, TrendingUp, Calendar, MessageSquare, ShieldCheck} from 'lucide-react';

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
}

/**
 * Visualizacion Paso 1: Llamada
 * Minimalista: Avatar pulsando suavemente + Ondas de audio sutiles
 */
function SimulationStepCall() {
    return (
        <motion.div className="flex flex-col gap-4 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.3}}>
            <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm bg-white" style={{borderColor: 'var(--color-border-subtle)'}}>
                <div className="relative flex-shrink-0">
                    <motion.div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100" animate={{boxShadow: ['0 0 0 0px rgba(59, 130, 246, 0.1)', '0 0 0 8px rgba(59, 130, 246, 0)']}} transition={{duration: 2, repeat: Infinity}}>
                        <Phone className="w-5 h-5" />
                    </motion.div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium" style={{color: 'var(--color-text-primary)'}}>
                            Llamada breve de 15-20 min
                        </div>
                        <div className="flex gap-0.5 items-end h-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div key={i} className="w-0.5 bg-blue-400 rounded-full" animate={{height: ['20%', '100%', '20%']}} transition={{duration: 0.8, repeat: Infinity, delay: i * 0.1}} />
                            ))}
                        </div>
                    </div>
                    <div className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                        Me cuentas tu situacion y objetivos
                    </div>
                </div>
            </div>
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
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">AI</div>
                <div className="bg-indigo-50/50 p-2 rounded-lg rounded-tl-none text-[11px] text-indigo-900 border border-indigo-100/50 max-w-[80%]">Hola, ¿en qué puedo ayudarte hoy?</div>
            </motion.div>

            <motion.div className="flex gap-3 flex-row-reverse items-start" initial={{opacity: 0, x: 10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.6}}>
                <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">Tú</div>
                <div className="bg-white p-2 rounded-lg rounded-tr-none text-[11px] text-gray-700 border border-gray-200 max-w-[80%] shadow-sm">Quiero reservar una cita para mañana.</div>
            </motion.div>

            <motion.div className="flex gap-3 items-start" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 1.2}}>
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">AI</div>
                <div className="bg-indigo-50/50 p-2 rounded-lg rounded-tl-none text-[11px] text-indigo-900 border border-indigo-100/50 max-w-[80%]">
                    Aquí tienes los huecos libres:
                    <div className="mt-1 h-1.5 w-12 bg-indigo-200/30 rounded-full"></div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 3: Lanzamiento
 * Minimalista: Iconos de apps activándose
 */
function SimulationStepLaunch() {
    return (
        <motion.div className="flex flex-col gap-3 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <div className="grid grid-cols-4 gap-2">
                {[
                    {icon: Database, color: 'text-emerald-600 bg-emerald-50 border-emerald-100'},
                    {icon: Calendar, color: 'text-orange-600 bg-orange-50 border-orange-100'},
                    {icon: MessageSquare, color: 'text-blue-600 bg-blue-50 border-blue-100'},
                    {icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-100'}
                ].map((item, i) => (
                    <motion.div key={i} className={`flex flex-col items-center justify-center p-2 rounded border ${item.color}`} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: i * 0.1}}>
                        <item.icon className="w-4 h-4 mb-1" />
                        <motion.div initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 0.5 + i * 0.1}}>
                            <CheckCircle className="w-3 h-3 opacity-80" />
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1 px-1">
                <span>STATUS:</span>
                <span className="text-green-600 font-bold">ALL SYSTEMS OPERATIONAL</span>
            </div>
        </motion.div>
    );
}

/**
 * Visualizacion Paso 4: Mejora Continua
 * Minimalista: Micro-grafica subiendo
 */
function SimulationStepImprove() {
    return (
        <motion.div className="flex flex-col gap-3 py-2" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <div className="flex items-end justify-between gap-1 h-16 px-2 border-b border-gray-100 pb-1">
                {[30, 45, 40, 60, 55, 75, 80, 95].map((h, i) => (
                    <motion.div key={i} className="bg-indigo-500 w-full rounded-t-[1px] opacity-80" initial={{height: '10%'}} animate={{height: `${h}%`}} transition={{delay: i * 0.05, duration: 0.5}} />
                ))}
            </div>
            <div className="flex justify-between px-2">
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-[11px] font-medium text-gray-600">Conversión</span>
                </div>
                <motion.span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100" initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.8}}>
                    +32%
                </motion.span>
            </div>
        </motion.div>
    );
}

/**
 * Componente unificado que muestra el proceso de trabajo
 * Estructura minimalista original con animaciones internas enriquecidas
 */
export function ProcessWorkflow({steps, simulations}: ProcessWorkflowProps) {
    const [activeStep, setActiveStep] = useState(0);
    const currentSimulation = simulations[activeStep];

    return (
        <section className="mx-auto w-full max-w-7xl space-y-8">
            {/* Indicadores Minimalistas (Estilo Original) */}
            <div className="flex w-full flex-wrap items-center justify-between gap-6 text-[13px] md:text-sm font-medium tracking-tight font-mono" style={{color: 'var(--color-text-muted)'}}>
                {steps.map((step, index) => {
                    const isActive = index === activeStep;

                    return (
                        <button key={index} onClick={() => setActiveStep(index)} className={`flex items-center gap-2 transition-all ${isActive ? 'hover:opacity-80 cursor-pointer scale-105' : 'opacity-50 hover:opacity-70 cursor-pointer'}`} style={{color: isActive ? 'var(--color-text-primary)' : 'inherit'}}>
                            <div className={`h-4 w-4 rounded-full flex-shrink-0 ${isActive ? 'border-[2px] border-dotted border-orange-500 animate-spin' : 'border'}`} style={{borderColor: isActive ? undefined : 'var(--color-border-secondary)'}}></div>
                            <span>{step.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Area Visual Minimalista (Estilo Original) */}
            <div className="border rounded-md overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                <div className="border-b relative h-64 md:h-[420px] overflow-hidden group" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-secondary)'}}>
                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}></div>

                    {/* Tarjeta Flotante Central (Contenedor de Simulaciones) */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full max-w-2xl rounded-lg shadow-sm border p-1.5 transition-transform duration-500" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            <div className="rounded border p-6 flex flex-col gap-4" style={{backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)'}}>
                                {/* Header de la Tarjeta */}
                                <div className="flex items-center justify-between border-b pb-4" style={{borderColor: 'var(--color-border-subtle)'}}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded border" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-secondary)'}}></div>
                                        <div className="flex flex-col gap-1">
                                            <div className="h-2 w-24 rounded-sm" style={{backgroundColor: 'var(--color-border-secondary)'}}></div>
                                            <div className="h-2 w-16 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                        </div>
                                    </div>
                                    <Badge>{currentSimulation.badge}</Badge>
                                </div>

                                {/* Contenido Dinamico Animado */}
                                <div className="min-h-[120px] flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={activeStep} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                                            {activeStep === 0 && <SimulationStepCall />}
                                            {activeStep === 1 && <SimulationStepPrototype />}
                                            {activeStep === 2 && <SimulationStepLaunch />}
                                            {activeStep === 3 && <SimulationStepImprove />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Linea Falsa Inferior (Fake UI) */}
                                <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm opacity-60 mt-2" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                    <div className="h-4 w-4 rounded-full border" style={{borderColor: 'var(--color-border-secondary)'}}></div>
                                    <div className="h-2 w-1/2 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
