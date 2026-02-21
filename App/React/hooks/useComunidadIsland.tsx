/*
 * Hook: useComunidadIsland — Kamples
 * Lógica del feed de comunidad: carga, filtro, likes, reposts, menú contextual.
 * Extraído de ComunidadIsland (SRP).
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Link2, Trash2, Flag, CheckCircle } from 'lucide-react';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { apiGet, apiDelete } from '@app/services/apiCliente';
import { darLike, quitarLike, actualizarPublicacion } from '@app/services/apiSocial';
import { toast } from '@app/stores/toastStore';
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

    /* Menú contextual de publicaciones */
    const [menuPost, setMenuPost] = useState<{ abierto: boolean; x: number; y: number; post: Publicacion | null }>({
        abierto: false, x: 0, y: 0, post: null,
    });

    const abrirMenuPost = useCallback((e: React.MouseEvent, post: Publicacion) => {
        e.stopPropagation();
        e.preventDefault();
        setMenuPost({ abierto: true, x: e.clientX, y: e.clientY, post });
    }, []);

    const cerrarMenuPost = useCallback(() => {
        setMenuPost(prev => ({ ...prev, abierto: false }));
    }, []);

    const itemsMenuPost = useMemo(() => {
        const post = menuPost.post;
        if (!post) return [];

        const esPropietario = usuario?.id !== undefined && String(post.autor.id) === String(usuario.id);
        const esAdmin = usuario?.rol === 'admin';
        const items: { id: string; etiqueta: string; icono: JSX.Element; onClick: () => void; peligro?: boolean; separadorDespues?: boolean; href?: string }[] = [];

        items.push({
            id: 'ver-perfil',
            etiqueta: `Ir a @${post.autor.username}`,
            icono: <User size={16} />,
            href: `/perfil/${post.autor.username}/`,
            onClick: () => { navegar(`/perfil/${post.autor.username}/`); cerrarMenuPost(); },
        });

        items.push({
            id: 'copiar-enlace',
            etiqueta: 'Copiar enlace',
            icono: <Link2 size={16} />,
            separadorDespues: true,
            onClick: () => { copiarAlPortapapeles(`${window.location.origin}/post/${post.id}/`); cerrarMenuPost(); },
        });

        if (esPropietario || esAdmin) {
            if (esAdmin && post.moderacionEstado && post.moderacionEstado !== 'aprobado') {
                items.push({
                    id: 'aprobar',
                    etiqueta: 'Aprobar publicación',
                    icono: <CheckCircle size={16} />,
                    onClick: async () => {
                        const resp = await actualizarPublicacion(post.id, { moderacionEstado: 'aprobado' });
                        if (resp.ok) {
                            setPublicaciones(prev => prev.map(p =>
                                p.id === post.id ? { ...p, moderacionEstado: 'aprobado' } : p
                            ));
                            toast.exito('Publicación aprobada');
                        }
                        cerrarMenuPost();
                    },
                });
            }
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar publicación',
                icono: <Trash2 size={16} />,
                peligro: true,
                onClick: () => {
                    toast.confirmar('¿Eliminar esta publicación?', async () => {
                        const resp = await apiDelete(`/publicaciones/${post.id}`);
                        if (resp.ok) {
                            setPublicaciones(prev => prev.filter(p => p.id !== post.id));
                            toast.exito('Publicación eliminada');
                        }
                    });
                    cerrarMenuPost();
                },
            });
        }

        items.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            onClick: () => { cerrarMenuPost(); },
        });

        return items;
    }, [menuPost.post, usuario, navegar, cerrarMenuPost]);

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
        menuSample, menuPost, abrirMenuPost, cerrarMenuPost, itemsMenuPost,
        recargarFeed, manejarLikePost, manejarRepost, alternarComentarios,
    };
}
