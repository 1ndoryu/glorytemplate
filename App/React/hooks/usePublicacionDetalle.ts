/*
 * Hook: usePublicacionDetalle — Kamples
 * Lógica para la página de detalle de una publicación individual.
 * Fetch, like, repost, sample-like, menú contextual.
 */

import { useState, useEffect, useCallback, useMemo, type SetStateAction } from 'react';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useAuthStore } from '@app/stores/authStore';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useMenuContextualPublicacion } from '@app/hooks/useMenuContextualPublicacion';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import {
    obtenerPublicacion, darLike, quitarLike,
    repostear, quitarRepost,
} from '@app/services/apiSocial';
import { crearLogger } from '@app/services/logger';
import type { Publicacion, TipoReaccion } from '@app/types';

const log = crearLogger('usePublicacionDetalle');

interface UsePublicacionDetalleOpciones {
    /* Prop PHP (solo disponible en carga server-side, vacío en navegación SPA) */
    publicacionIdProp?: number;
}

export function usePublicacionDetalle({ publicacionIdProp }: UsePublicacionDetalleOpciones) {
    const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navegar = useNavigationStore(s => s.navegar);
    const rutaActualRaw = useNavigationStore(s => s.rutaActual);
    const usuario = useAuthStore(s => s.usuario);

    /* Keep-alive: congelar rutaActual cuando la isla está oculta.
     * Sin esto, navegar a otra página cambia publicacionId a 0 → estado error. */
    const activa = useIslaActiva('PublicacionIsland');
    const rutaActual = useValorCongelado(rutaActualRaw, !activa);

    /*
     * Resolver ID: priorizar URL SPA sobre prop PHP.
     * La prop PHP llega vacía en navegación cliente (callable props no serializables).
     * rutaActual siempre tiene la URL correcta — ej: /publicacion/16/
     */
    const publicacionId = useMemo(() => {
        const segmentos = rutaActual.replace(/\/$/, '').split('/');
        const idx = segmentos.indexOf('publicacion');
        if (idx !== -1 && segmentos[idx + 1]) {
            const idDesdeUrl = Number(segmentos[idx + 1]);
            if (idDesdeUrl > 0) return idDesdeUrl;
        }
        return publicacionIdProp && publicacionIdProp > 0 ? publicacionIdProp : 0;
    }, [rutaActual, publicacionIdProp]);

    /*
     * Adapter: useMenuContextualPublicacion espera Dispatch<SetStateAction<Publicacion[]>>.
     * Convertimos de array a single-item para mantener compatibilidad.
     */
    const setPublicaciones = useCallback(
        (action: SetStateAction<Publicacion[]>) => {
            setPublicacion(prev => {
                if (!prev) return prev;
                const lista = typeof action === 'function' ? action([prev]) : action;
                return lista[0] ?? prev;
            });
        },
        []
    );

    const menuSample = useMenuContextualSample();
    const menuPublicacion = useMenuContextualPublicacion({ setPublicaciones });

    /* Cargar publicación */
    useEffect(() => {
        if (!publicacionId) {
            setError('ID de publicación no válido');
            setCargando(false);
            return;
        }

        let activo = true;
        setCargando(true);
        setError(null);

        const cargar = async () => {
            try {
                const resp = await obtenerPublicacion(publicacionId);
                if (!activo) return;
                if (resp.ok && resp.data) {
                    setPublicacion(resp.data);
                } else {
                    setError('Publicación no encontrada');
                }
            } catch (err) {
                if (activo) {
                    log.error('Error cargando publicación', err);
                    setError('Error al cargar la publicación');
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [publicacionId]);

    /* Like con actualización optimista + rollback */
    const manejarLike = useCallback(async (postId: number, reaccion?: TipoReaccion) => {
        if (!publicacion || publicacion.id !== postId) return;
        const snapshot = publicacion;

        try {
            if (reaccion) {
                const eraPositivo = publicacion.reaccion === 'like' || publicacion.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setPublicacion(prev => prev ? {
                    ...prev, liked: esPositivo, reaccion,
                    totalLikes: Math.max(0, prev.totalLikes + delta),
                } : prev);
                await darLike('publicacion', postId, reaccion);
            } else if (publicacion.liked || publicacion.reaccion) {
                const eraPositivo = publicacion.reaccion === 'like' || publicacion.reaccion === 'encanta';
                setPublicacion(prev => prev ? {
                    ...prev, liked: false, reaccion: null,
                    totalLikes: Math.max(0, prev.totalLikes - (eraPositivo ? 1 : 0)),
                } : prev);
                await quitarLike('publicacion', postId);
            } else {
                setPublicacion(prev => prev ? {
                    ...prev, liked: true, reaccion: 'like' as const,
                    totalLikes: prev.totalLikes + 1,
                } : prev);
                await darLike('publicacion', postId, 'like');
            }
        } catch {
            setPublicacion(snapshot);
        }
    }, [publicacion]);

    /* Like en sample embebido */
    const manejarLikeSample = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        if (!publicacion) return;
        const snapshot = publicacion;

        const actualizarSamples = (samples: Publicacion['samplesAdjuntos']) =>
            samples.map(s => {
                if (s.id !== sampleId) return s;
                if (reaccion) {
                    const eraPositivo = s.reaccion === 'like' || s.reaccion === 'encanta';
                    const esPositivo = reaccion !== 'dislike';
                    const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                    return { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) };
                } else if (s.liked || s.reaccion) {
                    const eraPositivo = s.reaccion === 'like' || s.reaccion === 'encanta';
                    return { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) };
                }
                return { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 };
            });

        setPublicacion(prev => prev ? { ...prev, samplesAdjuntos: actualizarSamples(prev.samplesAdjuntos) } : prev);

        try {
            const sampleRef = publicacion.samplesAdjuntos.find(s => s.id === sampleId);
            if (reaccion) {
                await darLike('sample', sampleId, reaccion);
            } else if (sampleRef?.liked || sampleRef?.reaccion) {
                await quitarLike('sample', sampleId);
            } else {
                await darLike('sample', sampleId, 'like');
            }
        } catch {
            setPublicacion(snapshot);
        }
    }, [publicacion]);

    /* Repost con optimismo + rollback */
    const manejarRepost = useCallback(async (postId: number) => {
        if (!publicacion || publicacion.id !== postId) return;
        const snapshot = publicacion;
        const estabaReposteado = publicacion.reposteado;

        setPublicacion(prev => prev ? {
            ...prev,
            reposteado: !estabaReposteado,
            totalReposts: estabaReposteado
                ? Math.max(0, (prev.totalReposts ?? 0) - 1)
                : (prev.totalReposts ?? 0) + 1,
        } : prev);

        try {
            const resp = estabaReposteado ? await quitarRepost(postId) : await repostear(postId);
            if (!resp.ok) {
                setPublicacion(snapshot);
                toast.error(getT()('error.repost'));
            } else {
                toast.exito(estabaReposteado ? 'Repost eliminado' : 'Repost compartido');
            }
        } catch {
            setPublicacion(snapshot);
            toast.error('No se pudo realizar el repost');
        }
    }, [publicacion]);

    return {
        publicacion,
        publicacionId,
        cargando,
        error,
        navegar,
        usuario,
        menuSample,
        menuPublicacion,
        manejarLike,
        manejarLikeSample,
        manejarRepost,
    };
}
