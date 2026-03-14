/*
 * Servicio de autenticación para desktop.
 * Usa el plugin store de Tauri para persistir el token JWT
 * de forma segura entre sesiones, con localStorage como
 * respaldo síncrono para defensa en profundidad (QK77).
 *
 * Flujo:
 * 1. Usuario hace login → servidor retorna JWT
 * 2. Guardamos JWT en Tauri Store (cifrado) + localStorage (backup)
 * 3. Al arrancar la app, restauramos JWT (Tauri Store → localStorage fallback)
 * 4. Si el token expira, redirigimos a login
 */

import { esDesktop } from './desktopService';
import { actualizarTokenApi, limpiarAuthApi } from './apiDesktopAdapter';
import { establecerTokenSync } from './syncGuards';
import { emitirCambioAuth } from './authDesktopEventos';

/* Clave del store seguro de Tauri */
const STORE_KEY_TOKEN = 'auth_token';
const STORE_KEY_USUARIO = 'auth_usuario';
const STORE_FILE = 'auth.json';

/* Claves localStorage — backup síncrono (QK77: defensa en profundidad) */
const LS_KEY_TOKEN = 'kamples_auth_token';
const LS_KEY_USUARIO = 'kamples_auth_usuario';

/* Token en memoria para acceso rápido (evita async en cada petición) */
let tokenEnMemoria: string | null = null;

/*
 * Helpers localStorage — operaciones seguras que nunca lanzan.
 * QK77: Backup síncrono para cuando Tauri Store falla silenciosamente.
 */
function lsGuardar(clave: string, valor: string): void {
    try { localStorage.setItem(clave, valor); } catch { /* quota o privado */ }
}
function lsLeer(clave: string): string | null {
    try { return localStorage.getItem(clave); } catch { return null; }
}
function lsEliminar(clave: string): void {
    try { localStorage.removeItem(clave); } catch { /* noop */ }
}

/*
 * Obtiene el token actual (sincrónico, desde memoria).
 */
export function obtenerToken(): string | null {
    return tokenEnMemoria;
}

/*
 * Setter del token en memoria — solo para uso interno de authDesktopEventos.
 */
export function setTokenEnMemoria(token: string | null): void {
    tokenEnMemoria = token;
}

/*
 * Inicializa la auth al arrancar la app.
 * Intenta restaurar desde Tauri Store (cifrado). Si falla, usa localStorage (QK77).
 * Configura el interceptor y sincroniza authStore para evitar flash de "no autenticado".
 */
export async function inicializarAuthDesktop(): Promise<void> {
    if (!esDesktop()) return;

    let token: string | null = null;
    let usuario: Record<string, unknown> | null = null;

    /* Intentar Tauri Store primero (persistencia cifrada) */
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        token = await store.get<string>(STORE_KEY_TOKEN);
        usuario = await store.get<Record<string, unknown>>(STORE_KEY_USUARIO) ?? null;

        if (token) {
            console.info('[AuthDesktop] Sesión restaurada desde Tauri Store');
            /* Sincronizar al localStorage como backup si no existía */
            lsGuardar(LS_KEY_TOKEN, token);
            if (usuario) lsGuardar(LS_KEY_USUARIO, JSON.stringify(usuario));
        } else {
            console.warn('[AuthDesktop] Tauri Store devolvió token null — intentando localStorage');
        }
    } catch (err) {
        console.warn('[AuthDesktop] Tauri Store falló — intentando localStorage:', err);
    }

    /* QK77: Fallback a localStorage si Tauri Store no devolvió token */
    if (!token) {
        const tokenLs = lsLeer(LS_KEY_TOKEN);
        if (tokenLs) {
            token = tokenLs;
            console.info('[AuthDesktop] Sesión restaurada desde localStorage (fallback)');

            const usuarioLs = lsLeer(LS_KEY_USUARIO);
            if (usuarioLs) {
                try { usuario = JSON.parse(usuarioLs); } catch { usuario = null; }
            }

            /* Re-sincronizar al Tauri Store en background para próxima carga */
            resincronizarATauriStore(token, usuario).catch(() => { /* best-effort */ });
        }
    }

    if (!token) {
        console.info('[AuthDesktop] Sin sesión persistida — usuario no autenticado');
        return;
    }

    /* Restaurar estado de auth con el token encontrado */
    tokenEnMemoria = token;
    actualizarTokenApi(token);
    establecerTokenSync(token);

    if (usuario) {
        const { useAuthStore } = await import(/* @vite-ignore */ '@app/stores/authStore');
        /* QK3: Datos cache parcial — marcar como no verificado */
        useAuthStore.getState().setUsuario(usuario as never, false);
    }

    /* Marcar isLoggedIn en GLORY_CONTEXT para que useInicializadorAuth
     * no sobreescriba el usuario con null al detectar ctx.isLoggedIn = undefined */
    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = true;
        ctx.userId = (usuario as Record<string, unknown>)?.wpUserId
            ?? (usuario as Record<string, unknown>)?.id ?? 1;
    }
}

/*
 * Re-sincroniza token/usuario al Tauri Store si se cargó desde localStorage.
 * Ejecutado en background, no bloquea el init.
 */
async function resincronizarATauriStore(
    token: string,
    usuario: Record<string, unknown> | null
): Promise<void> {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load(STORE_FILE);
    await store.set(STORE_KEY_TOKEN, token);
    if (usuario) await store.set(STORE_KEY_USUARIO, usuario);
    await store.save();
    console.info('[AuthDesktop] Re-sincronizado a Tauri Store desde localStorage');
}

/*
 * Guarda el token después de un login exitoso.
 * Persiste en Tauri Store (cifrado) + localStorage (backup síncrono QK77).
 */
export async function guardarToken(token: string): Promise<void> {
    tokenEnMemoria = token;
    actualizarTokenApi(token);
    establecerTokenSync(token);

    /* QK77: Backup síncrono inmediato — no depende de await */
    lsGuardar(LS_KEY_TOKEN, token);

    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_TOKEN, token);
        await store.save();
    } catch (err) {
        console.error('[AuthDesktop] Error guardando token en Tauri Store:', err);
    }

    emitirCambioAuth('login');
}

/*
 * Guarda datos del usuario autenticado.
 * Persiste en Tauri Store + localStorage (backup QK77).
 */
export async function guardarUsuario(usuario: Record<string, unknown>): Promise<void> {
    /* QK77: Backup síncrono inmediato */
    lsGuardar(LS_KEY_USUARIO, JSON.stringify(usuario));

    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_USUARIO, usuario);
        await store.save();
    } catch (err) {
        console.error('[AuthDesktop] Error guardando usuario en Tauri Store:', err);
    }
}

/*
 * Obtiene datos del usuario guardado.
 * Intenta Tauri Store primero, fallback a localStorage (QK77).
 */
export async function obtenerUsuarioGuardado(): Promise<Record<string, unknown> | null> {
    if (!esDesktop()) return null;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const usuario = await store.get<Record<string, unknown>>(STORE_KEY_USUARIO);
        if (usuario) return usuario;
    } catch { /* Tauri Store falló — intentar localStorage */ }

    /* QK77: Fallback localStorage */
    const raw = lsLeer(LS_KEY_USUARIO);
    if (raw) {
        try { return JSON.parse(raw); } catch { /* JSON corrupto */ }
    }
    return null;
}

/*
 * Cierra la sesión: limpia token de memoria, store, localStorage, fetch interceptor y tracking de sync.
 * C286: Al cerrar sesión, limpiar el tracking de sync para que al loguearse
 * con otra cuenta no se operen sobre colecciones/archivos ajenos (403).
 */
export async function cerrarSesionDesktop(): Promise<void> {
    tokenEnMemoria = null;
    limpiarAuthApi();
    establecerTokenSync(null);

    /* QK77: Limpiar backup localStorage */
    lsEliminar(LS_KEY_TOKEN);
    lsEliminar(LS_KEY_USUARIO);

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
