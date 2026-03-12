/*
 * useUrlFiltros — Kamples
 * Sincronización bidireccional entre filtrosStore y query params de la URL.
 * - Al montar: lee params de la URL y los aplica al store.
 * - Al cambiar el store: actualiza la URL con history.replaceState.
 * Solo se incluyen params con valores no-default para mantener URLs limpias.
 */

import { useEffect, useRef } from 'react';
import {
    useFiltrosStore,
    type TipoOrdenamiento,
    type PeriodoDestacados,
    type FiltroPrecio,
} from '@app/stores/filtrosStore';

const PARAM_ORDEN = 'orden';
const PARAM_PERIODO = 'periodo';
const PARAM_BUSCAR = 'buscar';
const PARAM_BPM_MIN = 'bpm_min';
const PARAM_BPM_MAX = 'bpm_max';
const PARAM_PRECIO = 'precio';
const PARAM_REPRODUCIDOS = 'reproducidos';
const PARAM_LIKEADOS = 'likeados';
const PARAM_SEGUIDOS = 'seguidos';
const PARAM_DESCARGADOS = 'descargados';

const ORDENAMIENTOS_VALIDOS: readonly TipoOrdenamiento[] = ['inteligente', 'recientes', 'destacados'];
const PERIODOS_VALIDOS: readonly PeriodoDestacados[] = ['semana', 'mes', 'anio'];
const PRECIOS_VALIDOS: readonly FiltroPrecio[] = ['todos', 'gratis', 'premium'];

function esOrdenamiento(valor: string): valor is TipoOrdenamiento {
    return (ORDENAMIENTOS_VALIDOS as readonly string[]).includes(valor);
}

function esPeriodo(valor: string): valor is PeriodoDestacados {
    return (PERIODOS_VALIDOS as readonly string[]).includes(valor);
}

function esPrecio(valor: string): valor is FiltroPrecio {
    return (PRECIOS_VALIDOS as readonly string[]).includes(valor);
}

function construirQueryString(state: ReturnType<typeof useFiltrosStore.getState>): string {
    const params = new URLSearchParams();

    if (state.ordenamiento !== 'inteligente') {
        params.set(PARAM_ORDEN, state.ordenamiento);
    }
    if (state.ordenamiento === 'destacados' && state.periodoDestacados !== 'semana') {
        params.set(PARAM_PERIODO, state.periodoDestacados);
    }
    if (state.busqueda) {
        params.set(PARAM_BUSCAR, state.busqueda);
    }
    if (state.bpmMin !== null) {
        params.set(PARAM_BPM_MIN, String(state.bpmMin));
    }
    if (state.bpmMax !== null) {
        params.set(PARAM_BPM_MAX, String(state.bpmMax));
    }
    if (state.filtroPrecio !== 'todos') {
        params.set(PARAM_PRECIO, state.filtroPrecio);
    }
    if (state.yaReproducidos) params.set(PARAM_REPRODUCIDOS, '1');
    if (state.likeados) params.set(PARAM_LIKEADOS, '1');
    if (state.deSeguidos) params.set(PARAM_SEGUIDOS, '1');
    if (state.descargados) params.set(PARAM_DESCARGADOS, '1');

    return params.toString();
}

/**
 * Sincroniza filtrosStore ↔ URL query params.
 * Usar en el componente raíz del feed (FeedUnificado).
 */
export function useUrlFiltros(): void {
    const inicializadoRef = useRef(false);
    const ultimaUrlRef = useRef('');

    /* 1. Restaurar estado desde URL al montar */
    useEffect(() => {
        if (inicializadoRef.current) return;
        inicializadoRef.current = true;

        const params = new URLSearchParams(window.location.search);
        if (params.size === 0) return;

        const store = useFiltrosStore.getState();

        const orden = params.get(PARAM_ORDEN);
        if (orden && esOrdenamiento(orden)) {
            store.setOrdenamiento(orden);
        }

        const periodo = params.get(PARAM_PERIODO);
        if (periodo && esPeriodo(periodo)) {
            store.setPeriodoDestacados(periodo);
        }

        const buscar = params.get(PARAM_BUSCAR);
        if (buscar) {
            store.setBusqueda(buscar);
        }

        const bpmMin = params.get(PARAM_BPM_MIN);
        const bpmMax = params.get(PARAM_BPM_MAX);
        if (bpmMin || bpmMax) {
            store.setBpmRango(
                bpmMin ? parseInt(bpmMin, 10) || null : null,
                bpmMax ? parseInt(bpmMax, 10) || null : null,
            );
        }

        const precio = params.get(PARAM_PRECIO);
        if (precio && esPrecio(precio)) {
            store.setFiltroPrecio(precio);
        }

        if (params.get(PARAM_REPRODUCIDOS) === '1') store.toggleYaReproducidos();
        if (params.get(PARAM_LIKEADOS) === '1') store.toggleLikeados();
        if (params.get(PARAM_SEGUIDOS) === '1') store.toggleDeSeguidos();
        if (params.get(PARAM_DESCARGADOS) === '1') store.toggleDescargados();
    }, []);

    /* 2. Sincronizar cambios del store → URL (solo si estamos en la ruta del feed) */
    useEffect(() => {
        const unsub = useFiltrosStore.subscribe((state) => {
            const qs = construirQueryString(state);
            const nuevaUrl = qs
                ? `${window.location.pathname}?${qs}`
                : window.location.pathname;

            if (nuevaUrl !== ultimaUrlRef.current) {
                ultimaUrlRef.current = nuevaUrl;
                window.history.replaceState(null, '', nuevaUrl);
            }
        });

        return unsub;
    }, []);
}
