/*
 * Hook: useGoogleAuth
 * Carga dinámicamente Google Identity Services y gestiona el flujo OAuth.
 * Usa el enfoque de credential (ID token) para autenticación segura.
 * El ID token se valida server-side en POST /auth/google.
 *
 * QK5: Usa renderButton() como mecanismo principal (abre popup, funciona
 * en incógnito). prompt() (One Tap) se mantiene como mejora UX opcional
 * para usuarios con sesión Google activa + cookies habilitadas.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
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
        renderButton: (parent: HTMLElement, options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with';
            logo_alignment?: 'left' | 'center';
            width?: number;
        }) => void;
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
 * Hook que inicializa Google Identity Services y expone:
 * - botonContenedorRef: callback ref para renderizar el botón de Google
 *   (popup nativo, funciona en incógnito sin third-party cookies).
 * - disparar: dispara One Tap (opcional, solo funciona con cookies activas).
 */
export function useGoogleAuth(onCredential: (credential: string) => void, skip = false) {
    const inicializadoRef = useRef(false);
    const callbackRef = useRef(onCredential);
    const [gsiListo, setGsiListo] = useState(false);
    callbackRef.current = onCredential;

    useEffect(() => {
        /* [2003A-17] En contextos nativos (desktop/APK) no cargar GSI.
         * El botón nativo usa PKCE o Capacitor, no el flujo de credenciales GSI. */
        if (skip) return;

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
            setGsiListo(true);
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
    }, [skip]);

    /*
     * QK5: Callback ref que renderiza el botón de Google cuando el nodo DOM
     * existe Y GSI está listo. renderButton crea un botón que al hacer click
     * abre un popup nativo de Google — funciona en incógnito sin third-party cookies.
     * Al cambiar gsiListo, React re-invoca el callback con el nodo → renderiza.
     */
    const botonContenedorRef = useCallback((nodo: HTMLDivElement | null) => {
        if (skip || !nodo || !gsiListo || !window.google?.accounts?.id) return;
        window.google.accounts.id.renderButton(nodo, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 300,
        });
    }, [gsiListo, skip]);

    /**
     * Dispara el popup de Google One Tap / Sign In.
     * Si GSI no está disponible, no hace nada (graceful degradation).
     */
    const disparar = useCallback(() => {
        if (skip) return; /* no-op en contextos nativos */
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

    return { disparar, botonContenedorRef };
}
