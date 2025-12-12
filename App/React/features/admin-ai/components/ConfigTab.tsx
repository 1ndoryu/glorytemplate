/**
 * ConfigTab - Pestana de configuracion del panel de administracion de IA
 *
 * Permite configurar:
 * - API Key de Gemini
 * - Modelo a utilizar
 * - Probar la conexion
 */

import {useState} from 'react';
import {Settings, RefreshCw, Search, Check, AlertCircle, CheckCircle} from 'lucide-react';
import {Button} from '../../../components/ui';

interface AIConfig {
    status: {
        configured: boolean;
        message: string;
    };
    model: string;
    active_provider: string;
    gemini_api_key?: string;
}

interface ConfigTabProps {
    config: AIConfig | null;
    models: Record<string, string>;
    onTestConnection: (apiKey?: string, model?: string) => Promise<{success: boolean; message: string}>;
    onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

export function ConfigTab({config, models, onTestConnection, onSaveConfig}: ConfigTabProps): JSX.Element {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState(config?.model || 'gemini-2.5-flash');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [saving, setSaving] = useState(false);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const result = await onTestConnection(apiKey || undefined, model);
            setTestResult(result);
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const configToSave: Record<string, unknown> = {model};
            if (apiKey.trim()) {
                configToSave.gemini_api_key = apiKey.trim();
            }

            await onSaveConfig(configToSave);
            setApiKey('');
            setTestResult({success: true, message: 'Configuracion guardada correctamente'});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div id="config-tab-content" className="max-w-2xl space-y-8">
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuracion de API
                </h2>

                <ConfigStatusBanner config={config} />
                <ApiKeyField value={apiKey} onChange={setApiKey} hasExistingKey={Boolean(config?.gemini_api_key)} />
                <ModelSelector value={model} onChange={setModel} models={models} />
                <TestResultBanner result={testResult} />
                <ConfigActions onTest={handleTest} onSave={handleSave} testing={testing} saving={saving} />
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
    value: string;
    onChange: (value: string) => void;
    hasExistingKey: boolean;
}

function ApiKeyField({value, onChange, hasExistingKey}: ApiKeyFieldProps): JSX.Element {
    return (
        <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-primary mb-2">
                API Key de Gemini
            </label>
            <input id="api-key" type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={hasExistingKey ? '••••••••••••••••' : 'AIza...'} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" />
            <p className="mt-1 text-xs text-muted">
                Obtiene tu API key en{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-[var(--color-accent-primary)] hover:underline">
                    Google AI Studio
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
