/*
 * Hook: useBlog — Kamples (183A-109 + 183A-110-B + 183A-110-E)
 * Lógica del listado de artículos del blog.
 * Carga artículos, filtra por categoría, paginación infinita.
 * [183A-110-B] En modo dev, inyecta contenido de prueba si el API devuelve vacío.
 * [183A-110-E] Modo "Mis artículos" con filtro por estado de moderación.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { listarArticulos, listarMisArticulos, toggleLikeArticulo } from '@app/services/apiArticulos';
import type { ArticuloResumen, CategoriaArticulo } from '@app/types';

const LIMITE = 20;
const CLAVE_BORRADOR = 'kamples_borrador_articulo';

type EstadoFiltroMisArticulos = 'aprobado' | 'pendiente' | 'rechazado' | undefined;

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
    /* [183A-110-E] Modo mis-artículos con filtro de estado */
    const [misArticulosActivo, setMisArticulosActivo] = useState(false);
    const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltroMisArticulos>(undefined);
    const paginaRef = useRef(1);
    const abortRef = useRef<AbortController>();

    /* [183A-110-E] Borrador guardado localmente (localStorage) */
    const borradorLocal = useMemo(() => {
        try {
            const raw = localStorage.getItem(CLAVE_BORRADOR);
            if (!raw) return null;
            const datos = JSON.parse(raw) as { titulo?: string; categoria?: CategoriaArticulo };
            return datos.titulo ? datos : null;
        } catch {
            return null;
        }
    }, []);

    const cargar = useCallback(async (cat?: CategoriaArticulo, pagina = 1, acumular = false, misArticulos = false, estadoFlt?: EstadoFiltroMisArticulos) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (!acumular) setCargando(true);

        try {
            if (misArticulos) {
                /* [183A-110-E] Modo Mis artículos — endpoint autenticado */
                const res = await listarMisArticulos({ moderacionEstado: estadoFlt, pagina, limite: LIMITE });
                if (res.ok && res.data) {
                    setArticulos(prev => acumular ? [...prev, ...res.data!.articulos] : res.data!.articulos);
                    setHayMas(res.data.hayMas);
                    paginaRef.current = pagina;
                }
            } else {
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
            }
        } catch {
            /* Error silencioso — no bloquear UI */
        } finally {
            setCargando(false);
        }
    }, []);

    /* Carga inicial */
    useEffect(() => {
        cargar(categoria, 1, false, misArticulosActivo, estadoFiltro);
    }, [cargar, categoria, misArticulosActivo, estadoFiltro]);

    /* Cleanup */
    useEffect(() => {
        return () => { abortRef.current?.abort(); };
    }, []);

    const cambiarCategoria = useCallback((cat: CategoriaArticulo | undefined) => {
        setCategoria(cat);
        setMisArticulosActivo(false);
        setEstadoFiltro(undefined);
        paginaRef.current = 1;
    }, []);

    /* [183A-110-E] Activar modo mis artículos con estado opcional */
    const activarMisArticulos = useCallback(() => {
        setMisArticulosActivo(true);
        setCategoria(undefined);
        setEstadoFiltro('aprobado');
        paginaRef.current = 1;
    }, []);

    const cambiarEstadoFiltro = useCallback((estado: EstadoFiltroMisArticulos) => {
        setEstadoFiltro(estado);
        paginaRef.current = 1;
    }, []);

    const cargarMas = useCallback(() => {
        if (!hayMas || cargando) return;
        cargar(categoria, paginaRef.current + 1, true, misArticulosActivo, estadoFiltro);
    }, [cargar, categoria, hayMas, cargando, misArticulosActivo, estadoFiltro]);

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
        /* [193A-45] Quitar artículo eliminado de la lista local */
        quitarArticulo: useCallback((id: number) => {
            setArticulos(prev => prev.filter(a => a.id !== id));
        }, []),
        /* [183A-110-E] Mis artículos */
        misArticulosActivo,
        estadoFiltro,
        activarMisArticulos,
        cambiarEstadoFiltro,
        borradorLocal,
    };
};
