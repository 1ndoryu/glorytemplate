/*
 * Hook: useBlog — Kamples (183A-109 + 183A-110-B)
 * Lógica del listado de artículos del blog.
 * Carga artículos, filtra por categoría, paginación infinita.
 * [183A-110-B] En modo dev, inyecta contenido de prueba si el API devuelve vacío.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { listarArticulos, toggleLikeArticulo } from '@app/services/apiArticulos';
import type { ArticuloResumen, CategoriaArticulo } from '@app/types';

const LIMITE = 20;

/* [183A-110-B] Contenido de prueba para desarrollo.
 * Solo se usa cuando GLORY_CONTEXT.devMode === true y no hay artículos reales. */
function generarArticulosDev(): ArticuloResumen[] {
    const categorias: CategoriaArticulo[] = [
        'inspiracion', 'mezcla', 'fl-studio', 'sonidos-gratis',
        'entrevistas', 'mastering', 'sampling', 'noticias',
    ];
    return categorias.map((cat, i) => ({
        id: -(i + 1),
        titulo: `[Dev] Artículo de prueba — ${cat}`,
        slug: `dev-articulo-${cat}`,
        extracto: `Este es un artículo de prueba para la categoría ${cat}. Solo visible en modo desarrollo.`,
        portadaUrl: null,
        categoria: cat,
        totalLikes: Math.floor(Math.random() * 50),
        totalComentarios: Math.floor(Math.random() * 10),
        publicadoEn: new Date().toISOString(),
        autor: { id: 1, username: 'dev', nombreVisible: 'Dev User', avatarUrl: null, verificado: false },
        liked: false,
    }));
}

function esDevMode(): boolean {
    const ctx = (window as unknown as Record<string, { devMode?: boolean } | undefined>).GLORY_CONTEXT;
    return ctx?.devMode === true;
}

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
                let articulosRecibidos = res.data.articulos;

                /* [183A-110-B] En dev mode, si no hay artículos reales, inyectar mock */
                if (articulosRecibidos.length === 0 && pagina === 1 && esDevMode()) {
                    articulosRecibidos = generarArticulosDev();
                    if (cat) {
                        articulosRecibidos = articulosRecibidos.filter(a => a.categoria === cat);
                    }
                }

                setArticulos(prev => acumular ? [...prev, ...articulosRecibidos] : articulosRecibidos);
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
