/**
 * AdvancedTab - Pestana de configuracion avanzada
 *
 * Contiene opciones avanzadas que estaban ocultas en un colapsable:
 * - Temperatura de generacion
 * - Prompt del sistema
 * - Dominios a ignorar
 * - Modelo personalizado
 */

import {useState, useEffect} from 'react';
import {Sliders, Save, RefreshCw} from 'lucide-react';
import {Button} from '../../../components/ui';

interface AdvancedTabProps {
    config: {
        temperature?: number;
        system_prompt?: string;
        excluded_sources?: string[];
        model?: string;
        custom_model?: string;
    } | null;
    onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

const DEFAULT_SYSTEM_PROMPT = `Eres un experto en chatbots, automatizacion y WhatsApp Business API.
Escribes contenido para el blog de un consultor que ayuda a empresas a implementar estas soluciones.

Tu estilo es cercano y amigable, como hablando con un colega.

Reglas:
- Usa primera persona (yo, mi experiencia, trabajo con mis clientes)
- Evita jerga excesiva, explica conceptos complejos de forma simple
- Incluye ejemplos practicos de negocios reales (restaurantes, clinicas, hoteles)
- NO uses emojis en ningun caso
- Formato HTML limpio, sin clases CSS
- Estructura clara con H2 para secciones principales y H3 para subsecciones`;

export function AdvancedTab({config, onSaveConfig}: AdvancedTabProps): JSX.Element {
    const [temperature, setTemperature] = useState(config?.temperature ?? 0.7);
    const [systemPrompt, setSystemPrompt] = useState(config?.system_prompt || DEFAULT_SYSTEM_PROMPT);
    const [excludedSources, setExcludedSources] = useState(config?.excluded_sources?.join('\n') || '');
    const [customModel, setCustomModel] = useState(config?.custom_model || '');
    const [useCustomModel, setUseCustomModel] = useState(Boolean(config?.custom_model));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Actualizar estado cuando cambia config
    useEffect(() => {
        if (config) {
            setTemperature(config.temperature ?? 0.7);
            setSystemPrompt(config.system_prompt || DEFAULT_SYSTEM_PROMPT);
            setExcludedSources(config.excluded_sources?.join('\n') || '');
            setCustomModel(config.custom_model || '');
            setUseCustomModel(Boolean(config.custom_model));
        }
    }, [config]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        try {
            const configToSave: Record<string, unknown> = {
                temperature,
                system_prompt: systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT,
                custom_model: useCustomModel ? customModel.trim() : ''
            };

            if (excludedSources.trim()) {
                configToSave.excluded_sources = excludedSources
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean);
            }

            // Si se usa modelo personalizado, actualizarlo
            if (useCustomModel && customModel.trim()) {
                configToSave.model = customModel.trim();
            }

            await onSaveConfig(configToSave);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setTemperature(0.7);
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        setExcludedSources('');
        setCustomModel('');
        setUseCustomModel(false);
    };

    return (
        <div id="advanced-tab-content" className="max-w-3xl space-y-8">
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Sliders className="w-5 h-5" />
                    Configuracion Avanzada
                </h2>

                <div className="p-6 rounded-xl border border-primary space-y-6 bg-surface">
                    {/* Temperatura */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Temperatura: {temperature.toFixed(2)}</label>
                        <input type="range" min="0" max="1" step="0.05" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full accent-[var(--color-accent-primary)]" />
                        <div className="flex justify-between text-xs text-muted mt-1">
                            <span>Mas preciso (0)</span>
                            <span>Mas creativo (1)</span>
                        </div>
                    </div>

                    {/* Modelo Personalizado */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-primary">Usar modelo personalizado</label>
                            <button onClick={() => setUseCustomModel(!useCustomModel)} className={`relative w-12 h-6 rounded-full transition-colors ${useCustomModel ? 'bg-[var(--color-accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${useCustomModel ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        {useCustomModel && (
                            <div className="mt-2">
                                <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="Ej: gemini-2.5-flash-exp-0827 o gpt-4-turbo-2024-04-09" className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] font-mono text-sm" />
                                <p className="mt-1 text-xs text-muted">Especifica el identificador exacto del modelo a usar. Esto sobrescribe la seleccion del dropdown.</p>
                            </div>
                        )}
                    </div>

                    {/* Prompt del sistema */}
                    <div>
                        <label htmlFor="system-prompt" className="block text-sm font-medium text-primary mb-2">
                            Prompt del Sistema (personalizado)
                        </label>
                        <textarea id="system-prompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="Ej: Eres un experto en chatbots y automatizacion. Escribe en primera persona..." rows={8} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none text-sm" />
                        <p className="mt-1 text-xs text-muted">Define la personalidad y reglas para la IA al generar contenido.</p>
                    </div>

                    {/* Fuentes a ignorar */}
                    <div>
                        <label htmlFor="excluded-sources" className="block text-sm font-medium text-primary mb-2">
                            Dominios a Ignorar (uno por linea)
                        </label>
                        <textarea
                            id="excluded-sources"
                            value={excludedSources}
                            onChange={e => setExcludedSources(e.target.value)}
                            placeholder="ejemplo.com&#10;spam-site.net"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none text-sm font-mono"
                        />
                        <p className="mt-1 text-xs text-muted">El grounding ignorara fuentes de estos dominios.</p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t border-primary">
                        <Button onClick={handleReset} variant="ghost">
                            Restablecer valores
                        </Button>
                        <Button onClick={handleSave} variant="primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : saved ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardado
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar cambios
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
