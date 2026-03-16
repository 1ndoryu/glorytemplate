/*
 * Hook: useTabCancionesAdmin — QL21
 * Lógica para la tabla admin de canciones.
 * Usa /canciones (paginado) y /canciones/buscar para búsqueda.
 * Separación vista-lógica obligatoria por protocolo (SRP).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { listarCancionesPaginado, buscarCanciones } from '@app/services/apiCanciones';
import type { Cancion } from '@app/types/cancion';

interface EstadoTabCanciones {
    canciones: Cancion[];
    total: number;
    pagina: number;
    porPagina: number;
    busqueda: string;
    cargando: boolean;
    setBusqueda: (valor: string) => void;
    setPagina: (p: number) => void;
    recargar: () => void;
}

export function useTabCancionesAdmin(): EstadoTabCanciones {
    const [canciones, setCanciones] = useState<Cancion[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [busqueda, setBusquedaRaw] = useState('');
    const [cargando, setCargando] = useState(false);
    const porPagina = 50;
    const abortRef = useRef<AbortController | null>(null);

    const cargar = useCallback(async (pag: number, query: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setCargando(true);
        try {
            if (query.trim().length >= 2) {
                const resp = await buscarCanciones(query.trim(), porPagina);
                if (controller.signal.aborted) return;
                if (resp.ok && resp.data) {
                    setCanciones(resp.data);
                    /* buscar no retorna total, usar longitud del resultado */
                    setTotal(resp.data.length);
                }
            } else {
                const resp = await listarCancionesPaginado(pag, porPagina);
                if (controller.signal.aborted) return;
                if (resp.ok && resp.data) {
                    setCanciones(resp.data);
                    if (typeof resp.total === 'number') {
                        setTotal(resp.total);
                    }
                }
            }
        } catch {
            if (!controller.signal.aborted) {
                setCanciones([]);
            }
        } finally {
            if (!controller.signal.aborted) {
                setCargando(false);
            }
        }
    }, [porPagina]);

    useEffect(() => {
        void cargar(pagina, busqueda);
    }, [pagina, busqueda, cargar]);

    /* Cleanup al desmontar */
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const setBusqueda = useCallback((valor: string) => {
        setBusquedaRaw(valor);
        setPagina(1);
    }, []);

    const recargar = useCallback(() => {
        void cargar(pagina, busqueda);
    }, [cargar, pagina, busqueda]);

    return {
        canciones,
        total,
        pagina,
        porPagina,
        busqueda,
        cargando,
        setBusqueda,
        setPagina,
        recargar,
    };
}
