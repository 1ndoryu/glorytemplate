/*
 * FiltroTags — Componente reutilizable de filtrado por tags, categorías y BPM.
 *
 * Extraído de FeedSamples para poder usarse en cualquier vista que liste samples:
 * InicioIsland, DescargasIsland, FavoritosIsland, LibreriaIsland, etc.
 *
 * Recibe los datos de filtrado de useFeedFiltros y renderiza:
 * - Fila de SelectFiltro por categoría (género, instrumento, sentimiento, tipo)
 * - SelectorBPM
 * - Fila de tags sueltos ("otro") con arrastre horizontal
 */

import { useCallback, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { SelectFiltro } from '@app/components/ui/SelectFiltro';
import { SelectorBPM } from '@app/components/ui/SelectorBPM';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useFeedArrastreTags } from '@app/hooks/useFeedArrastreTags';
import { ETIQUETAS_CATEGORIA, CATEGORIAS_SELECT } from '@app/hooks/useFeedSamples';
import { useT } from '@app/utils/i18n/useT';
import type { CategoriaTag } from '@app/services/tagUtils';

export interface FiltroTagsProps {
    tagsAgrupados: Record<CategoriaTag, string[]>;
    tagsSueltos: string[];
    tagsIncluidos: string[];
    tagsExcluidos: string[];
    bpmMin: number | null;
    bpmMax: number | null;
    onIncluirTag: (tag: string) => void;
    onExcluirTag: (tag: string) => void;
    onQuitarTag: (tag: string) => void;
    onCambiarBpm: (min: number | null, max: number | null) => void;
    /* [193A-30] Búsqueda server-side al hacer click en tag (en vez de filtrado client-side) */
    onBuscarTag?: (tag: string) => void;
    className?: string;
}

export const FiltroTags = ({
    tagsAgrupados,
    tagsSueltos,
    tagsIncluidos,
    tagsExcluidos,
    bpmMin,
    bpmMax,
    onIncluirTag,
    onExcluirTag,
    onQuitarTag,
    onCambiarBpm,
    onBuscarTag,
    className = '',
}: FiltroTagsProps): JSX.Element => {
    const { t } = useT();
    const { listaTagsRef, arrastrandoTags, iniciarArrastre, moverArrastre, finalizarArrastre } = useFeedArrastreTags();

    /* QL9: Ordenar tags — incluidos primero, excluidos segundo, inactivos al final */
    const tagsOrdenados = useMemo(() => {
        if (tagsIncluidos.length === 0 && tagsExcluidos.length === 0) return tagsSueltos;
        return [...tagsSueltos].sort((a, b) => {
            const pesoA = tagsIncluidos.includes(a) ? -2 : tagsExcluidos.includes(a) ? -1 : 0;
            const pesoB = tagsIncluidos.includes(b) ? -2 : tagsExcluidos.includes(b) ? -1 : 0;
            return pesoA - pesoB;
        });
    }, [tagsSueltos, tagsIncluidos, tagsExcluidos]);

    /* Renderizar un tag con botones +/- */
    const renderizarTag = useCallback((tag: string) => (
        <div
            key={tag}
            className={`feedTagItem ${tagsIncluidos.includes(tag) ? 'feedTagItemIncluido' : ''} ${tagsExcluidos.includes(tag) ? 'feedTagItemExcluido' : ''}`}
        >
            <BotonBase variante="ghost" type="button" className="feedTagBoton feedTagBotonRestar"
                aria-label={t('filtros.excluirTag', { tag })}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onBuscarTag ? onBuscarTag('-' + tag) : onExcluirTag(tag); }}
            >
                <Minus size={10} />
            </BotonBase>
            <span className="feedTagTexto" role="button" tabIndex={0}
                aria-label={t('filtros.incluirTag', { tag })}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onBuscarTag ? onBuscarTag(tag) : onIncluirTag(tag); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onBuscarTag ? onBuscarTag(tag) : onIncluirTag(tag); } }}
            >
                {tag}
            </span>
            <BotonBase variante="ghost" type="button" className="feedTagBoton feedTagBotonSumar"
                aria-label={t('filtros.incluirTag', { tag })}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onBuscarTag ? onBuscarTag(tag) : onIncluirTag(tag); }}
            >
                <Plus size={10} />
            </BotonBase>
        </div>
    ), [tagsIncluidos, tagsExcluidos, onIncluirTag, onExcluirTag, onBuscarTag]);

    return (
        <div className={`feedTags ${className}`}>
            {/* Fila 1: Selects de categorías + BPM */}
            <div className="feedFiltrosSelects">
                {CATEGORIAS_SELECT.map(cat => {
                    const opciones = tagsAgrupados[cat] ?? [];
                    if (opciones.length === 0) return null;
                    return (
                        <SelectFiltro
                            key={cat}
                            etiqueta={t(ETIQUETAS_CATEGORIA[cat])}
                            opciones={opciones}
                            tagsIncluidos={tagsIncluidos}
                            tagsExcluidos={tagsExcluidos}
                            onIncluir={onIncluirTag}
                            onExcluir={onExcluirTag}
                            onQuitar={onQuitarTag}
                            onBuscar={onBuscarTag}
                        />
                    );
                })}
                <SelectorBPM
                    bpmMin={bpmMin}
                    bpmMax={bpmMax}
                    onCambiar={onCambiarBpm}
                />
            </div>

            {/* Fila 2: Tags sueltos ("otro") — draggable horizontal */}
            {tagsSueltos.length > 0 && (
                <div
                    ref={listaTagsRef}
                    className={`feedTagsLista ${arrastrandoTags ? 'feedTagsListaArrastrando' : ''}`}
                    onMouseDown={e => iniciarArrastre(e.clientX)}
                    onMouseMove={e => moverArrastre(e.clientX)}
                    onMouseUp={finalizarArrastre}
                    onMouseLeave={finalizarArrastre}
                    onTouchStart={e => iniciarArrastre(e.touches[0].clientX)}
                    onTouchMove={e => moverArrastre(e.touches[0].clientX)}
                    onTouchEnd={finalizarArrastre}
                >
                    {tagsOrdenados.map(renderizarTag)}
                </div>
            )}
        </div>
    );
};

export default FiltroTags;
