/*
 * Hook: useLibreriaIsland — Kamples
 * Lógica de LibreriaIsland: carga por tab (explorar/colecciones), CRUD colecciones.
 * Extraído de LibreriaIsland (SRP).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion } from '@app/services/apiColecciones';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';

const log = crearLogger('LibreriaIsland');

export function useLibreriaIsland() {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalColeccionAbierto, setModalColeccionAbierto] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);

    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
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
                }
                if (activo) {
                    ultimoFetchRef.current = { tab: tabActiva, busqueda };
                }
            } catch {
                if (activo) {
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
        colecciones, coleccionesPublicas, cargando,
        modalColeccionAbierto, setModalColeccionAbierto, coleccionEditando,
        tabActiva,
        abrirNuevaColeccion, manejarEditarColeccion, manejarEliminarColeccion, manejarGuardarColeccion,
    };
}
