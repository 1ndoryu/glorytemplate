/*
 * Manejo de eventos de auth cross-window (main ↔ sync-panel).
 * Extraído de authDesktopService.ts para mantener SRP.
 * Usa el sistema de eventos Tauri para sincronizar estado de auth
 * cuando otra ventana hace login o logout.
 */

import { esDesktop } from './desktopService';
import { actualizarTokenApi, limpiarAuthApi } from './apiDesktopAdapter';
import { establecerTokenSync } from './syncGuards';
import { obtenerToken, setTokenEnMemoria } from './authDesktopService';

const STORE_KEY_TOKEN = 'auth_token';
const STORE_KEY_USUARIO = 'auth_usuario';
const STORE_FILE = 'auth.json';
const EVENTO_AUTH_CAMBIADA = 'auth-cambiada';

/*
 * Emite evento cross-window para que las demas ventanas se sincronicen.
 */
export function emitirCambioAuth(tipo: 'login' | 'logout'): void {
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
                    await manejarLoginExterno();
                } else if (evento.payload.tipo === 'logout') {
                    manejarLogoutExterno();
                }
            } finally {
                procesandoEventoAuth = false;
            }
        });
    } catch {
        /* Entorno no-Tauri */
    }
}

/*
 * Otra ventana hizo login — re-leer token y usuario del store.
 */
async function manejarLoginExterno(): Promise<void> {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load(STORE_FILE);
    const token = await store.get<string>(STORE_KEY_TOKEN);

    if (token && token !== obtenerToken()) {
        setTokenEnMemoria(token);
        actualizarTokenApi(token);
        establecerTokenSync(token);

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
}

/*
 * Otra ventana cerró sesión — limpiar estado local.
 */
function manejarLogoutExterno(): void {
    if (!obtenerToken()) return;

    setTokenEnMemoria(null);
    limpiarAuthApi();
    establecerTokenSync(null);

    import('@app/stores/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().cerrarSesion();
    }).catch(() => { /* noop */ });

    /* QK77-B: Desvincular carpeta sync en la ventana sync-panel también */
    import('./syncState').then(({ estado: syncEstado, guardarConfig }) => {
        syncEstado.config.carpetaLocal = null;
        syncEstado.config.sincronizacionActiva = false;
        syncEstado.config.ultimaSync = 0;
        guardarConfig().catch(() => { /* noop */ });
    }).catch(() => { /* noop */ });

    const ctx = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
    if (ctx) {
        ctx.isLoggedIn = false;
        ctx.userId = undefined;
    }
}
