/*
 * Hook: useNotificacionesNativas
 * Escucha eventos WebSocket y muestra notificaciones nativas del sistema
 * cuando la app corre en Tauri (Android/desktop).
 *
 * Se monta una vez en InicializadorAuth, junto a useWebSocket.
 * Solo se activa si estamos en Tauri y el usuario está autenticado.
 *
 * Flujo:
 * 1. Al montar: inicializa canales Android y solicita permiso.
 * 2. Suscribe handlers WS para 'notificacion' y 'mensaje_nuevo'.
 * 3. Al recibir evento: muestra notificación nativa via tauri-plugin-notification.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { wsService } from '@app/services/wsService';
import {
    inicializarCanalesNotificacion,
    mostrarNotificacionNativa,
    mostrarNotificacionMensaje,
} from '@app/services/notificacionNativa';
import { registrarTokenFcmSiDisponible } from '@app/services/fcmToken';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useNotificacionesNativas');

/* Solo activar en entorno Tauri */
const esTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const useNotificacionesNativas = (): void => {
    const autenticado = useAuthStore(s => s.autenticado);
    const inicializadoRef = useRef(false);

    /* Inicializar canales una sola vez cuando el usuario se autentica en Tauri */
    useEffect(() => {
        if (!esTauri || !autenticado || inicializadoRef.current) return;

        inicializarCanalesNotificacion().then(ok => {
            if (ok) {
                inicializadoRef.current = true;
                log.info('Notificaciones nativas inicializadas');
            }
        });

        /* QL34: Registrar token FCM en backend (Android) */
        registrarTokenFcmSiDisponible();
    }, [autenticado]);

    /* Suscribir a eventos WS para despachar notificaciones nativas */
    useEffect(() => {
        if (!esTauri || !autenticado) return;

        const unsubNotif = wsService.on('notificacion', (datos: unknown) => {
            mostrarNotificacionNativa(datos as Record<string, unknown>);
        });

        const unsubMsg = wsService.on('mensaje_nuevo', (datos: unknown) => {
            mostrarNotificacionMensaje(datos as Record<string, unknown>);
        });

        return () => {
            unsubNotif();
            unsubMsg();
        };
    }, [autenticado]);
};
