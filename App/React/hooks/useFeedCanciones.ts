/*
 * Hook: useFeedCanciones — C812
 * Feed paginado de canciones con ordenamiento externo (TopBar tabs).
 * Soporta dos modos:
 *   - Modo feed: paginado/infinite scroll según ordenExterno.
 *   - Modo búsqueda: llama a buscarCanciones cuando `busqueda` es no vacío.
 * Like optimista con rollback en error.
 */

import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { feedCanciones, buscarCanciones } from '@app/services/apiCanciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useNavigationStore } from '@/core/router';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import type { OrdenFeedCanciones } from '@app/services/apiCanciones';
import type { Cancion } from '@app/types/cancion';
import { usePaginacionProgresiva } from '@app/hooks/usePaginacionProgresiva';

const POR_PAGINA = 20;

export function useFeedCanciones(ordenExterno: OrdenFeedCanciones, busqueda = '') {
    const [canciones, setCanciones] = useState<Cancion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [hayMas, setHayMas] = useState(true);
    /* Total real retornado por el servidor en la primera página del feed */
    const [totalReal, setTotalReal] = useState<number | null>(null);

    const sentinelaRef = useRef<HTMLDivElement | null>(null);
    const cacheRef = useRef<Record<string, Cancion[]>>({});
    const requestIdRef = useRef(0);
    const navegar = useNavigationStore(s => s.navegar);
    const throttle = usePaginacionProgresiva();

    /* Modo búsqueda: resultados server-side cuando hay query activo */
    useEffect(() => {
        if (!busqueda.trim()) return;

        const thisRequest = ++requestIdRef.current;
        setCargando(true);
        setCanciones([]);
        setTotalReal(null);

        buscarCanciones(busqueda).then(resp => {
            if (requestIdRef.current !== thisRequest) return;
            const items = resp.ok && resp.data ? resp.data : [];
            setCanciones(items);
            /* En búsqueda se retornan todos los resultados de una vez */
            setTotalReal(items.length);
            setCargando(false);
        });
    }, [busqueda]);

    /* Modo feed: carga paginada por orden */
    const cargarPagina = useCallback(async (pagina: number, esNuevo: boolean) => {
        const thisRequest = ++requestIdRef.current;
        const cacheKey = `${ordenExterno}_p${pagina}`;

        if (esNuevo) {
            setCargando(true);
        } else {
            setCargandoMas(true);
        }

        let items: Cancion[] = [];

        if (cacheRef.current[cacheKey]) {
            items = cacheRef.current[cacheKey];
        } else {
            const resp = await feedCanciones(ordenExterno, pagina, POR_PAGINA);
            if (requestIdRef.current !== thisRequest) return;

            if (resp.ok && resp.data) {
                items = resp.data;
                cacheRef.current[cacheKey] = items;
                /* Capturar total real solo en la primera página */
                if (esNuevo && typeof resp.total === 'number') {
                    setTotalReal(resp.total);
                }
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
    }, [ordenExterno]);

    /* Carga inicial de feed y al cambiar orden — omitido en modo busqueda */
    useEffect(() => {
        if (busqueda.trim()) return;
        cacheRef.current = {};
        setPaginaActual(1);
        setHayMas(true);
        setTotalReal(null);
        throttle.resetear();
        cargarPagina(1, true);
    }, [cargarPagina, busqueda, throttle.resetear]);

    /* Carga manual removida en QL79 — throttle pausa 2s automaticamente */

    /* Infinite scroll con throttle progresivo — omitido en modo busqueda */
    useEffect(() => {
        if (busqueda.trim()) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !cargandoMas && hayMas && !cargando) {
                    const nuevaPagina = paginaActual + 1;
                    throttle.programarCarga(nuevaPagina, () => {
                        setPaginaActual(nuevaPagina);
                        cargarPagina(nuevaPagina, false);
                    });
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [cargandoMas, hayMas, cargando, paginaActual, cargarPagina, busqueda, throttle.programarCarga]);

    /* Like optimista con rollback */
    const manejarLike = useCallback(async (cancionId: number) => {
        const idx = canciones.findIndex(c => c.id === cancionId);
        if (idx === -1) return;

        const anterior = canciones[idx];
        const nuevoLiked = !anterior.liked;

        /* Optimista: actualizar UI inmediatamente */
        setCanciones(prev => prev.map(c =>
            c.id === cancionId ? { ...c, liked: nuevoLiked } : c
        ));

        const resp = nuevoLiked
            ? await darLike('cancion', cancionId)
            : await quitarLike('cancion', cancionId);

        if (!resp.ok) {
            /* Rollback */
            setCanciones(prev => prev.map(c =>
                c.id === cancionId ? { ...c, liked: anterior.liked } : c
            ));
            toast.error(getT()('error.like'));
        }
    }, [canciones]);

    /* Menu contextual: placeholder — el island usa useMenuContextualCancion (QQ50) */
    const manejarMenu = useCallback((_e: MouseEvent, _cancion: Cancion) => {
        /* Depreciado: ExplorarCancionesIsland usa useMenuContextualCancion directamente */
    }, []);

    const irACancion = useCallback(
        (slug: string) => navegar(`/cancion/${slug}`),
        [navegar]
    );

    return {
        canciones,
        cargando,
        cargandoMas,
        hayMas,
        totalReal,
        sentinelaRef,
        manejarLike,
        manejarMenu,
        irACancion,
    };
}
