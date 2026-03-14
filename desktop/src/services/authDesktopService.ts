/*
 * Servicio de autenticación para desktop.
 * Usa el plugin store de Tauri para persistir el token JWT
 * de forma segura entre sesiones.
 *
 * Flujo:
 * 1. Usuario hace login → servidor retorna JWT
 * 2. Guardamos JWT en Tauri Store (cifrado en disco)
 * 3. Al arrancar la app, restauramos JWT y lo inyectamos en fetch
 * 4. Si el token expira, redirigimos a login
 */

import { esDesktop } from './desktopService';
import { actualizarTokenApi, limpiarAuthApi } from './apiDesktopAdapter';
import { establecerTokenSync } from './syncGuards';

/* Clave del store seguro de Tauri */
const STORE_KEY_TOKEN = 'auth_token';
const STORE_KEY_USUARIO = 'auth_usuario';
const STORE_FILE = 'auth.json';

/* Evento Tauri para sincronizar auth entre ventanas (main ↔ sync-panel) */
const EVENTO_AUTH_CAMBIADA = 'auth-cambiada';

/* Token en memoria para acceso rápido (evita async en cada petición) */
let tokenEnMemoria: string | null = null;

/*
 * Obtiene el token actual (sincrónico, desde memoria).
 */
export function obtenerToken(): string | null {
    return tokenEnMemoria;
}

/*
 * Inicializa la auth al arrancar la app.
 * Lee token Y usuario del store de Tauri, configura el interceptor
 * y sincroniza authStore para evitar el flash de "no autenticado".
 */
export async function inicializarAuthDesktop(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const token = await store.get<string>(STORE_KEY_TOKEN);

        if (token) {
            tokenEnMemoria = token;
            actualizarTokenApi(token);
            establecerTokenSync(token);

            /* Leer usuario cacheado y poblar authStore ANTES de que React monte.
             * Esto elimina el flash de "no autenticado" (el roundtrip a /me tardaba ~300ms+). */
            const usuario = await store.get<Record<string, unknown>>(STORE_KEY_USUARIO);
            if (usuario) {
                /* Importar authStore dinámicamente para evitar dependencia circular */
                const { useAuthStore } = await import(/* @vite-ignore */ '@app/stores/authStore');
                /* QK3: Datos del Tauri Store son cache parcial (pueden no incluir
                 * generosPreferidos). Marcar como no verificado para que
                 * el modal de generos no destelle con datos incompletos. */
                useAuthStore.getState().setUsuario(usuario as never, false);
            }

            /* Marcar isLoggedIn en GLORY_CONTEXT para que useInicializadorAuth
             * no sobreescriba el usuario con null al detectar ctx.isLoggedIn = undefined */            const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;            if (ctx) {
                ctx.isLoggedIn = true;
                ctx.userId = (usuario as Record<string, unknown>)?.wpUserId ?? (usuario as Record<string, unknown>)?.id ?? 1;
            }
        }
    } catch (err) {
        console.warn('[AuthDesktop] No se pudo restaurar sesión:', err);
    }
}

/*
 * Guarda el token después de un login exitoso.
 */
export async function guardarToken(token: string): Promise<void> {
    tokenEnMemoria = token;
    actualizarTokenApi(token);
    establecerTokenSync(token);

    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_TOKEN, token);
        await store.save();
    } catch (err) {
        console.error('[AuthDesktop] Error guardando token:', err);
    }

    emitirCambioAuth('login');
}

/*
 * Guarda datos del usuario autenticado.
 */
export async function guardarUsuario(usuario: Record<string, unknown>): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_USUARIO, usuario);
        await store.save();
    } catch (err) {
        console.error('[AuthDesktop] Error guardando usuario:', err);
    }
}

/*
 * Obtiene datos del usuario guardado.
 */
export async function obtenerUsuarioGuardado(): Promise<Record<string, unknown> | null> {
    if (!esDesktop()) return null;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        return await store.get<Record<string, unknown>>(STORE_KEY_USUARIO) ?? null;
    } catch {
        return null;
    }
}

/*
 * Cierra la sesión: limpia token de memoria, store, fetch interceptor y tracking de sync.
 * C286: Al cerrar sesión, limpiar el tracking de sync para que al loguearse
 * con otra cuenta no se operen sobre colecciones/archivos ajenos (403).
 */
export async function cerrarSesionDesktop(): Promise<void> {
    tokenEnMemoria = null;
    limpiarAuthApi();
    establecerTokenSync(null);

    /* QK1: Detener sync watcher ANTES de limpiar tracking.
     * Sin esto, el watcher sigue polling con token null → 401 infinito. */
    try {
        const { detenerSyncBidireccional } = await import('./syncWatcherSetup');
        await detenerSyncBidireccional();
    } catch {
        /* Sync no inicializado — nada que detener */
    }

    /* C286: Limpiar tracking sync para evitar contaminación cross-usuario */
    try {
        const { resetearTracking } = await import('./syncTrackingService');
        await resetearTracking();
    } catch {
        /* Tracking no inicializado — nada que limpiar */
    }

    /* QK1: Limpiar GLORY_CONTEXT para evitar que useInicializadorAuth
     * detecte isLoggedIn=true del usuario anterior al recargar. */
    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = false;
        ctx.userId = undefined;
    }

    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.delete(STORE_KEY_TOKEN);
        await store.delete(STORE_KEY_USUARIO);
        await store.save();
    } catch (err) {
        console.error('[AuthDesktop] Error cerrando sesión:', err);
    }

    emitirCambioAuth('logout');
}

/*
 * Emite evento cross-window para que las demas ventanas se sincronicen.
 * Usa el sistema de eventos de Tauri: emitTo('*') llega a todas las ventanas.
 */
function emitirCambioAuth(tipo: 'login' | 'logout'): void {
    import('@tauri-apps/api/event').then(({ emit }) => {
        emit(EVENTO_AUTH_CAMBIADA, { tipo }).catch(() => {
            /* Silencioso: entorno no-Tauri o ventana ya cerrada */
        });
    }).catch(() => { /* Silencioso */ });
}

/* Guard para evitar re-entrancia en el listener de eventos */
let procesandoEventoAuth = false;

/*
 * Escucha cambios de auth emitidos por otras ventanas y re-sincroniza.
 * Debe llamarse una vez en cada ventana (main y sync-panel).
 * Si la ventana emisora es la misma que recibe, ignora el evento
 * (ya se actualizo localmente en guardarToken/cerrarSesion).
 */
export async function escucharCambiosAuth(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { listen } = await import('@tauri-apps/api/event');
        await listen<{ tipo: 'login' | 'logout' }>(EVENTO_AUTH_CAMBIADA, async (evento) => {
            if (procesandoEventoAuth) return;
            procesandoEventoAuth = true;

            try {
                if (evento.payload.tipo === 'login') {
                    /* Otra ventana hizo login — re-leer token y usuario del store */
                    const { load } = await import('@tauri-apps/plugin-store');
                    const store = await load(STORE_FILE);
                    const token = await store.get<string>(STORE_KEY_TOKEN);

                    if (token && token !== tokenEnMemoria) {
                        tokenEnMemoria = token;
                        actualizarTokenApi(token);
                        establecerTokenSync(token);

                        /* Actualizar authStore con el usuario recien guardado */
                        const usuario = await store.get<Record<string, unknown>>(STORE_KEY_USUARIO);
                        if (usuario) {
                            const { useAuthStore } = await import('@app/stores/authStore');
                            useAuthStore.getState().setUsuario(usuario as never, false);
                        }

                        const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
                        if (ctx) {
                            ctx.isLoggedIn = true;
                            ctx.userId = (usuario as Record<string, unknown> | null)?.wpUserId
                                ?? (usuario as Record<string, unknown> | null)?.id ?? 1;
                        }
                    }
                } else if (evento.payload.tipo === 'logout') {
                    /* Otra ventana cerro sesion — limpiar estado local */
                    if (tokenEnMemoria) {
                        tokenEnMemoria = null;
                        limpiarAuthApi();
                        establecerTokenSync(null);

                        const { useAuthStore } = await import('@app/stores/authStore');
                        useAuthStore.getState().cerrarSesion();

                        const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
                        if (ctx) {
                            ctx.isLoggedIn = false;
                            ctx.userId = undefined;
                        }
                    }
                }
            } finally {
                procesandoEventoAuth = false;
            }
        });
    } catch {
        /* Entorno no-Tauri */
    }
}
