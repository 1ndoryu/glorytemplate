/**
 * AdminAIIsland - Panel de Administracion de IA
 *
 * Panel para administradores que permite:
 * - Configurar la API de Gemini
 * - Generar articulos automaticamente
 * - Gestionar borradores pendientes
 * - Ver estadisticas
 *
 * SOLO visible para administradores autenticados.
 *
 * ARQUITECTURA:
 * Este archivo actua como orquestador principal.
 * La logica de cada tab esta extraida en:
 * - features/admin-ai/components/GenerateTab.tsx
 * - features/admin-ai/components/DraftsTab.tsx
 * - features/admin-ai/components/ConfigTab.tsx
 * - features/admin-ai/components/StatsTab.tsx
 */

import {useState} from 'react';
import {Settings, Sparkles, FileText, BarChart3, X, AlertCircle} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {useAdminAI} from '../hooks/useAdminAI';
import {GenerateTab, DraftsTab, ConfigTab, StatsTab} from '../features/admin-ai';

type TabId = 'generate' | 'drafts' | 'config' | 'stats';

interface TabConfig {
    id: TabId;
    label: string;
    icon: typeof Settings;
}

const TABS: TabConfig[] = [
    {id: 'generate', label: 'Generar', icon: Sparkles},
    {id: 'drafts', label: 'Borradores', icon: FileText},
    {id: 'config', label: 'Configuracion', icon: Settings},
    {id: 'stats', label: 'Estadisticas', icon: BarChart3}
];

export function AdminAIIsland(): JSX.Element {
    const [activeTab, setActiveTab] = useState<TabId>('generate');
    const ai = useAdminAI();

    return (
        <PageLayout headerCtaText="Volver al sitio" mainClassName="flex-1 flex flex-col gap-6 px-6 py-8">
            <AdminAIHeader />
            <ConfigurationBanner config={ai.config} />
            <TabsNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} pendingCount={ai.stats?.pending ?? 0} />
            <ErrorBanner error={ai.error} onDismiss={ai.clearError} />
            <main id="admin-ai-content" className="flex-1">
                <TabContent activeTab={activeTab} ai={ai} />
            </main>
        </PageLayout>
    );
}

function AdminAIHeader(): JSX.Element {
    return (
        <header id="admin-ai-header" className="admin-ai-header">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-[var(--color-accent-primary)]/10">
                    <Sparkles className="w-6 h-6 text-[var(--color-accent-primary)]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Generador de Contenido IA</h1>
            </div>
            <p className="text-muted">Genera articulos automaticamente con Gemini 2.5 Flash y Google Search grounding.</p>
        </header>
    );
}

interface ConfigurationBannerProps {
    config: ReturnType<typeof useAdminAI>['config'];
}

function ConfigurationBanner({config}: ConfigurationBannerProps): JSX.Element | null {
    if (!config || config.status.configured) return null;

    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Configuracion pendiente:</strong> {config.status.message}. Ve a la pestana de Configuracion para agregar tu API key.
            </p>
        </div>
    );
}

interface TabsNavigationProps {
    tabs: TabConfig[];
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    pendingCount: number;
}

function TabsNavigation({tabs, activeTab, onTabChange, pendingCount}: TabsNavigationProps): JSX.Element {
    return (
        <nav id="admin-ai-tabs" className="flex gap-2 border-b border-primary pb-2 overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${activeTab === tab.id ? 'bg-[var(--color-accent-primary)] text-white' : 'text-muted hover:text-primary hover:bg-secondary'}
                    `}>
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'drafts' && pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{pendingCount}</span>}
                </button>
            ))}
        </nav>
    );
}

interface ErrorBannerProps {
    error: string | null;
    onDismiss: () => void;
}

function ErrorBanner({error, onDismiss}: ErrorBannerProps): JSX.Element | null {
    if (!error) return null;

    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button onClick={onDismiss} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

interface TabContentProps {
    activeTab: TabId;
    ai: ReturnType<typeof useAdminAI>;
}

function TabContent({activeTab, ai}: TabContentProps): JSX.Element | null {
    const isConfigured = ai.config?.status.configured ?? false;

    switch (activeTab) {
        case 'generate':
            return <GenerateTab isConfigured={isConfigured} toneOptions={ai.toneOptions} generateArticle={ai.generateArticle} generateIdeas={ai.generateIdeas} />;

        case 'drafts':
            return <DraftsTab drafts={ai.drafts} loading={ai.loading} onLoadDrafts={ai.loadDrafts} onApproveDraft={ai.approveDraft} onPublishDraft={ai.publishDraft} onRejectDraft={ai.rejectDraft} />;

        case 'config':
            return <ConfigTab config={ai.config} models={ai.models} onTestConnection={ai.testConnection} onSaveConfig={ai.saveConfig} />;

        case 'stats':
            return <StatsTab stats={ai.stats} loading={ai.loading} onRefresh={ai.loadStats} />;

        default:
            return null;
    }
}
