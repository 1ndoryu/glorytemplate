/**
 * DraftsTab - Pestana de borradores del panel de administracion de IA
 *
 * Muestra la lista de borradores generados por IA con:
 * - Filtros por estado (todos, pendientes, aprobados, publicados)
 * - Acciones rapidas (ver, editar, aprobar, rechazar, publicar)
 * - Modal de detalle
 */

import {useState} from 'react';
import {FileText, RefreshCw, Eye, Edit, Check, Trash2} from 'lucide-react';
import {Button} from '../../../components/ui';
import {DraftStatusBadge} from './DraftStatusBadge';
import {DraftDetailModal} from './DraftDetailModal';
import type {AIDraft} from '../../../hooks/useAdminAI';

const FILTER_OPTIONS = [
    {value: 'all', label: 'Todos'},
    {value: 'pending_review', label: 'Pendientes'},
    {value: 'approved', label: 'Aprobados'},
    {value: 'published', label: 'Publicados'}
] as const;

interface DraftsTabProps {
    drafts: AIDraft[];
    loading: boolean;
    onLoadDrafts: () => void;
    onApproveDraft: (id: number) => Promise<void>;
    onPublishDraft: (id: number) => Promise<void>;
    onRejectDraft: (id: number) => Promise<void>;
}

export function DraftsTab({drafts, loading, onLoadDrafts, onApproveDraft, onPublishDraft, onRejectDraft}: DraftsTabProps): JSX.Element {
    const [filter, setFilter] = useState('all');
    const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);

    const filteredDrafts = filter === 'all' ? drafts : drafts.filter(d => d.ai.status === filter);

    const handleAction = async (action: 'approve' | 'publish' | 'reject', id: number) => {
        if (action === 'approve') await onApproveDraft(id);
        if (action === 'publish') await onPublishDraft(id);
        if (action === 'reject') {
            if (confirm('Seguro que quieres rechazar este borrador? Se movera a la papelera.')) {
                await onRejectDraft(id);
            }
        }
        setSelectedDraft(null);
    };

    return (
        <div id="drafts-tab-content" className="space-y-6">
            <DraftsFilter filter={filter} onFilterChange={setFilter} loading={loading} onRefresh={onLoadDrafts} />

            {filteredDrafts.length === 0 ? <EmptyDraftsState /> : <DraftsList drafts={filteredDrafts} onViewDraft={setSelectedDraft} onAction={handleAction} />}

            {selectedDraft && <DraftDetailModal draft={selectedDraft} onClose={() => setSelectedDraft(null)} onApprove={onApproveDraft} />}
        </div>
    );
}

interface DraftsFilterProps {
    filter: string;
    onFilterChange: (value: string) => void;
    loading: boolean;
    onRefresh: () => void;
}

function DraftsFilter({filter, onFilterChange, loading, onRefresh}: DraftsFilterProps): JSX.Element {
    return (
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-primary">Filtrar:</span>
            <div className="flex gap-2">
                {FILTER_OPTIONS.map(f => (
                    <button key={f.value} onClick={() => onFilterChange(f.value)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f.value ? 'bg-[var(--color-accent-primary)] text-white' : 'text-muted hover:text-primary hover:bg-secondary'}`}>
                        {f.label}
                    </button>
                ))}
            </div>
            <Button onClick={onRefresh} variant="ghost" size="sm" className="ml-auto">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
            </Button>
        </div>
    );
}

function EmptyDraftsState(): JSX.Element {
    return (
        <div className="p-8 rounded-xl border border-dashed border-primary text-center">
            <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-primary mb-2">No hay borradores</h3>
            <p className="text-muted">Los articulos generados apareceran aqui para revision.</p>
        </div>
    );
}

interface DraftsListProps {
    drafts: AIDraft[];
    onViewDraft: (draft: AIDraft) => void;
    onAction: (action: 'approve' | 'publish' | 'reject', id: number) => void;
}

function DraftsList({drafts, onViewDraft, onAction}: DraftsListProps): JSX.Element {
    return (
        <div className="grid gap-4">
            {drafts.map(draft => (
                <DraftCard key={draft.id} draft={draft} onView={() => onViewDraft(draft)} onAction={onAction} />
            ))}
        </div>
    );
}

interface DraftCardProps {
    draft: AIDraft;
    onView: () => void;
    onAction: (action: 'approve' | 'publish' | 'reject', id: number) => void;
}

function DraftCard({draft, onView, onAction}: DraftCardProps): JSX.Element {
    return (
        <article className="p-4 rounded-xl border border-primary bg-surface hover:border-[var(--color-accent-primary)] transition-colors">
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-primary">{draft.title}</h3>
                        <DraftStatusBadge status={draft.ai.status} />
                    </div>
                    <p className="text-sm text-muted line-clamp-2 mb-2">{draft.excerpt}</p>
                    <DraftMeta draft={draft} />
                </div>
                <DraftActions draft={draft} onView={onView} onAction={onAction} />
            </div>
        </article>
    );
}

function DraftMeta({draft}: {draft: AIDraft}): JSX.Element {
    return (
        <div className="flex items-center gap-4 text-xs text-muted">
            <span>Modelo: {draft.ai.model}</span>
            <span>Generado: {new Date(draft.ai.generatedAt).toLocaleDateString()}</span>
            {draft.ai.sources.length > 0 && <span>{draft.ai.sources.length} fuentes</span>}
        </div>
    );
}

interface DraftActionsProps {
    draft: AIDraft;
    onView: () => void;
    onAction: (action: 'approve' | 'publish' | 'reject', id: number) => void;
}

function DraftActions({draft, onView, onAction}: DraftActionsProps): JSX.Element {
    return (
        <div className="flex items-center gap-2">
            <button onClick={onView} className="p-2 rounded-lg text-muted hover:text-primary hover:bg-secondary" title="Ver detalles">
                <Eye className="w-4 h-4" />
            </button>
            <a href={draft.editUrl} target="_blank" rel="noopener" className="p-2 rounded-lg text-muted hover:text-primary hover:bg-secondary" title="Editar en WP">
                <Edit className="w-4 h-4" />
            </a>
            {draft.ai.status === 'pending_review' && (
                <>
                    <button onClick={() => onAction('approve', draft.id)} className="p-2 rounded-lg text-green-600 hover:bg-green-500/10" title="Aprobar">
                        <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => onAction('reject', draft.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-500/10" title="Rechazar">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            )}
            {draft.ai.status === 'approved' && (
                <button onClick={() => onAction('publish', draft.id)} className="p-2 rounded-lg text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10" title="Publicar">
                    <Check className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
