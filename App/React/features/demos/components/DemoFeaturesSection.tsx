import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Calendar, CheckCircle} from 'lucide-react';
import {Badge, Button, SimulationCard} from '../../../components/ui';
import {SplitSection} from '../../../components/sections/SplitSection';

interface DemoFeatureItem {
    icon: React.ComponentType<{className?: string}>;
    text: string;
}

interface DemoFeaturesSectionProps {
    title: string;
    description: string;
    items: DemoFeatureItem[];
    ctaText: string;
    ctaHref: string;
}

/**
 * Contenido animado de la simulacion
 * Ciclo: Chat -> Procesando -> Confirmado -> Lista CRM
 */
function DemoSimulationContent() {
    const [step, setStep] = useState<'chat' | 'list'>('chat');
    const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const runCycle = () => {
            // Reiniciar ciclo
            setStep('chat');
            setStatus('idle');

            // 1. Procesando a los 2s
            timeout = setTimeout(() => setStatus('processing'), 2000);

            // 2. Confirmado a los 4.5s
            setTimeout(() => setStatus('confirmed'), 4500);

            // 3. Cambiar a lista de citas a los 7s
            setTimeout(() => setStep('list'), 7000);

            // 4. Reiniciar todo a los 12s (5s viendo la lista)
            setTimeout(runCycle, 12000);
        };

        runCycle();

        return () => clearTimeout(timeout);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {step === 'chat' ? (
                <motion.div key="chat" className="flex flex-col gap-3" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10, scale: 0.95}} transition={{duration: 0.4}}>
                    {/* Mensaje entrante */}
                    <motion.div className="flex gap-2 items-start" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-secondary text-primary border-secondary">C</div>
                        <div className="p-2 rounded-lg rounded-tl-none text-[11px] border max-w-[85%] bg-[var(--color-bg-tertiary)] text-primary border-[var(--color-border-subtle)]">Quiero reservar una cita para manana.</div>
                    </motion.div>

                    {/* Respuesta bot */}
                    <motion.div className="flex gap-2 flex-row-reverse items-start" initial={{opacity: 0, x: 10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8}}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]">AI</div>
                        <div className="p-2 rounded-lg rounded-tr-none text-[11px] border max-w-[85%] shadow-sm bg-surface text-primary border-primary">Perfecto. Tengo huecos a las 10:00 y 16:00.</div>
                    </motion.div>

                    {/* Status Footer */}
                    <div className="pt-2 border-t border-[var(--color-border-subtle)] min-h-[28px] flex items-center">
                        <AnimatePresence mode="wait">
                            {status === 'idle' && (
                                <motion.span key="idle" className="text-[10px] text-subtle" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                                    Esperando...
                                </motion.span>
                            )}

                            {status === 'processing' && (
                                <motion.div key="proc" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] bg-[var(--color-bg-tertiary)] text-secondary">
                                    <span>Bot: Buscando hueco...</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse"></span>
                                </motion.div>
                            )}

                            {status === 'confirmed' && (
                                <motion.div key="conf" initial={{opacity: 0}} animate={{opacity: 1}} className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] bg-[var(--color-success)]/10 text-[var(--color-success)]">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Cita Agendada: 16:00</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ) : (
                <motion.div key="list" className="flex flex-col" initial={{opacity: 0, y: 10, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: -10}} transition={{duration: 0.4}}>
                    {/* Header mini CRM */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border-subtle)]">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] font-bold text-secondary">Agenda CRM</span>
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
                                <div className="text-[9px] text-subtle">Hoy 10:00</div>
                            </div>
                        </div>

                        {/* Nueva cita - Highlight */}
                        <motion.div className="flex items-center gap-2 p-1.5 rounded border border-[var(--color-border-primary)] bg-[var(--color-success)]/5" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                            <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-[9px]">C</div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-primary">Cliente Nuevo</div>
                                <div className="text-[9px] text-[var(--color-success)] font-medium">Manana 16:00</div>
                            </div>
                            <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                        </motion.div>

                        <div className="flex items-center gap-2 p-1.5 rounded border border-[var(--color-border-subtle)] opacity-50">
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px]">AT</div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-secondary">Ana Torres</div>
                                <div className="text-[9px] text-subtle">Jueves 12:30</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Componente visual completo usando SimulationCard */
function DemoVisualSimulation() {
    return (
        <SimulationCard badge="DEMO" minHeight="150px">
            <DemoSimulationContent />
        </SimulationCard>
    );
}

export function DemoFeaturesSection({title, description, items, ctaText, ctaHref}: DemoFeaturesSectionProps) {
    // Contenido de texto: mismo estilo que AnalyticsSection
    const textContent = (
        <>
            <Badge className="w-fit mb-4 text-[var(--color-warning)] border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10">DEMO PREVIEW</Badge>
            <h2 className="text-3xl font-medium tracking-tight mb-6 text-primary">{title}</h2>
            <p className="text-base mb-8 leading-relaxed text-muted">{description}</p>

            {/* Lista de features estilo AnalyticsSection */}
            <div className="space-y-6">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                        <div className="mt-1 p-1.5 rounded-md border flex-none bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)]">
                            <item.icon className="w-4 h-4 text-[var(--color-accent-primary)]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary">{item.text}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA dentro de la seccion */}
            <div className="mt-10 pt-6 border-t border-[var(--color-bg-tertiary)]">
                <Button href={ctaHref} variant="outline">
                    {ctaText}
                </Button>
            </div>
        </>
    );

    return <SplitSection id="que-veras-demo" visual={<DemoVisualSimulation />} content={textContent} visualPosition="right" />;
}
