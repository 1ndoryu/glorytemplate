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
 */

import {useState} from 'react';
import {Settings, Sparkles, FileText, BarChart3, Search, RefreshCw, Check, X, Eye, Edit, Trash2, Lightbulb, AlertCircle, CheckCircle} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {Button, Badge} from '../components/ui';
import {useAdminAI, type AIDraft, type ArticleIdea} from '../hooks/useAdminAI';

// Tabs del panel
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
            {/* Header */}
            <header id="admin-ai-header" className="admin-ai-header">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-[var(--color-accent-primary)]/10">
                        <Sparkles className="w-6 h-6 text-[var(--color-accent-primary)]" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Generador de Contenido IA</h1>
                </div>
                <p className="text-muted">Genera articulos automaticamente con Gemini 2.5 Flash y Google Search grounding.</p>
            </header>

            {/* Status Banner */}
            {ai.config && !ai.config.status.configured && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong>Configuracion pendiente:</strong> {ai.config.status.message}. Ve a la pestana de Configuracion para agregar tu API key.
                    </p>
                </div>
            )}

            {/* Tabs Navigation */}
            <nav id="admin-ai-tabs" className="flex gap-2 border-b border-primary pb-2 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id ? 'bg-[var(--color-accent-primary)] text-white' : 'text-muted hover:text-primary hover:bg-secondary'}
                        `}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.id === 'drafts' && ai.stats && ai.stats.pending > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{ai.stats.pending}</span>}
                    </button>
                ))}
            </nav>

            {/* Error display */}
            {ai.error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300 flex-1">{ai.error}</p>
                    <button onClick={ai.clearError} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Tab Content */}
            <main id="admin-ai-content" className="flex-1">
                {activeTab === 'generate' && <GenerateTab ai={ai} />}
                {activeTab === 'drafts' && <DraftsTab ai={ai} />}
                {activeTab === 'config' && <ConfigTab ai={ai} />}
                {activeTab === 'stats' && <StatsTab ai={ai} />}
            </main>
        </PageLayout>
    );
}

// === TAB: GENERAR ===
function GenerateTab({ai}: {ai: ReturnType<typeof useAdminAI>}): JSX.Element {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [outline, setOutline] = useState('');
    const [tone, setTone] = useState('cercano');
    const [generating, setGenerating] = useState(false);
    const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);

    const handleGenerate = async () => {
        if (!title.trim()) return;

        setGenerating(true);
        try {
            const result = await ai.generateArticle({
                title: title.trim(),
                topic: topic.trim() || title.trim(),
                outline: outline.trim(),
                tone
            });

            if (result.success) {
                setTitle('');
                setTopic('');
                setOutline('');
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateIdeas = async () => {
        setLoadingIdeas(true);
        try {
            const result = await ai.generateIdeas(5);
            if (result.success && result.ideas) {
                setIdeas(result.ideas);
            }
        } finally {
            setLoadingIdeas(false);
        }
    };

    const useIdea = (idea: ArticleIdea) => {
        setTitle(idea.title);
        setOutline(idea.outline.join('\n'));
        setIdeas([]);
    };

    const isConfigured = ai.config?.status.configured ?? false;

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulario de generacion */}
            <section id="generate-form" className="space-y-6">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--color-accent-primary)]" />
                    Generar Articulo
                </h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="article-title" className="block text-sm font-medium text-primary mb-2">
                            Titulo del articulo *
                        </label>
                        <input id="article-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Como implementar un chatbot en WhatsApp Business" className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" disabled={!isConfigured} />
                    </div>

                    <div>
                        <label htmlFor="article-topic" className="block text-sm font-medium text-primary mb-2">
                            Tema principal (opcional)
                        </label>
                        <input id="article-topic" type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: chatbots whatsapp" className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" disabled={!isConfigured} />
                    </div>

                    <div>
                        <label htmlFor="article-outline" className="block text-sm font-medium text-primary mb-2">
                            Esquema o puntos a cubrir (opcional)
                        </label>
                        <textarea
                            id="article-outline"
                            value={outline}
                            onChange={e => setOutline(e.target.value)}
                            placeholder="Punto 1&#10;Punto 2&#10;Punto 3"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                            disabled={!isConfigured}
                        />
                    </div>

                    <div>
                        <label htmlFor="article-tone" className="block text-sm font-medium text-primary mb-2">
                            Tono
                        </label>
                        <select id="article-tone" value={tone} onChange={e => setTone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" disabled={!isConfigured}>
                            {Object.entries(ai.toneOptions).map(([key, opt]) => (
                                <option key={key} value={key}>
                                    {opt.label} - {opt.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button onClick={handleGenerate} variant="primary" disabled={!title.trim() || generating || !isConfigured} className="w-full">
                        {generating ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Generando articulo...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generar Articulo
                            </>
                        )}
                    </Button>
                </div>
            </section>

            {/* Ideas y asistente */}
            <section id="generate-ideas" className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Ideas de Articulos
                    </h2>
                    <Button onClick={handleGenerateIdeas} variant="ghost" size="sm" disabled={loadingIdeas || !isConfigured}>
                        {loadingIdeas ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {loadingIdeas ? 'Buscando...' : 'Generar ideas'}
                    </Button>
                </div>

                {ideas.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-primary text-center">
                        <Lightbulb className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
                        <p className="text-muted">Haz clic en "Generar ideas" para obtener sugerencias de articulos basadas en tendencias actuales.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ideas.map((idea, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-primary bg-surface hover:border-[var(--color-accent-primary)] transition-colors">
                                <h3 className="font-medium text-primary mb-1">{idea.title}</h3>
                                <p className="text-sm text-muted mb-3">{idea.description}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {idea.keywords.map((kw, i) => (
                                        <Badge key={i} variant="info" size="sm">
                                            {kw}
                                        </Badge>
                                    ))}
                                </div>
                                <Button onClick={() => useIdea(idea)} variant="outline" size="sm">
                                    Usar esta idea
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// === TAB: BORRADORES ===
function DraftsTab({ai}: {ai: ReturnType<typeof useAdminAI>}): JSX.Element {
    const [filter, setFilter] = useState('all');
    const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);

    const filteredDrafts = filter === 'all' ? ai.drafts : ai.drafts.filter(d => d.ai.status === filter);

    const handleAction = async (action: 'approve' | 'publish' | 'reject', id: number) => {
        if (action === 'approve') await ai.approveDraft(id);
        if (action === 'publish') await ai.publishDraft(id);
        if (action === 'reject') {
            if (confirm('¿Seguro que quieres rechazar este borrador? Se movera a la papelera.')) {
                await ai.rejectDraft(id);
            }
        }
        setSelectedDraft(null);
    };

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-primary">Filtrar:</span>
                <div className="flex gap-2">
                    {[
                        {value: 'all', label: 'Todos'},
                        {value: 'pending_review', label: 'Pendientes'},
                        {value: 'approved', label: 'Aprobados'},
                        {value: 'published', label: 'Publicados'}
                    ].map(f => (
                        <button key={f.value} onClick={() => setFilter(f.value)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f.value ? 'bg-[var(--color-accent-primary)] text-white' : 'text-muted hover:text-primary hover:bg-secondary'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <Button onClick={() => ai.loadDrafts()} variant="ghost" size="sm" className="ml-auto">
                    <RefreshCw className={`w-4 h-4 ${ai.loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Lista de borradores */}
            {filteredDrafts.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-primary text-center">
                    <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium text-primary mb-2">No hay borradores</h3>
                    <p className="text-muted">Los articulos generados apareceran aqui para revision.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredDrafts.map(draft => (
                        <article key={draft.id} className="p-4 rounded-xl border border-primary bg-surface hover:border-[var(--color-accent-primary)] transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-primary">{draft.title}</h3>
                                        <DraftStatusBadge status={draft.ai.status} />
                                    </div>
                                    <p className="text-sm text-muted line-clamp-2 mb-2">{draft.excerpt}</p>
                                    <div className="flex items-center gap-4 text-xs text-muted">
                                        <span>Modelo: {draft.ai.model}</span>
                                        <span>Generado: {new Date(draft.ai.generatedAt).toLocaleDateString()}</span>
                                        {draft.ai.sources.length > 0 && <span>{draft.ai.sources.length} fuentes</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedDraft(draft)} className="p-2 rounded-lg text-muted hover:text-primary hover:bg-secondary" title="Ver detalles">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <a href={draft.editUrl} target="_blank" rel="noopener" className="p-2 rounded-lg text-muted hover:text-primary hover:bg-secondary" title="Editar en WP">
                                        <Edit className="w-4 h-4" />
                                    </a>
                                    {draft.ai.status === 'pending_review' && (
                                        <>
                                            <button onClick={() => handleAction('approve', draft.id)} className="p-2 rounded-lg text-green-600 hover:bg-green-500/10" title="Aprobar">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleAction('reject', draft.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-500/10" title="Rechazar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    {draft.ai.status === 'approved' && (
                                        <button onClick={() => handleAction('publish', draft.id)} className="p-2 rounded-lg text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10" title="Publicar">
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* Modal de detalle */}
            {selectedDraft && <DraftDetailModal draft={selectedDraft} onClose={() => setSelectedDraft(null)} ai={ai} />}
        </div>
    );
}

// Badge de estado del borrador
function DraftStatusBadge({status}: {status: string}): JSX.Element {
    const config: Record<string, {variant: 'info' | 'success' | 'warning' | 'error'; label: string}> = {
        pending_review: {variant: 'warning', label: 'Pendiente'},
        approved: {variant: 'info', label: 'Aprobado'},
        published: {variant: 'success', label: 'Publicado'},
        rejected: {variant: 'error', label: 'Rechazado'}
    };

    const cfg = config[status] || {variant: 'info', label: status};

    return (
        <Badge variant={cfg.variant} size="sm">
            {cfg.label}
        </Badge>
    );
}

// Modal de detalle del borrador
function DraftDetailModal({draft, onClose, ai}: {draft: AIDraft; onClose: () => void; ai: ReturnType<typeof useAdminAI>}): JSX.Element {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-surface rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 flex items-center justify-between p-4 border-b border-primary bg-surface">
                    <h2 className="text-lg font-semibold text-primary">{draft.title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted hover:text-primary hover:bg-secondary">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <DraftStatusBadge status={draft.ai.status} />
                        <span className="text-muted">Modelo: {draft.ai.model}</span>
                        <span className="text-muted">Generado: {new Date(draft.ai.generatedAt).toLocaleString()}</span>
                    </div>

                    {/* Fuentes */}
                    {draft.ai.sources.length > 0 && (
                        <div>
                            <h3 className="font-medium text-primary mb-2">Fuentes consultadas</h3>
                            <ul className="space-y-1">
                                {draft.ai.sources.map((src, i) => (
                                    <li key={i}>
                                        <a href={src.url} target="_blank" rel="noopener" className="text-sm text-[var(--color-accent-primary)] hover:underline">
                                            {src.title || src.url}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Contenido */}
                    <div>
                        <h3 className="font-medium text-primary mb-2">Contenido</h3>
                        <div className="prose prose-sm max-w-none p-4 rounded-xl bg-secondary" dangerouslySetInnerHTML={{__html: draft.content}} />
                    </div>

                    {/* Acciones */}
                    <div className="flex justify-end gap-3">
                        <a href={draft.previewUrl} target="_blank" rel="noopener">
                            <Button variant="outline">
                                <Eye className="w-4 h-4" />
                                Vista previa
                            </Button>
                        </a>
                        <a href={draft.editUrl} target="_blank" rel="noopener">
                            <Button variant="outline">
                                <Edit className="w-4 h-4" />
                                Editar en WordPress
                            </Button>
                        </a>
                        {draft.ai.status === 'pending_review' && (
                            <Button
                                variant="primary"
                                onClick={async () => {
                                    await ai.approveDraft(draft.id);
                                    onClose();
                                }}>
                                <Check className="w-4 h-4" />
                                Aprobar
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// === TAB: CONFIGURACION ===
function ConfigTab({ai}: {ai: ReturnType<typeof useAdminAI>}): JSX.Element {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState(ai.config?.model || 'gemini-2.5-flash');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [saving, setSaving] = useState(false);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const result = await ai.testConnection(apiKey || undefined, model);
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

            await ai.saveConfig(configToSave);
            setApiKey('');
            setTestResult({success: true, message: 'Configuracion guardada correctamente'});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-8">
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuracion de API
                </h2>

                {/* Estado actual */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${ai.config?.status.configured ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    {ai.config?.status.configured ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                    <div>
                        <p className="font-medium text-primary">{ai.config?.status.configured ? 'API Configurada' : 'Configuracion pendiente'}</p>
                        <p className="text-sm text-muted">
                            Proveedor: {ai.config?.active_provider} | Modelo: {ai.config?.model}
                        </p>
                    </div>
                </div>

                {/* API Key */}
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-primary mb-2">
                        API Key de Gemini
                    </label>
                    <input id="api-key" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={ai.config?.gemini_api_key ? '••••••••••••••••' : 'AIza...'} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" />
                    <p className="mt-1 text-xs text-muted">
                        Obtiene tu API key en{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-[var(--color-accent-primary)] hover:underline">
                            Google AI Studio
                        </a>
                    </p>
                </div>

                {/* Modelo */}
                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-primary mb-2">
                        Modelo
                    </label>
                    <select id="model" value={model} onChange={e => setModel(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]">
                        {Object.entries(ai.models).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Resultado del test */}
                {testResult && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${testResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                        {testResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                        <p className="text-sm">{testResult.message}</p>
                    </div>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                    <Button onClick={handleTest} variant="outline" disabled={testing}>
                        {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {testing ? 'Probando...' : 'Probar conexion'}
                    </Button>
                    <Button onClick={handleSave} variant="primary" disabled={saving}>
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Guardando...' : 'Guardar configuracion'}
                    </Button>
                </div>
            </section>
        </div>
    );
}

// === TAB: ESTADISTICAS ===
function StatsTab({ai}: {ai: ReturnType<typeof useAdminAI>}): JSX.Element {
    const stats = ai.stats;

    if (!stats) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted" />
            </div>
        );
    }

    const statCards = [
        {label: 'Total generados', value: stats.total, color: 'text-primary'},
        {label: 'Pendientes', value: stats.pending, color: 'text-amber-500'},
        {label: 'Aprobados', value: stats.approved, color: 'text-blue-500'},
        {label: 'Publicados', value: stats.published, color: 'text-green-500'},
        {label: 'Rechazados', value: stats.rejected, color: 'text-red-500'}
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estadisticas de Generacion
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statCards.map(stat => (
                    <div key={stat.label} className="p-4 rounded-xl border border-primary bg-surface text-center">
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-muted">{stat.label}</p>
                    </div>
                ))}
            </div>

            <Button onClick={() => ai.loadStats()} variant="ghost" size="sm">
                <RefreshCw className={`w-4 h-4 ${ai.loading ? 'animate-spin' : ''}`} />
                Actualizar estadisticas
            </Button>
        </div>
    );
}
