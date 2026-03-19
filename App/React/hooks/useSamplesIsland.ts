/*
 * Hook: useSamplesIsland
 * Lógica extraída de SamplesIsland (SRP).
 * Gestiona filtros, paginación, likes optimistic y carga de samples.
 */

import { useState, useCallback, useEffect, type ChangeEvent } from 'react';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import type { FiltrosSamples, RespuestaListaSamples } from '@app/services/apiSamples';
import type { SampleResumen } from '@app/types';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';

export const useSamplesIsland = () => {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtros, setFiltros] = useState<FiltrosSamples>({ page: 1, perPage: 20 });
    const [paginacion, setPaginacion] = useState({ page: 1, pages: 1, total: 0 });
    const [tabActiva, setTabActiva] = useState('todos');

    const navegar = useNavigationStore(s => s.navegar);
    const setTabs = useTabsTopBarStore(s => s.setTabs);
    const menu = useMenuContextualSample();

    /* Registrar tab "Explorar" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'explorar', etiqueta: 'Explorar' }], 'explorar');
        return () => { setTabs([]); };
    }, [setTabs]);

    /* Like con optimistic UI y soporte de reacciones */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        const snapshot = samples;

        try {
            if (reaccion) {
                const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                /* [193A-32] Dislike oculta el sample del listado */
                if (!esPositivo) {
                    setSamples(prev => prev.filter(s => s.id !== sampleId));
                } else {
                    const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                    setSamples((prev) =>
                        prev.map((s) =>
                            s.id === sampleId
                                ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                                : s
                        )
                    );
                }
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
        } catch {
            setSamples(snapshot);
        }
    }, [samples]);

    /* Cargar samples */
    const cargarSamples = useCallback(async () => {
        setCargando(true);
        try {
            const respuesta = await listarSamples(filtros);
            if (respuesta.ok && respuesta.data) {
                const lista = respuesta.data as unknown as RespuestaListaSamples;
                setSamples(lista.data ?? []);
                setPaginacion({
                    page: lista.pagination?.page ?? 1,
                    pages: lista.pagination?.pages ?? 1,
                    total: lista.pagination?.total ?? 0,
                });
            } else {
                setSamples([]);
            }
        } catch {
            setSamples([]);
        } finally {
            setCargando(false);
        }
    }, [filtros]);

    useEffect(() => {
        cargarSamples();
    }, [cargarSamples]);

    /* Actualizar filtro de búsqueda */
    const manejarBusqueda = useCallback((valor: string) => {
        setFiltros((prev) => ({ ...prev, busqueda: valor || undefined, page: 1 }));
    }, []);

    /* Selectores de filtro */
    const manejarFiltroSelect = useCallback(
        (campo: keyof FiltrosSamples) => (e: ChangeEvent<HTMLSelectElement>) => {
            const valor = e.target.value;
            setFiltros((prev) => ({
                ...prev,
                [campo]: valor || undefined,
                page: 1,
            }));
        },
        []
    );

    /* Filtro BPM rango */
    const manejarBpmMin = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || undefined;
        setFiltros((prev) => ({ ...prev, bpmMin: val, page: 1 }));
    }, []);

    const manejarBpmMax = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || undefined;
        setFiltros((prev) => ({ ...prev, bpmMax: val, page: 1 }));
    }, []);

    /* Paginación */
    const irAPagina = useCallback((pagina: number) => {
        setFiltros((prev) => ({ ...prev, page: pagina }));
    }, []);

    /* Tabs */
    const manejarTab = useCallback((tabId: string) => {
        setTabActiva(tabId);
        /* TO-DO: cambiar endpoint según tab (trending, recientes, recomendados) */
        setFiltros((prev) => ({ ...prev, page: 1 }));
    }, []);

    return {
        samples,
        cargando,
        filtros,
        paginacion,
        tabActiva,
        navegar,
        menu,
        manejarLike,
        manejarBusqueda,
        manejarFiltroSelect,
        manejarBpmMin,
        manejarBpmMax,
        irAPagina,
        manejarTab,
    };
};
