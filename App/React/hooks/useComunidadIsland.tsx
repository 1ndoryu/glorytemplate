/*
 * Hook: useComunidadIsland — Kamples
 * Lógica del feed de comunidad: carga, filtro, likes, reposts, menú contextual.
 * Extraído de ComunidadIsland (SRP).
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useMenuContextualPublicacion } from '@app/hooks/useMenuContextualPublicacion';
import { apiGet } from '@app/services/apiCliente';
import { darLike, quitarLike, repostear, quitarRepost, obtenerPublicacion } from '@app/services/apiSocial';
import { EVENTO_ENTIDAD_ACTUALIZADA } from '@app/components/social/ModalEditar';
import type { TipoReaccion, Publicacion } from '@app/types';

export type FiltroComunidad = 'todos' | 'siguiendo' | 'populares';

export function useComunidadIsland() {
    const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
    const [filtro, setFiltro] = useState<FiltroComunidad>('todos');
    const [cargando, setCargando] = useState(true);
    const [comentariosAbiertos, setComentariosAbiertos] = useState<Set<number>>(new Set());
    const navegar = useNavigationStore(s => s.navegar);
    const usuario = useAuthStore(s => s.usuario);

    /* Menú contextual de samples adjuntos */
    const menuSample = useMenuContextualSample();

    /* Menú contextual de publicaciones (C322 — hook reutilizable) */
    const menuPublicacion = useMenuContextualPublicacion({ setPublicaciones });

    /* Escuchar edicion desde ModalEditar y actualizar el post en tiempo real sin recargar */
    useEffect(() => {
        const manejarActualizacion = async (e: Event) => {
            const { tipo, id } = (e as CustomEvent<{ tipo: string; id: number }>).detail;
            if (tipo !== 'publicacion' || !id) return;
            try {
                const resp = await obtenerPublicacion(id);
                if (!resp.data) return;
                setPublicaciones(prev => prev.map(p => p.id === id ? resp.data! : p));
            } catch { /* sin-op: fallo silencioso no critico en refresh de post */ }
        };
        window.addEventListener(EVENTO_ENTIDAD_ACTUALIZADA, manejarActualizacion);
        return () => window.removeEventListener(EVENTO_ENTIDAD_ACTUALIZADA, manejarActualizacion);
    }, []);

    /* Cargar publicaciones con cleanup */
    useEffect(() => {
        let activo = true;
        setCargando(true);

        const cargar = async () => {
            try {
                const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro });
                if (!activo) return;
                const lista = resp.data?.data ?? resp.data ?? [];
                setPublicaciones(Array.isArray(lista) ? lista : []);
            } catch {
                if (activo) setPublicaciones([]);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [filtro]);

    /* Callback para recargar feed tras publicar */
    const recargarFeed = useCallback(async () => {
        try {
            const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro });
            const lista = resp.data?.data ?? resp.data ?? [];
            setPublicaciones(Array.isArray(lista) ? lista : []);
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
                ? { ...p, reposteado: !estabaReposteado, totalReposts: estabaReposteado ? p.totalReposts - 1 : p.totalReposts + 1 }
                : p
        ));
        try {
            const resp = estabaReposteado ? await quitarRepost(postId) : await repostear(postId);
            if (!resp.ok) setPublicaciones(snapshot);
        } catch {
            setPublicaciones(snapshot);
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
        publicaciones, filtro, setFiltro, cargando,
        comentariosAbiertos, navegar, usuario,
        menuSample, menuPublicacion,
        recargarFeed, manejarLikePost, manejarLikeSample, manejarRepost, alternarComentarios,
    };
}
