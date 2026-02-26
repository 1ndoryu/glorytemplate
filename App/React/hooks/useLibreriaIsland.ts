/*
 * Hook: useLibreriaIsland — Kamples
 * Lógica de LibreriaIsland: carga por tab, likes, CRUD colecciones, panel lateral.
 * Extraído de LibreriaIsland (SRP).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion } from '@app/services/apiColecciones';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useMenuContextualSample, EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO } from '@app/hooks/useMenuContextualSample';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { crearLogger } from '@app/services/logger';
import type { TipoReaccion, SampleResumen, Coleccion } from '@app/types';

const log = crearLogger('LibreriaIsland');

export function useLibreriaIsland() {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalColeccionAbierto, setModalColeccionAbierto] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const navegar = useNavigationStore(s => s.navegar);
    const abrirSubirModal = useSubirModalStore(s => s.abrir);
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);
    const menu = useMenuContextualSample();

    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const busquedaGlobal = useFiltrosStore(s => s.busqueda);

    /* Keep-alive: congelar tabActiva y busqueda cuando la isla está oculta.
     * Sin esto, otra isla cambiando tabs o el usuario escribiendo en TopBar
     * provoca re-fetch de datos en esta isla oculta. */
    const activa = useIslaActiva('LibreriaIsland');
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);
    const busqueda = useValorCongelado(busquedaGlobal, !activa);

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'LibreriaIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Listener para eliminación/restauración optimista */
    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId) {
                setSamples(prev => prev.filter(s => s.id !== detalle.sampleId));
            }
        };
        const manejarRestauracion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sample?: SampleResumen }>).detail;
            if (detalle?.sample) {
                setSamples(prev => {
                    if (prev.some(s => s.id === detalle.sample!.id)) return prev;
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

    /* Cargar datos según tab activa con cleanup.
     * C346: Skip de re-fetch si los parámetros no cambiaron realmente
     * (evita recarga al volver a la isla si el store global cambió
     *  mientras estaba oculta pero el valor congelado resultante es el mismo). */
    const ultimoFetchRef = useRef<{ tab: string; busqueda: string } | null>(null);

    useEffect(() => {
        /* Si los parámetros son los mismos que el último fetch exitoso, no recargar */
        if (
            ultimoFetchRef.current &&
            ultimoFetchRef.current.tab === tabActiva &&
            ultimoFetchRef.current.busqueda === busqueda
        ) {
            return;
        }

        let activo = true;
        setCargando(true);

        const cargar = async () => {
            try {
                if (tabActiva === 'explorar') {
                    const resp = await listarColeccionesPublicas(busqueda || undefined);
                    if (!activo) return;
                    setColeccionesPublicas(resp.ok && resp.data ? resp.data : []);
                } else if (tabActiva === 'colecciones') {
                    const resp = await listarColecciones(undefined, busqueda || undefined);
                    if (!activo) return;
                    setColecciones(resp.ok && resp.data ? resp.data : []);
                } else if (tabActiva === 'subidos') {
                    const { useAuthStore } = await import('@app/stores/authStore');
                    if (!activo) return;
                    const username = useAuthStore.getState().usuario?.username;
                    const resp = await listarSamples({
                        creador: username || undefined,
                        busqueda: busqueda || undefined,
                        perPage: 20,
                    });
                    if (!activo) return;
                    setSamples(resp.ok && resp.data ? (resp.data.data ?? []) : []);
                }
                if (activo) {
                    ultimoFetchRef.current = { tab: tabActiva, busqueda };
                }
            } catch {
                if (activo) {
                    setSamples([]);
                    setColecciones([]);
                    setColeccionesPublicas([]);
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [tabActiva, busqueda]);

    const manejarClickTitulo = useCallback((sample: SampleResumen) => {
        abrirDetalle(sample);
    }, [abrirDetalle]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = samples.find(s => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [samples, abrirComentarios]);

    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find(s => s.id === sampleId);
        const snapshot = samples;
        try {
            if (reaccion) {
                const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setSamples(prev => prev.map(s =>
                    s.id === sampleId ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) } : s
                ));
                await darLike('sample', sampleId, reaccion);
            } else if (sample?.liked || sample?.reaccion) {
                const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                setSamples(prev => prev.map(s =>
                    s.id === sampleId ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) } : s
                ));
                await quitarLike('sample', sampleId);
            } else {
                setSamples(prev => prev.map(s =>
                    s.id === sampleId ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 } : s
                ));
                await darLike('sample', sampleId, 'like');
            }
        } catch {
            setSamples(snapshot);
        }
    }, [samples]);

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
            setColecciones(prev => prev.filter(c => c.id !== col.id));
            log.info('Colección eliminada', { id: col.id });
        }
    }, []);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones(prev => {
            const existe = prev.find(c => c.id === col.id);
            if (existe) return prev.map(c => (c.id === col.id ? col : c));
            return [col, ...prev];
        });
    }, []);

    return {
        samples, colecciones, coleccionesPublicas, cargando,
        modalColeccionAbierto, setModalColeccionAbierto, coleccionEditando,
        tabActiva, menu, navegar, abrirSubirModal,
        manejarClickTitulo, manejarComentar, manejarLike,
        abrirNuevaColeccion, manejarEditarColeccion, manejarEliminarColeccion, manejarGuardarColeccion,
    };
}
