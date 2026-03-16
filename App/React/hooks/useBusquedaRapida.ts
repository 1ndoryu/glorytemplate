/*
 * Hook: useBusquedaRapida
 * Lógica de búsqueda rápida con debounce y AbortController.
 * Gestiona el fetch al endpoint /busqueda/rapida con cancelación de requests.
 * Mínimo 2 caracteres para disparar la búsqueda.
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
        /* Limpiar timer previo */
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        /* Si el query es corto, ocultar y resetear */
        if (query.trim().length < MIN_CHARS) {
            setResultados(RESULTADOS_VACIOS);
            setVisible(false);
            setCargando(false);

            /* Cancelar request en vuelo */
            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
            return;
        }

        setCargando(true);

        timerRef.current = setTimeout(async () => {
            /* Cancelar request previo */
            if (abortRef.current) {
                abortRef.current.abort();
            }

            const controller = new AbortController();
            abortRef.current = controller;

            const resp = await busquedaRapida(query.trim(), controller.signal);

            /* Ignorar si fue cancelado */
            if (controller.signal.aborted) return;

            if (resp.ok && resp.data) {
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
