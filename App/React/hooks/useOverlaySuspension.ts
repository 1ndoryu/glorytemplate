/*
 * Hook: useOverlaySuspension — QQ65
 * Lógica del overlay de suspensión: countdown en tiempo real + cierre de sesión.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import type { DatosSuspension } from '@app/types';

interface TiempoRestante {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    totalMs: number;
}

interface UseOverlaySuspensionResult {
    visible: boolean;
    suspension: DatosSuspension | null;
    tiempoRestante: TiempoRestante | null;
    textoTiempo: string;
    cerrarSesion: () => void;
}

const INTERVALO_MS = 1000;

function calcularTiempoRestante(hasta: string | null): TiempoRestante | null {
    if (!hasta) return null;
    const diff = new Date(hasta).getTime() - Date.now();
    if (diff <= 0) return null;

    return {
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diff % (1000 * 60)) / 1000),
        totalMs: diff,
    };
}

function formatearTiempo(t: TiempoRestante): string {
    const partes: string[] = [];
    if (t.dias > 0) partes.push(`${t.dias}d`);
    if (t.horas > 0) partes.push(`${t.horas}h`);
    if (t.minutos > 0) partes.push(`${t.minutos}m`);
    partes.push(`${t.segundos}s`);
    return partes.join(' ');
}

export const useOverlaySuspension = (): UseOverlaySuspensionResult => {
    const usuario = useAuthStore(s => s.usuario);
    const cerrarSesionStore = useAuthStore(s => s.cerrarSesion);

    const suspension = useMemo<DatosSuspension | null>(() => {
        if (!usuario) return null;
        return usuario.suspension ?? null;
    }, [usuario]);

    const visible = suspension !== null;

    const [tiempoRestante, setTiempoRestante] = useState<TiempoRestante | null>(() =>
        suspension ? calcularTiempoRestante(suspension.suspendidoHasta) : null
    );

    useEffect(() => {
        if (!suspension?.suspendidoHasta) {
            setTiempoRestante(null);
            return;
        }

        const actualizar = () => {
            const nuevo = calcularTiempoRestante(suspension.suspendidoHasta);
            setTiempoRestante(nuevo);
        };

        actualizar();
        const id = setInterval(actualizar, INTERVALO_MS);
        return () => clearInterval(id);
    }, [suspension?.suspendidoHasta]);

    const textoTiempo = useMemo(() => {
        if (!tiempoRestante) return 'indefinido';
        return formatearTiempo(tiempoRestante);
    }, [tiempoRestante]);

    const cerrarSesion = useCallback(() => {
        cerrarSesionStore();
        window.location.href = '/';
    }, [cerrarSesionStore]);

    return { visible, suspension, tiempoRestante, textoTiempo, cerrarSesion };
};
