/*
 * LibreriaIsland — Kamples (Fase 5, C140)
 * Librería personal: explorar colecciones públicas, mis colecciones y subidos.
 * Descargas y Favoritos se movieron a páginas independientes (C140).
 * Tabs se renderizan en el TopBar via tabsTopBarStore.
 */

import { useState, useCallback, useEffect } from 'react';
import { FolderOpen, Upload, Music, Plus, Globe } from 'lucide-react';
import {
    BotonBase,
} from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion } from '@app/services/apiColecciones';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample, EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import type { SampleResumen, Coleccion } from '@app/types';
import { crearLogger } from '@app/services/logger';
import '../../styles/componentes/libreria.css';

/* C140: Tabs reducidas — descargas y favoritos ahora son páginas propias */
const TABS_LIBRERIA = [
    { id: 'explorar', etiqueta: 'Explorar' },
    { id: 'colecciones', etiqueta: 'Mis Colecciones' },
    { id: 'subidos', etiqueta: 'Subidos' },
];

const log = crearLogger('LibreriaIsland');

export const LibreriaIsland = (): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);

    /* Modal de colección */
    const [modalColeccionAbierto, setModalColeccionAbierto] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const { navegar } = useNavigationStore();
    const { abrir: abrirSubirModal } = useSubirModalStore();
    const { activa: tabActiva } = useTabsTopBarStore();
    const menu = useMenuContextualSample();

    /* Panel lateral: habilitar para esta island */
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel, abrirDetalle, abrirComentarios } = usePanelLateralStore();

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('LibreriaIsland', TABS_LIBRERIA, 'explorar');

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'LibreriaIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Listener para eliminación optimista de samples */
    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId) {
                setSamples((prev) => prev.filter((s) => s.id !== detalle.sampleId));
            }
        };
        const manejarRestauracion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sample?: SampleResumen }>).detail;
            if (detalle?.sample) {
                setSamples((prev) => {
                    if (prev.some((s) => s.id === detalle.sample!.id)) return prev;
                    return [detalle.sample!, ...prev];
                });
            }
        };
        window.addEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
        window.addEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        return () => {
            window.removeEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
            window.removeEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        };
    }, []);

    /* C169: Suscribirse a la búsqueda del TopBar */
    const busqueda = useFiltrosStore(s => s.busqueda);

    /* Cargar datos según tab activa — C140: sin descargas/favoritos — C169: con búsqueda */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            if (tabActiva === 'explorar') {
                const resp = await listarColeccionesPublicas(busqueda || undefined);
                if (resp.ok && resp.data) {
                    setColeccionesPublicas(resp.data);
                } else {
                    setColeccionesPublicas([]);
                }
            } else if (tabActiva === 'colecciones') {
                const resp = await listarColecciones(undefined, busqueda || undefined);
                if (resp.ok && resp.data) {
                    setColecciones(resp.data);
                } else {
                    setColecciones([]);
                }
            } else if (tabActiva === 'subidos') {
                /* subidos: usar filtro creador con username del auth store — C169: con búsqueda */
                const { useAuthStore } = await import('@app/stores/authStore');
                const username = useAuthStore.getState().usuario?.username;
                const resp = await listarSamples({
                    creador: username || undefined,
                    busqueda: busqueda || undefined,
                    perPage: 20,
                });
                if (resp.ok && resp.data) {
                    setSamples(resp.data.data ?? []);
                } else {
                    setSamples([]);
                }
            }
            setCargando(false);
        };
        cargar();
    }, [tabActiva, busqueda]);

    /* Handlers para panel lateral */
    const manejarClickTitulo = useCallback((sample: SampleResumen) => {
        abrirDetalle(sample);
    }, [abrirDetalle]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [samples, abrirComentarios]);

    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                )
            );
            await darLike('sample', sampleId, reaccion);
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            await quitarLike('sample', sampleId);
        } else {
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            await darLike('sample', sampleId, 'like');
        }
    }, [samples]);

    /* Colecciones: crear/editar/eliminar */
    const abrirNuevaColeccion = useCallback(() => {
        setColeccionEditando(null);
        setModalColeccionAbierto(true);
    }, []);

    const manejarEditarColeccion = useCallback((col: Coleccion) => {
        setColeccionEditando(col);
        setModalColeccionAbierto(true);
    }, []);

    const manejarEliminarColeccion = useCallback(async (col: Coleccion) => {
        const resp = await eliminarColeccion(col.id);
        if (resp.ok) {
            setColecciones((prev) => prev.filter((c) => c.id !== col.id));
            log.info('Colección eliminada', { id: col.id });
        }
    }, []);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones((prev) => {
            const existe = prev.find((c) => c.id === col.id);
            if (existe) {
                return prev.map((c) => (c.id === col.id ? col : c));
            }
            return [col, ...prev];
        });
    }, []);

    /* Mensajes vacíos por tab — C140: sin descargas/favoritos */
    const mensajeVacio: Record<string, { titulo: string; texto: string }> = {
        colecciones: { titulo: 'Sin colecciones', texto: 'Crea tu primera colección para organizar samples.' },
        subidos: { titulo: 'Sin samples subidos', texto: 'Sube tu primer sample para compartirlo.' },
    };

    /* Iconos para estado vacío por tab */
    const ICONOS_TAB: Record<string, JSX.Element> = {
        explorar: <Globe size={16} />,
        colecciones: <FolderOpen size={16} />,
        subidos: <Upload size={16} />,
    };

    return (
        <div className="libreriaContenedor" id="seccionLibreria">
            {/* Acciones contextuales por tab */}
            <div className="libreriaBarraAcciones">
                <div className="libreriaAcciones">
                    {tabActiva === 'colecciones' && (
                        <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                            <Plus size={14} /> Nueva colección
                        </BotonBase>
                    )}
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>
                            <Upload size={14} /> Subir sample
                        </BotonBase>
                    )}
                </div>
            </div>

            {cargando ? (
                <div className="libreriaVacio">
                    <Music size={32} className="libreriaVacioIcono" />
                    <p>Cargando...</p>
                </div>
            ) : tabActiva === 'explorar' ? (
                /* Colecciones públicas de otros usuarios */
                coleccionesPublicas.length === 0 ? (
                    <div className="libreriaVacio">
                        <Globe size={32} />
                        <h3 className="libreriaVacioTitulo">Sin colecciones públicas</h3>
                        <p className="libreriaVacioTexto">Aún no hay colecciones compartidas por otros usuarios.</p>
                    </div>
                ) : (
                    <div className="libreriaGridColecciones">
                        {coleccionesPublicas.map((col) => (
                            <TarjetaColeccion
                                key={col.id}
                                coleccion={col}
                                onClick={(c) => navegar(`/coleccion/${c.id}/`)}
                            />
                        ))}
                    </div>
                )
            ) : tabActiva === 'colecciones' ? (
                colecciones.length === 0 ? (
                    <div className="libreriaVacio">
                        <FolderOpen size={32} />
                        <h3 className="libreriaVacioTitulo">Sin colecciones</h3>
                        <p className="libreriaVacioTexto">Crea tu primera colección para organizar samples.</p>
                        <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                            <Plus size={14} /> Nueva colección
                        </BotonBase>
                    </div>
                ) : (
                    <div className="libreriaGridColecciones">
                        {colecciones.map((col) => (
                            <TarjetaColeccion
                                key={col.id}
                                coleccion={col}
                                onClick={(c) => navegar(`/coleccion/${c.id}/`)}
                                onEditar={manejarEditarColeccion}
                                onEliminar={manejarEliminarColeccion}
                            />
                        ))}
                    </div>
                )
            ) : samples.length === 0 ? (
                <div className="libreriaVacio">
                    {ICONOS_TAB[tabActiva]}
                    <h3 className="libreriaVacioTitulo">{mensajeVacio[tabActiva]?.titulo}</h3>
                    <p className="libreriaVacioTexto">{mensajeVacio[tabActiva]?.texto}</p>
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>
                            Subir sample
                        </BotonBase>
                    )}
                </div>
            ) : (
                <div className="listaDeSamples">
                    {samples.map((sample) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            onLike={manejarLike}
                            onMenu={menu.abrirMenu}
                            onClickCreador={(u) => navegar(`/perfil/${u}`)}
                            onClickTitulo={manejarClickTitulo}
                            onComentar={manejarComentar}
                        />
                    ))}
                </div>
            )}

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />

            {/* Modal para crear/editar colección */}
            <ModalColeccion
                abierto={modalColeccionAbierto}
                onCerrar={() => setModalColeccionAbierto(false)}
                onGuardar={manejarGuardarColeccion}
                coleccion={coleccionEditando}
            />
        </div>
    );
};

export default conAutenticacion(LibreriaIsland as React.ComponentType<Record<string, unknown>>);
