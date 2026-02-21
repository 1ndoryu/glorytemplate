/*
 * usePerfilIsland — Hook para PerfilIsland.
 * Gestiona carga de perfil, tabs (samples/publicaciones/likes),
 * likes optimistas con reacciones y acciones de perfil.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { obtenerPerfil } from '@app/services/apiAuth';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike, listarPublicacionesUsuario } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { useAuthStore } from '@app/stores/authStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useChatFlotanteStore } from '@app/stores/chatFlotanteStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample, EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO } from '@app/hooks/useMenuContextualSample';
import type { Usuario } from '@app/types/usuario';
import type { SampleResumen } from '@app/types/sample';
import type { Publicacion } from '@app/types/publicacion';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('PerfilIsland');

const TABS_PERFIL = [
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'publicaciones', etiqueta: 'Publicaciones' },
    { id: 'likes', etiqueta: 'Likes' }
];

interface PerfilParams {
    usernameProp?: string;
}

export function usePerfilIsland({ usernameProp }: PerfilParams) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [samplesPerfil, setSamplesPerfil] = useState<SampleResumen[]>([]);
    const [likesPerfil, setLikesPerfil] = useState<SampleResumen[]>([]);
    const [publicacionesPerfil, setPublicacionesPerfil] = useState<Publicacion[]>([]);
    const [cargandoTab, setCargandoTab] = useState(false);

    /* Listener para eliminacion/restauracion optimista de samples */
    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId) {
                setSamplesPerfil(prev => prev.filter(s => s.id !== detalle.sampleId));
                setLikesPerfil(prev => prev.filter(s => s.id !== detalle.sampleId));
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
    const tabActiva = useTabsTopBarStore(s => s.activa);
    useTabsIsla('PerfilIsland', TABS_PERFIL, 'samples');
    const navegar = useNavigationStore(s => s.navegar);
    const rutaActual = useNavigationStore(s => s.rutaActual);
    const abrirConfiguracion = useConfiguracionModalStore(s => s.abrir);
    const abrirChat = useChatFlotanteStore(s => s.abrirChat);
    const menu = useMenuContextualSample();

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

    const esPropietario = usuarioAuth && usuario && usuarioAuth.username === usuario.username;

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
                } else if (tabActiva === 'likes') {
                    /* TO-DO: endpoint GET /usuarios/{id}/likes */
                    const resp = await listarSamples({ page: 1, perPage: 10 });
                    if (!controller.signal.aborted && resp.ok && resp.data) {
                        setLikesPerfil(resp.data.data ?? []);
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

    /* Like con optimistic UI y soporte de reacciones */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const encontrar = (lista: SampleResumen[]) => lista.find(s => s.id === sampleId);
        const sampleEncontrado = encontrar(samplesPerfil) || encontrar(likesPerfil);
        const estabaLiked = sampleEncontrado?.liked ?? false;
        const reaccionAnterior = sampleEncontrado?.reaccion ?? null;

        const snapSamples = samplesPerfil;
        const snapLikes = likesPerfil;

        try {
            if (reaccion) {
                const eraPositivo = reaccionAnterior === 'like' || reaccionAnterior === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                const actualizar = (lista: SampleResumen[]) =>
                    lista.map(s => s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                    );
                setSamplesPerfil(actualizar);
                setLikesPerfil(actualizar);
                await darLike('sample', sampleId, reaccion);
            } else if (estabaLiked || reaccionAnterior) {
                const eraPositivo = reaccionAnterior === 'like' || reaccionAnterior === 'encanta';
                const actualizar = (lista: SampleResumen[]) =>
                    lista.map(s => s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                    );
                setSamplesPerfil(actualizar);
                setLikesPerfil(actualizar);
                await quitarLike('sample', sampleId);
            } else {
                const actualizar = (lista: SampleResumen[]) =>
                    lista.map(s => s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                    );
                setSamplesPerfil(actualizar);
                setLikesPerfil(actualizar);
                await darLike('sample', sampleId, 'like');
            }
        } catch {
            setSamplesPerfil(snapSamples);
            setLikesPerfil(snapLikes);
        }
    }, [samplesPerfil, likesPerfil]);

    /* Navegacion al creador */
    const manejarClickCreador = useCallback(
        (usr: string) => { navegar(`/perfil/${usr}/`); },
        [navegar]
    );

    return {
        usuario,
        cargando,
        samplesPerfil,
        likesPerfil,
        publicacionesPerfil,
        cargandoTab,
        usuarioAuth,
        authCargando,
        tabActiva,
        navegar,
        abrirConfiguracion,
        abrirChat,
        menu,
        username,
        esPropietario,
        recargarPublicaciones,
        manejarLike,
        manejarClickCreador,
    };
}
