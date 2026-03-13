/*
 * Hook: useCookiesAdmin
 * Logica para gestion de cookies de yt-dlp desde el panel admin.
 * Soporta multiples plataformas (YouTube, SoundCloud) con estado independiente.
 * Separado de useTabProcesos para SRP — cada hook una responsabilidad.
 */

import { useState, useCallback } from 'react';
import type { InfoCookies, TipoCookies } from '../services/apiProcesos';
import { actualizarCookies } from '../services/apiProcesos';

/** Estado individual de cookies para una plataforma */
interface EstadoCookiesPlataforma {
    contenido: string;
    guardando: boolean;
    mensaje: string | null;
    error: string | null;
}

interface UseCookiesAdminReturn {
    /** Info de archivo de cada plataforma (viene del backend) */
    infoCookies: Record<TipoCookies, InfoCookies> | null;
    /** Estado de edicion por plataforma */
    plataformas: Record<TipoCookies, EstadoCookiesPlataforma>;
    /** Actualiza el contenido del textarea de una plataforma */
    setContenido: (tipo: TipoCookies, valor: string) => void;
    /** Guarda cookies de una plataforma al backend */
    guardar: (tipo: TipoCookies) => Promise<void>;
    /** Recibe info del backend (llamado por useTabProcesos) */
    actualizarInfo: (info: Record<TipoCookies, InfoCookies>) => void;
}

const estadoInicial: EstadoCookiesPlataforma = {
    contenido: '',
    guardando: false,
    mensaje: null,
    error: null,
};

export function useCookiesAdmin(): UseCookiesAdminReturn {
    const [infoCookies, setInfoCookies] = useState<Record<TipoCookies, InfoCookies> | null>(null);
    const [plataformas, setPlataformas] = useState<Record<TipoCookies, EstadoCookiesPlataforma>>({
        youtube: { ...estadoInicial },
        soundcloud: { ...estadoInicial },
    });

    const setContenido = useCallback((tipo: TipoCookies, valor: string) => {
        setPlataformas(prev => ({
            ...prev,
            [tipo]: { ...prev[tipo], contenido: valor },
        }));
    }, []);

    const guardar = useCallback(async (tipo: TipoCookies) => {
        const actual = plataformas[tipo];
        if (actual.contenido.trim() === '') {
            setPlataformas(prev => ({
                ...prev,
                [tipo]: { ...prev[tipo], error: 'El contenido de cookies no puede estar vacio.' },
            }));
            return;
        }

        setPlataformas(prev => ({
            ...prev,
            [tipo]: { ...prev[tipo], guardando: true, mensaje: null, error: null },
        }));

        const resp = await actualizarCookies(actual.contenido, tipo);

        if (resp.ok && resp.data?.ok) {
            setPlataformas(prev => ({
                ...prev,
                [tipo]: {
                    ...prev[tipo],
                    guardando: false,
                    contenido: '',
                    mensaje: resp.data?.mensaje ?? `Cookies ${tipo} actualizadas correctamente.`,
                    error: null,
                },
            }));
            /* Actualizar info — ahora existe */
            setInfoCookies(prev => prev ? { ...prev, [tipo]: { existe: true } } : prev);
        } else {
            setPlataformas(prev => ({
                ...prev,
                [tipo]: {
                    ...prev[tipo],
                    guardando: false,
                    error: resp.data?.error ?? resp.error ?? 'Error al guardar cookies.',
                },
            }));
        }
    }, [plataformas]);

    const actualizarInfo = useCallback((info: Record<TipoCookies, InfoCookies>) => {
        setInfoCookies(info);
    }, []);

    return {
        infoCookies,
        plataformas,
        setContenido,
        guardar,
        actualizarInfo,
    };
}
