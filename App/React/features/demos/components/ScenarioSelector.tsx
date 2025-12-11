import {Play} from 'lucide-react';
import {Button} from '../../../components/ui/Button';
import {siteUrls} from '../../../config';
import {SCENARIOS} from '../data/scenarios';

interface ScenarioSelectorProps {
    activeScenarioId: string;
    onSelect: (id: string) => void;
}

export function ScenarioSelector({activeScenarioId, onSelect}: ScenarioSelectorProps) {
    return (
        <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-medium tracking-tight text-[#292524] mb-6">Elige una demo para empezar:</h2>

            <div className="space-y-3">
                {Object.values(SCENARIOS).map(scenario => (
                    <div key={scenario.id} onClick={() => onSelect(scenario.id)} className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 ${activeScenarioId === scenario.id ? 'bg-white border-[#292524] shadow-md ring-1 ring-[#292524]/5' : 'bg-[#fcfcfc] border-[#e5e5e0] hover:border-[#d6d3d1]'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`text-sm font-semibold mb-1 ${activeScenarioId === scenario.id ? 'text-[#292524]' : 'text-[#57534e]'}`}>{scenario.title}</h3>
                                <p className="text-xs text-[#79716b] leading-relaxed max-w-[90%]">{scenario.desc}</p>
                            </div>
                            {activeScenarioId === scenario.id && (
                                <div className="h-5 w-5 rounded-full bg-[#292524] flex items-center justify-center animate-in zoom-in duration-300">
                                    <Play className="w-2.5 h-2.5 text-white ml-0.5" />
                                </div>
                            )}
                        </div>

                        {/* Mini features */}
                        {activeScenarioId === scenario.id && (
                            <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                {scenario.features.map(f => (
                                    <span key={f} className="text-[10px] bg-[#f0efeb] px-2 py-1 rounded text-[#57534e] font-medium">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-[#e5e5e0] mt-8">
                <p className="text-sm text-[#79716b] mb-4">¿No ves tu sector? No te preocupes, diseño flujos a medida para cualquier industria.</p>
                <Button href={siteUrls.calendly} variant="outline" className="w-full justify-center">
                    Solicitar demo personalizada
                </Button>
            </div>
        </div>
    );
}
