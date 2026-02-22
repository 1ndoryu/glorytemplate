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
import { darLike, quitarLike } from '@app/services/apiSocial';
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

    const manejarRepost = useCallback((postId: number) => {
        setPublicaciones(prev => prev.map(p =>
            p.id === postId ? { ...p, reposteado: !p.reposteado, totalReposts: p.reposteado ? p.totalReposts - 1 : p.totalReposts + 1 } : p
        ));
    }, []);

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
        recargarFeed, manejarLikePost, manejarRepost, alternarComentarios,
    };
}
