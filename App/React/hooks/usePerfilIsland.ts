/* glory-sentinel-disable-file limite-lineas — Hook central de PerfilIsland: gestiona perfil,
 * tabs (samples/publicaciones/ganancias), menus contextuales, follow, chat y auth.
 * Dividir por dominio fragmentaría state compartido sin beneficio real. */
/*
 * usePerfilIsland — Hook para PerfilIsland.
 * Gestiona carga de perfil, tabs (samples/publicaciones/likes),
 * likes optimistas con reacciones y acciones de perfil.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { obtenerPerfil } from '@app/services/apiAuth';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike, listarPublicacionesUsuario, repostear, quitarRepost } from '@app/services/apiSocial';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import type { TipoReaccion } from '@app/types';
import { useAuthStore } from '@app/stores/authStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useChatFlotanteStore } from '@app/stores/chatFlotanteStore';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useMenuContextualSample, EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO } from '@app/hooks/useMenuContextualSample';
import { useMenuContextualPublicacion, EVENTO_PUBLICACION_ELIMINADA } from '@app/hooks/useMenuContextualPublicacion';
import { useMenuContextualPerfil } from '@app/hooks/useMenuContextualPerfil';
import type { Usuario } from '@app/types/usuario';
import type { SampleResumen } from '@app/types/sample';
import type { Publicacion } from '@app/types/publicacion';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('PerfilIsland');

/* [183A-96] Tabs base + tab de ganancias solo para propietario */
const TABS_BASE = [{ id: 'publicaciones', etiqueta: 'Publicaciones' }, { id: 'samples', etiqueta: 'Samples' }];
const TABS_CON_GANANCIAS = [...TABS_BASE, { id: 'ganancias', etiqueta: 'Ganancias' }];

interface PerfilParams {
    usernameProp?: string;
}

export function usePerfilIsland({ usernameProp }: PerfilParams) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [samplesPerfil, setSamplesPerfil] = useState<SampleResumen[]>([]);
    const [publicacionesPerfil, setPublicacionesPerfil] = useState<Publicacion[]>([]);
    const [cargandoTab, setCargandoTab] = useState(false);

    /* Listener para eliminacion/restauracion optimista de samples */
    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId) {
                setSamplesPerfil(prev => prev.filter(s => s.id !== detalle.sampleId));
            }
        };
        const manejarRestauracion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sample?: SampleResumen }>).detail;
            if (detalle?.sample) {
                setSamplesPerfil(prev => {
                    if (prev.some(s => s.id === detalle.sample!.id)) return prev;
                    return [detalle.sample!, ...prev];
                });
            }
        };
        window.addEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
        window.addEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        return () => {
            window.removeEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
            window.removeEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        };
    }, []);

    const usuarioAuth = useAuthStore(s => s.usuario);
    const authCargando = useAuthStore(s => s.cargando);
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);

    /* [183A-96] tabs con ganancias solo para propietario — re-registra al cambiar */
    const esPropietarioTemprano = !!(usuarioAuth && usuario && usuarioAuth.username === usuario.username);
    useTabsIsla('PerfilIsland', esPropietarioTemprano ? TABS_CON_GANANCIAS : TABS_BASE, 'publicaciones');
    const navegar = useNavigationStore(s => s.navegar);
    const rutaActualRaw = useNavigationStore(s => s.rutaActual);

    /* Keep-alive: congelar valores derivados de stores globales cuando la isla
     * está oculta. Sin esto, navegar a otra isla cambia rutaActual → username
     * se hace null → re-fetch. tabActiva global cambia por tabs de otra isla. */
    const activa = useIslaActiva('PerfilIsland');
    const rutaActual = useValorCongelado(rutaActualRaw, !activa);
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);
    const abrirConfiguracion = useConfiguracionModalStore(s => s.abrir);
    const abrirChat = useChatFlotanteStore(s => s.abrirChat);
    const menu = useMenuContextualSample();
    const menuPublicacion = useMenuContextualPublicacion({ setPublicaciones: setPublicacionesPerfil });

    /* Listener para eliminación de publicaciones (C322) */
    useEffect(() => {
        const manejarEliminacionPost = (event: Event) => {
            const detalle = (event as CustomEvent<{ publicacionId?: number }>).detail;
            if (detalle?.publicacionId) {
                setPublicacionesPerfil(prev => prev.filter(p => p.id !== detalle.publicacionId));
            }
        };
        window.addEventListener(EVENTO_PUBLICACION_ELIMINADA, manejarEliminacionPost as EventListener);
        return () => {
            window.removeEventListener(EVENTO_PUBLICACION_ELIMINADA, manejarEliminacionPost as EventListener);
        };
    }, []);

    /* Resolver username desde ruta SPA o prop */
    const username = useMemo(() => {
        const segmentos = (rutaActual ?? '').replace(/\/$/, '').split('/');
        const idxPerfil = segmentos.indexOf('perfil');
        if (idxPerfil !== -1 && segmentos[idxPerfil + 1] && segmentos[idxPerfil + 1] !== 'perfil' && segmentos[idxPerfil + 1] !== 'editar') {
            return segmentos[idxPerfil + 1];
        }
        const val = usernameProp?.trim();
        if (val && val !== 'perfil' && val !== 'editar') return val;
        return usuarioAuth?.username ?? null;
    }, [rutaActual, usernameProp, usuarioAuth?.username]);

    const esPropietario = esPropietarioTemprano;

    /* QQ23+QQ57: Menu contextual del perfil — propietario (config+papelera) o visitante (reportar/bloquear) */
    /* [2003A-33] Pasar esAdmin para opción de banear/eliminar en perfiles ajenos */
    const menuPerfil = useMenuContextualPerfil({
        usuario: usuario ? { id: usuario.id, username: usuario.username } : null,
        esPropietario: !!esPropietario,
        esAdmin: usuarioAuth?.rol === 'admin',
    });

    /* Cargar perfil con AbortController */
    useEffect(() => {
        if (!username && authCargando) return;
        if (!username) return;

        const controller = new AbortController();
        const cargar = async () => {
            setCargando(true);
            try {
                const respuesta = await obtenerPerfil(username);
                if (controller.signal.aborted) return;
                if (respuesta.ok && respuesta.data) {
                    setUsuario(respuesta.data as unknown as Usuario);
                    setCargando(false);
                    return;
                }
            } catch (err) {
                log.debug('API perfil no disponible, intentando fallback', err);
            }

            /* Fallback: usar datos del authStore para perfil propio */
            if (!controller.signal.aborted && usuarioAuth && (username === usuarioAuth.username || username === '')) {
                setUsuario({
                    id: usuarioAuth.id,
                    username: usuarioAuth.username,
                    nombreVisible: usuarioAuth.nombreVisible ?? usuarioAuth.username,
                    avatarUrl: usuarioAuth.avatarUrl ?? null,
                    bio: '',
                    portadaUrl: null,
                    plan: (usuarioAuth as unknown as { plan?: string }).plan ?? 'free',
                    verificado: false,
                    totalSamples: 0,
                    totalSeguidores: 0,
                    totalSeguidos: 0
                } as Usuario);
            }
            if (!controller.signal.aborted) setCargando(false);
        };

        cargar();
        return () => { controller.abort(); };
    }, [username, authCargando, usuarioAuth]);

    /* Cargar contenido de tabs con AbortController */
    useEffect(() => {
        if (!usuario) return;
        const controller = new AbortController();

        const cargarTab = async () => {
            setCargandoTab(true);
            try {
                if (tabActiva === 'samples') {
                    const resp = await listarSamples({ page: 1, perPage: 20, creador: usuario.username });
                    if (!controller.signal.aborted && resp.ok && resp.data) {
                        setSamplesPerfil(resp.data.data ?? []);
                    }
                } else if (tabActiva === 'publicaciones') {
                    const resp = await listarPublicacionesUsuario(usuario.username, 1);
                    if (!controller.signal.aborted && resp.ok && resp.data) {
                        const lista = resp.data.data ?? resp.data ?? [];
                        setPublicacionesPerfil(Array.isArray(lista) ? lista : []);
                    }
                }
            } catch (err) {
                log.error('Error cargando tab', err);
            } finally {
                if (!controller.signal.aborted) setCargandoTab(false);
            }
        };

        cargarTab();
        return () => { controller.abort(); };
    }, [usuario, tabActiva]);

    /* Recargar publicaciones tras publicar inline */
    const recargarPublicaciones = useCallback(async () => {
        if (!usuario) return;
        try {
            const resp = await listarPublicacionesUsuario(usuario.username, 1);
            if (resp.ok && resp.data) {
                const lista = resp.data.data ?? resp.data ?? [];
                setPublicacionesPerfil(Array.isArray(lista) ? lista : []);
            }
        } catch { /* sin-op */ }
    }, [usuario]);

    /* [193A-46] Refs para acceder al estado actual sin crear dependencia en useCallback.
     * Sin esto, useCallback([samplesPerfil]) se recrea al cambiar el estado,
     * causando bucle infinito de re-renders (React error #310). */
    const samplesPerfilRef = useRef(samplesPerfil);
    samplesPerfilRef.current = samplesPerfil;
    const publicacionesPerfilRef = useRef(publicacionesPerfil);
    publicacionesPerfilRef.current = publicacionesPerfil;

    /* Like con optimistic UI y soporte de reacciones */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sampleEncontrado = samplesPerfilRef.current.find(s => s.id === sampleId);
        const estabaLiked = sampleEncontrado?.liked ?? false;
        const reaccionAnterior = sampleEncontrado?.reaccion ?? null;
        const snapSamples = samplesPerfilRef.current;

        try {
            if (reaccion) {
                const eraPositivo = reaccionAnterior === 'like' || reaccionAnterior === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                /* [193A-32] Dislike oculta el sample del listado */
                if (!esPositivo) {
                    setSamplesPerfil(prev => prev.filter(s => s.id !== sampleId));
                } else {
                    const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                    setSamplesPerfil(prev =>
                        prev.map(s => s.id === sampleId
                            ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                            : s
                        )
                    );
                }
                await darLike('sample', sampleId, reaccion);
            } else if (estabaLiked || reaccionAnterior) {
                const eraPositivo = reaccionAnterior === 'like' || reaccionAnterior === 'encanta';
                setSamplesPerfil(prev =>
                    prev.map(s => s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                    )
                );
                await quitarLike('sample', sampleId);
            } else {
                setSamplesPerfil(prev =>
                    prev.map(s => s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                    )
                );
                await darLike('sample', sampleId, 'like');
            }
        } catch {
            setSamplesPerfil(snapSamples);
        }
    }, []);

    /* Navegacion al creador */
    const manejarClickCreador = useCallback(
        (usr: string) => { navegar(`/perfil/${usr}/`); },
        [navegar]
    );

    /* QQ18: Like optimista en publicaciones del perfil (replicado de useComunidadIsland) */
    const manejarLikePost = useCallback(async (postId: number, reaccion?: TipoReaccion) => {
        const post = publicacionesPerfilRef.current.find((p) => p.id === postId);
        const snapshot = publicacionesPerfilRef.current;

        try {
            if (reaccion) {
                const eraPositivo = post?.reaccion === 'like' || post?.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setPublicacionesPerfil(prev => prev.map(p =>
                    p.id === postId ? { ...p, liked: esPositivo, reaccion, totalLikes: Math.max(0, p.totalLikes + delta) } : p
                ));
                await darLike('publicacion', postId, reaccion);
            } else if (post?.liked || post?.reaccion) {
                const eraPositivo = post?.reaccion === 'like' || post?.reaccion === 'encanta';
                setPublicacionesPerfil(prev => prev.map(p =>
                    p.id === postId ? { ...p, liked: false, reaccion: null, totalLikes: Math.max(0, p.totalLikes - (eraPositivo ? 1 : 0)) } : p
                ));
                await quitarLike('publicacion', postId);
            } else {
                setPublicacionesPerfil(prev => prev.map(p =>
                    p.id === postId ? { ...p, liked: true, reaccion: 'like' as const, totalLikes: p.totalLikes + 1 } : p
                ));
                await darLike('publicacion', postId, 'like');
            }
        } catch {
            setPublicacionesPerfil(snapshot);
        }
    }, []);

    /* QQ18: Alternar panel de comentarios en publicaciones del perfil */
    const [comentariosAbiertos, setComentariosAbiertos] = useState<Set<number>>(new Set());
    const alternarComentarios = useCallback((postId: number) => {
        setComentariosAbiertos(prev => {
            const siguiente = new Set(prev);
            if (siguiente.has(postId)) siguiente.delete(postId);
            else siguiente.add(postId);
            return siguiente;
        });
    }, []);

    /* Repost optimista con toast */
    const manejarRepost = useCallback(async (postId: number) => {
        const post = publicacionesPerfilRef.current.find(p => p.id === postId);
        if (!post) return;
        const snapshot = publicacionesPerfilRef.current;
        const estabaReposteado = post.reposteado;
        setPublicacionesPerfil(prev => prev.map(p =>
            p.id === postId
                ? { ...p, reposteado: !estabaReposteado, totalReposts: estabaReposteado ? Math.max(0, (p.totalReposts ?? 0) - 1) : (p.totalReposts ?? 0) + 1 }
                : p
        ));
        try {
            const resp = estabaReposteado ? await quitarRepost(postId) : await repostear(postId);
            if (!resp.ok) {
                setPublicacionesPerfil(snapshot);
                toast.error(getT()('error.repost'));
            } else {
                toast.exito(estabaReposteado ? 'Repost eliminado' : 'Repost compartido');
            }
        } catch {
            setPublicacionesPerfil(snapshot);
            toast.error('No se pudo realizar el repost');
        }
    }, []);

    return {
        usuario,
        cargando,
        samplesPerfil,
        publicacionesPerfil,
        cargandoTab,
        usuarioAuth,
        authCargando,
        tabActiva,
        navegar,
        abrirConfiguracion,
        abrirChat,
        menu,
        menuPublicacion,
        menuPerfil,
        username,
        esPropietario,
        recargarPublicaciones,
        manejarLike,
        manejarLikePost,
        alternarComentarios,
        comentariosAbiertos,
        manejarClickCreador,
        manejarRepost,
    };
}
