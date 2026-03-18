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
 * 4. QL45: Al volver a primer plano en Android, procesa click-to-navigate de FCM.
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
import { procesarNavegacionFcm } from '@app/services/navegacionFcm';
import { crearLogger } from '@app/services/logger';
import { esAndroid, esTauri } from '@app/utils/plataforma';

const log = crearLogger('useNotificacionesNativas');

export const useNotificacionesNativas = (): void => {
    const autenticado = useAuthStore(s => s.autenticado);
    const inicializadoRef = useRef(false);

    /* Inicializar canales una sola vez cuando el usuario se autentica en Tauri */
    useEffect(() => {
        if (!autenticado || inicializadoRef.current) return;

        if (esTauri()) {
            inicializarCanalesNotificacion().then(ok => {
                if (ok) {
                    inicializadoRef.current = true;
                    log.info('Notificaciones nativas inicializadas');
                }
            });
        } else if (esAndroid()) {
            inicializadoRef.current = true;
        } else {
            return;
        }

        /* QL34/173A-8: Registrar token FCM en backend para Android Tauri o Capacitor */
        registrarTokenFcmSiDisponible();
    }, [autenticado]);

    /* Suscribir a eventos WS para despachar notificaciones nativas */
    useEffect(() => {
        if (!esTauri() || !autenticado) return;

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

    /* QL45: Procesar click-to-navigate de FCM al volver a primer plano (Android) */
    useEffect(() => {
        if ((!esTauri() && !esAndroid()) || !autenticado) return;

        const manejarVisibilidad = () => {
            if (document.visibilityState === 'visible') {
                procesarNavegacionFcm();
            }
        };

        /* Verificar al montar (en caso de que la app se abriera desde la notificacion) */
        procesarNavegacionFcm();

        document.addEventListener('visibilitychange', manejarVisibilidad);
        return () => {
            document.removeEventListener('visibilitychange', manejarVisibilidad);
        };
    }, [autenticado]);
};
