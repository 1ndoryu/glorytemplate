/*
 * Hook: useArticuloDetalle — Kamples (183A-109)
 * Carga un artículo individual por slug y gestiona like.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { obtenerArticulo, toggleLikeArticulo } from '@app/services/apiArticulos';
import type { Articulo } from '@app/types';

export const useArticuloDetalle = (slug: string) => {
    const [articulo, setArticulo] = useState<Articulo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController>();

    useEffect(() => {
        if (!slug) return;
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const cargar = async () => {
            setCargando(true);
            setError(null);
            try {
                const res = await obtenerArticulo(slug);
                if (res.ok && res.data) {
                    setArticulo(res.data);
                } else {
                    setError(res.error ?? 'Artículo no encontrado');
                }
            } catch {
                setError('Error cargando el artículo');
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
