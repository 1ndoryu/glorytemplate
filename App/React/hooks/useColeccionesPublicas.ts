/*
 * Hook: useColeccionesPublicas
 * Lógica extraída de ColeccionesIsland (SRP).
 * Carga colecciones públicas desde la API y gestiona búsqueda.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { listarColeccionesPublicas } from '@app/services/apiColecciones';
import type { Coleccion } from '@app/types';

export const useColeccionesPublicas = () => {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const cargar = useCallback(async (query?: string) => {
        setCargando(true);
        try {
            const resp = await listarColeccionesPublicas(query || undefined);
            if (resp.ok && resp.data) {
                setColecciones(resp.data.colecciones);
            }
        } catch {
            /* Error cargando colecciones */
        } finally {
            setCargando(false);
        }
    }, []);

    /* Carga inicial */
    useEffect(() => {
        cargar();
    }, [cargar]);

    /* Búsqueda con debounce */
    const manejarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => cargar(valor), 350);
    }, [cargar]);

    /* Cleanup debounce */
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return { colecciones, cargando, busqueda, manejarBusqueda };
};
