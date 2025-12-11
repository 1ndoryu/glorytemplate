import {motion} from 'framer-motion';
import {MessageSquare, Workflow, Calendar, Database, LucideIcon} from 'lucide-react';
import {Badge, Button} from '../ui';

// --- TIPOS ---
interface AutomationFeature {
    icon: LucideIcon;
    label: string;
}

interface AutomationFlowProps {
    badge?: string;
    title: React.ReactNode;
    description: string;
    features: AutomationFeature[];
    cta?: {
        text: string;
        href: string;
    };
}

// --- COMPONENTE ---
// Seccion visual de automatizacion con flujo animado
// Muestra como se conectan los diferentes servicios
export function AutomationFlow({badge = 'BACKEND & LOGIC', title, description, features, cta}: AutomationFlowProps): JSX.Element {
    return (
        <section id="automation-section" className="mx-auto w-full max-w-7xl">
            <div className="rounded-xl p-8 md:p-12 text-[var(--color-bg-primary)] relative overflow-hidden bg-neutral-900">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-info)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div id="automation-content">
                        <Badge className="mb-4 bg-[var(--color-text-primary)] text-[var(--color-text-subtle)] border-neutral-700">{badge}</Badge>
                        <h2 className="text-3xl font-medium tracking-tight mb-6 text-white">{title}</h2>
                        <p className="text-neutral-300 mb-8 leading-relaxed">{description}</p>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                            {features.map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-white/5 border border-white/10">
                                        <feat.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span>{feat.label}</span>
                                </div>
                            ))}
                        </div>

                        {cta && (
                            <div className="mt-8">
                                <Button href={cta.href} variant="white" icon={Calendar}>
                                    {cta.text}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Visual Flow Abstracto */}
                    <div id="automation-visual" className="relative h-64 md:h-80 bg-white/5 rounded-lg border border-white/10 p-6 flex flex-col justify-center items-center">
                        {/* Node 1: Trigger */}
                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.3, duration: 0.5}} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-green)] flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono text-subtle">TRIGGER: NUEVO MENSAJE</span>
                        </motion.div>

                        {/* Line Animated */}
                        <motion.div initial={{scaleY: 0}} whileInView={{scaleY: 1}} viewport={{once: true}} transition={{delay: 0.8, duration: 0.4}} style={{transformOrigin: 'top'}} className="h-8 w-px bg-gradient-to-b from-[var(--color-accent-green)] to-[var(--color-info)] my-1"></motion.div>

                        {/* Node 2: Make Scenario */}
                        <motion.div initial={{opacity: 0, scale: 0.8}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 1.2, duration: 0.4}} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-info)] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                <Workflow className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono text-subtle">MAKE SCENARIO</span>
                        </motion.div>

                        {/* Line Split Animated */}
                        <motion.div initial={{opacity: 0}} whileInView={{opacity: 1}} viewport={{once: true}} transition={{delay: 1.6, duration: 0.3}} className="w-32 h-px bg-[var(--color-info)] my-4 relative">
                            <div className="absolute left-1/2 top-0 h-4 w-px bg-[var(--color-info)] -translate-x-1/2"></div>
                            <div className="absolute left-0 top-0 h-4 w-px bg-[var(--color-info)]"></div>
                            <div className="absolute right-0 top-0 h-4 w-px bg-[var(--color-info)]"></div>
                        </motion.div>

                        {/* Nodes 3 (Row): Output */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 2.0, duration: 0.4}} className="flex justify-between w-48">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                <Database className="w-4 h-4 text-white" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
