/*
 * Isla: ColeccionDetalleIsland — Kamples (FASE 6.3)
 * Página de detalle de una colección: header + grid de samples.
 * Logica extraida a useColeccionDetalle (SRP).
 */

import { useCallback } from 'react';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Lock, Globe, Download, Play, Pause, MoreHorizontal, Loader2 } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { SkeletonColeccionDetalle } from '@app/components/skeletons';
import { SkeletonFeed } from '@app/components/skeletons';
import { obtenerSugerencias } from '@app/services/apiColecciones';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { useColeccionDetalle } from '@app/hooks/useColeccionDetalle';
import { useColeccionPreview } from '@app/hooks/useColeccionPreview';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { FiltroSubcolecciones } from '@app/components/colecciones/FiltroSubcolecciones';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/coleccionDetalle.css';

interface ColeccionDetalleIslandProps {
    coleccionSlug?: string;
}

const ColeccionDetalleBase = ({ coleccionSlug: propSlug }: ColeccionDetalleIslandProps): JSX.Element => {
    const {
        coleccion, cargando, guardada, descargando, navegar,
        tabActiva, usuario, samples, metasComunes,
        subcolecciones, subActiva, setSubActiva, cargandoSub,
        menuColeccion, abrirMenuColeccion, cerrarMenuColeccion, itemsMenuColeccion,
        modalEditarAbierto, setModalEditarAbierto, manejarGuardarEdicion,
        manejarGuardar, manejarDescargarZip, manejarLikeSamples,
    } = useColeccionDetalle({ propSlug });

    /* QQ75/QL43: Preview de la colección — misma lógica que TarjetaColeccion */
    const { iniciarPreview, cargando: cargandoPreview } = useColeccionPreview();
    const coleccionPreviewId = useReproductorStore(s => s.coleccionPreviewId);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const esPreviewActiva = coleccion ? (coleccionPreviewId === coleccion.id && reproduciendo) : false;

    /* Proveedor para tab "Más Ideas" — usa coleccion.id (numérico) en vez del
     * segmento de URL, que es null cuando la ruta usa slug en lugar de ID. */
    const coleccionId = coleccion?.id ?? null;
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

    /* Mismo fallback que TarjetaColeccion/FilaColecciones para consistencia visual */
    const imagenHeader = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);

    return (
        <div className="coleccionDetalle" id="coleccionDetalle">
            {/* Botón volver */}
            <BotonBase variante="ghost" className="botonVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </BotonBase>

            {/* Header de la colección */}
            <div className="coleccionHeader">
                <img className="coleccionHeaderImg" src={imagenHeader} alt={coleccion.nombre} />
                <div className="coleccionHeaderInfo">
                    <div className="coleccionHeaderTipo">
                        {coleccion.esPublica ? (
                            <Badge variante="acento"><Globe size={12} /> Pública</Badge>
                        ) : (
                            <Badge variante="neutro"><Lock size={12} /> Privada</Badge>
                        )}
                    </div>
                    <h1 className="coleccionNombre">{coleccion.nombre}</h1>
                    {coleccion.descripcion && (
                        <p className="coleccionDescripcion">{coleccion.descripcion}</p>
                    )}
                    <div className="coleccionMeta">
                        {coleccion.usuario && (
                            <EnlaceCreador
                                username={coleccion.usuario.username}
                                nombreVisible={coleccion.usuario.nombreVisible}
                                avatarUrl={coleccion.usuario.avatarUrl ?? undefined}
                                tamanoAvatar="xs"
                                className="coleccionCreador"
                            />
                        )}
                        <span className="coleccionStats">
                            {coleccion.totalSamples} samples
                        </span>
                        {/* C108: 5 metas más comunes separadas por • */}
                        {metasComunes.length > 0 && (
                            <span className="coleccionMetasComunes">
                                {metasComunes.join(' \u2022 ')}
                            </span>
                        )}
                    </div>
                    {/* C109+C125+C137: Botones con texto — guardar (solo ajena), descargar, preview */}
                    <div className="coleccionAcciones">
                        {/* C137: Ocultar guardar en colecciones propias */}
                        {coleccion.usuarioId !== usuario?.id && (
                            <BotonBase variante="ghost"
                                className={`coleccionAccionBtn ${guardada ? 'coleccionAccionActivo' : ''}`}
                                onClick={manejarGuardar}
                                type="button"
                                title={guardada ? 'Guardada' : 'Guardar colección'}
                            >
                                {guardada ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                                <span>{guardada ? 'Guardada' : 'Guardar'}</span>
                            </BotonBase>
                        )}
                        <BotonBase variante="ghost"
                            className="coleccionAccionBtn"
                            type="button"
                            title="Descargar colección"
                            onClick={manejarDescargarZip}
                            disabled={descargando}
                        >
                            <Download size={16} />
                            <span>{descargando ? 'Descargando...' : 'Descargar'}</span>
                        </BotonBase>
                        <BotonBase variante="ghost"
                            className={`coleccionAccionBtn ${esPreviewActiva ? 'coleccionAccionActivo' : ''}`}
                            type="button"
                            title={esPreviewActiva ? 'Detener preview' : 'Preview'}
                            onClick={() => coleccion && iniciarPreview(coleccion.id)}
                            disabled={cargandoPreview}
                        >
                            {cargandoPreview ? <Loader2 size={16} className="tarjetaColeccionSpinner" /> : esPreviewActiva ? <Pause size={16} /> : <Play size={16} />}
                            <span>{cargandoPreview ? 'Cargando...' : esPreviewActiva ? 'Detener' : 'Preview'}</span>
                        </BotonBase>
                        {/* C127: Menú 3 puntos */}
                        <BotonBase variante="ghost"
                            className="coleccionAccionBtn"
                            type="button"
                            title="Más opciones"
                            onClick={abrirMenuColeccion}
                        >
                            <MoreHorizontal size={16} />
                        </BotonBase>
                    </div>
                </div>
            </div>

            {/* C387: Badges de subcolecciones como filtro */}
            <FiltroSubcolecciones
                subcolecciones={subcolecciones}
                activa={subActiva}
                onChange={setSubActiva}
            />

            {/* Contenido según tab activa — key distinta fuerza desmontaje para evitar race conditions (C46) */}
            {cargandoSub ? (
                <SkeletonFeed cantidad={3} />
            ) : tabActiva === 'samples' ? (
                <FeedSamples
                    key={`coleccion-samples-${subActiva ?? 'raiz'}`}
                    samplesIniciales={samples}
                    proveedor={async () => ({ ok: true, data: [] })}
                    claveCache={`coleccion_${coleccion.id}_sub_${subActiva ?? 'raiz'}`}
                    infiniteScroll={false}
                    virtualizar={false}
                    mostrarTags
                    mensajeVacio="Esta colección aún no tiene samples."
                    onLike={manejarLikeSamples}
                />
            ) : (
                <FeedSamples
                    key="coleccion-ideas"
                    proveedor={proveedorSugerencias}
                    claveCache={`sugerencias_${coleccion.id}`}
                    mostrarTags
                    infiniteScroll
                    virtualizar={false}
                    mensajeVacio="No hay sugerencias disponibles para esta colección."
                />
            )}

            {/* C127: MenuContextual de la colección */}
            <MenuContextual
                abierto={menuColeccion.abierto}
                onCerrar={cerrarMenuColeccion}
                items={itemsMenuColeccion}
                x={menuColeccion.x}
                y={menuColeccion.y}
            />

            {/* Modal para editar la colección (solo propietario/admin via menu) */}
            {coleccion && (
                <ModalColeccion
                    abierto={modalEditarAbierto}
                    onCerrar={() => setModalEditarAbierto(false)}
                    onGuardar={manejarGuardarEdicion}
                    coleccion={coleccion}
                />
            )}
        </div>
    );
};

export const ColeccionDetalleIsland = ColeccionDetalleBase;
export default ColeccionDetalleIsland;
