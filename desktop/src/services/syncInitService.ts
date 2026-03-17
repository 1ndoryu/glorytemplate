/*
 * Servicio: syncInitService — Inicialización del sistema de sincronización.
 *
 * Extraído de syncService.ts (TA6) para cumplir SRP.
 * Carga config, tracking v2, migración v1→v2, listener de config-sync,
 * y lanza rehidratación de imágenes en background.
 */

import { esDesktop } from './desktopService';
import { logSync } from './syncLogger';
import {
    estado,
    cargarConfigAvanzada,
    reconstruirIndicesArchivos,
    STORE_FILE,
    STORE_KEY_CONFIG,
    STORE_KEY_INDICE,
    type SyncConfig,
    type ArchivoLocal,
} from './syncState';
import { inicializarSyncBidireccional } from './syncWatcherSetup';
import { rehidratarImagenesPendientes } from './syncRehidratacionService';

/**
 * Inicializa el servicio de sincronización.
 *
 * @param opciones.soloLectura Si true, solo inicializa tracking y collectionModule
 *   para lectura (historial, colecciones). NO arranca watcher, upload queue ni polling.
 *   Usado por ventanas secundarias MPA (sync-panel) que solo muestran datos.
 *   Sin esto, cada ventana MPA duplica watchers y upload queues causando
 *   race conditions en tracking, imagenUrl sobreescrito y uploads duplicados.
 */
export async function inicializarSyncService(
    opciones: { soloLectura?: boolean } = {},
): Promise<void> {
    if (!esDesktop()) return;
    const { soloLectura = false } = opciones;

    /* F6.1: Inicializar logger estructurado antes de cualquier operación */
    const { inicializarSyncLogger } = await import('./syncLogger');
    await inicializarSyncLogger();
    logSync.info('syncService', 'Inicializando sync service', { soloLectura });

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const configGuardada = await store.get<SyncConfig>(STORE_KEY_CONFIG);
        if (configGuardada) {
            estado.config = configGuardada;
            logSync.info('syncService', 'Config cargada desde store', {
                carpetaLocal: !!configGuardada.carpetaLocal,
                sincronizacionActiva: configGuardada.sincronizacionActiva,
            });
        } else {
            logSync.warn('syncService', 'No hay config guardada en store — sync no se iniciara hasta que el usuario configure la carpeta');
        }

        const indiceGuardado = await store.get<ArchivoLocal[]>(STORE_KEY_INDICE);
        if (indiceGuardado) estado.indiceArchivos = indiceGuardado;
    } catch (err) {
        logSync.error('syncService', 'Error cargando config desde Tauri Store — sync usara defaults (desactivado)', {
            error: err instanceof Error ? err.message : String(err),
        });
    }

    /* Reconstruir índices O(1) para lookups rápidos del watcher */
    reconstruirIndicesArchivos();

    /* Cargar configuración avanzada (paralelismo, throttle, papelera) */
    await cargarConfigAvanzada();

    /* F2.1: Cargar cursor delta para continuar desde donde quedó */
    const { cargarCursorDelta } = await import('./syncState');
    await cargarCursorDelta();

    /* C355: Inicializar tracking v2 y migrar datos v1 si es primera vez.
     * TA5: La migración usa flag en Store para evitar que dos ventanas la ejecuten
     * simultáneamente (race en inicialización multi-window). */
    try {
        estado.trackingModule = await import('./syncTrackingService');
        estado.collectionModule = await import('./syncCollectionService');

        /*
         * C286: Obtener userId del usuario autenticado para scoping del tracking.
         * inicializarAuthDesktop() ya corrió antes y pobló GLORY_CONTEXT.userId.
         * Si no hay usuario (no autenticado), se pasa undefined y el tracking
         * se inicializa sin verificación de propiedad.
         */
        const ctx = window.GLORY_CONTEXT as { userId?: number } | undefined;
        const userIdActual = ctx?.userId ? Number(ctx.userId) : undefined;

        await estado.trackingModule.inicializarTracking(userIdActual);

        if (estado.trackingModule.totalArchivos() === 0 && estado.indiceArchivos.length > 0) {
            /* TA5: Verificar flag de migración en Store para evitar duplicación cross-window */
            let migracionYaEjecutada = false;
            try {
                const { load } = await import('@tauri-apps/plugin-store');
                const storeInit = await load(STORE_FILE);
                const flagMigracion = await storeInit.get<boolean>('v1_migracion_completada');
                if (flagMigracion) {
                    migracionYaEjecutada = true;
                } else {
                    /* Marcar como en curso ANTES de migrar para que otra ventana la salte */
                    await storeInit.set('v1_migracion_completada', true);
                    await storeInit.save();
                }
            } catch {
                /* Store no disponible — continuar con migración (mejor duplicar que perder datos) */
            }

            if (!migracionYaEjecutada) {
                const migrado = await estado.trackingModule.migrarDesdeV1();
                if (migrado) {
                    logSync.info('syncService', 'Migración v1→v2 completada automáticamente');
                }
            } else {
                logSync.info('syncService', 'TA5: Migración v1→v2 ya fue ejecutada por otra ventana, saltando');
            }
        }
    } catch (err) {
        logSync.error('syncService', 'Error inicializando tracking v2', { error: err instanceof Error ? err.message : String(err) });
    }

    /*
     * Modo solo-lectura: la ventana solo necesita leer historial/colecciones.
     * NO arrancar watcher, upload queue ni polling — eso lo hace la ventana principal.
     * Arrancar duplicados causa: watchers dobles, uploads duplicados, race conditions
     * en persistir() que borran imagenUrl de otras ventanas.
     */
    if (!soloLectura) {
        logSync.info('syncService', 'Lanzando inicializacion bidireccional', {
            carpetaLocal: estado.config.carpetaLocal ?? '(no configurada)',
            sincronizacionActiva: estado.config.sincronizacionActiva,
        });
        await inicializarSyncBidireccional();
    }

    /* Escuchar evento de la ventana config-sync para refrescar config en memoria */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        await listen('config-sync-actualizada', async () => {
            logSync.info('syncService', 'Config actualizada desde ventana independiente, recargando');
            await cargarConfigAvanzada();

            /* QL78: Si borrarAlSubirExitoso se acaba de activar, limpiar archivos
             * ya subidos que quedaron en disco de subidas previas. */
            try {
                const { limpiarArchivosSubidosEnDisco } = await import('./uploadQueueService');
                await limpiarArchivosSubidosEnDisco();
            } catch { /* plugin-fs no disponible — ignorar */ }
        });
    } catch (err) {
        logSync.error('syncService', 'Error registrando listener de config', { error: err instanceof Error ? err.message : String(err) });
    }

    /* Rehidratar imágenes de portada de samples ya sincronizados que no las tienen.
     * Se lanza en background (no bloquea inicialización). */
    rehidratarImagenesPendientes().catch(() => {});
}
