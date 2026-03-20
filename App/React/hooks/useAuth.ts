/*
 * Hook: useAuth
 * Gestión centralizada de autenticación.
 * Conecta el store de auth con las llamadas a la API.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAuthModalStore } from '../stores/authModalStore';
import { obtenerUsuarioActual, login, registrar as apiRegistrar, loginConGoogle, cerrarSesion as apiCerrarSesion } from '../services/apiAuth';
import { crearLogger } from '../services/logger';
import { useNavigationStore } from '@/core/router/navigationStore';
import { useGoogleAuth } from './useGoogleAuth';
import { useTooltipPerfilStore } from '../stores/tooltipPerfilStore';
import type { UsuarioAutenticado } from '../types/usuario';
import { esAndroid, esCapacitor } from '../utils/plataforma';

const log = crearLogger('useAuth');
const LS_KEY_TOKEN = 'kamples_auth_token';
const LS_KEY_USUARIO = 'kamples_auth_usuario';

/*
 * QK1: Limpia todos los Zustand stores que contienen datos de usuario.
 * Evita fuga de datos entre cuentas tras logout (cache perfiles,
 * notificaciones, mensajes, reproducidos, etc.).
 * [2003A-15] Exportada para que TopBar.tsx la llame en sus logout handlers.
 */
export function limpiarStoresUsuario(): void {
    /* Cache de perfiles hover (incluye estado de seguimiento) */
    useTooltipPerfilStore.getState().limpiarCache();
    useTooltipPerfilStore.getState().cancelarTodo();

    /* Imports dinámicos para stores opcionales — si no están cargados, nada que limpiar */
    try {
        /* eslint-disable @typescript-eslint/no-require-imports */
        const { useNotificacionesStore } = require('../stores/notificacionesStore') as {
            useNotificacionesStore: { getState: () => { hidratarNotificaciones: (n: never[], s?: boolean) => void } }
        };
        useNotificacionesStore.getState().hidratarNotificaciones([], true);
    } catch { /* store no cargado */ }

    try {
        const { useMensajesStore } = require('../stores/mensajesStore') as {
            useMensajesStore: { getState: () => { setConversaciones: (c: never[]) => void; setMensajes: (m: never[]) => void } }
        };
        const s = useMensajesStore.getState();
        s.setConversaciones([]);
        s.setMensajes([]);
    } catch { /* store no cargado */ }

    try {
        const { useReproducidosStore } = require('../stores/reproducidosStore') as {
            useReproducidosStore: { setState: (s: { ids: Set<number>; cargado: boolean }) => void }
        };
        useReproducidosStore.setState({ ids: new Set(), cargado: false });
    } catch { /* store no cargado */ }
}

/*
 * QK77-A: Persiste token y usuario via la interfaz global de desktop.
 * En desktop, main.tsx registra las funciones de authDesktopService en
 * window.__KAMPLES_AUTH_PERSIST__. Esto evita dynamic imports frágiles
 * con @vite-ignore que fallaban silenciosamente en ciertos builds.
 * En web, la interfaz no existe y el early return actúa como no-op.
 */
interface AuthPersistInterface {
    guardarToken: (token: string) => Promise<void>;
    guardarUsuario: (usuario: Record<string, unknown>) => Promise<void>;
    cerrarSesionDesktop: () => Promise<void>;
}

function obtenerPersistorDesktop(): AuthPersistInterface | null {
    return (window as unknown as Record<string, unknown>).__KAMPLES_AUTH_PERSIST__ as AuthPersistInterface | null ?? null;
}

async function persistirTokenDesktop(token: string, usuario: UsuarioAutenticado | null): Promise<void> {
    const persistor = obtenerPersistorDesktop();
    if (persistor) {
        await persistor.guardarToken(token);
        if (usuario) await persistor.guardarUsuario(usuario as unknown as Record<string, unknown>);
        return;
    }

    try {
        localStorage.setItem(LS_KEY_TOKEN, token);
        if (usuario) {
            localStorage.setItem(LS_KEY_USUARIO, JSON.stringify(usuario));
        }
    } catch (err) {
        log.warn('No se pudo persistir la sesión nativa', err);
    }

    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx && usuario) {
        ctx.isLoggedIn = true;
        ctx.userId = usuario.wpUserId ?? usuario.id ?? 1;
    }
}

function limpiarSesionNativa(): void {
    try {
        localStorage.removeItem(LS_KEY_TOKEN);
        localStorage.removeItem(LS_KEY_USUARIO);
    } catch {
        /* noop */
    }

    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = false;
        ctx.userId = undefined;
    }
}

interface DatosRegistro {
    nombreVisible: string;
    username: string;
    email: string;
    password: string;
}

export const useAuth = () => {
    const usuario = useAuthStore(s => s.usuario);
    const cargandoStore = useAuthStore(s => s.cargando);
    const autenticado = useAuthStore(s => s.autenticado);
    const setUsuario = useAuthStore(s => s.setUsuario);
    const cerrarSesion = useAuthStore(s => s.cerrarSesion);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const esDesktopApp = !!(window as unknown as Record<string, unknown>).__KAMPLES_DESKTOP__;

    /* [183A-19] Detección reactiva de Capacitor.
     * Capacitor puede no estar inyectado en el primer render de hydration (timing race).
     * Se evalúa al montar para garantizar que el botón Google nativo aparezca en Android. */
    const [esAndroidCapacitorEstado, setEsAndroidCapacitorEstado] = useState(() => esCapacitor() && esAndroid());
    useEffect(() => {
        const valorActual = esCapacitor() && esAndroid();
        if (valorActual !== esAndroidCapacitorEstado) {
            setEsAndroidCapacitorEstado(valorActual);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const esAndroidCapacitor = esAndroidCapacitorEstado;
    const esGoogleNativo = esDesktopApp || esAndroidCapacitor;

    /* Cargar usuario actual al montar */
    useEffect(() => {
        const verificar = async () => {
            try {
                const resp = await obtenerUsuarioActual();
                if (resp.ok && resp.data) {
                    setUsuario(resp.data as unknown as UsuarioAutenticado);
                }
            } catch (err) {
                log.debug('No hay sesión activa');
            }
        };

        if (!autenticado) {
            verificar();
        }
    }, [autenticado, setUsuario]);

    const iniciarSesion = useCallback(async (email: string, password: string) => {
        setError(null);
        setCargando(true);

        try {
            const resp = await login(email, password);

            if (resp.ok && resp.data) {
                /* El backend retorna { token, usuario } dentro de data */
                const datos = resp.data as unknown as { token?: string; usuario?: UsuarioAutenticado };
                const usuarioResp = datos.usuario ?? (resp.data as unknown as UsuarioAutenticado);
                setUsuario(usuarioResp);

                /* En desktop (Tauri): guardar JWT ANTES de redirigir.
                 * El await es crítico: sin él, window.location.href recarga la página
                 * antes de que el token quede persistido en el Tauri Store,
                 * y configurarApiDesktop() lo lee como null en la siguiente carga. */
                if (datos.token && esGoogleNativo) {
                    await persistirTokenDesktop(datos.token, datos.usuario ?? null);
                }

                /* Cerrar modal de auth antes de navegar */
                useAuthModalStore.getState().cerrar();

                /* Web: recarga completa para obtener nuevo nonce en GLORY_CONTEXT.
                 * Sin recarga, el nonce del guest queda obsoleto y las peticiones al
                 * feed fallan auth justo después del login (bug 523).
                 * Desktop (Tauri): SPA navigation — window.location.href causa re-init
                 * y pierde el token antes de persistirlo. */
                if (esGoogleNativo) {
                    useNavigationStore.getState().navegar('/');
                } else {
                    window.location.href = '/';
                }
            } else {
                setError(resp.error ?? 'Credenciales incorrectas');
            }
        } catch (err) {
            log.error('Error en login', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [esGoogleNativo, setUsuario]);

    const registrar = useCallback(async (datos: DatosRegistro) => {
        setError(null);
        setCargando(true);

        try {
            const resp = await apiRegistrar({
                username: datos.username,
                email: datos.email,
                password: datos.password,
                nombreVisible: datos.nombreVisible,
            });

            if (resp.ok && resp.data) {
                /* El backend retorna { token, usuario } dentro de data */
                const datos = resp.data as unknown as { token?: string; usuario?: UsuarioAutenticado };
                const usuarioResp = datos.usuario ?? (resp.data as unknown as UsuarioAutenticado);
                setUsuario(usuarioResp);

                /* En desktop (Tauri): guardar JWT ANTES de navegar */
                if (datos.token && esGoogleNativo) {
                    await persistirTokenDesktop(datos.token, datos.usuario ?? null);
                }

                /* Cerrar modal de auth antes de navegar */
                useAuthModalStore.getState().cerrar();

                /* Mismo patrón que iniciarSesion: recarga en web para nonce fresco */
                if (esGoogleNativo) {
                    useNavigationStore.getState().navegar('/');
                } else {
                    window.location.href = '/';
                }
            } else {
                setError(resp.error ?? 'Error al crear la cuenta');
            }
        } catch (err) {
            log.error('Error en registro', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [esGoogleNativo, setUsuario]);

    const manejarCredencialGoogle = useCallback(async (credential: string) => {
        setError(null);
        setCargando(true);

        try {
            const resp = await loginConGoogle(credential);

            if (resp.ok && resp.data) {
                const datos = resp.data as unknown as { token?: string; usuario?: UsuarioAutenticado };
                const usuarioResp = datos.usuario ?? (resp.data as unknown as UsuarioAutenticado);
                setUsuario(usuarioResp);

                if (datos.token && esGoogleNativo) {
                    await persistirTokenDesktop(datos.token, datos.usuario ?? null);
                }

                useAuthModalStore.getState().cerrar();

                if (esGoogleNativo) {
                    useNavigationStore.getState().navegar('/');
                } else {
                    window.location.href = '/';
                }
            } else {
                setError(resp.error ?? 'Error al iniciar sesión con Google');
            }
        } catch (err) {
            log.error('Error en login con Google', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [esGoogleNativo, setUsuario]);

    /* GSI: disparar popup de Google Sign-In — solo activo en web. Skip en native (2003A-17). */
    const { disparar: dispararGoogle, botonContenedorRef: googleBotonRef } = useGoogleAuth(manejarCredencialGoogle, esGoogleNativo);

    const iniciarSesionGoogle = useCallback(() => {
        log.info('Iniciando flujo OAuth Google (web)');
        dispararGoogle();
    }, [dispararGoogle]);

    /*
     * Desktop: abre el browser del sistema con Google OAuth PKCE.
     * La implementación se inyecta en window.__KAMPLES_GOOGLE_OAUTH__ por main.tsx
     * del desktop, siguiendo el patrón de inyección de dependencias del proyecto
     * (igual que __KAMPLES_AUTH_PERSIST__, __KAMPLES_SYNC__, etc.).
     * Esto evita imports directos de código Tauri en hooks compartidos web/desktop.
     */
    const loginGoogleNativo = useCallback(async () => {
        setError(null);
        setCargando(true);
        try {
            const datos = esDesktopApp
                ? await ((window as unknown as Record<string, unknown>).__KAMPLES_GOOGLE_OAUTH__ as
                    | (() => Promise<{ token: string; usuario: UsuarioAutenticado }>)
                    | undefined)?.()
                : await (async () => {
                    const { iniciarGoogleOAuthCapacitor } = await import('../services/googleAuthMobileCapacitor');
                    return iniciarGoogleOAuthCapacitor();
                })();

            if (!datos) {
                throw new Error('Google OAuth nativo no disponible');
            }

            setUsuario(datos.usuario);

            if (datos.token) {
                await persistirTokenDesktop(datos.token, datos.usuario ?? null);
            }

            useAuthModalStore.getState().cerrar();
            useNavigationStore.getState().navegar('/');
        } catch (err) {
            log.error('Error en Google OAuth nativo', err);
            setError('No se pudo completar la autenticación con Google. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [esDesktopApp, setUsuario]);

    const logout = useCallback(async () => {
        /*
         * QQ141: Orden critico — cerrar sesion WP ANTES de limpiar JWT desktop.
         * apiCerrarSesion necesita el Authorization header activo para destruir la sesion.
         */
        try { await apiCerrarSesion(); } catch { /* best effort */ }

        /* QK77-A: Usa interfaz global en vez de dynamic import frágil */
        const persistor = obtenerPersistorDesktop();
        if (persistor) {
            try { await persistor.cerrarSesionDesktop(); } catch { /* noop en web */ }
        }
        limpiarSesionNativa();
        cerrarSesion();

        /* QK1: Limpiar stores con datos de usuario para evitar fuga
         * de datos entre cuentas (cache perfiles, notificaciones, mensajes, etc.). */
        limpiarStoresUsuario();

        useNavigationStore.getState().navegar('/');
    }, [cerrarSesion]);

    return {
        usuario,
        autenticado,
        cargando: cargando || cargandoStore,
        error,
        iniciarSesion,
        registrar,
        iniciarSesionGoogle,
        loginGoogleNativo,
        googleBotonRef: esGoogleNativo ? null : googleBotonRef,
        esDesktopApp,
        esGoogleNativo,
        logout,
    };
};
