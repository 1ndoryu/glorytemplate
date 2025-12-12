/**
 * GenerateTab - Pestana de generacion de articulos
 *
 * Permite generar articulos mediante IA con:
 * - Titulo del articulo
 * - Tema principal
 * - Esquema o puntos a cubrir
 * - Tono del articulo
 *
 * Tambien incluye generacion de ideas de articulos.
 */

import {Sparkles, Search, RefreshCw, Lightbulb} from 'lucide-react';
import {Button, Badge} from '../../../components/ui';
import {useGenerateForm} from '../hooks/useGenerateForm';
import type {ArticleIdea} from '../../../hooks/useAdminAI';

interface ToneOption {
    label: string;
    description: string;
}

interface GenerateTabProps {
    isConfigured: boolean;
    toneOptions: Record<string, ToneOption>;
    generateArticle: (params: {title: string; topic: string; outline: string; tone: string}) => Promise<{success: boolean}>;
    generateIdeas: (count: number) => Promise<{success: boolean; ideas?: ArticleIdea[]}>;
}

export function GenerateTab({isConfigured, toneOptions, generateArticle, generateIdeas}: GenerateTabProps): JSX.Element {
    const form = useGenerateForm({generateArticle, generateIdeas});

    return (
        <div id="generate-tab-content" className="grid lg:grid-cols-2 gap-8">
            <GenerateFormSection form={form} isConfigured={isConfigured} toneOptions={toneOptions} />
            <IdeasSection ideas={form.ideas} loadingIdeas={form.loadingIdeas} isConfigured={isConfigured} onGenerateIdeas={form.handleGenerateIdeas} onUseIdea={form.useIdea} />
        </div>
    );
}

interface GenerateFormSectionProps {
    form: ReturnType<typeof useGenerateForm>;
    isConfigured: boolean;
    toneOptions: Record<string, ToneOption>;
}

function GenerateFormSection({form, isConfigured, toneOptions}: GenerateFormSectionProps): JSX.Element {
    return (
        <section id="generate-form" className="space-y-6">
            <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-accent-primary)]" />
                Generar Articulo
            </h2>

            <div className="space-y-4">
                <FormField id="article-title" label="Titulo del articulo *" value={form.title} onChange={form.setTitle} placeholder="Ej: Como implementar un chatbot en WhatsApp Business" disabled={!isConfigured} />
                <FormField id="article-topic" label="Tema principal (opcional)" value={form.topic} onChange={form.setTopic} placeholder="Ej: chatbots whatsapp" disabled={!isConfigured} />
                <TextareaField id="article-outline" label="Esquema o puntos a cubrir (opcional)" value={form.outline} onChange={form.setOutline} placeholder={'Punto 1\nPunto 2\nPunto 3'} disabled={!isConfigured} />
                <ToneSelector value={form.tone} onChange={form.setTone} options={toneOptions} disabled={!isConfigured} />
                <Button onClick={form.handleGenerate} variant="primary" disabled={!form.title.trim() || form.generating || !isConfigured} className="w-full">
                    {form.generating ? (
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
    );
}

interface FormFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled: boolean;
}

function FormField({id, label, value, onChange, placeholder, disabled}: FormFieldProps): JSX.Element {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-primary mb-2">
                {label}
            </label>
            <input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" disabled={disabled} />
        </div>
    );
}

interface TextareaFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled: boolean;
}

function TextareaField({id, label, value, onChange, placeholder, disabled}: TextareaFieldProps): JSX.Element {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-primary mb-2">
                {label}
            </label>
            <textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none" disabled={disabled} />
        </div>
    );
}

interface ToneSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: Record<string, ToneOption>;
    disabled: boolean;
}

function ToneSelector({value, onChange, options, disabled}: ToneSelectorProps): JSX.Element {
    return (
        <div>
            <label htmlFor="article-tone" className="block text-sm font-medium text-primary mb-2">
                Tono
            </label>
            <select id="article-tone" value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]" disabled={disabled}>
                {Object.entries(options).map(([key, opt]) => (
                    <option key={key} value={key}>
                        {opt.label} - {opt.description}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface IdeasSectionProps {
    ideas: ArticleIdea[];
    loadingIdeas: boolean;
    isConfigured: boolean;
    onGenerateIdeas: () => void;
    onUseIdea: (idea: ArticleIdea) => void;
}

function IdeasSection({ideas, loadingIdeas, isConfigured, onGenerateIdeas, onUseIdea}: IdeasSectionProps): JSX.Element {
    return (
        <section id="generate-ideas" className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Ideas de Articulos
                </h2>
                <Button onClick={onGenerateIdeas} variant="ghost" size="sm" disabled={loadingIdeas || !isConfigured}>
                    {loadingIdeas ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loadingIdeas ? 'Buscando...' : 'Generar ideas'}
                </Button>
            </div>

            {ideas.length === 0 ? <EmptyIdeasState /> : <IdeasList ideas={ideas} onUseIdea={onUseIdea} />}
        </section>
    );
}

function EmptyIdeasState(): JSX.Element {
    return (
        <div className="p-6 rounded-xl border border-dashed border-primary text-center">
            <Lightbulb className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
            <p className="text-muted">Haz clic en "Generar ideas" para obtener sugerencias de articulos basadas en tendencias actuales.</p>
        </div>
    );
}

function IdeasList({ideas, onUseIdea}: {ideas: ArticleIdea[]; onUseIdea: (idea: ArticleIdea) => void}): JSX.Element {
    return (
        <div className="space-y-3">
            {ideas.map((idea, idx) => (
                <IdeaCard key={idx} idea={idea} onUse={() => onUseIdea(idea)} />
            ))}
        </div>
    );
}

function IdeaCard({idea, onUse}: {idea: ArticleIdea; onUse: () => void}): JSX.Element {
    return (
        <div className="p-4 rounded-xl border border-primary bg-surface hover:border-[var(--color-accent-primary)] transition-colors">
            <h3 className="font-medium text-primary mb-1">{idea.title}</h3>
            <p className="text-sm text-muted mb-3">{idea.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
                {idea.keywords.map((kw, i) => (
                    <Badge key={i} variant="info" size="sm">
                        {kw}
                    </Badge>
                ))}
            </div>
            <Button onClick={onUse} variant="outline" size="sm">
                Usar esta idea
            </Button>
        </div>
    );
}
