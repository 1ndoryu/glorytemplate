/*
 * Hook: useArticuloDetalle — Kamples (183A-109 + 193A-9-B)
 * Carga un artículo individual por slug y gestiona like.
 * [193A-9-B] Cache en memoria por slug — re-visitas muestran datos instantáneamente
 * sin skeleton, y refetch silencioso actualiza en background.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { obtenerArticulo, toggleLikeArticulo } from '@app/services/apiArticulos';
import type { Articulo } from '@app/types';

/* [193A-9-B] Cache en memoria: slug → { data, timestamp }.
 * TTL de 5 minutos — después refetch silencioso. */
const cacheArticulos = new Map<string, { data: Articulo; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const useArticuloDetalle = (slug: string) => {
    const [articulo, setArticulo] = useState<Articulo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController>();

    useEffect(() => {
        if (!slug) return;
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        /* [193A-9-B] Si hay cache fresco, mostrar inmediatamente sin skeleton */
        const cached = cacheArticulos.get(slug);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            setArticulo(cached.data);
            setCargando(false);
            return;
        }

        const cargar = async () => {
            /* Si hay cache expirado, mostrar mientras refetch (sin skeleton) */
            if (cached) {
                setArticulo(cached.data);
                setCargando(false);
            } else {
                setCargando(true);
            }
            setError(null);
            try {
                const res = await obtenerArticulo(slug);
                if (res.ok && res.data) {
                    setArticulo(res.data);
                    cacheArticulos.set(slug, { data: res.data, ts: Date.now() });
                } else {
                    if (!cached) setError(res.error ?? 'Artículo no encontrado');
                }
            } catch {
                if (!cached) setError('Error cargando el artículo');
            } finally {
                setCargando(false);
            }
        };

        cargar();
        return () => { abortRef.current?.abort(); };
    }, [slug]);

    const darLike = useCallback(async () => {
        if (!articulo) return;
        const prevLiked = articulo.liked;
        const prevTotal = articulo.totalLikes;

        /* Optimistic update */
        setArticulo(prev => prev ? {
            ...prev,
            liked: !prev.liked,
            totalLikes: prev.totalLikes + (prev.liked ? -1 : 1),
        } : prev);

        const res = await toggleLikeArticulo(articulo.id);
        if (!res.ok) {
            /* Rollback */
            setArticulo(prev => prev ? { ...prev, liked: prevLiked, totalLikes: prevTotal } : prev);
        }
    }, [articulo]);

    return { articulo, cargando, error, darLike };
};
