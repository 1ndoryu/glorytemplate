/*
 * Isla: ColeccionDetalleIsland — Kamples (FASE 6.3)
 * Página de detalle de una colección: header + grid de samples.
 * Logica extraida a useColeccionDetalle (SRP).
 */

import { useCallback, useState } from 'react';
import { Dices, Heart, SlidersHorizontal } from 'lucide-react';
import { ColeccionCabecera } from '@app/components/colecciones/ColeccionCabecera';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { BarraControlFeed, OPCIONES_ORDEN_COLECCION } from '@app/components/feed/BarraControlFeed';
import type { TipoOrdenFeed } from '@app/components/feed/BarraControlFeed';
import { BotonBase } from '@app/components/ui/BotonBase';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ColeccionDetalleModales } from '@app/components/colecciones/ColeccionDetalleModales';
import { SkeletonColeccionDetalle } from '@app/components/skeletons';
import { SkeletonFeed } from '@app/components/skeletons';
import { obtenerColeccion, obtenerSugerencias } from '@app/services/apiColecciones';
import { useReproductorAleatorio } from '@app/hooks/useReproductorAleatorio';

import { useColeccionDetalle } from '@app/hooks/useColeccionDetalle';
import { useColeccionPreview } from '@app/hooks/useColeccionPreview';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { FiltroSubcolecciones } from '@app/components/colecciones/FiltroSubcolecciones';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { ModalCodigoExpirado } from '@app/components/ui/ModalCodigoExpirado';
import { useFiltrosContenido } from '@app/hooks/useFiltrosContenido';
import { useCodigosGratis } from '@app/hooks/useCodigosGratis';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/coleccionDetalle.css';

interface ColeccionDetalleIslandProps {
    coleccionSlug?: string;
}

const ColeccionDetalleBase = ({ coleccionSlug: propSlug }: ColeccionDetalleIslandProps): JSX.Element => {

    /* QL53: Estado de ordenamiento — default 'posicion' para colecciones */
    const [ordenColeccion, setOrdenColeccion] = useState<TipoOrdenFeed>('posicion');
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);

    /* QL87: Filtros locales para colecciones (no mostrar "ocultar coleccionados" porque ya estás en una) */
    const filtrosColeccion = useFiltrosContenido({ disponibles: ['soloWav', 'soloMeEncanta', 'ocultarDescargados'] });

    const {
        coleccion, cargando, guardada, descargando, navegar,
        tabActiva, usuario, samples, metasComunes,
        subcolecciones, subActiva, setSubActiva, cargandoSub,
        coleccionPadre,
        menuColeccion, abrirMenuColeccion, cerrarMenuColeccion, itemsMenuColeccion,
        modalEditarAbierto, setModalEditarAbierto, manejarGuardarEdicion,
        manejarGuardar, manejarDescargarZip, manejarLikeSamples,
        modalCombinarAbierto, setModalCombinarAbierto,
        modalVolumenAbierto, setModalVolumenAbierto, recargarColeccionActual,
        combinacionPendiente, manejarDeshacerCombinacion, deshaciendoCombinacion,
        manejarCombinado,
        modalEliminarAbierto, setModalEliminarAbierto, manejarEliminado,
    } = useColeccionDetalle({ propSlug });

    /* [223A-7] Dado: aleatorio dentro de la colección actual (incluye subcolecciones) */
    const {
        cargandoAleatorio, reproducirAleatorio,
        modoAutoplayForzado, iniciarAutoplayForzado, detenerAutoplayForzado,
    } = useReproductorAleatorio(coleccion?.id);
    const esPadre = (subcolecciones?.length ?? 0) > 0;

    /* QQ75/QL43: Preview de la colección — misma lógica que TarjetaColeccion */
    const { iniciarPreview, cargando: cargandoPreview } = useColeccionPreview();

    /* [183A-106] Detecta ?codigoGratis= en URL y reclama descarga gratis */
    useCodigosGratis();
    const coleccionPreviewId = useReproductorStore(s => s.coleccionPreviewId);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const esPreviewActiva = coleccion ? (coleccionPreviewId === coleccion.id && reproduciendo) : false;

    /* Proveedor para tab "Más Ideas" — usa coleccion.id (numérico) en vez del
     * segmento de URL, que es null cuando la ruta usa slug en lugar de ID. */
    const coleccionId = coleccion?.id ?? null;

    /*
     * QL77 fix: Proveedor real para el tab "Samples".
     * Antes estaba hardcodeado a devolver [] — el polling de useFeedRefresco
     * cada 5 min provocaba que los samples desaparecieran.
     * Ahora re-fetcha la coleccion (o subcoleccion activa) y extrae samples.
     */
    const proveedorSamples = useCallback(async () => {
        const targetId = subActiva ?? coleccionId;
        if (!targetId) return { ok: true, data: [] as SampleResumen[] };
        const resp = await obtenerColeccion(targetId, { incluirSubcolecciones: subActiva === null, orden: ordenColeccion });
        return { ok: resp.ok, data: resp.ok && resp.data?.samples ? resp.data.samples : [] };
    }, [coleccionId, subActiva, ordenColeccion]);

    const proveedorSugerencias = useCallback(async (pagina: number) => {
        if (!coleccionId) return { ok: true, data: [] as SampleResumen[] };
        const resp = await obtenerSugerencias(coleccionId, pagina);
        return { ok: resp.ok, data: resp.ok && resp.data ? resp.data : [] };
    }, [coleccionId]);

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="coleccionDetalle">
                <SkeletonColeccionDetalle cantidadSamples={4} />
            </div>
        );
    }

    if (!coleccion) {
        return (
            <div className="coleccionDetalle" id="coleccionDetalle">
                <div className="coleccionError">
                    <p>Colección no encontrada</p>
                    <BotonBase variante="ghost" onClick={() => navegar('/libreria/')}>
                        Volver a librería
                    </BotonBase>
                </div>
            </div>
        );
    }

    return (
        <div className="coleccionDetalle" id="coleccionDetalle">
            <ColeccionCabecera
                coleccion={coleccion}
                coleccionPadre={coleccionPadre ?? null}
                navegar={navegar}
                usuarioId={usuario?.id}
                metasComunes={metasComunes}
                guardada={guardada}
                manejarGuardar={manejarGuardar}
                descargando={descargando}
                manejarDescargarZip={manejarDescargarZip}
                esPadre={esPadre}
                modoAutoplayForzado={modoAutoplayForzado}
                iniciarAutoplayForzado={iniciarAutoplayForzado}
                detenerAutoplayForzado={detenerAutoplayForzado}
                cargandoAleatorio={cargandoAleatorio}
                esPreviewActiva={esPreviewActiva}
                iniciarPreview={iniciarPreview}
                cargandoPreview={cargandoPreview}
                abrirMenuColeccion={abrirMenuColeccion}
                combinacionPendiente={combinacionPendiente}
                manejarDeshacerCombinacion={manejarDeshacerCombinacion}
                deshaciendoCombinacion={deshaciendoCombinacion}
            />

            {/* Contenido según tab activa — key distinta fuerza desmontaje para evitar race conditions (C46) */}
            {tabActiva === 'samples' ? (
                <>
                    <BarraControlFeed
                        opciones={OPCIONES_ORDEN_COLECCION}
                        ordenActual={ordenColeccion}
                        onOrdenCambiar={setOrdenColeccion}
                    >
                        {/* [2103A-18] Botón dado para sample aleatorio */}
                        <BotonBase variante="ghost" tamano="ninguno" onClick={reproducirAleatorio} type="button" aria-label="Aleatorio" className={`inicioFiltrosBtn${cargandoAleatorio ? ' cargandoAleatorio' : ''}`} disabled={cargandoAleatorio}>
                            <Dices size={16} />
                        </BotonBase>
                        {/* [223A-6] Ciclo corazón: off → like → encanta → off */}
                        <BotonBase
                            variante="ghost"
                            tamano="ninguno"
                            onClick={filtrosColeccion.ciclarCorazon}
                            type="button"
                            aria-label={filtrosColeccion.modoCorazon === 'off' ? 'Filtrar favoritos' : filtrosColeccion.modoCorazon === 'like' ? 'Solo me gusta' : 'Solo me encanta'}
                            className={`inicioFiltrosBtn ${filtrosColeccion.modoCorazon !== 'off' ? 'filtroEncantaActivo' : ''}`}
                        >
                            <Heart size={16} fill={filtrosColeccion.modoCorazon === 'encanta' ? 'currentColor' : 'none'} strokeWidth={filtrosColeccion.modoCorazon === 'like' ? 3 : 2} />
                        </BotonBase>
                        <BotonBase variante="ghost" tamano="ninguno" onClick={() => setFiltrosAbierto(true)} type="button" aria-label="Filtros">
                            <SlidersHorizontal size={16} />
                        </BotonBase>
                    </BarraControlFeed>
                    <FiltroSubcolecciones
                        subcolecciones={subcolecciones}
                        activa={subActiva}
                        onChange={setSubActiva}
                    />
                    {cargandoSub ? (
                        <SkeletonFeed cantidad={3} />
                    ) : (
                        <FeedSamples
                            key={`coleccion-samples-${subActiva ?? 'raiz'}-${ordenColeccion}`}
                            samplesIniciales={samples}
                            proveedor={proveedorSamples}
                            claveCache={`coleccion_${coleccion.id}_sub_${subActiva ?? 'raiz'}_${ordenColeccion}`}
                            habilitarRefresco={false}
                            infiniteScroll={false}
                            virtualizar={false}
                            mostrarTags
                            mensajeVacio="Esta colección aún no tiene samples."
                            onLike={manejarLikeSamples}
                            filtroAdicional={filtrosColeccion.aplicar}
                            busquedaLocal
                        />
                    )}
                </>
            ) : (
                <FeedSamples
                    key="coleccion-ideas"
                    proveedor={proveedorSugerencias}
                    claveCache={`sugerencias_${coleccion.id}`}
                    mostrarTags
                    infiniteScroll
                    virtualizar={false}
                    mensajeVacio="No hay sugerencias disponibles para esta colección."
                    busquedaLocal
                />
            )}

            {/* QL87: Modal de filtros para colecciones */}
            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
                filtrosContenido={filtrosColeccion.filtros}
                estaActivo={filtrosColeccion.estaActivo}
                onToggleFiltro={filtrosColeccion.toggle}
                hayFiltrosContenidoActivos={filtrosColeccion.hayActivos}
                onResetContenido={filtrosColeccion.resetear}
                mostrarPrecio={false}
            />

            {/* C127: MenuContextual de la colección */}
            <MenuContextual
                abierto={menuColeccion.abierto}
                onCerrar={cerrarMenuColeccion}
                items={itemsMenuColeccion}
                x={menuColeccion.x}
                y={menuColeccion.y}
            />

            <ColeccionDetalleModales
                coleccion={coleccion}
                esAdmin={usuario?.rol === 'admin'}
                modalEditarAbierto={modalEditarAbierto}
                setModalEditarAbierto={setModalEditarAbierto}
                manejarGuardarEdicion={manejarGuardarEdicion}
                modalCombinarAbierto={modalCombinarAbierto}
                setModalCombinarAbierto={setModalCombinarAbierto}
                manejarCombinado={manejarCombinado}
                modalVolumenAbierto={modalVolumenAbierto}
                setModalVolumenAbierto={setModalVolumenAbierto}
                recargarColeccionActual={recargarColeccionActual}
                modalEliminarAbierto={modalEliminarAbierto}
                setModalEliminarAbierto={setModalEliminarAbierto}
                manejarEliminado={manejarEliminado}
            />
            {/* [183A-110] Modal de compensación por código de descarga expirado */}
            <ModalCodigoExpirado />
        </div>
    );
};

export const ColeccionDetalleIsland = ColeccionDetalleBase;
export default ColeccionDetalleIsland;
