import {Play} from 'lucide-react';
import {Button} from '../../../components/ui/Button';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../../../hooks/useSiteConfig';
import {SCENARIOS} from '../data/scenarios';

interface ScenarioSelectorProps {
    activeScenarioId: string;
    onSelect: (id: string) => void;
}

export function ScenarioSelector({activeScenarioId, onSelect}: ScenarioSelectorProps) {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();

    return (
        <div id="scenario-selector" className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-heading font-medium tracking-tight text-primary mb-6">Elige una demo para empezar:</h2>

            <div className="space-y-3">
                {Object.values(SCENARIOS).map(scenario => (
                    <div key={scenario.id} onClick={() => onSelect(scenario.id)} className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 ${activeScenarioId === scenario.id ? 'bg-surface border-stone-900 shadow-md ring-1 ring-stone-900/5' : 'bg-elevated border-primary hover:border-stone-300'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`text-sm font-heading font-semibold mb-1 ${activeScenarioId === scenario.id ? 'text-primary' : 'text-secondary'}`}>{scenario.title}</h3>
                                <p className="text-xs text-muted leading-relaxed max-w-[90%]">{scenario.desc}</p>
                            </div>
                            {activeScenarioId === scenario.id && (
                                <div className="h-5 w-5 rounded-full bg-stone-900 flex items-center justify-center animate-in zoom-in duration-300">
                                    <Play className="w-2.5 h-2.5 text-white ml-0.5" />
                                </div>
                            )}
                        </div>

                        {/* Mini features */}
                        {activeScenarioId === scenario.id && (
                            <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                {scenario.features.map(f => (
                                    <span key={f} className="text-[10px] bg-secondary px-2 py-1 rounded text-secondary font-medium">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-primary mt-8">
                <p className="text-sm text-muted mb-4">¿No ves tu sector? No te preocupes, diseño flujos a medida para cualquier industria.</p>
                <Button href={urls.calendly} variant="outline" className="w-full justify-center">
                    Solicitar demo personalizada
                </Button>
            </div>
        </div>
    );
}
