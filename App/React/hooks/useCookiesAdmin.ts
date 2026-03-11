/*
 * Hook: useCookiesAdmin
 * Logica para gestion de cookies.txt de yt-dlp desde el panel admin.
 * Separado de useTabProcesos para SRP — cada hook una responsabilidad.
 */

import { useState, useCallback } from 'react';
import type { InfoCookies } from '../services/apiProcesos';
import { actualizarCookies } from '../services/apiProcesos';

interface UseCookiesAdminReturn {
    infoCookies: InfoCookies | null;
    contenidoCookies: string;
    setContenidoCookies: (v: string) => void;
    guardando: boolean;
    mensaje: string | null;
    errorCookies: string | null;
    guardar: () => Promise<void>;
    actualizarInfo: (info: InfoCookies) => void;
}

export function useCookiesAdmin(): UseCookiesAdminReturn {
    const [infoCookies, setInfoCookies] = useState<InfoCookies | null>(null);
    const [contenidoCookies, setContenidoCookies] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [errorCookies, setErrorCookies] = useState<string | null>(null);

    const guardar = useCallback(async () => {
        if (contenidoCookies.trim() === '') {
            setErrorCookies('El contenido de cookies no puede estar vacio.');
            return;
        }

        setGuardando(true);
        setMensaje(null);
        setErrorCookies(null);

        const resp = await actualizarCookies(contenidoCookies);

        if (resp.ok && resp.data?.ok) {
            setMensaje(resp.data.mensaje ?? 'Cookies actualizadas correctamente.');
            setContenidoCookies('');
            /* Actualizar info — ahora existe */
            setInfoCookies({ existe: true });
        } else {
            setErrorCookies(resp.data?.error ?? resp.error ?? 'Error al guardar cookies.');
        }

        setGuardando(false);
    }, [contenidoCookies]);

    const actualizarInfo = useCallback((info: InfoCookies) => {
        setInfoCookies(info);
    }, []);

    return {
        infoCookies,
        contenidoCookies,
        setContenidoCookies,
        guardando,
        mensaje,
        errorCookies,
        guardar,
        actualizarInfo,
    };
}
