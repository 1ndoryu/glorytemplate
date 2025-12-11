import {CheckCircle2} from 'lucide-react';
import type {Scenario} from '../data/scenarios';
import {DemoChat} from './DemoChat';
import {ScenarioSelector} from './ScenarioSelector';

interface DemoShowcaseProps {
    activeScenarioId: string;
    onSelect: (id: string) => void;
    currentScenario: Scenario;
}

export function DemoShowcase({activeScenarioId, onSelect, currentScenario}: DemoShowcaseProps) {
    return (
        <section id="demo-showcase" className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Selector de Escenarios */}
                <ScenarioSelector activeScenarioId={activeScenarioId} onSelect={onSelect} />

                {/* Right: Simulador de Teléfono */}
                <div className="lg:col-span-7 bg-secondary rounded-2xl border border-primary p-8 md:p-12 relative flex items-center justify-center overflow-hidden">
                    {/* Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.3]"
                        style={{
                            backgroundImage: `radial-gradient(var(--color-border-secondary) 1px, transparent 1px)`,
                            backgroundSize: '24px 24px'
                        }}></div>

                    <div key={activeScenarioId} className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-500">
                        <DemoChat scenario={currentScenario} />

                        {/* Floating badge */}
                        <div className="absolute top-1/2 -right-4 md:-right-12 bg-surface border border-primary shadow-lg p-3 rounded-lg max-w-[150px] hidden md:block animate-in slide-in-from-right-4 duration-700 delay-500">
                            <div className="text-[10px] font-mono text-subtle mb-1">BACKEND LOG</div>
                            <div className="text-xs font-medium text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Cita Agendada
                            </div>
                            <div className="text-[10px] text-muted mt-1">Synced w/ Calendar</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
