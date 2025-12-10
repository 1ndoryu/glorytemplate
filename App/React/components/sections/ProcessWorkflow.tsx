import {useState} from 'react';
import {Badge} from '../ui/Badge';

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
 * Componente unificado que muestra el proceso de trabajo
 * Incluye los indicadores clicables y el area visual de simulacion
 */
export function ProcessWorkflow({steps, simulations}: ProcessWorkflowProps) {
    const [activeStep, setActiveStep] = useState(0);

    const currentSimulation = simulations[activeStep];

    return (
        <section className="mx-auto w-full max-w-7xl space-y-8">
            {/* Indicadores de proceso - clicables */}
            <div className="flex w-full flex-wrap items-center justify-between gap-6 text-[13px] md:text-sm font-medium tracking-tight font-mono" style={{color: 'var(--color-text-muted)'}}>
                {steps.map((step, index) => {
                    const isActive = index === activeStep;

                    return (
                        <button key={index} onClick={() => setActiveStep(index)} className={`flex items-center gap-2 transition-all ${isActive ? 'hover:opacity-80 cursor-pointer scale-105' : 'opacity-50 hover:opacity-70 cursor-pointer'}`} style={{color: isActive ? 'var(--color-text-primary)' : 'inherit'}}>
                            <div className={`h-4 w-4 rounded-full ${isActive ? 'border-[2px] border-dotted border-orange-500 animate-spin' : 'border'}`} style={{borderColor: isActive ? undefined : 'var(--color-border-secondary)'}}></div>
                            <span>{step.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Area visual de simulacion */}
            <div className="border rounded-md overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                <div className="border-b relative h-64 md:h-[420px] overflow-hidden group" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-secondary)'}}>
                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}></div>

                    {/* Mockup de simulacion */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full max-w-3xl rounded-lg shadow-sm border p-1.5 transform transition-transform group-hover:scale-[1.005] duration-1000" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            <div className="rounded border p-6 flex flex-col gap-4" style={{backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)'}}>
                                {/* Header con badge */}
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

                                {/* Contenido de la simulacion */}
                                <div className="space-y-3">
                                    {/* Titulo y subtitulo del proceso actual */}
                                    <div className="p-3 border rounded-md shadow-sm" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                        <div className="flex items-start gap-3">
                                            <div className="h-4 w-4 rounded-full border border-orange-400 animate-pulse mt-1"></div>
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold mb-1" style={{color: 'var(--color-text-primary)'}}>
                                                    {currentSimulation.title}
                                                </div>
                                                <div className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                                                    {currentSimulation.subtitle}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linea de progreso secundaria */}
                                    <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm opacity-60" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)'}}>
                                        <div className="h-4 w-4 rounded-full border" style={{borderColor: 'var(--color-border-secondary)'}}></div>
                                        <div className="h-2 w-1/2 rounded-sm" style={{backgroundColor: 'var(--color-border-subtle)'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
