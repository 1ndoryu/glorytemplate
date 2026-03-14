/*
 * LibreriaIsland — Kamples
 * Librería personal: explorar colecciones públicas y mis colecciones.
 * C388: barraControl con ordenamiento + tag badges para filtrado.
 * Lógica extraída a useLibreriaIsland (SRP).
 */

import { useState } from 'react';
import { FolderOpen, Plus, Globe, ArrowDownWideNarrow, ChevronDown } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { Badge } from '@app/components/ui/Badge';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { SkeletonTarjetaColeccion } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useLibreriaIsland } from '@app/hooks/useLibreriaIsland';
import type { OrdenColecciones } from '@app/hooks/useLibreriaIsland';
import { useAuthStore } from '@app/stores/authStore';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import '../../styles/componentes/libreria.css';

const TABS_LIBRERIA = [
    { id: 'explorar', etiqueta: 'Explorar' },
    { id: 'colecciones', etiqueta: 'Mis Colecciones' },
];

/* C388: Opciones de ordenamiento para el menú dropdown */
const OPCIONES_ORDEN: { id: OrdenColecciones; etiqueta: string }[] = [
    { id: 'recientes', etiqueta: 'Recientes' },
    { id: 'nombre', etiqueta: 'Nombre (A-Z)' },
    { id: 'totalSamples', etiqueta: 'Más samples' },
];

export const LibreriaIsland = (): JSX.Element => {
    const {
        colecciones, coleccionesPublicas, cargando,
        modalColeccionAbierto, setModalColeccionAbierto, coleccionEditando,
        tabActiva,
        tagsFrecuentes, tagActivo, setTagActivo,
        orden, setOrden, totalColecciones,
        abrirNuevaColeccion, manejarEditarColeccion, manejarEliminarColeccion, manejarGuardarColeccion,
    } = useLibreriaIsland();
    const usuario = useAuthStore(s => s.usuario);
    const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false);

    useTabsIsla('LibreriaIsland', TABS_LIBRERIA, 'explorar');

    const etiquetaOrden = OPCIONES_ORDEN.find(o => o.id === orden)?.etiqueta ?? 'Recientes';

    return (
        <div className="libreriaContenedor" id="seccionLibreria">

            {cargando ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--espacioMd)', padding: 'var(--espacioMd)' }}>
                    <SkeletonTarjetaColeccion />
                    <SkeletonTarjetaColeccion />
                    <SkeletonTarjetaColeccion />
                    <SkeletonTarjetaColeccion />
                </div>
            ) : (
                <>
                    {/* B1: barraControl compartida entre ambas tabs */}
                    <div className="libreriaBarraControl">
                        <div className="libreriaControlesIzquierda">
                            <span className="libreriaContador">{totalColecciones} colecciones</span>
                        </div>

                        <div className="libreriaControlesDerecha">
                            <div className="libreriaOrdenWrapper">
                                <BotonBase variante="ghost"
                                    className="libreriaOrdenBtn"
                                    onClick={() => setMenuOrdenAbierto(prev => !prev)}
                                    type="button"
                                >
                                    <ArrowDownWideNarrow size={14} />
                                    {etiquetaOrden}
                                    <ChevronDown size={12} />
                                </BotonBase>

                                {menuOrdenAbierto && (
                                    <div className="libreriaOrdenMenu">
                                        {OPCIONES_ORDEN.map(opcion => (
                                            <BotonBase key={opcion.id} variante="ghost"
                                                className={orden === opcion.id ? 'libreriaOrdenActivo' : ''}
                                                onClick={() => { setOrden(opcion.id); setMenuOrdenAbierto(false); }}
                                                type="button"
                                            >
                                                {opcion.etiqueta}
                                            </BotonBase>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {tabActiva !== 'explorar' && (
                                <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                                    <Plus size={14} /> Nueva
                                </BotonBase>
                            )}
                        </div>
                    </div>

                    {/* B1: Tags frecuentes compartidos entre ambas tabs */}
                    {tagsFrecuentes.length > 0 && (
                        <div className="libreriaTagsFrecuentes">
                            <Badge
                                variante={tagActivo === null ? 'acento' : 'neutro'}
                                estilo={tagActivo === null ? 'relleno' : 'borde'}
                                tamano="sm"
                                interactivo
                                onClick={() => setTagActivo(null)}
                            >
                                Todos
                            </Badge>
                            {tagsFrecuentes.map(tag => (
                                <Badge
                                    key={tag}
                                    variante={tagActivo === tag ? 'acento' : 'neutro'}
                                    estilo={tagActivo === tag ? 'relleno' : 'borde'}
                                    tamano="sm"
                                    interactivo
                                    onClick={() => setTagActivo(tagActivo === tag ? null : tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Contenido de tab activa */}
                    {tabActiva === 'explorar' ? (
                        coleccionesPublicas.length === 0 ? (
                            <EstadoVacio
                                icono={<Globe size={32} />}
                                titulo={tagActivo ? 'Sin resultados' : 'Sin colecciones públicas'}
                                mensaje={tagActivo
                                    ? `No hay colecciones con el tag "${tagActivo}".`
                                    : 'Aún no hay colecciones compartidas por otros usuarios.'}
                            />
                        ) : (
                            <div className="libreriaGridColecciones">
                                {coleccionesPublicas.map(col => {
                                    const esPropia = usuario?.id !== undefined && String(col.usuarioId) === String(usuario.id);
                                    return (
                                        <TarjetaColeccion key={col.id} coleccion={col}
                                            onEditar={esPropia ? manejarEditarColeccion : undefined}
                                            onEliminar={esPropia ? manejarEliminarColeccion : undefined}
                                        />
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        colecciones.length === 0 ? (
                            <EstadoVacio
                                icono={<FolderOpen size={32} />}
                                titulo={tagActivo ? 'Sin resultados' : 'Sin colecciones'}
                                mensaje={tagActivo
                                    ? `No hay colecciones con el tag "${tagActivo}".`
                                    : 'Crea tu primera colección para organizar samples.'}
                                accion={!tagActivo ? (
                                    <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                                        <Plus size={14} /> Nueva colección
                                    </BotonBase>
                                ) : undefined}
                            />
                        ) : (
                        <div className="libreriaGridColecciones">
                            {colecciones.map(col => (
                                <TarjetaColeccion key={col.id} coleccion={col}
                                    esSubcoleccion={col.parentId !== null}
                                    onEditar={manejarEditarColeccion}
                                    onEliminar={manejarEliminarColeccion}
                                />
                            ))}
                        </div>
                    ))}
                </>
            )}

            <ModalColeccion abierto={modalColeccionAbierto} onCerrar={() => setModalColeccionAbierto(false)}
                onGuardar={manejarGuardarColeccion} coleccion={coleccionEditando} />
        </div>
    );
};

export default conAutenticacion(LibreriaIsland as React.ComponentType<Record<string, unknown>>);
