/**
 * DraftDetailModal - Modal para ver detalles de un borrador
 *
 * Muestra:
 * - Titulo y metadata del borrador
 * - Fuentes consultadas por la IA
 * - Contenido completo del articulo
 * - Acciones: vista previa, editar, aprobar
 */

import {X, Eye, Edit, Check} from 'lucide-react';
import {Button} from '../../../components/ui';
import {DraftStatusBadge} from './DraftStatusBadge';
import type {AIDraft} from '../../../hooks/useAdminAI';

interface DraftDetailModalProps {
    draft: AIDraft;
    onClose: () => void;
    onApprove: (id: number) => Promise<void>;
}

export function DraftDetailModal({draft, onClose, onApprove}: DraftDetailModalProps): JSX.Element {
    const handleApprove = async () => {
        await onApprove(draft.id);
        onClose();
    };

    return (
        <div id="draft-detail-modal-overlay" className="fixed inset-0 flex items-center justify-center p-4 bg-black/60" style={{zIndex: 9999}} onClick={onClose}>
            <div id="draft-detail-modal-content" className="w-full max-w-3xl max-h-[80vh] overflow-auto bg-surface rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <header className="sticky top-0 flex items-center justify-between p-4 border-b border-primary bg-surface" style={{zIndex: 1}}>
                    <h2 className="text-lg font-semibold text-primary truncate pr-4">{draft.title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted hover:text-primary hover:bg-secondary flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-5 space-y-5">
                    <DraftMetaInfo draft={draft} />
                    <DraftSources sources={draft.ai.sources} />
                    <DraftContent content={draft.content} />
                    <DraftActions draft={draft} onApprove={handleApprove} />
                </div>
            </div>
        </div>
    );
}

function DraftMetaInfo({draft}: {draft: AIDraft}): JSX.Element {
    return (
        <div className="flex flex-wrap gap-4 text-sm">
            <DraftStatusBadge status={draft.ai.status} />
            <span className="text-muted">Modelo: {draft.ai.model}</span>
            <span className="text-muted">Generado: {new Date(draft.ai.generatedAt).toLocaleString()}</span>
        </div>
    );
}

function DraftSources({sources}: {sources: Array<{url: string; title?: string}>}): JSX.Element | null {
    if (sources.length === 0) return null;

    return (
        <div>
            <h3 className="font-medium text-primary mb-2">Fuentes consultadas</h3>
            <ul className="space-y-1">
                {sources.map((src, i) => (
                    <li key={i}>
                        <a href={src.url} target="_blank" rel="noopener" className="text-sm text-[var(--color-accent-primary)] hover:underline">
                            {src.title || src.url}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DraftContent({content}: {content: string}): JSX.Element {
    return (
        <div>
            <h3 className="font-medium text-primary mb-2">Contenido</h3>
            <div className="prose prose-sm max-w-none p-4 rounded-xl bg-secondary" dangerouslySetInnerHTML={{__html: content}} />
        </div>
    );
}

function DraftActions({draft, onApprove}: {draft: AIDraft; onApprove: () => void}): JSX.Element {
    return (
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
                <Button variant="primary" onClick={onApprove}>
                    <Check className="w-4 h-4" />
                    Aprobar
                </Button>
            )}
        </div>
    );
}
