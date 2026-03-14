/*
 * Servicio principal de inicialización desktop.
 * Configura auth, offline storage, sync y API base URL.
 */

import { configurarApiDesktop, marcarAuthInicializada } from './apiDesktopAdapter';
import { inicializarAuthDesktop } from './authDesktopService';
import { escucharCambiosAuth } from './authDesktopEventos';
import { inicializarOfflineQueue } from './offlineQueueService';
import { inicializarSyncService } from './syncService';

let inicializado = false;

/*
 * Inicializa todos los servicios desktop.
 * Se llama una vez al arrancar la app (main.tsx).
 */
export async function inicializarDesktop(): Promise<void> {
    if (inicializado) return;
    inicializado = true;

    /* 1. Configurar API base URL (apuntar al servidor remoto) */
    configurarApiDesktop();

    /* 2. Restaurar sesión de auth desde el store seguro */
    await inicializarAuthDesktop();

    /* 2b. Escuchar cambios de auth de otras ventanas (sync-panel) */
    escucharCambiosAuth();

    /* 3. Inicializar queue offline (reproducciones, likes pendientes) */
    await inicializarOfflineQueue();

    /* 4. Inicializar servicio de sincronización de archivos */
    await inicializarSyncService();

    /* QK38: Marcar auth como inicializada DESPUES de todos los servicios.
     * Los 401 durante la inicializacion se ignoran para evitar logouts espurios. */
    marcarAuthInicializada();
}

/*
 * Detecta si estamos corriendo en Tauri (desktop) o en el navegador (web).
 */
export function esDesktop(): boolean {    return !!window.__TAURI_INTERNALS__;}

/*
 * Detecta si estamos online (conectados al servidor).
 */
export function estaOnline(): boolean {
    return navigator.onLine;
}
