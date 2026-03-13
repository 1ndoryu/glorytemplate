/*
 * Hook: useTabProcesos
 * Logica para el tab de procesos de fondo en el panel admin.
 * Polling cada 5s cuando hay procesos running, 30s cuando todo esta stopped.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EstadoProceso, InfoCookies, TipoCookies } from '../services/apiProcesos';
import { listarProcesos, iniciarProceso, detenerProceso } from '../services/apiProcesos';

/** Mapa de info de cookies por plataforma */
type InfoCookiesMapa = Record<TipoCookies, InfoCookies>;

interface UseTabProcesosReturn {
    procesos: EstadoProceso[];
    cargando: boolean;
    accionEnCurso: string | null;
    iniciar: (nombre: string, limit?: number) => Promise<void>;
    detener: (nombre: string) => Promise<void>;
    recargar: () => Promise<void>;
    error: string | null;
    cookiesInfo: InfoCookiesMapa | null;
}

const INTERVALO_ACTIVO  = 5000;
const INTERVALO_PASIVO  = 30000;

export function useTabProcesos(): UseTabProcesosReturn {
    const [procesos, setProcesos] = useState<EstadoProceso[]>([]);
    const [cargando, setCargando] = useState(true);
    const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cookiesInfo, setCookiesInfo] = useState<InfoCookiesMapa | null>(null);
    const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cargarDatos = useCallback(async () => {
        try {
            const resp = await listarProcesos();
            if (resp.ok && resp.data?.procesos) {
                setProcesos(resp.data.procesos);
                setError(null);
            }
            if (resp.data?.cookies) {
                setCookiesInfo(resp.data.cookies);
            }
        } catch {
            setError('Error cargando estado de procesos.');
        } finally {
            setCargando(false);
        }
    }, []);

    /* Ajustar intervalo de polling segun estado de procesos */
    const hayAlgunoRunning = procesos.some(p => p.estado === 'running');

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    useEffect(() => {
        if (intervaloRef.current) {
            clearInterval(intervaloRef.current);
        }

        const ms = hayAlgunoRunning ? INTERVALO_ACTIVO : INTERVALO_PASIVO;
        intervaloRef.current = setInterval(cargarDatos, ms);

        return () => {
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
            }
        };
    }, [hayAlgunoRunning, cargarDatos]);

    const iniciar = useCallback(async (nombre: string, limit?: number) => {
        setAccionEnCurso(nombre);
        setError(null);
        try {
            const resp = await iniciarProceso(nombre, limit);
            if (!resp.ok || resp.data?.error) {
                setError(resp.data?.error ?? resp.error ?? 'Error al iniciar proceso.');
            }
            await cargarDatos();
        } finally {
            setAccionEnCurso(null);
        }
    }, [cargarDatos]);

    const detener = useCallback(async (nombre: string) => {
        setAccionEnCurso(nombre);
        setError(null);
        try {
            const resp = await detenerProceso(nombre);
            if (!resp.ok || resp.data?.error) {
                setError(resp.data?.error ?? resp.error ?? 'Error al detener proceso.');
            }
            await cargarDatos();
        } finally {
            setAccionEnCurso(null);
        }
    }, [cargarDatos]);

    return {
        procesos,
        cargando,
        accionEnCurso,
        iniciar,
        detener,
        recargar: cargarDatos,
        error,
        cookiesInfo,
    };
}
