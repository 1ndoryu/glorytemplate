/**
 * ConfigTab - Pestana de configuracion del panel de administracion de IA
 *
 * Permite configurar:
 * - API Key de Gemini y OpenAI
 * - Modelo a utilizar
 * - Temperatura y parametros avanzados
 * - Prompt del sistema personalizado
 * - Programacion automatica
 * - Fuentes a ignorar
 */

import {useState} from 'react';
import {Settings, RefreshCw, Search, Check, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, Sliders} from 'lucide-react';
import {Button} from '../../../components/ui';

interface AIConfig {
    status: {
        configured: boolean;
        message: string;
    };
    model: string;
    active_provider: string;
    gemini_api_key?: string;
    openai_api_key?: string;
    temperature?: number;
    system_prompt?: string;
    schedule_enabled?: boolean;
    schedule_frequency?: string;
    excluded_sources?: string[];
}

interface ConfigTabProps {
    config: AIConfig | null;
    models: Record<string, string>;
    onTestConnection: (apiKey?: string, model?: string) => Promise<{success: boolean; message: string}>;
    onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

// Valores por defecto
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_SCHEDULE_FREQUENCY = 'daily';
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

export function ConfigTab({config, models, onTestConnection, onSaveConfig}: ConfigTabProps): JSX.Element {
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Estado basico
    const [apiKey, setApiKey] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [model, setModel] = useState(config?.model || 'gemini-2.5-flash');
    const [activeProvider, setActiveProvider] = useState(config?.active_provider || 'gemini');

    // Estado avanzado (con valores por defecto)
    const [temperature, setTemperature] = useState(config?.temperature ?? DEFAULT_TEMPERATURE);
    const [systemPrompt, setSystemPrompt] = useState(config?.system_prompt || DEFAULT_SYSTEM_PROMPT);
    const [scheduleEnabled, setScheduleEnabled] = useState(config?.schedule_enabled ?? false);
    const [scheduleFrequency, setScheduleFrequency] = useState(config?.schedule_frequency || DEFAULT_SCHEDULE_FREQUENCY);
    const [excludedSources, setExcludedSources] = useState(config?.excluded_sources?.join('\n') || '');

    // Estados de UI
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [saving, setSaving] = useState(false);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const keyToTest = activeProvider === 'openai' ? openaiApiKey : apiKey;
            const result = await onTestConnection(keyToTest || undefined, model);
            setTestResult(result);
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const configToSave: Record<string, unknown> = {
                model,
                active_provider: activeProvider,
                temperature,
                schedule_enabled: scheduleEnabled,
                schedule_frequency: scheduleFrequency
            };

            if (apiKey.trim()) {
                configToSave.gemini_api_key = apiKey.trim();
            }
            if (openaiApiKey.trim()) {
                configToSave.openai_api_key = openaiApiKey.trim();
            }
            if (systemPrompt.trim()) {
                configToSave.system_prompt = systemPrompt.trim();
            }
            if (excludedSources.trim()) {
                configToSave.excluded_sources = excludedSources
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean);
            }

            await onSaveConfig(configToSave);
            setApiKey('');
            setOpenaiApiKey('');
            setTestResult({success: true, message: 'Configuracion guardada correctamente'});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div id="config-tab-content" className="max-w-3xl space-y-8">
            {/* Seccion: Estado y API Keys */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuracion de API
                </h2>

                <ConfigStatusBanner config={config} />

                {/* Selector de proveedor */}
                <div>
                    <label className="block text-sm font-medium text-primary mb-2">Proveedor de IA</label>
                    <div className="flex gap-3">
                        <button onClick={() => setActiveProvider('gemini')} className={`flex-1 p-3 rounded-xl border transition-all ${activeProvider === 'gemini' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-primary hover:border-muted'}`}>
                            <span className="font-medium text-primary">Google Gemini</span>
                            <p className="text-xs text-muted mt-1">Gemini 2.5 Flash con Google Search</p>
                        </button>
                        <button onClick={() => setActiveProvider('openai')} className={`flex-1 p-3 rounded-xl border transition-all ${activeProvider === 'openai' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-primary hover:border-muted'}`}>
                            <span className="font-medium text-primary">OpenAI</span>
                            <p className="text-xs text-muted mt-1">GPT-4o y GPT-4o-mini</p>
                        </button>
                    </div>
                </div>

                {/* API Key segun proveedor */}
                {activeProvider === 'gemini' ? <ApiKeyField label="API Key de Gemini" value={apiKey} onChange={setApiKey} hasExistingKey={Boolean(config?.gemini_api_key)} helpLink="https://aistudio.google.com/app/apikey" helpText="Google AI Studio" /> : <ApiKeyField label="API Key de OpenAI" value={openaiApiKey} onChange={setOpenaiApiKey} hasExistingKey={Boolean(config?.openai_api_key)} helpLink="https://platform.openai.com/api-keys" helpText="OpenAI Platform" />}

                {/* Modelo */}
                <ModelSelector value={model} onChange={setModel} models={models} />
                <TestResultBanner result={testResult} />
                <ConfigActions onTest={handleTest} onSave={handleSave} testing={testing} saving={saving} />
            </section>

            {/* Seccion: Configuracion Avanzada (colapsable) */}
            <section className="space-y-4">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-4 rounded-xl border border-primary hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-muted" />
                        <span className="font-medium text-primary">Configuracion Avanzada</span>
                    </div>
                    {showAdvanced ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
                </button>

                {showAdvanced && (
                    <div className="space-y-6 p-4 rounded-xl border border-primary bg-secondary/30">
                        {/* Temperatura */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">Temperatura: {temperature.toFixed(2)}</label>
                            <input type="range" min="0" max="1" step="0.05" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full accent-[var(--color-accent-primary)]" />
                            <div className="flex justify-between text-xs text-muted mt-1">
                                <span>Mas preciso (0)</span>
                                <span>Mas creativo (1)</span>
                            </div>
                        </div>

                        {/* Prompt del sistema */}
                        <div>
                            <label htmlFor="system-prompt" className="block text-sm font-medium text-primary mb-2">
                                Prompt del Sistema (personalizado)
                            </label>
                            <textarea id="system-prompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="Ej: Eres un experto en chatbots y automatizacion. Escribe en primera persona..." rows={4} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none text-sm" />
                            <p className="mt-1 text-xs text-muted">Si se deja vacio, se usara el prompt por defecto del sistema.</p>
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
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none text-sm font-mono"
                            />
                            <p className="mt-1 text-xs text-muted">El grounding ignorara fuentes de estos dominios.</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Seccion: Programacion Automatica */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Generacion Automatica
                </h2>

                <div className="p-4 rounded-xl border border-primary space-y-4">
                    {/* Toggle de programacion */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-primary">Generar articulos automaticamente</p>
                            <p className="text-sm text-muted">Crea borradores periodicamente basados en tendencias</p>
                        </div>
                        <button onClick={() => setScheduleEnabled(!scheduleEnabled)} className={`relative w-12 h-6 rounded-full transition-colors ${scheduleEnabled ? 'bg-[var(--color-accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${scheduleEnabled ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    {/* Frecuencia */}
                    {scheduleEnabled && (
                        <div>
                            <label htmlFor="schedule-frequency" className="block text-sm font-medium text-primary mb-2">
                                Frecuencia
                            </label>
                            <select id="schedule-frequency" value={scheduleFrequency} onChange={e => setScheduleFrequency(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                                <option value="hourly">Cada hora</option>
                                <option value="twice_daily">2 veces al dia</option>
                                <option value="daily">Diariamente</option>
                                <option value="weekly">Semanalmente</option>
                            </select>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function ConfigStatusBanner({config}: {config: AIConfig | null}): JSX.Element {
    const isConfigured = config?.status.configured;

    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${isConfigured ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            {isConfigured ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
            <div>
                <p className="font-medium text-primary">{isConfigured ? 'API Configurada' : 'Configuracion pendiente'}</p>
                <p className="text-sm text-muted">
                    Proveedor: {config?.active_provider} | Modelo: {config?.model}
                </p>
            </div>
        </div>
    );
}

interface ApiKeyFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hasExistingKey: boolean;
    helpLink: string;
    helpText: string;
}

function ApiKeyField({label, value, onChange, hasExistingKey, helpLink, helpText}: ApiKeyFieldProps): JSX.Element {
    return (
        <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-primary mb-2">
                {label}
            </label>
            <input id="api-key" type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={hasExistingKey ? '••••••••••••••••' : 'sk-... o AIza...'} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" />
            <p className="mt-1 text-xs text-muted">
                Obtiene tu API key en{' '}
                <a href={helpLink} target="_blank" rel="noopener" className="text-[var(--color-accent-primary)] hover:underline">
                    {helpText}
                </a>
            </p>
        </div>
    );
}

interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    models: Record<string, string>;
}

function ModelSelector({value, onChange, models}: ModelSelectorProps): JSX.Element {
    return (
        <div>
            <label htmlFor="model" className="block text-sm font-medium text-primary mb-2">
                Modelo
            </label>
            <select id="model" value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                {Object.entries(models).map(([key, label]) => (
                    <option key={key} value={key}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function TestResultBanner({result}: {result: {success: boolean; message: string} | null}): JSX.Element | null {
    if (!result) return null;

    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            {result.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <p className="text-sm">{result.message}</p>
        </div>
    );
}

interface ConfigActionsProps {
    onTest: () => void;
    onSave: () => void;
    testing: boolean;
    saving: boolean;
}

function ConfigActions({onTest, onSave, testing, saving}: ConfigActionsProps): JSX.Element {
    return (
        <div className="flex gap-3">
            <Button onClick={onTest} variant="outline" disabled={testing}>
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {testing ? 'Probando...' : 'Probar conexion'}
            </Button>
            <Button onClick={onSave} variant="primary" disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Guardar configuracion'}
            </Button>
        </div>
    );
}
