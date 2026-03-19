/*
 * Hook: useBusquedaRapida
 * Lógica de búsqueda rápida con debounce y AbortController.
 * Gestiona el fetch al endpoint /busqueda/rapida con cancelación de requests.
 * Mínimo 2 caracteres para disparar la búsqueda.
 *
 * [183A-93] Optimizado: memoización client-side por sesión + setCargando
 * movido dentro del debounce para evitar spinner prematuro.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { busquedaRapida, type ResultadosBusquedaRapida } from '@app/services/apiBusqueda';

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

const RESULTADOS_VACIOS: ResultadosBusquedaRapida = {
    canciones: [],
    samples: [],
    sampleos: [],
    usuarios: [],
    colecciones: [],
    todos: [],
};

/* [183A-93] Cache client-side por sesión — evita re-fetches para queries repetidos */
const cacheLocal = new Map<string, ResultadosBusquedaRapida>();

interface UseBusquedaRapidaRetorno {
    resultados: ResultadosBusquedaRapida;
    cargando: boolean;
    visible: boolean;
    cerrar: () => void;
}

export const useBusquedaRapida = (query: string): UseBusquedaRapidaRetorno => {
    const [resultados, setResultados] = useState<ResultadosBusquedaRapida>(RESULTADOS_VACIOS);
    const [cargando, setCargando] = useState(false);
    const [visible, setVisible] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        const trimmed = query.trim();

        if (trimmed.length < MIN_CHARS) {
            setResultados(RESULTADOS_VACIOS);
            setVisible(false);
            setCargando(false);

            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
            return;
        }

        /* [183A-93] Si ya tenemos resultado cacheado, mostrarlo inmediatamente */
        const cacheKey = trimmed.toLowerCase();
        const cached = cacheLocal.get(cacheKey);
        if (cached) {
            setResultados(cached);
            setVisible(cached.todos.length > 0);
            setCargando(false);
            return;
        }

        timerRef.current = setTimeout(async () => {
            /* [183A-93] setCargando dentro del debounce — evita spinner prematuro */
            setCargando(true);

            if (abortRef.current) {
                abortRef.current.abort();
            }

            const controller = new AbortController();
            abortRef.current = controller;

            const resp = await busquedaRapida(trimmed, controller.signal);

            if (controller.signal.aborted) return;

            if (resp.ok && resp.data) {
                cacheLocal.set(cacheKey, resp.data);
                setResultados(resp.data);
                setVisible(resp.data.todos.length > 0);
            } else {
                setResultados(RESULTADOS_VACIOS);
                setVisible(false);
            }

            setCargando(false);
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
        };
    }, [query]);

    const cerrar = useCallback(() => {
        setVisible(false);
    }, []);

    return { resultados, cargando, visible, cerrar };
};
