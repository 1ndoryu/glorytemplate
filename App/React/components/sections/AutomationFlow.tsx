import {motion} from 'framer-motion';
import {MessageSquare, Workflow, Calendar, Database, LucideIcon} from 'lucide-react';
import {Badge} from '../ui';

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
}

// --- COMPONENTE ---
// Seccion visual de automatizacion con flujo animado
// Muestra como se conectan los diferentes servicios
export function AutomationFlow({badge = 'BACKEND & LOGIC', title, description, features}: AutomationFlowProps): JSX.Element {
    return (
        <section id="automation-section" className="mx-auto w-full max-w-7xl">
            <div className="rounded-xl p-8 md:p-12 text-[#f8f8f6] relative overflow-hidden" style={{backgroundColor: '#1c1917'}}>
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div id="automation-content">
                        <Badge className="mb-4 bg-[#292524] text-[#a8a29e] border-[#44403c]">{badge}</Badge>
                        <h2 className="text-3xl font-semibold tracking-tight mb-6 text-white">{title}</h2>
                        <p className="text-[#d6d3d1] mb-8 leading-relaxed font-light">{description}</p>

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
                    </div>

                    {/* Visual Flow Abstracto */}
                    <div id="automation-visual" className="relative h-64 md:h-80 bg-white/5 rounded-lg border border-white/10 p-6 flex flex-col justify-center items-center">
                        {/* Node 1 */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono text-[#a8a29e]">TRIGGER: NUEVO MENSAJE</span>
                        </motion.div>

                        {/* Line */}
                        <div className="h-8 w-px bg-gradient-to-b from-[#25D366] to-[#3b82f6] my-1"></div>

                        {/* Node 2 */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                <Workflow className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono text-[#a8a29e]">MAKE SCENARIO</span>
                        </motion.div>

                        {/* Line Split */}
                        <div className="w-32 h-px bg-[#3b82f6] my-4 relative">
                            <div className="absolute left-1/2 top-0 h-4 w-px bg-[#3b82f6] -translate-x-1/2"></div>
                            <div className="absolute left-0 top-0 h-4 w-px bg-[#3b82f6]"></div>
                            <div className="absolute right-0 top-0 h-4 w-px bg-[#3b82f6]"></div>
                        </div>

                        {/* Nodes 3 (Row) */}
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.4}} className="flex justify-between w-48">
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
