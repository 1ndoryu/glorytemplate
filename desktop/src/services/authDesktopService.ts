/*
 * Servicio de autenticación para desktop.
 * Tauri Store (cifrado) + localStorage (backup síncrono QK77).
 * QK77-A: Logging diagnóstico + verificación de escrituras +
 *          llamada /me pre-React si usuario no está cacheado.
 */

import { esDesktop } from './desktopService';
import { actualizarTokenApi, limpiarAuthApi } from './apiDesktopAdapter';
import { establecerTokenSync } from './syncGuards';
import { emitirCambioAuth } from './authDesktopEventos';
import type { UsuarioAutenticado } from '@app/types/usuario';

/* Clave del store seguro de Tauri */
const STORE_KEY_TOKEN = 'auth_token';
const STORE_KEY_USUARIO = 'auth_usuario';
const STORE_FILE = 'auth.json';

/* Claves localStorage — backup síncrono (QK77: defensa en profundidad) */
const LS_KEY_TOKEN = 'kamples_auth_token';
const LS_KEY_USUARIO = 'kamples_auth_usuario';

/* Token en memoria para acceso rápido (evita async en cada petición) */
let tokenEnMemoria: string | null = null;

/* Helpers localStorage — QK77-A: verificación de escritura + logging de fallos */
function lsGuardar(clave: string, valor: string): boolean {
    try {
        localStorage.setItem(clave, valor);
        const guardado = localStorage.getItem(clave);
        if (guardado !== valor) {
            console.error(`[AuthDesktop] LS verificación falló: ${clave}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`[AuthDesktop] LS setItem falló: ${clave}`, err);
        return false;
    }
}
function lsLeer(clave: string): string | null {
    try { return localStorage.getItem(clave); } catch (err) {
        console.error(`[AuthDesktop] LS getItem falló: ${clave}`, err);
        return null;
    }
}
function lsEliminar(clave: string): void {
    try { localStorage.removeItem(clave); } catch { /* noop */ }
}

/* Token en memoria para acceso rápido (evita async en cada petición) */
export function obtenerToken(): string | null { return tokenEnMemoria; }

/* Setter del token en memoria — solo para authDesktopEventos */
export function setTokenEnMemoria(token: string | null): void { tokenEnMemoria = token; }

/*
 * Restaura auth al arrancar. Tauri Store → localStorage fallback.
 * QK77-A: Si hay token sin usuario, llama /me ANTES de montar React.
 */
export async function inicializarAuthDesktop(): Promise<void> {
    if (!esDesktop()) return;

    /* Diagnóstico: verificar que localStorage funciona */
    const lsFuncional = (() => {
        try {
            localStorage.setItem('_kamples_diag', 'ok');
            const ok = localStorage.getItem('_kamples_diag') === 'ok';
            localStorage.removeItem('_kamples_diag');
            return ok;
        } catch { return false; }
    })();
    console.info('[AuthDesktop] Init — LS:', lsFuncional ? 'OK' : 'FALLÓ',
        '| tokenLS:', !!lsLeer(LS_KEY_TOKEN), '| userLS:', !!lsLeer(LS_KEY_USUARIO));

    let token: string | null = null;
    let usuario: Record<string, unknown> | null = null;

    /* [2003A-15] Flag para saber si el Tauri Store cargó bien.
     * Si cargó y no tiene token → el usuario hizo logout → NO restaurar desde localStorage.
     * WebView2 puede no flushear removeItem() a disco si la app se cierra rápido,
     * dejando un token zombie en localStorage que restauraría la sesión cerrada. */
    let tauriStoreCargado = false;

    /* Tauri Store primero */
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        token = await store.get<string>(STORE_KEY_TOKEN) ?? null;
        usuario = await store.get<Record<string, unknown>>(STORE_KEY_USUARIO) ?? null;
        tauriStoreCargado = true;
        console.info('[AuthDesktop] TauriStore — token:', !!token, '| user:', !!usuario);

        if (token) {
            lsGuardar(LS_KEY_TOKEN, token);
            if (usuario) lsGuardar(LS_KEY_USUARIO, JSON.stringify(usuario));
        } else {
            /* [2003A-15] Tauri Store vacío = logout confirmado. Limpiar localStorage
             * por si conserva un token zombie que no se flusheó a disco. */
            lsEliminar(LS_KEY_TOKEN);
            lsEliminar(LS_KEY_USUARIO);
        }
    } catch (err) {
        console.warn('[AuthDesktop] Tauri Store falló — intentando localStorage:', err);
    }

    /* [2003A-15] Fallback a localStorage SOLO si Tauri Store no pudo cargar (crash/corrupción).
     * Si cargó pero no tiene token, el usuario cerró sesión — no restaurar desde LS. */
    if (!token && !tauriStoreCargado) {
        const tokenLs = lsLeer(LS_KEY_TOKEN);
        if (tokenLs) {
            token = tokenLs;
            console.info('[AuthDesktop] Token restaurado desde LS (fallback — TauriStore inaccesible)');
            const usuarioLs = lsLeer(LS_KEY_USUARIO);
            if (usuarioLs) { try { usuario = JSON.parse(usuarioLs); } catch { usuario = null; } }
            resincronizarATauriStore(token, usuario).catch(() => {});
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

    /*
     * QK77-A: Token sin usuario cached → obtener de /me ANTES de React.
     * Evita race conditions con useInicializadorAuth.
     */
    if (!usuario) {
        console.info('[AuthDesktop] Token OK pero sin usuario — llamando /me');
        try {
            const { obtenerUsuarioActual } = await import(/* @vite-ignore */ '@app/services/apiAuth');
            const resp = await obtenerUsuarioActual();
            if (resp.ok && resp.data) {
                usuario = resp.data as unknown as Record<string, unknown>;
                guardarUsuario(usuario);
            } else {
                console.warn('[AuthDesktop] /me sin datos:', resp.error ?? 'desconocido');
            }
        } catch (err) {
            console.warn('[AuthDesktop] /me falló:', err);
        }
    }

    if (usuario) {
        const { useAuthStore } = await import(/* @vite-ignore */ '@app/stores/authStore');
        useAuthStore.getState().setUsuario(usuario as never, false);
    }

    /* GLORY_CONTEXT para useInicializadorAuth */
    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = true;
        ctx.userId = (usuario as Record<string, unknown>)?.wpUserId
            ?? (usuario as Record<string, unknown>)?.id ?? 1;
    }

    console.info('[AuthDesktop] Init OK — token: true, user:', !!usuario);
}

/* Re-sincroniza token/usuario al Tauri Store desde localStorage (background) */
async function resincronizarATauriStore(
    token: string,
    usuario: Record<string, unknown> | null
): Promise<void> {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load(STORE_FILE);
    await store.set(STORE_KEY_TOKEN, token);
    if (usuario) await store.set(STORE_KEY_USUARIO, usuario);
    await store.save();
    console.info('[AuthDesktop] Re-sync a TauriStore OK');
}

/* Guarda token en ambos stores. QK77-A: Verificación de escritura. */
export async function guardarToken(token: string): Promise<void> {
    tokenEnMemoria = token;
    actualizarTokenApi(token);
    establecerTokenSync(token);

    /* QK77: Backup síncrono inmediato — no depende de await */
    const lsOk = lsGuardar(LS_KEY_TOKEN, token);
    console.info('[AuthDesktop] guardarToken — localStorage:', lsOk ? 'OK' : 'FALLÓ');

    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_TOKEN, token);
        await store.save();

    /* QK77-A: Verificar escritura */
        const ok = await store.get<string>(STORE_KEY_TOKEN);
        console.info('[AuthDesktop] guardarToken TauriStore:', ok === token ? 'OK' : 'FALLÓ');
    } catch (err) {
        console.error('[AuthDesktop] Error guardando token en Tauri Store:', err);
    }

    emitirCambioAuth('login');
}

/* Guarda datos del usuario. Tauri Store + localStorage. */
export async function guardarUsuario(usuario: Record<string, unknown>): Promise<void> {
    /* QK77: Backup síncrono inmediato */
    const lsOk = lsGuardar(LS_KEY_USUARIO, JSON.stringify(usuario));
    console.info('[AuthDesktop] guardarUsuario LS:', lsOk ? 'OK' : 'FALLÓ');

    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_USUARIO, usuario);
        await store.save();
    } catch (err) {
        console.error('[AuthDesktop] Error guardarUsuario TauriStore:', err);
    }
}

/*
 * Aplica una sesión autenticada completa en desktop/APK.
 * Centraliza persistencia, estado global y contexto para recuperaciones OAuth y futuros reingresos.
 */
export async function aplicarSesionAutenticadaDesktop(
    token: string,
    usuario: UsuarioAutenticado
): Promise<void> {
    await guardarToken(token);
    await guardarUsuario(usuario as unknown as Record<string, unknown>);

    const { useAuthStore } = await import('@app/stores/authStore');
    useAuthStore.getState().setUsuario(usuario, false);

    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = true;
        ctx.userId = usuario.wpUserId ?? usuario.id ?? 1;
    }
}

/* Obtiene usuario guardado. Tauri Store → localStorage fallback. */
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
    if (raw) { try { return JSON.parse(raw); } catch { /* JSON corrupto */ } }
    return null;
}

/* Cierra sesión: limpia todo (memoria, stores, interceptor, sync tracking). */
export async function cerrarSesionDesktop(): Promise<void> {
    tokenEnMemoria = null;
    limpiarAuthApi();
    establecerTokenSync(null);

    /* Detener sync watcher ANTES de limpiar tracking */
    try {
        const { detenerSyncBidireccional } = await import('./syncWatcherSetup');
        await detenerSyncBidireccional();
    } catch { /* Sync no inicializado */ }

    /* C286: Limpiar tracking sync (evita contaminación cross-usuario) */
    try {
        const { resetearTracking } = await import('./syncTrackingService');
        await resetearTracking();
    } catch { /* Tracking no inicializado */ }

    /* QK77-B: Desvincular carpeta sync — evita que otro usuario sincronice
     * en la carpeta del usuario anterior. El próximo login deberá elegir carpeta nueva. */
    try {
        const { estado: syncEstado, guardarConfig } = await import('./syncState');
        syncEstado.config.carpetaLocal = null;
        syncEstado.config.sincronizacionActiva = false;
        syncEstado.config.ultimaSync = 0;
        await guardarConfig();
    } catch { /* Sync state no inicializado */ }

    /* GLORY_CONTEXT limpio para evitar detección de sesión previa al recargar */
    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = false;
        ctx.userId = undefined;
    }

    if (!esDesktop()) return;

    /* [2003A-15] Limpiar Tauri Store PRIMERO (usa IPC síncrono con save()) y DESPUÉS
     * localStorage. WebView2 puede no flushear removeItem() a disco si la app cierra rápido,
     * pero el Tauri Store sí se flushea con save(). Al reiniciar, inicializarAuthDesktop()
     * lee Tauri Store primero: si está vacío, no cae al fallback de localStorage. */
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.delete(STORE_KEY_TOKEN);
        await store.delete(STORE_KEY_USUARIO);
        await store.save();

        /* Verificar que realmente se borró — defensa contra bugs del plugin */
        const postToken = await store.get<string>(STORE_KEY_TOKEN);
        if (postToken) {
            console.error('[AuthDesktop] Token persistió tras delete — forzando clear');
            await store.set(STORE_KEY_TOKEN, null as unknown as string);
            await store.save();
        }
    } catch (err) {
        console.error('[AuthDesktop] Error cerrando sesión en Tauri Store:', err);
    }

    /* [2003A-15] Limpiar localStorage DESPUÉS del store. Si la app cierra antes de que
     * WebView2 flushee, el Tauri Store ya está limpio y el init no caerá al fallback LS. */
    lsEliminar(LS_KEY_TOKEN);
    lsEliminar(LS_KEY_USUARIO);

    emitirCambioAuth('logout');
}
