/*
 * Hook: useWebSocket — Kamples (Fase 7)
 * Gestión de conexión WebSocket con reconexión automática.
 * Se conecta al servidor Bun WS para mensajes y notificaciones en tiempo real.
 * Mientras no haya servidor WS, opera en modo desconectado sin errores.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useWebSocket');

type EstadoConexion = 'conectado' | 'conectando' | 'desconectado' | 'error';

interface MensajeWS {
    tipo: string;
    datos: unknown;
    timestamp: number;
}

type HandlerMensaje = (mensaje: MensajeWS) => void;

interface ConfigWSHook {
    /* URL del servidor WS (por defecto infiere de la ubicación actual) */
    url?: string;
    /* Auto-conectar al montar (default: true) */
    autoConectar?: boolean;
    /* Tiempo máximo entre reconexiones en ms (default: 30000) */
    maxReconexion?: number;
    /* Canales a los que suscribirse al conectar */
    canales?: string[];
}

const HEARTBEAT_INTERVAL = 25000;
const RECONEXION_BASE = 1000;

export const useWebSocket = (config: ConfigWSHook = {}) => {
    const {
        autoConectar = true,
        maxReconexion = 30000,
        canales = [],
    } = config;

    const [estadoConexion, setEstadoConexion] = useState<EstadoConexion>('desconectado');
    const wsRef = useRef<WebSocket | null>(null);
    const heartbeatRef = useRef<number | null>(null);
    const reconexionRef = useRef<number | null>(null);
    const intentosRef = useRef(0);
    const handlersRef = useRef<Map<string, Set<HandlerMensaje>>>(new Map());
    const { autenticado, usuario } = useAuthStore();

    /*
     * Determina la URL del servidor WebSocket.
     * TO-DO: Configurar en variables de entorno cuando el servidor Bun esté listo.
     */
    const obtenerUrlWS = useCallback((): string | null => {
        if (config.url) return config.url;

        /* Sin servidor WS configurado por el momento */
        try {
            const contexto = (window as unknown as { GLORY_CONTEXT?: { wsUrl?: string } }).GLORY_CONTEXT;
            if (contexto?.wsUrl) return contexto.wsUrl;
        } catch { /* silencio */ }

        return null;
    }, [config.url]);

    /*
     * Registrar un handler para un tipo de mensaje.
     */
    const on = useCallback((tipo: string, handler: HandlerMensaje) => {
        if (!handlersRef.current.has(tipo)) {
            handlersRef.current.set(tipo, new Set());
        }
        handlersRef.current.get(tipo)!.add(handler);

        /* Retorna función para desuscribirse */
        return () => {
            handlersRef.current.get(tipo)?.delete(handler);
        };
    }, []);

    /*
     * Enviar mensaje por el WebSocket.
     */
    const enviar = useCallback((tipo: string, datos: unknown = {}) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            log.warn('WebSocket no conectado, mensaje descartado', { tipo });
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify({ tipo, datos, timestamp: Date.now() }));
            return true;
        } catch (err) {
            log.error('Error enviando mensaje WS', err);
            return false;
        }
    }, []);

    /*
     * Iniciar heartbeat para mantener la conexión viva.
     */
    const iniciarHeartbeat = useCallback(() => {
        detenerHeartbeat();
        heartbeatRef.current = window.setInterval(() => {
            enviar('ping');
        }, HEARTBEAT_INTERVAL);
    }, [enviar]);

    const detenerHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    /*
     * Conectar al servidor WebSocket.
     */
    const conectar = useCallback(() => {
        const url = obtenerUrlWS();
        if (!url) {
            log.debug('Sin URL de WebSocket configurada, modo offline');
            return;
        }

        if (!autenticado || !usuario) {
            log.debug('Usuario no autenticado, WS desactivado');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setEstadoConexion('conectando');

        try {
            /* TO-DO: Agregar token JWT como parámetro cuando el auth backend esté listo */
            const ws = new WebSocket(`${url}?userId=${usuario.id}`);
            wsRef.current = ws;

            ws.onopen = () => {
                log.info('WebSocket conectado');
                setEstadoConexion('conectado');
                intentosRef.current = 0;
                iniciarHeartbeat();

                /* Suscribir a canales configurados */
                canales.forEach(canal => {
                    enviar('suscribir', { canal });
                });
            };

            ws.onmessage = (evento) => {
                try {
                    const mensaje: MensajeWS = JSON.parse(evento.data);
                    const handlers = handlersRef.current.get(mensaje.tipo);
                    if (handlers) {
                        handlers.forEach(handler => handler(mensaje));
                    }

                    /* Handler global para todos los mensajes */
                    const globales = handlersRef.current.get('*');
                    if (globales) {
                        globales.forEach(handler => handler(mensaje));
                    }
                } catch (err) {
                    log.warn('Mensaje WS inválido', evento.data);
                }
            };

            ws.onclose = () => {
                log.info('WebSocket desconectado');
                setEstadoConexion('desconectado');
                detenerHeartbeat();
                programarReconexion();
            };

            ws.onerror = () => {
                log.debug('Error WebSocket (servidor posiblemente no disponible)');
                setEstadoConexion('error');
            };
        } catch (err) {
            log.debug('No se pudo crear WebSocket', err);
            setEstadoConexion('error');
        }
    }, [autenticado, usuario, canales, obtenerUrlWS, iniciarHeartbeat, detenerHeartbeat, enviar]);

    /*
     * Reconexión con backoff exponencial.
     */
    const programarReconexion = useCallback(() => {
        const delay = Math.min(
            RECONEXION_BASE * Math.pow(2, intentosRef.current),
            maxReconexion
        );
        intentosRef.current += 1;

        log.debug(`Reconectando en ${delay}ms (intento ${intentosRef.current})`);

        reconexionRef.current = window.setTimeout(() => {
            conectar();
        }, delay);
    }, [conectar, maxReconexion]);

    /*
     * Desconectar manualmente.
     */
    const desconectar = useCallback(() => {
        if (reconexionRef.current) {
            clearTimeout(reconexionRef.current);
            reconexionRef.current = null;
        }
        detenerHeartbeat();

        if (wsRef.current) {
            wsRef.current.onclose = null; /* Evitar reconexión */
            wsRef.current.close();
            wsRef.current = null;
        }
        setEstadoConexion('desconectado');
        intentosRef.current = 0;
    }, [detenerHeartbeat]);

    /* Auto-conectar cuando el usuario esté autenticado */
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
