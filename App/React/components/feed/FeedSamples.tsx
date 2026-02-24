/*
 * FeedSamples — Componente centralizado de lista de samples.
 *
 * Reutilizable en: InicioIsland, ColeccionDetalleIsland, Tab "Más Ideas",
 * PerfilIsland, DescubrirIsland, y cualquier vista que liste samples.
 *
 * Lógica extraída a useFeedSamples (SRP).
 */

import { useCallback } from 'react';
import { Music, Plus, Minus } from 'lucide-react';
import '../../styles/componentes/feedSamples.css';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ModalInspectorSample } from '@app/components/ui/ModalInspectorSample';
import { SelectFiltro } from '@app/components/ui/SelectFiltro';
import { SelectorBPM } from '@app/components/ui/SelectorBPM';
import {
    useFeedSamples,
    ETIQUETAS_CATEGORIA,
    CATEGORIAS_SELECT,
} from '@app/hooks/useFeedSamples';
import type { SampleResumen } from '@app/types';
import { BotonBase } from '../ui/BotonBase';

/* Tipo del proveedor de datos: recibe página, devuelve samples */
export type ProveedorSamples = (pagina: number) => Promise<SampleResumen[]>;

export interface FeedSamplesProps {
    proveedor: ProveedorSamples;
    samplesIniciales?: SampleResumen[];
    claveCache?: string;
    mostrarTags?: boolean;
    infiniteScroll?: boolean;
    virtualizar?: boolean;
    maxRenderizados?: number;
    alturaTarjeta?: number;
    mensajeVacio?: string;
    accionVacia?: React.ReactNode;
    className?: string;
    id?: string;
    onLike?: (sampleId: number, nuevoEstado: boolean) => void;
    idsExcluidos?: Set<number>;
    idsCreadoresIncluidos?: Set<number>;
    onConteoChange?: (total: number) => void;
}

export const FeedSamples = ({
    proveedor,
    samplesIniciales,
    claveCache = 'default',
    mostrarTags = false,
    infiniteScroll = true,
    virtualizar = true,
    maxRenderizados = 50,
    alturaTarjeta = 72,
    mensajeVacio = 'No se encontraron samples.',
    accionVacia,
    className = '',
    id,
    onLike,
    idsExcluidos,
    idsCreadoresIncluidos,
    onConteoChange,
}: FeedSamplesProps): JSX.Element => {
    const feed = useFeedSamples({
        proveedor,
        samplesIniciales,
        claveCache,
        mostrarTags,
        infiniteScroll,
        virtualizar,
        maxRenderizados,
        alturaTarjeta,
        onLike,
        idsExcluidos,
        idsCreadoresIncluidos,
        onConteoChange,
    });

    /* Renderizar un tag con botones +/- */
    const renderizarTag = useCallback((tag: string) => (
        <div
            key={tag}
            className={`feedTagItem ${feed.tagsIncluidos.includes(tag) ? 'feedTagItemIncluido' : ''} ${feed.tagsExcluidos.includes(tag) ? 'feedTagItemExcluido' : ''}`}
        >
            <BotonBase variante="ghost" type="button" className="feedTagBoton feedTagBotonRestar"
                aria-label={`Excluir tag ${tag}`}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); feed.manejarExcluirTag(tag); }}
            >
                <Minus size={10} />
            </BotonBase>
            <span className="feedTagTexto" role="button" tabIndex={0}
                aria-label={`Incluir tag ${tag}`}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); feed.manejarIncluirTag(tag); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); feed.manejarIncluirTag(tag); } }}
            >
                {tag}
            </span>
            <BotonBase variante="ghost" type="button" className="feedTagBoton feedTagBotonSumar"
                aria-label={`Incluir tag ${tag}`}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); feed.manejarIncluirTag(tag); }}
            >
                <Plus size={10} />
            </BotonBase>
        </div>
    ), [feed.tagsIncluidos, feed.tagsExcluidos, feed.manejarIncluirTag, feed.manejarExcluirTag]);

    /* Loading state */
    if (feed.cargando) {
        return (
            <div className={`feedSamplesContenedor ${className}`} id={id}>
                <div className="feedSamplesVacio">
                    <Music size={40} className="feedSamplesVacioIcono" />
                    <p>Cargando samples…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`feedSamplesContenedor ${className}`} id={id}>
            {/* Fila de selects por categoría + tags sueltos draggable */}
            {mostrarTags && (
                <div className="feedTags">
                    {/* Fila 1: Selects de categorías + BPM */}
                    <div className="feedFiltrosSelects">
                        {CATEGORIAS_SELECT.map(cat => {
                            const opciones = feed.tagsAgrupados[cat] ?? [];
                            if (opciones.length === 0) return null;
                            return (
                                <SelectFiltro
                                    key={cat}
                                    etiqueta={ETIQUETAS_CATEGORIA[cat]}
                                    opciones={opciones}
                                    tagsIncluidos={feed.tagsIncluidos}
                                    tagsExcluidos={feed.tagsExcluidos}
                                    onIncluir={feed.incluirTag}
                                    onExcluir={feed.excluirTag}
                                    onQuitar={feed.quitarTag}
                                />
                            );
                        })}
                        <SelectorBPM
                            bpmMin={feed.bpmMin}
                            bpmMax={feed.bpmMax}
                            onCambiar={feed.setBpmRango}
                        />
                    </div>

                    {/* Fila 2: Tags sueltos ("otro") — draggable horizontal */}
                    {feed.tagsSueltos.length > 0 && (
                        <div
                            ref={feed.listaTagsRef}
                            className={`feedTagsLista ${feed.arrastrandoTags ? 'feedTagsListaArrastrando' : ''}`}
                            onMouseDown={e => feed.iniciarArrastre(e.clientX)}
                            onMouseMove={e => feed.moverArrastre(e.clientX)}
                            onMouseUp={feed.finalizarArrastre}
                            onMouseLeave={feed.finalizarArrastre}
                            onTouchStart={e => feed.iniciarArrastre(e.touches[0].clientX)}
                            onTouchMove={e => feed.moverArrastre(e.touches[0].clientX)}
                            onTouchEnd={feed.finalizarArrastre}
                        >
                            {feed.tagsSueltos.map(renderizarTag)}
                        </div>
                    )}
                </div>
            )}

            {/* Lista de samples con virtualización */}
            {feed.samplesFiltrados.length === 0 ? (
                <div className="feedSamplesVacio">
                    <Music size={48} className="feedSamplesVacioIcono" />
                    <p>{mensajeVacio}</p>
                    {accionVacia}
                </div>
            ) : (
                <div className="listaDeSamples">
                    {/* Espaciador superior para virtualización */}
                    {feed.virtualizar && feed.indiceInicio > 0 && (
                        <div style={{ height: feed.indiceInicio * feed.alturaTarjeta }} aria-hidden="true" />
                    )}

                    {feed.samplesVisibles.map(s => (
                        <TarjetaSample
                            key={s.id}
                            sample={s}
                            onLike={feed.manejarLike}
                            onMenu={feed.menu.abrirMenu}
                            onClickCreador={u => feed.navegar(`/perfil/${u}`)}
                            onClickTitulo={feed.panelHabilitado ? feed.manejarClickTitulo : undefined}
                            onComentar={feed.panelHabilitado ? feed.manejarComentar : undefined}
                        />
                    ))}

                    {/* Espaciador inferior para virtualización */}
                    {feed.virtualizar && feed.indiceInicio + feed.maxRenderizados < feed.samplesFiltrados.length && (
                        <div
                            style={{ height: (feed.samplesFiltrados.length - feed.indiceInicio - feed.maxRenderizados) * feed.alturaTarjeta }}
                            aria-hidden="true"
                        />
                    )}
                </div>
            )}

            {/* Centinela de infinite scroll */}
            {feed.infiniteScroll && (
                <div ref={feed.sentinelaRef} className="feedSamplesSentinela" aria-hidden="true">
                    {feed.cargandoMas && <p className="feedSamplesCargandoMas">Cargando más samples…</p>}
                </div>
            )}

            <MenuContextual
                abierto={feed.menu.estado.abierto}
                onCerrar={feed.menu.cerrarMenu}
                items={feed.menu.items}
                x={feed.menu.estado.x}
                y={feed.menu.estado.y}
            />

            <ModalInspectorSample
                abierto={!!feed.menu.sampleInspeccion}
                onCerrar={feed.menu.cerrarInspeccion}
                sample={feed.menu.sampleInspeccion}
            />
        </div>
    );
};

export default FeedSamples;
