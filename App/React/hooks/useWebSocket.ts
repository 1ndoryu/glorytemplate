/*
 * Hook: useWebSocket — Kamples (Fase 7)
 * Wrapper React sobre wsService singleton.
 * Gestiona lifecycle (mount/unmount) y expone estado reactivo.
 * Mientras no haya servidor WS, opera en modo desconectado sin errores.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { wsService } from '@app/services/wsService';
import type { HandlerMensaje, EstadoConexion } from '@app/services/wsService';

interface ConfigWSHook {
    autoConectar?: boolean;
    canales?: string[];
}

export const useWebSocket = (config: ConfigWSHook = {}) => {
    const { autoConectar = true, canales = [] } = config;
    const [estadoConexion, setEstadoConexion] = useState<EstadoConexion>(
        wsService.obtenerEstado()
    );
    const { autenticado, usuario } = useAuthStore();

    /* Suscribir handler de tipo específico, se limpia al desmontar */
    const on = useCallback((tipo: string, handler: HandlerMensaje) => {
        return wsService.on(tipo, handler);
    }, []);

    /* Enviar mensaje */
    const enviar = useCallback((tipo: string, datos: unknown = {}) => {
        return wsService.enviar(tipo, datos);
    }, []);

    /* Conectar/desconectar */
    const conectar = useCallback(() => {
        if (!autenticado || !usuario) return;

        /* Obtener URL del contexto de Glory */
        let url: string | null = null;
        try {
            const contexto = (window as unknown as { GLORY_CONTEXT?: { wsUrl?: string } }).GLORY_CONTEXT;
            if (contexto?.wsUrl) url = contexto.wsUrl;
        } catch { /* silencio */ }

        if (url) {
            wsService.configurar(url, usuario.id);
            wsService.conectar();
            canales.forEach((canal) => wsService.enviar('suscribir', { canal }));
        }
    }, [autenticado, usuario, canales]);

    const desconectar = useCallback(() => {
        wsService.desconectar();
    }, []);

    /* Sincronizar estado reactivo con wsService */
    useEffect(() => {
        wsService.onCambioEstado(setEstadoConexion);
        return () => wsService.onCambioEstado(() => {});
    }, []);

    /* Auto-conectar al montar si el usuario está autenticado */
    useEffect(() => {
        if (autoConectar && autenticado) {
            conectar();
        }
        return () => {
            desconectar();
        };
    }, [autoConectar, autenticado]);

    return {
        estadoConexion,
        conectado: estadoConexion === 'conectado',
        conectar,
        desconectar,
        enviar,
        on,
    };
};
