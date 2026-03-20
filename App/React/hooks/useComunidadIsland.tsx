/*
 * Hook: useComunidadIsland — Kamples
 * Lógica del feed de comunidad: carga, filtro, likes, reposts, menú contextual, scroll infinito.
 * Extraído de ComunidadIsland (SRP).
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useMenuContextualPublicacion } from '@app/hooks/useMenuContextualPublicacion';
import { apiGet } from '@app/services/apiCliente';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { darLike, quitarLike, repostear, quitarRepost, obtenerPublicacion } from '@app/services/apiSocial';
import { EVENTO_ENTIDAD_ACTUALIZADA } from '@app/components/social/ModalEditar';
import type { TipoReaccion, Publicacion } from '@app/types';
import { usePaginacionProgresiva } from '@app/hooks/usePaginacionProgresiva';

export type FiltroComunidad = 'todos' | 'siguiendo' | 'populares';

/* Debe coincidir con el limit del backend (PublicacionesController::listar) */
const PAGE_SIZE = 20;

export function useComunidadIsland() {
    const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
    const [filtro, setFiltro] = useState<FiltroComunidad>('todos');
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hayMas, setHayMas] = useState(true);
    const [comentariosAbiertos, setComentariosAbiertos] = useState<Set<number>>(new Set());

    /* paginaRef evita stale closure en el observer sin recrearlo con cada página */
    const paginaRef = useRef(1);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const navegar = useNavigationStore(s => s.navegar);
    const usuario = useAuthStore(s => s.usuario);

    /* Menú contextual de samples adjuntos */
    const menuSample = useMenuContextualSample();

    /* Menú contextual de publicaciones (C322 — hook reutilizable) */
    const menuPublicacion = useMenuContextualPublicacion({ setPublicaciones });

    /* Throttle progresivo */
    const throttle = usePaginacionProgresiva();

    /* Escuchar edicion desde ModalEditar y actualizar el post en tiempo real sin recargar */
    useEffect(() => {
        const manejarActualizacion = async (e: Event) => {
            const { tipo, id } = (e as CustomEvent<{ tipo: string; id: number }>).detail;
            if (tipo !== 'publicacion' || !id) return;
            try {
                const resp = await obtenerPublicacion(id);
                if (!resp.data) return;
                /* Merge en vez de reemplazar: preserva campos que el endpoint individual
                 * puede no devolver (moderacionEstado, contadores optimistas, etc.) */
                setPublicaciones(prev => prev.map(p => p.id === id ? { ...p, ...resp.data! } : p));
            } catch { /* sin-op: fallo silencioso no critico en refresh de post */ }
        };
        window.addEventListener(EVENTO_ENTIDAD_ACTUALIZADA, manejarActualizacion);
        return () => window.removeEventListener(EVENTO_ENTIDAD_ACTUALIZADA, manejarActualizacion);
    }, []);

    /* Cargar página 1 al cambiar filtro — resetea todo el estado de paginación */
    useEffect(() => {
        let activo = true;
        setCargando(true);
        setHayMas(true);
        paginaRef.current = 1;
        throttle.resetear();

        const cargar = async () => {
            try {
                const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro, page: 1 });
                if (!activo) return;
                const lista = resp.data?.data ?? resp.data ?? [];
                const arr = Array.isArray(lista) ? lista : [];
                setPublicaciones(arr);
                setHayMas(arr.length >= PAGE_SIZE);
            } catch {
                if (activo) setPublicaciones([]);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [filtro, throttle.resetear]);

    /* cargarMas — appends la siguiente página al feed */
    const cargarMas = useCallback(async () => {
        if (cargandoMas || !hayMas) return;
        const nuevaPagina = paginaRef.current + 1;
        setCargandoMas(true);
        try {
            const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro, page: nuevaPagina });
            const lista = resp.data?.data ?? resp.data ?? [];
            const arr = Array.isArray(lista) ? lista : [];
            setPublicaciones(prev => [...prev, ...arr]);
            paginaRef.current = nuevaPagina;
            setHayMas(arr.length >= PAGE_SIZE);
        } catch { /* sin-op */ } finally {
            setCargandoMas(false);
        }
    }, [cargandoMas, hayMas, filtro]);

    /* IntersectionObserver: dispara cargarMas con throttle progresivo */
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hayMas) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const siguientePagina = paginaRef.current + 1;
                    throttle.programarCarga(siguientePagina, () => cargarMas());
                }
            },
            { rootMargin: '300px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [cargarMas, hayMas, throttle.programarCarga]);

    /* Carga manual removida en QL79 — throttle pausa 2s automaticamente */

    /* Callback para recargar feed tras publicar — resetea paginación */
    const recargarFeed = useCallback(async () => {
        paginaRef.current = 1;
        setHayMas(true);
        try {
            const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro, page: 1 });
            const lista = resp.data?.data ?? resp.data ?? [];
            const arr = Array.isArray(lista) ? lista : [];
            setPublicaciones(arr);
            setHayMas(arr.length >= PAGE_SIZE);
        } catch { /* sin-op */ }
    }, [filtro]);

    const manejarLikePost = useCallback(async (postId: number, reaccion?: TipoReaccion) => {
        const post = publicaciones.find((p) => p.id === postId);
        const snapshot = publicaciones;

        try {
            if (reaccion) {
                const eraPositivo = post?.reaccion === 'like' || post?.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setPublicaciones(prev => prev.map(p =>
                    p.id === postId ? { ...p, liked: esPositivo, reaccion, totalLikes: Math.max(0, p.totalLikes + delta) } : p
                ));
                await darLike('publicacion', postId, reaccion);
            } else if (post?.liked || post?.reaccion) {
                const eraPositivo = post?.reaccion === 'like' || post?.reaccion === 'encanta';
                setPublicaciones(prev => prev.map(p =>
                    p.id === postId ? { ...p, liked: false, reaccion: null, totalLikes: Math.max(0, p.totalLikes - (eraPositivo ? 1 : 0)) } : p
                ));
                await quitarLike('publicacion', postId);
            } else {
                setPublicaciones(prev => prev.map(p =>
                    p.id === postId ? { ...p, liked: true, reaccion: 'like' as const, totalLikes: p.totalLikes + 1 } : p
                ));
                await darLike('publicacion', postId, 'like');
            }
        } catch {
            setPublicaciones(snapshot);
        }
    }, [publicaciones]);

    /* Like al sample embebido dentro de una publicacion (entidad independiente) */
    const manejarLikeSample = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        /* Actualizar optimisticamente el sample dentro de cada publicacion que lo contenga */
        const actualizarSample = (prev: Publicacion[]) => prev.map(pub => ({
            ...pub,
            samplesAdjuntos: pub.samplesAdjuntos.map(s => {
                if (s.id !== sampleId) return s;
                if (reaccion) {
                    const eraPositivo = s.reaccion === 'like' || s.reaccion === 'encanta';
                    const esPositivo = reaccion !== 'dislike';
                    const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                    return { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) };
                } else if (s.liked || s.reaccion) {
                    const eraPositivo = s.reaccion === 'like' || s.reaccion === 'encanta';
                    return { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) };
                } else {
                    return { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 };
                }
            }),
        }));

        const snapshot = publicaciones;
        setPublicaciones(actualizarSample);
        try {
            /* Determinar si el sample estaba liked antes de la actualización optimista */
            const sampleRef = publicaciones.flatMap(p => p.samplesAdjuntos).find(s => s.id === sampleId);
            if (reaccion) {
                await darLike('sample', sampleId, reaccion);
            } else if (sampleRef?.liked || sampleRef?.reaccion) {
                await quitarLike('sample', sampleId);
            } else {
                await darLike('sample', sampleId, 'like');
            }
        } catch {
            setPublicaciones(snapshot);
        }
    }, [publicaciones]);

    const manejarRepost = useCallback(async (postId: number) => {
        const post = publicaciones.find(p => p.id === postId);
        if (!post) return;
        const snapshot = publicaciones;
        /* Optimismo: alternar estado antes de la llamada */
        const estabaReposteado = post.reposteado;
        setPublicaciones(prev => prev.map(p =>
            p.id === postId
                ? { ...p, reposteado: !estabaReposteado, totalReposts: estabaReposteado ? Math.max(0, (p.totalReposts ?? 0) - 1) : (p.totalReposts ?? 0) + 1 }
                : p
        ));
        try {
            const resp = estabaReposteado ? await quitarRepost(postId) : await repostear(postId);
            if (!resp.ok) {
                setPublicaciones(snapshot);
                toast.error(getT()('error.repost'));
            } else {
                toast.exito(estabaReposteado ? 'Repost eliminado' : 'Repost compartido');
            }
        } catch {
            setPublicaciones(snapshot);
            toast.error('No se pudo realizar el repost');
        }
    }, [publicaciones]);

    const alternarComentarios = useCallback((postId: number) => {
        setComentariosAbiertos(prev => {
            const siguiente = new Set(prev);
            if (siguiente.has(postId)) siguiente.delete(postId);
            else siguiente.add(postId);
            return siguiente;
        });
    }, []);

    return {
        publicaciones, filtro, setFiltro, cargando, cargandoMas, hayMas,
        comentariosAbiertos, navegar, usuario,
        menuSample, menuPublicacion, sentinelRef,
        recargarFeed, manejarLikePost, manejarLikeSample, manejarRepost, alternarComentarios,
    };
}
