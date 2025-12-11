import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {MessageSquare, User, Calendar, CheckCircle} from 'lucide-react';
import {Badge} from '../ui';

import {Button} from '../ui';
import {FeatureList} from './FeatureList';
import type {Feature} from './FeatureList';
import {siteUrls} from '../../config';

interface FeatureSectionProps {
    features: Feature[];
}

// Simulacion de conversacion y reserva
function ConversationSimulation() {
    const [step, setStep] = useState<'chat' | 'list'>('chat');
    const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const runCycle = () => {
            // Reiniciar ciclo
            setStep('chat');
            setStatus('idle');

            // 1. Aparece chat (animacion entry automatica)

            // 2. Procesando a los 2.5s
            timeout = setTimeout(() => setStatus('processing'), 2500);

            // 3. Confirmado a los 5.5s
            setTimeout(() => setStatus('confirmed'), 5500);

            // 4. Cambiar a lista de citas a los 9s
            setTimeout(() => setStep('list'), 9000);

            // 5. Reiniciar todo a los 15s (6s viendo la lista)
            setTimeout(runCycle, 15000);
        };

        runCycle();

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="relative w-[85%] h-[180px]">
            <AnimatePresence mode="wait">
                {step === 'chat' ? (
                    <motion.div key="chat" className="absolute inset-0 rounded-lg p-4 shadow-lg bg-surface border border-[var(--color-border-subtle)] flex flex-col justify-between" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10, scale: 0.95}} transition={{duration: 0.5}}>
                        {/* Header Chat */}
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white bg-[var(--color-accent-primary)]">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-primary">Maria Gomez</div>
                                    <div className="text-[10px] opacity-70 text-muted">via WhatsApp Business</div>
                                </div>
                            </div>
                            <span className="text-[10px] text-subtle">Now</span>
                        </div>

                        {/* Mensaje */}
                        <motion.div className="p-2 rounded mb-2 text-[11px] leading-relaxed border bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)] text-secondary" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3}}>
                            Hola, me gustaria agendar una reunion para manana por la tarde si es posible.
                        </motion.div>

                        {/* Status Footer */}
                        <div className="pt-1 border-t border-[var(--color-border-primary)] min-h-[30px] flex items-center">
                            <AnimatePresence mode="wait">
                                {status === 'idle' && <span className="text-[10px] text-subtle">...</span>}

                                {status === 'processing' && (
                                    <motion.div key="proc" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] bg-[var(--color-bg-tertiary)] text-secondary">
                                        <span>Bot: Buscando hueco...</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse"></span>
                                    </motion.div>
                                )}

                                {status === 'confirmed' && (
                                    <motion.div key="conf" initial={{opacity: 0}} animate={{opacity: 1}} className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] bg-[var(--color-success)]/10 text-[var(--color-success)]">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Cita Agendada: Mañana 16:00</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="list" className="absolute inset-0 rounded-lg shadow-lg bg-surface border border-[var(--color-border-subtle)] overflow-hidden flex flex-col" initial={{opacity: 0, y: 10, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: -10}} transition={{duration: 0.5}}>
                        {/* Fake Header CRM */}
                        <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-secondary" />
                                <span className="text-[10px] font-bold text-secondary">Agenda CRM</span>
                            </div>
                            <Badge className="text-[8px] h-4 px-1 py-0">LIVE</Badge>
                        </div>

                        {/* Lista Citas */}
                        <div className="p-2 space-y-2">
                            <div className="flex items-center gap-2 p-2 rounded border border-[var(--color-border-subtle)] opacity-50">
                                <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px]">JP</div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-secondary">Juan Perez</div>
                                    <div className="text-[9px] text-subtle">Hoy 10:00 - Revisión</div>
                                </div>
                            </div>

                            {/* New Item Highlight */}
                            <motion.div className="flex items-center gap-2 p-2 rounded border border-[var(--color-border-primary)] bg-[var(--color-accent-green)]/10" initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-[9px]">
                                    <User className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-primary">Maria Gomez</div>
                                    <div className="text-[9px] text-[var(--color-success)] font-medium">Mañana 16:00 - Reunión</div>
                                </div>
                                <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                            </motion.div>

                            <div className="flex items-center gap-2 p-2 rounded border border-[var(--color-border-subtle)] opacity-50">
                                <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px]">TR</div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-secondary">Ana Torres</div>
                                    <div className="text-[9px] text-subtle">Jueves 12:30 - Demo</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * FeatureSection: Seccion de caracteristicas con mockup visual de WhatsApp.
 *
 * Combina:
 * - Mockup visual animado de una conversacion de WhatsApp
 * - Lista de features/beneficios
 * - CTA para ver planes
 *
 * Extraido de HomeIsland para mejorar mantenibilidad.
 */
export function FeatureSection({features}: FeatureSectionProps): JSX.Element {
    return (
        <section id="servicios" className="mx-auto w-full max-w-7xl pt-12">
            <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-primary">Lo que voy a conseguir contigo</h2>
                <p className="mt-3 max-w-3xl text-sm text-muted">Mas oportunidades, reservas directas, menos tareas repetitivas y mejor experiencia para tus clientes.</p>
            </div>

            <div className="grid grid-cols-12 gap-12 lg:gap-16 items-start">
                {/* Mockup Visual */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="rounded-sm border shadow-sm overflow-hidden aspect-[4/3] relative flex items-center justify-center group bg-[var(--color-bg-secondary)] border-primary">
                        <div className="absolute inset-0 opacity-20 bg-[var(--color-border-secondary)]"></div>
                        <ConversationSimulation />
                    </div>
                </div>

                {/* Feature List */}
                <div className="col-span-12 lg:col-span-6 flex flex-col justify-center h-full">
                    <FeatureList features={features} />
                    <div className="mt-8">
                        <Button href={siteUrls.planes} variant="outline" className="h-9 text-xs">
                            Ver planes
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
