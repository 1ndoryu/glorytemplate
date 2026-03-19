/*
 * Hook: useBlog — Kamples (183A-109)
 * Lógica del listado de artículos del blog.
 * Carga artículos, filtra por categoría, paginación infinita.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { listarArticulos, toggleLikeArticulo } from '@app/services/apiArticulos';
import type { ArticuloResumen, CategoriaArticulo } from '@app/types';

const LIMITE = 20;

export const useBlog = () => {
    const [articulos, setArticulos] = useState<ArticuloResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [hayMas, setHayMas] = useState(false);
    const [categoria, setCategoria] = useState<CategoriaArticulo | undefined>(undefined);
    const paginaRef = useRef(1);
    const abortRef = useRef<AbortController>();

    const cargar = useCallback(async (cat?: CategoriaArticulo, pagina = 1, acumular = false) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (!acumular) setCargando(true);

        try {
            const res = await listarArticulos({ categoria: cat, pagina, limite: LIMITE });
            if (res.ok && res.data) {
                setArticulos(prev => acumular ? [...prev, ...res.data!.articulos] : res.data!.articulos);
                setHayMas(res.data.hayMas);
                paginaRef.current = pagina;
            }
        } catch {
            /* Error silencioso — no bloquear UI */
        } finally {
            setCargando(false);
        }
    }, []);

    /* Carga inicial */
    useEffect(() => {
        cargar(categoria);
    }, [cargar, categoria]);

    /* Cleanup */
    useEffect(() => {
        return () => { abortRef.current?.abort(); };
    }, []);

    const cambiarCategoria = useCallback((cat: CategoriaArticulo | undefined) => {
        setCategoria(cat);
        paginaRef.current = 1;
    }, []);

    const cargarMas = useCallback(() => {
        if (!hayMas || cargando) return;
        cargar(categoria, paginaRef.current + 1, true);
    }, [cargar, categoria, hayMas, cargando]);

    const darLike = useCallback(async (id: number) => {
        /* Optimistic update */
        setArticulos(prev => prev.map(a => {
            if (a.id !== id) return a;
            const nuevoLiked = !a.liked;
            return { ...a, liked: nuevoLiked, totalLikes: a.totalLikes + (nuevoLiked ? 1 : -1) };
        }));

        const res = await toggleLikeArticulo(id);
        if (!res.ok) {
            /* Rollback */
            setArticulos(prev => prev.map(a => {
                if (a.id !== id) return a;
                const revertLiked = !a.liked;
                return { ...a, liked: revertLiked, totalLikes: a.totalLikes + (revertLiked ? 1 : -1) };
            }));
        }
    }, []);

    return {
        articulos,
        cargando,
        hayMas,
        categoria,
        cambiarCategoria,
        cargarMas,
        darLike,
    };
};
