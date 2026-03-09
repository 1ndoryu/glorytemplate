/*
 * Hook: useExplorarCanciones — Kamples
 * Lógica de la página de exploración de canciones.
 * Tabs: recientes, top sampleadas, búsqueda.
 * Extraído de ExplorarCancionesIsland (SRP).
 */

import { useState, useEffect, useCallback } from 'react';
import {
    listarCanciones,
    cancionesTopSampleadas,
    buscarCanciones,
    obtenerEstadisticasRelaciones,
} from '@app/services/apiCanciones';
import { useNavigationStore } from '@/core/router';
import type { CancionResumen, EstadisticaRelaciones } from '@app/types/cancion';

export type TabExplorar = 'recientes' | 'top' | 'buscar';

export function useExplorarCanciones() {
    /* S4.6: Leer query param "q" de la URL si viene desde búsqueda global */
    const queryInicial = (() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('q')?.trim() ?? '';
        } catch {
            return '';
        }
    })();

    const [tabActiva, setTabActiva] = useState<TabExplorar>(queryInicial ? 'buscar' : 'recientes');
    const [canciones, setCanciones] = useState<CancionResumen[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticaRelaciones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [queryBusqueda, setQueryBusqueda] = useState(queryInicial);
    const navegar = useNavigationStore((s) => s.navegar);

    const cargarTab = useCallback(async (tab: TabExplorar, query: string, signal: AbortSignal) => {
        setCargando(true);
        setError('');

        let resp;
        switch (tab) {
            case 'recientes':
                resp = await listarCanciones(30);
                break;
            case 'top':
                resp = await cancionesTopSampleadas(30);
                break;
            case 'buscar':
                if (!query.trim()) {
                    setCanciones([]);
                    setCargando(false);
                    return;
                }
                resp = await buscarCanciones(query.trim(), 30);
                break;
        }

        if (signal.aborted) return;

        if (resp?.ok && resp.data) {
            setCanciones(resp.data);
        } else {
            setCanciones([]);
            setError(resp?.error ?? 'Error al cargar canciones');
        }

        setCargando(false);
    }, []);

    /* Cargar datos al cambiar tab o ejecutar búsqueda */
    useEffect(() => {
        const controller = new AbortController();
        cargarTab(tabActiva, queryBusqueda, controller.signal);
        return () => { controller.abort(); };
    }, [tabActiva, queryBusqueda, cargarTab]);

    /* Cargar estadísticas una vez */
    useEffect(() => {
        const controller = new AbortController();

        const cargar = async () => {
            const resp = await obtenerEstadisticasRelaciones();
            if (controller.signal.aborted) return;
            if (resp.ok && resp.data) {
                setEstadisticas(resp.data);
            }
        };

        cargar();
        return () => { controller.abort(); };
    }, []);

    const cambiarTab = useCallback((tab: TabExplorar) => {
        setTabActiva(tab);
        if (tab !== 'buscar') {
            setQueryBusqueda('');
        }
    }, []);

    const ejecutarBusqueda = useCallback((query: string) => {
        setQueryBusqueda(query);
        if (query.trim()) {
            setTabActiva('buscar');
        }
    }, []);

    const irACancion = useCallback(
        (slug: string) => navegar(`/cancion/${slug}`),
        [navegar]
    );

    return {
        tabActiva,
        canciones,
        estadisticas,
        cargando,
        error,
        queryBusqueda,
        cambiarTab,
        ejecutarBusqueda,
        irACancion,
    };
}
