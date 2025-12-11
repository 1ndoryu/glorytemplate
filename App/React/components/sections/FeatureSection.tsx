import {motion} from 'framer-motion';
import {MessageSquare} from 'lucide-react';

import {Button, NotificationStatus} from '../ui';
import {FeatureList} from './FeatureList';
import type {Feature} from './FeatureList';
import {siteUrls} from '../../config';

interface FeatureSectionProps {
    features: Feature[];
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
                        <motion.div className="relative w-[85%] border rounded-lg p-4 shadow-lg transition-transform hover:-translate-y-1 bg-surface border-primary" initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.5}}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[var(--color-accent-green)]">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-primary">Maria Gomez</div>
                                        <div className="text-[10px] opacity-70 text-muted">via WhatsApp Business</div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-subtle">Now</span>
                            </div>

                            <motion.div className="p-2 rounded mb-3 text-[11px] leading-relaxed border bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)] text-secondary" initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay: 0.5}}>
                                Hola, me gustaria agendar una reunion para manana por la tarde si es posible.
                            </motion.div>

                            <div className="pt-2 border-subtle">
                                <NotificationStatus />
                            </div>
                        </motion.div>
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
