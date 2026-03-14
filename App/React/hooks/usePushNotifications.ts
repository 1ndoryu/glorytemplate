/*
 * Hook: usePushNotifications
 * Gestiona suscripción y permiso de notificaciones push (VAPID).
 * Se usa en ModalConfiguracion o similar para que el usuario active/desactive push.
 *
 * QK86: Notificaciones push self-hosted, sin Firebase.
 * Flujo: obtener VAPID key → registrar Service Worker → solicitar permiso →
 *        obtener PushSubscription → registrar en backend.
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerClaveVapid, registrarSuscripcionPush, eliminarSuscripcionPush } from '@app/services/apiPush';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('usePushNotifications');

interface EstadoPush {
    soportado: boolean;
    habilitado: boolean;
    permiso: NotificationPermission | 'unsupported';
    suscrito: boolean;
    cargando: boolean;
}

/**
 * Convierte la clave pública VAPID (base64url) a Uint8Array para la Push API.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const vista = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
        vista[i] = rawData.charCodeAt(i);
    }
    return vista;
}

/**
 * Detectar plataforma actual.
 */
function detectarPlataforma(): 'web' | 'android' | 'desktop' {
    if (window.__TAURI_INTERNALS__) {
        return /android/i.test(navigator.userAgent) ? 'android' : 'desktop';
    }
    return 'web';
}

export function usePushNotifications() {
    const [estado, setEstado] = useState<EstadoPush>({
        soportado: false,
        habilitado: false,
        permiso: 'unsupported',
        suscrito: false,
        cargando: true,
    });

    /* Verificar soporte y estado inicial */
    useEffect(() => {
        const verificar = async () => {
            /* Push API requiere Service Worker + Notification */
            const swSoportado = 'serviceWorker' in navigator;
            const notifSoportado = 'Notification' in window;
            const pushSoportado = 'PushManager' in window;

            if (!swSoportado || !notifSoportado || !pushSoportado) {
                setEstado(prev => ({
                    ...prev,
                    soportado: false,
                    cargando: false,
                }));
                return;
            }

            /* Verificar si el servidor tiene VAPID configurado */
            const resp = await obtenerClaveVapid();
            const habilitado = resp.ok && resp.data?.habilitado === true;

            /* Verificar si ya hay suscripción activa */
            let suscrito = false;
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                suscrito = sub !== null;
            } catch {
                /* SW no registrado o error — suscrito = false */
            }

            setEstado({
                soportado: true,
                habilitado,
                permiso: Notification.permission,
                suscrito,
                cargando: false,
            });
        };

        verificar();
    }, []);

    /**
     * Suscribirse a notificaciones push.
     * Solicita permiso al usuario, registra SW y envía suscripción al backend.
     */
    const suscribirse = useCallback(async (): Promise<boolean> => {
        setEstado(prev => ({ ...prev, cargando: true }));

        try {
            /* Obtener clave VAPID del servidor */
            const vapidResp = await obtenerClaveVapid();
            if (!vapidResp.ok || !vapidResp.data?.vapidKey) {
                log.error('No se pudo obtener clave VAPID');
                setEstado(prev => ({ ...prev, cargando: false }));
                return false;
            }

            /* Solicitar permiso de notificaciones */
            const permiso = await Notification.requestPermission();
            if (permiso !== 'granted') {
                log.info('Permiso de notificaciones denegado');
                setEstado(prev => ({
                    ...prev,
                    permiso,
                    cargando: false,
                }));
                return false;
            }

            /* Registrar Service Worker si no está registrado */
            const reg = await navigator.serviceWorker.ready;

            /* Suscribirse a Push */
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidResp.data.vapidKey),
            });

            /* Enviar suscripción al backend */
            const plataforma = detectarPlataforma();
            const resultado = await registrarSuscripcionPush(subscription, plataforma);

            if (resultado.ok) {
                log.info('Suscripción push registrada', { plataforma });
                setEstado(prev => ({
                    ...prev,
                    permiso: 'granted',
                    suscrito: true,
                    cargando: false,
                }));
                return true;
            }

            log.error('Error registrando suscripción en backend');
            setEstado(prev => ({ ...prev, cargando: false }));
            return false;
        } catch (err) {
            log.error('Error en suscripción push', err);
            setEstado(prev => ({ ...prev, cargando: false }));
            return false;
        }
    }, []);

    /**
     * Desuscribirse de notificaciones push.
     * Elimina suscripción del navegador y del backend.
     */
    const desuscribirse = useCallback(async (): Promise<boolean> => {
        setEstado(prev => ({ ...prev, cargando: true }));

        try {
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();

            if (subscription) {
                /* Eliminar del backend */
                await eliminarSuscripcionPush(subscription.endpoint);
                /* Eliminar del navegador */
                await subscription.unsubscribe();
            }

            setEstado(prev => ({
                ...prev,
                suscrito: false,
                cargando: false,
            }));
            return true;
        } catch (err) {
            log.error('Error desuscribiéndose de push', err);
            setEstado(prev => ({ ...prev, cargando: false }));
            return false;
        }
    }, []);

    return {
        ...estado,
        suscribirse,
        desuscribirse,
    };
}
