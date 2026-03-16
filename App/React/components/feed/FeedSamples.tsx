/*
 * FeedSamples — Componente centralizado de lista de samples.
 *
 * Reutilizable en: InicioIsland, ColeccionDetalleIsland, Tab "Más Ideas",
 * PerfilIsland, DescubrirIsland, y cualquier vista que liste samples.
 *
 * Lógica extraída a useFeedSamples (SRP).
 */

import { Music } from 'lucide-react';
import '../../styles/componentes/feedSamples.css';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { BotonBase } from '@app/components/ui/BotonBase';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ModalInspectorSample } from '@app/components/ui/ModalInspectorSample';
import { FiltroTags } from '@app/components/feed/FiltroTags';
import { SkeletonTarjetaSample } from '@app/components/skeletons';
import { useFeedSamples } from '@app/hooks/useFeedSamples';
import type { SampleResumen } from '@app/types';

/* QL35: Resultado del proveedor — distingue exito de error para que el hook
 * no reemplace datos validos en cache con arrays vacios de fallos de red/API. */
export interface ResultadoProveedor {
    ok: boolean;
    data: SampleResumen[];
}

/* Tipo del proveedor de datos: recibe pagina, devuelve resultado con flag de exito */
export type ProveedorSamples = (pagina: number) => Promise<ResultadoProveedor>;

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

    /* QL20: Mostrar skeleton hasta que haya al menos una carga exitosa.
     * primeraCargaCompleta es false solo cuando: no hay cache persistente Y la API no ha
     * respondido todavia. Esto elimina el flash de "No se encontraron samples" que ocurria
     * por race conditions entre re-renders y callbacks async del proveedor.
     * Una vez que primeraCargaCompleta es true, si samplesFiltrados esta vacio,
     * es un vacio real (el usuario no tiene samples o los filtros excluyeron todo). */
    if (feed.samplesFiltrados.length === 0 && !feed.primeraCargaCompleta) {
        return (
            <div className={`feedSamplesContenedor ${className}`} id={id}>
                <div className="feedSamplesSkeletonInicial">
                    <SkeletonTarjetaSample />
                    <SkeletonTarjetaSample />
                    <SkeletonTarjetaSample />
                    <SkeletonTarjetaSample />
                    <SkeletonTarjetaSample />
                </div>
            </div>
        );
    }

    return (
        <div className={`feedSamplesContenedor ${className}`} id={id}>
            {/* Filtros de tags y BPM — componente reutilizable */}
            {mostrarTags && (
                <FiltroTags
                    tagsAgrupados={feed.tagsAgrupados}
                    tagsSueltos={feed.tagsSueltos}
                    tagsIncluidos={feed.tagsIncluidos}
                    tagsExcluidos={feed.tagsExcluidos}
                    bpmMin={feed.bpmMin}
                    bpmMax={feed.bpmMax}
                    onIncluirTag={feed.manejarIncluirTag}
                    onExcluirTag={feed.manejarExcluirTag}
                    onQuitarTag={feed.quitarTag}
                    onCambiarBpm={feed.setBpmRango}
                />
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
                            contexto={feed.samplesVisibles}
                            onLike={feed.manejarLike}
                            onMenu={feed.menu.abrirMenu}
                            onClickCreador={u => feed.navegar(`/perfil/${u}`)}
                            onClickTitulo={feed.panelHabilitado ? feed.manejarClickTitulo : undefined}
                            onComentar={feed.panelHabilitado ? feed.manejarComentar : undefined}
                            onFiltrarMeta={feed.manejarIncluirTag}
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
            {feed.infiniteScroll && !feed.requiereManual && (
                <div ref={feed.sentinelaRef} className="feedSamplesSentinela" aria-hidden="true">
                    {feed.cargandoMas && (
                        <div className="feedSamplesSkeletonMas">
                            <SkeletonTarjetaSample />
                            <SkeletonTarjetaSample />
                        </div>
                    )}
                </div>
            )}

            {/* Botón manual cuando el throttle excede maxAutoCarga */}
            {feed.requiereManual && (
                <div className="feedSamplesBotonManual">
                    <BotonBase variante="secundario" className="feedSamplesCargarMas" onClick={feed.cargarMasManual}>
                        Cargar más samples
                    </BotonBase>
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
