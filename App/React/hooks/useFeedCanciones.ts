/*
 * Hook: useFeedCanciones — C812
 * Feed paginado de canciones con 3 modos de ordenamiento (inteligente/top/hot).
 * Infinite scroll via IntersectionObserver. Cache por clave orden.
 * Patrón basado en useFeedSamples (SRP).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { feedCanciones } from '@app/services/apiCanciones';
import { useNavigationStore } from '@/core/router';
import type { OrdenFeedCanciones } from '@app/services/apiCanciones';
import type { Cancion } from '@app/types/cancion';

const POR_PAGINA = 20;

export function useFeedCanciones() {
    const [orden, setOrdenInterno] = useState<OrdenFeedCanciones>('inteligente');
    const [canciones, setCanciones] = useState<Cancion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [hayMas, setHayMas] = useState(true);

    const sentinelaRef = useRef<HTMLDivElement | null>(null);
    const cacheRef = useRef<Record<string, Cancion[]>>({});
    const requestIdRef = useRef(0);
    const navegar = useNavigationStore(s => s.navegar);

    const cargarPagina = useCallback(async (pagina: number, esNuevo: boolean) => {
        const thisRequest = ++requestIdRef.current;
        const cacheKey = `${orden}_p${pagina}`;

        if (esNuevo) {
            setCargando(true);
        } else {
            setCargandoMas(true);
        }

        let items: Cancion[] = [];

        if (cacheRef.current[cacheKey]) {
            items = cacheRef.current[cacheKey];
        } else {
            const resp = await feedCanciones(orden, pagina, POR_PAGINA);
            if (requestIdRef.current !== thisRequest) return;

            if (resp.ok && resp.data) {
                items = resp.data;
                cacheRef.current[cacheKey] = items;
            }
        }

        if (items.length < POR_PAGINA) setHayMas(false);

        if (esNuevo) {
            setCanciones(items);
            setCargando(false);
        } else {
            setCanciones(prev => {
                const idsExistentes = new Set(prev.map(c => c.id));
                const nuevos = items.filter(c => !idsExistentes.has(c.id));
                return [...prev, ...nuevos];
            });
            setCargandoMas(false);
        }
    }, [orden]);

    /* Carga inicial y al cambiar orden */
    useEffect(() => {
        setPaginaActual(1);
        setHayMas(true);
        cargarPagina(1, true);
    }, [cargarPagina]);

    /* Infinite scroll con IntersectionObserver */
    useEffect(() => {
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !cargandoMas && hayMas && !cargando) {
                    const nuevaPagina = paginaActual + 1;
                    setPaginaActual(nuevaPagina);
                    cargarPagina(nuevaPagina, false);
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [cargandoMas, hayMas, cargando, paginaActual, cargarPagina]);

    const cambiarOrden = useCallback((nuevoOrden: OrdenFeedCanciones) => {
        if (nuevoOrden === orden) return;
        cacheRef.current = {};
        setOrdenInterno(nuevoOrden);
    }, [orden]);

    const irACancion = useCallback(
        (slug: string) => navegar(`/cancion/${slug}`),
        [navegar]
    );

    return {
        orden,
        canciones,
        cargando,
        cargandoMas,
        hayMas,
        sentinelaRef,
        cambiarOrden,
        irACancion,
    };
}
