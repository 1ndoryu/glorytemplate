/**
 * ConfigTab - Pestana de configuracion del panel de administracion de IA
 *
 * Permite configurar:
 * - API Key de Gemini y OpenAI
 * - Modelo a utilizar
 * - Programacion automatica
 * - Notificaciones por email
 *
 * Nota: La configuracion avanzada (temperatura, prompt, etc) esta en AdvancedTab
 */

import {useState} from 'react';
import {Settings, RefreshCw, Search, Check, AlertCircle, CheckCircle, Clock} from 'lucide-react';
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
    auto_search_enabled?: boolean;
    schedule_frequency?: string;
    schedule_hour?: number;
    schedule_minute?: number;
    schedule_day_of_week?: number;
    schedule_day_of_month?: number;
    notification_enabled?: boolean;
    notification_email?: string;
    notification_on_error?: boolean;
    notification_on_success?: boolean;
    next_execution?: string | null;
}

interface ConfigTabProps {
    config: AIConfig | null;
    geminiModels: Record<string, string>;
    openaiModels: Record<string, string>;
    onTestConnection: (apiKey?: string, model?: string) => Promise<{success: boolean; message: string}>;
    onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

const DEFAULT_SCHEDULE_FREQUENCY = 'daily';

export function ConfigTab({config, geminiModels, openaiModels, onTestConnection, onSaveConfig}: ConfigTabProps): JSX.Element {
    // Estado basico
    const [apiKey, setApiKey] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [model, setModel] = useState(config?.model || 'gemini-2.5-flash');
    const [activeProvider, setActiveProvider] = useState(config?.active_provider || 'gemini');

    // Estado de programacion
    const [scheduleEnabled, setScheduleEnabled] = useState(config?.auto_search_enabled ?? false);
    const [scheduleFrequency, setScheduleFrequency] = useState(config?.schedule_frequency || DEFAULT_SCHEDULE_FREQUENCY);
    const [scheduleHour, setScheduleHour] = useState(config?.schedule_hour ?? 9);
    const [scheduleMinute, setScheduleMinute] = useState(config?.schedule_minute ?? 0);
    const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(config?.schedule_day_of_week ?? 1);
    const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(config?.schedule_day_of_month ?? 1);

    // Estado de notificaciones
    const [notificationEnabled, setNotificationEnabled] = useState(config?.notification_enabled ?? false);
    const [notificationEmail, setNotificationEmail] = useState(config?.notification_email || '');
    const [notificationOnError, setNotificationOnError] = useState(config?.notification_on_error ?? true);
    const [notificationOnSuccess, setNotificationOnSuccess] = useState(config?.notification_on_success ?? true);

    // Estados de UI
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [saving, setSaving] = useState(false);

    // Handler para cambiar proveedor y ajustar modelo por defecto
    const handleProviderChange = (newProvider: string) => {
        setActiveProvider(newProvider);
        // Cambiar al primer modelo disponible del nuevo proveedor
        const modelsForProvider = newProvider === 'openai' ? openaiModels : geminiModels;
        const firstModel = Object.keys(modelsForProvider)[0];
        if (firstModel) {
            setModel(firstModel);
        }
    };

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
                auto_search_enabled: scheduleEnabled,
                schedule_frequency: scheduleFrequency,
                schedule_hour: scheduleHour,
                schedule_minute: scheduleMinute,
                schedule_day_of_week: scheduleDayOfWeek,
                schedule_day_of_month: scheduleDayOfMonth,
                notification_enabled: notificationEnabled,
                notification_email: notificationEmail,
                notification_on_error: notificationOnError,
                notification_on_success: notificationOnSuccess
            };

            if (apiKey.trim()) {
                configToSave.gemini_api_key = apiKey.trim();
            }
            if (openaiApiKey.trim()) {
                configToSave.openai_api_key = openaiApiKey.trim();
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
                        <button onClick={() => handleProviderChange('gemini')} className={`flex-1 p-3 rounded-xl border transition-all ${activeProvider === 'gemini' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-primary hover:border-muted'}`}>
                            <span className="font-medium text-primary">Google Gemini</span>
                            <p className="text-xs text-muted mt-1">Gemini 2.5 Flash con Google Search</p>
                        </button>
                        <button onClick={() => handleProviderChange('openai')} className={`flex-1 p-3 rounded-xl border transition-all ${activeProvider === 'openai' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-primary hover:border-muted'}`}>
                            <span className="font-medium text-primary">OpenAI</span>
                            <p className="text-xs text-muted mt-1">GPT-4o y GPT-4o-mini</p>
                        </button>
                    </div>
                </div>

                {/* API Key segun proveedor */}
                {activeProvider === 'gemini' ? <ApiKeyField label="API Key de Gemini" value={apiKey} onChange={setApiKey} hasExistingKey={Boolean(config?.gemini_api_key)} helpLink="https://aistudio.google.com/app/apikey" helpText="Google AI Studio" /> : <ApiKeyField label="API Key de OpenAI" value={openaiApiKey} onChange={setOpenaiApiKey} hasExistingKey={Boolean(config?.openai_api_key)} helpLink="https://platform.openai.com/api-keys" helpText="OpenAI Platform" />}

                {/* Modelo - filtrado segun proveedor activo */}
                <ModelSelector value={model} onChange={setModel} models={activeProvider === 'openai' ? openaiModels : geminiModels} provider={activeProvider} />
                <TestResultBanner result={testResult} />
                <ConfigActions onTest={handleTest} onSave={handleSave} testing={testing} saving={saving} />
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

                    {/* Proxima ejecucion */}
                    {scheduleEnabled && config?.next_execution && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-accent-primary)]/10">
                            <Clock className="w-4 h-4 text-[var(--color-accent-primary)]" />
                            <span className="text-sm font-medium text-primary">
                                Proxima ejecucion:{' '}
                                {new Date(config.next_execution).toLocaleString('es-ES', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}

                    {/* Opciones de frecuencia */}
                    {scheduleEnabled && (
                        <div className="space-y-4">
                            {/* Frecuencia */}
                            <div>
                                <label htmlFor="schedule-frequency" className="block text-sm font-medium text-primary mb-2">
                                    Frecuencia
                                </label>
                                <select id="schedule-frequency" value={scheduleFrequency} onChange={e => setScheduleFrequency(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                                    <option value="hourly">Cada hora</option>
                                    <option value="twice_daily">2 veces al dia</option>
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                    <option value="biweekly">Cada 2 semanas</option>
                                    <option value="monthly">Mensualmente</option>
                                </select>
                            </div>

                            {/* Hora */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="schedule-hour" className="block text-sm font-medium text-primary mb-2">
                                        Hora
                                    </label>
                                    <select id="schedule-hour" value={scheduleHour} onChange={e => setScheduleHour(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                                        {Array.from({length: 24}, (_, i) => (
                                            <option key={i} value={i}>
                                                {i.toString().padStart(2, '0')}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="schedule-minute" className="block text-sm font-medium text-primary mb-2">
                                        Minuto
                                    </label>
                                    <select id="schedule-minute" value={scheduleMinute} onChange={e => setScheduleMinute(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                                        {[0, 15, 30, 45].map(m => (
                                            <option key={m} value={m}>
                                                {m.toString().padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dia de la semana (solo para weekly/biweekly) */}
                            {(scheduleFrequency === 'weekly' || scheduleFrequency === 'biweekly') && (
                                <div>
                                    <label htmlFor="schedule-day" className="block text-sm font-medium text-primary mb-2">
                                        Dia de la semana
                                    </label>
                                    <select id="schedule-day" value={scheduleDayOfWeek} onChange={e => setScheduleDayOfWeek(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                                        <option value={1}>Lunes</option>
                                        <option value={2}>Martes</option>
                                        <option value={3}>Miercoles</option>
                                        <option value={4}>Jueves</option>
                                        <option value={5}>Viernes</option>
                                        <option value={6}>Sabado</option>
                                        <option value={7}>Domingo</option>
                                    </select>
                                </div>
                            )}

                            {/* Dia del mes (solo para monthly) */}
                            {scheduleFrequency === 'monthly' && (
                                <div>
                                    <label htmlFor="schedule-day-month" className="block text-sm font-medium text-primary mb-2">
                                        Dia del mes
                                    </label>
                                    <select id="schedule-day-month" value={scheduleDayOfMonth} onChange={e => setScheduleDayOfMonth(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                                        {Array.from({length: 28}, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-muted">Usando dias 1-28 para compatibilidad con todos los meses</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Seccion: Notificaciones */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Notificaciones
                </h2>

                <div className="p-4 rounded-xl border border-primary space-y-4">
                    {/* Toggle de notificaciones */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-primary">Recibir notificaciones por email</p>
                            <p className="text-sm text-muted">Te avisamos cuando se genera contenido o hay errores</p>
                        </div>
                        <button onClick={() => setNotificationEnabled(!notificationEnabled)} className={`relative w-12 h-6 rounded-full transition-colors ${notificationEnabled ? 'bg-[var(--color-accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationEnabled ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    {notificationEnabled && (
                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="notification-email" className="block text-sm font-medium text-primary mb-2">
                                    Email de notificacion
                                </label>
                                <input id="notification-email" type="email" value={notificationEmail} onChange={e => setNotificationEmail(e.target.value)} placeholder="admin@tudominio.com" className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" />
                            </div>

                            {/* Tipos de notificacion */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={notificationOnSuccess} onChange={e => setNotificationOnSuccess(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                    <span className="text-sm text-primary">Notificar cuando se genera contenido exitosamente</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={notificationOnError} onChange={e => setNotificationOnError(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                    <span className="text-sm text-primary">Notificar cuando hay errores</span>
                                </label>
                            </div>
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
    provider: string;
}

function ModelSelector({value, onChange, models, provider}: ModelSelectorProps): JSX.Element {
    const modelEntries = Object.entries(models);
    const hasModels = modelEntries.length > 0;

    return (
        <div>
            <label htmlFor="model" className="block text-sm font-medium text-primary mb-2">
                Modelo ({provider === 'openai' ? 'OpenAI' : 'Gemini'})
            </label>
            {hasModels ? (
                <select id="model" value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                    {modelEntries.map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            ) : (
                <p className="text-sm text-muted italic">Cargando modelos disponibles...</p>
            )}
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
