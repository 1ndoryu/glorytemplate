/*
 * Hook: useGoogleAuth
 * Carga dinámicamente Google Identity Services y gestiona el flujo OAuth.
 * Usa el enfoque de credential (ID token) para autenticación segura.
 * El ID token se valida server-side en POST /auth/google.
 */

import { useEffect, useRef, useCallback } from 'react';
import { crearLogger } from '../services/logger';

const log = crearLogger('useGoogleAuth');

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/* Tipado mínimo del SDK de Google Identity Services */
interface GoogleCredentialResponse {
    credential: string;
    select_by?: string;
}

interface GoogleAccounts {
    id: {
        initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
        }) => void;
        prompt: (notification?: (n: { isNotDisplayed: () => boolean }) => void) => void;
    };
}

declare global {
    interface Window {
        google?: { accounts: GoogleAccounts };
    }
}

/**
 * Obtiene el Google Client ID inyectado por PHP en GLORY_CONTEXT.
 * Es un valor público (aparece en el HTML), no un secreto.
 */
function obtenerClientId(): string | null {
    const ctx = (window as unknown as Record<string, unknown>).GLORY_CONTEXT as
        | { googleClientId?: string }
        | undefined;
    return ctx?.googleClientId ?? null;
}

/**
 * Hook que inicializa Google Identity Services y expone un método
 * para disparar el flujo OAuth. Retorna el credential (ID token)
 * vía el callback proporcionado.
 */
export function useGoogleAuth(onCredential: (credential: string) => void) {
    const inicializadoRef = useRef(false);
    const callbackRef = useRef(onCredential);
    callbackRef.current = onCredential;

    useEffect(() => {
        const clientId = obtenerClientId();
        if (!clientId) {
            log.debug('Google Client ID no disponible en GLORY_CONTEXT');
            return;
        }

        /* Evitar doble inicialización */
        if (inicializadoRef.current) return;

        const inicializarGSI = () => {
            if (!window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: GoogleCredentialResponse) => {
                    callbackRef.current(response.credential);
                },
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            inicializadoRef.current = true;
            log.debug('Google Identity Services inicializado');
        };

        /* Si el script ya está cargado, inicializar directamente */
        if (window.google?.accounts?.id) {
            inicializarGSI();
            return;
        }

        /* Cargar script de GSI dinámicamente */
        const existente = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
        if (existente) {
            existente.addEventListener('load', inicializarGSI);
            return;
        }

        const script = document.createElement('script');
        script.src = GSI_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = inicializarGSI;
        script.onerror = () => log.error('Error cargando Google Identity Services script');
        document.head.appendChild(script);
    }, []);

    /**
     * Dispara el popup de Google One Tap / Sign In.
     * Si GSI no está disponible, no hace nada (graceful degradation).
     */
    const disparar = useCallback(() => {
        if (!window.google?.accounts?.id) {
            log.warn('Google Identity Services no disponible');
            return;
        }
        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
                log.debug('Google One Tap no se mostró — puede ser bloqueado por el navegador o configuración');
            }
        });
    }, []);

    return { disparar };
}
