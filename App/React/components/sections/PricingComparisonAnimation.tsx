import {motion} from 'framer-motion';
import {Check, Settings2, Lock, ListFilter, Phone, Target, FileCheck} from 'lucide-react';
import {LucideIcon} from 'lucide-react';

export function PricingComparisonAnimation() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
                {/* RIGHT: MARKET STATIC APPROACH (UI STYLE) */}
                <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.6, delay: 0.2}} className="relative md:mt-12 opacity-90">
                    {/* UI Window Header */}
                    <div className="bg-bg-tertiary border border-border-primary border-b-0 rounded-t-xl p-4 flex items-center justify-between opacity-80">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5 opacity-50">
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                            </div>
                            <div className="h-4 w-px bg-border-primary mx-2" />
                            <span className="text-xs font-semibold text-muted tracking-tight flex items-center gap-1.5">
                                <ListFilter className="w-3.5 h-3.5" />
                                Plan Estándar Del Mercado
                            </span>
                        </div>
                        <div className="px-2 py-1 rounded bg-bg-secondary text-[10px] font-medium text-muted border border-border-primary uppercase tracking-wider">Rigido</div>
                    </div>

                    {/* UI Body */}
                    <div className="bg-white border border-border-primary rounded-b-xl p-6 md:p-8 shadow-sm relative">
                        <div className="space-y-3">
                            <StaticRow title="Plan Básico" active={true} />
                            <StaticRow title="Features Definidos" active={true} />
                            <StaticRow title="Integraciones Extra" active={false} locked={true} />
                            <StaticRow title="Personalización" active={false} locked={true} />
                            <StaticRow title="Soporte Prioritario" active={false} locked={true} />
                        </div>

                        {/* Overlay to simulate 'Generic' feel */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent pointer-events-none rounded-b-xl" />
                    </div>
                </motion.div>
                {/* LEFT: MY DYNAMIC APPROACH (UI STYLE) */}
                <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.6}} className="relative">
                    {/* UI Window Header */}
                    <div className="bg-white border border-border-primary border-b-0 rounded-t-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                            </div>
                            <div className="h-4 w-px bg-border-primary mx-2" />
                            <span className="text-xs font-semibold text-primary/70 tracking-tight flex items-center gap-1.5">
                                <Settings2 className="w-3.5 h-3.5" />
                                Mi solución
                            </span>
                        </div>
                        <div className="px-2 py-1 rounded bg-green-50 text-[10px] font-medium text-green-700 border border-green-100 uppercase tracking-wider">Flexible</div>
                    </div>

                    {/* UI Body */}
                    <div className="bg-bg-primary/50 border border-border-primary rounded-b-xl p-6 md:p-8 shadow-xl shadow-black/5 relative overflow-hidden">
                        {/* Connection Line */}
                        <div className="absolute left-[2.25rem] md:left-[2.75rem] top-8 bottom-8 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent dashed opacity-50 z-0 border-l border-dashed border-primary/30" />

                        <div className="space-y-2 relative z-10">
                            <StepCard icon={Phone} title="Llamada breve (15-20 min)" desc="Entender tu situación" active={true} delay={0.2} />
                            <StepCard icon={Target} title="Objetivos y Alcance" desc="Definimos qué quieres lograr" active={true} delay={0.5} />
                            <StepCard icon={FileCheck} title="Propuesta Exacta" desc="Canales + Automatizaciones" active={true} delay={0.8} isLast={true} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

interface StepCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
    active: boolean;
    delay: number;
    isLast?: boolean;
}

function StepCard({icon: Icon, title, desc, active, delay, isLast}: StepCardProps) {
    return (
        <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay, duration: 0.4}} className={`flex items-start gap-4 p-4 rounded-xl transition-all ${active ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${active ? 'bg-[var(--color-bg-secondary)] text-primary' : 'bg-bg-secondary text-muted'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className={`text-sm font-bold ${active ? 'text-primary' : 'text-muted'}`}>{title}</h4>
                <p className="text-xs text-secondary mt-0.5">{desc}</p>
            </div>
            {isLast && (
                <div className="ml-auto self-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Check className="w-3.5 h-3.5" />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function StaticRow({title, active, locked}: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${active ? 'bg-bg-primary border-border-subtle' : 'bg-bg-secondary/30 border-transparent opacity-60'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'}`}>{active && <Check className="w-2.5 h-2.5" />}</div>
                <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-muted-foreground line-through'}`}>{title}</span>
            </div>
            {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />}
        </div>
    );
}
