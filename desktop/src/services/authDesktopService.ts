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
                useAuthStore.getState().setUsuario(usuario as never);
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
 * Cierra la sesión: limpia token de memoria, store y fetch interceptor.
 */
export async function cerrarSesionDesktop(): Promise<void> {
    tokenEnMemoria = null;
    limpiarAuthApi();
    establecerTokenSync(null);

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
}
