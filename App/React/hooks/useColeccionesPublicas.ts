/*
 * Hook: useColeccionesPublicas
 * Lógica extraída de ColeccionesIsland (SRP).
 * Carga colecciones públicas desde la API y gestiona búsqueda.
 * [193A-37] Sincroniza con filtrosStore.busqueda para que el buscador
 * del NavPublico filtre colecciones en la vista pública.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { listarColeccionesPublicas } from '@app/services/apiColecciones';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import type { Coleccion } from '@app/types';

export const useColeccionesPublicas = () => {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const busquedaGlobal = useFiltrosStore(s => s.busqueda);
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

    /* [193A-37] Recargar cuando cambia la búsqueda global (NavPublico buscador) */
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => cargar(busquedaGlobal || undefined), 350);
    }, [busquedaGlobal, cargar]);

    /* Cleanup debounce */
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return { colecciones, cargando };
};
