/*
 * Servicio: uploadQueueService — Cola de subida de samples al servidor.
 *
 * Gestiona la subida automática de archivos detectados por fileWatcherService.
 * Procesa en orden FIFO con reintentos, detección de duplicados por hash parcial,
 * y persistencia en Tauri Store para resistir cierres inesperados.
 *
 * Flujo por archivo:
 *   1. Verificar duplicado (hash parcial: primeros 8KB + últimos 8KB + tamaño)
 *   2. Extraer contexto de ruta (3 carpetas padre + nombre de archivo)
 *   3. Generar título y tags desde el contexto
 *   4. Construir FormData y POST /samples/upload
 *   5. Registrar en índice de syncService
 *   6. Notificar progreso a la UI
 *
 * Detección de duplicados:
 *   Hash parcial = SHA-256 de (primeros 8KB + últimos 8KB + tamaño en bytes)
 *   Esto es rápido (no lee el archivo completo) y suficientemente robusto
 *   para archivos de audio que difieren en contenido.
 */

import { esDesktop, estaOnline } from './desktopService';
import { extraerMetadataDeRuta, registrarSubidaLocal, registrarAccionHistorial, actualizarEstadoSampleHistorial, moverSampleEnServidorPublico, moverArchivoASinColeccion, rehidratarImagenesPendientesForzadoSync, obtenerConfigSync } from './syncService';
import { obtenerBaseUrlSync } from './syncGuards';
import { Semaforo } from './semaforo';
import { persistirConDebounce, flushPersistencia } from './persistenciaDebounce';
import { estado } from './syncState';
import { esRutaPapelera, normalizarNombreParaDedup } from './normalizarNombreArchivo';

const STORE_FILE = 'upload-queue.json';

/*
 * Verifica si una ruta de archivo está dentro de la carpeta de sync configurada.
 * Normaliza separadores y casing para comparación segura en Windows.
 * Retorna false si no hay carpeta configurada (failsafe: bloquear).
 */
function estaEnCarpetaSync(rutaArchivo: string): boolean {
    const config = obtenerConfigSync();
    if (!config?.carpetaLocal) return false;
    const carpetaNorm = config.carpetaLocal.replace(/\\/g, '/').toLowerCase();
    const rutaNorm = rutaArchivo.replace(/\\/g, '/').toLowerCase();
    return rutaNorm.startsWith(carpetaNorm);
}
const STORE_KEY_COLA = 'upload_cola';
const STORE_KEY_HASHES = 'upload_hashes_procesados';

const MAX_REINTENTOS = 3;
const BACKOFF_BASE_MS = 2000;

/* Estado de cada item en la cola */
export type EstadoUpload = 'pendiente' | 'subiendo' | 'completado' | 'error' | 'duplicado';

export interface ItemUploadCola {
    id: string;
    rutaArchivo: string;
    nombreArchivo: string;
    carpetas: string[];
    estado: EstadoUpload;
    intentos: number;
    ultimoError?: string;
    timestampCreado: number;
    timestampActualizado: number;
    sampleIdServidor?: number;
    hashParcial?: string;
    /** Clave de idempotencia para evitar duplicados si el upload se reintenta tras timeout */
    idempotencyKey: string;
}

export interface ProgresoUpload {
    item: ItemUploadCola;
    totalEnCola: number;
    posicionEnCola: number;
}

type OnProgresoUploadFn = (progreso: ProgresoUpload) => void;

let cola: ItemUploadCola[] = [];
let hashesConocidos = new Set<string>();
let procesando = false;
let callbackProgreso: OnProgresoUploadFn | null = null;

/* Set O(1) para verificar si una ruta ya está en cola. Evita cola.some() O(n). */
let rutasEnCola = new Set<string>();

/*
 * Guard síncrono contra race condition en encolarArchivo().
 * Problema: encolarArchivo es async y el callback del watcher no hace await.
 * Si llegan dos eventos rápidos (create + modify), ambos entran en encolarArchivo,
 * ambos pasan rutasEnCola.has() (que se actualiza DESPUÉS del await calcularHash),
 * y ambos encolan el mismo archivo → duplicado.
 *
 * Solución: este Set se actualiza SÍNCRONAMENTE al inicio de encolarArchivo,
 * antes de cualquier await. El segundo llamado lo ve inmediatamente y retorna false.
 */
const rutasEncolando = new Set<string>();

/*
 * Guard de hash en vuelo para uploads paralelos.
 * Con archivosParalelos > 1, dos items con el mismo hash podrían ejecutar
 * subirArchivo() simultáneamente, ambos pasando hashesConocidos.has() antes
 * de que ninguno lo añada. Este Set previene que dos uploads del mismo
 * contenido estén en vuelo al mismo tiempo.
 */
const hashesEnVuelo = new Set<string>(); 

function normalizarRutaCola(ruta: string): string {
    return ruta.replace(/\\/g, '/');
}

function claveRutaEnCola(ruta: string): string {
    return normalizarRutaCola(ruta).toLowerCase();
}

function hashSimpleTexto(texto: string): string {
    let hash = 2166136261;
    for (let i = 0; i < texto.length; i++) {
        hash ^= texto.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

function crearIdempotencyKeyDeterministica(rutaArchivo: string, nombreArchivo: string, hashParcial?: string): string {
    if (hashParcial && hashParcial.length > 0) {
        return `up-hash-${hashParcial.slice(0, 48)}`;
    }
    const rutaNorm = normalizarRutaCola(rutaArchivo);
    return `up-ruta-${hashSimpleTexto(`${rutaNorm}|${nombreArchivo.toLowerCase()}`)}`;
}

/* Semáforo de concurrencia: controla cuántos archivos se suben en paralelo.
 * El límite se lee de configAvanzada.archivosParalelos al iniciar procesarCola. */
let semaforoUpload: Semaforo | null = null;

/*
 * Inicializa la cola: carga items pendientes y hashes del store.
 */
export async function inicializarUploadQueue(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const colaGuardada = await store.get<ItemUploadCola[]>(STORE_KEY_COLA);
        if (colaGuardada) {
            /* Restaurar solo items no completados Y dentro de la carpeta sync.
             * Items residuales de antes del fix C378 (watcher scope) se purgan aquí
             * para que no se reintenten eternamente al reiniciar la app. */
            cola = colaGuardada.filter(i => {
                if (i.estado === 'completado') return false;
                if (!estaEnCarpetaSync(i.rutaArchivo)) {
                    console.warn('[UploadQueue] Purgando item persistido fuera de carpeta sync:', i.nombreArchivo);
                    return false;
                }
                return true;
            });
            /* Items que estaban "subiendo" al cerrar -> volver a pendiente.
             * Migración: items de store pre-C368 no tienen idempotencyKey. */
            for (const item of cola) {
                if (item.estado === 'subiendo') {
                    item.estado = 'pendiente';
                }
                item.rutaArchivo = normalizarRutaCola(item.rutaArchivo);
                if (!item.idempotencyKey) {
                    item.idempotencyKey = crearIdempotencyKeyDeterministica(
                        item.rutaArchivo,
                        item.nombreArchivo,
                        item.hashParcial,
                    );
                }
            }
            /* Reconstruir Set de rutas para lookups O(1) */
            rutasEnCola = new Set(cola.map(i => claveRutaEnCola(i.rutaArchivo)));
        }

        const hashesGuardados = await store.get<string[]>(STORE_KEY_HASHES);
        if (hashesGuardados) {
            hashesConocidos = new Set(hashesGuardados);
        }
    } catch {
        /* Store no disponible — usar cola en memoria */
    }

    /* Escuchar reconexión para reanudar subidas */
    window.addEventListener('online', () => { procesarCola(); });

    /* Listener cross-ventana: el sync panel (sync.html) actualiza el Tauri Store
     * directamente y emite este evento. La ventana principal recarga la cola
     * desde el Store para sincronizar su memoria con los cambios. */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        void listen('reintentar-errores-upload', async () => {
            /* Recargar cola desde el Store (el sync panel ya la actualizó ahí) */
            try {
                const { load } = await import('@tauri-apps/plugin-store');
                const store = await load(STORE_FILE);
                const colaGuardada = await store.get<ItemUploadCola[]>(STORE_KEY_COLA);
                if (colaGuardada) {
                    cola = colaGuardada.filter(i => {
                        if (i.estado === 'completado') return false;
                        if (!estaEnCarpetaSync(i.rutaArchivo)) return false;
                        return true;
                    });
                    rutasEnCola = new Set(cola.map(i => claveRutaEnCola(i.rutaArchivo)));
                }
            } catch {
                /* Fallback: resetear desde memoria */
                for (const item of cola) {
                    if (item.estado === 'error') {
                        item.estado = 'pendiente';
                        item.intentos = 0;
                        item.ultimoError = undefined;
                        item.timestampActualizado = Date.now();
                        rutasEnCola.add(claveRutaEnCola(item.rutaArchivo));
                    }
                }
            }
            if (estaOnline() && tienePendientes()) {
                procesarCola();
            }
        });
    } catch {
        /* Entorno sin Tauri — ignorar */
    }

    /* Si hay items pendientes y estamos online, procesar */
    if (estaOnline() && tienePendientes()) {
        procesarCola();
    }
}

/*
 * Registra un callback para recibir actualizaciones de progreso.
 */
export function onProgresoUpload(cb: OnProgresoUploadFn): void {
    callbackProgreso = cb;
}

/*
 * Encola un archivo nuevo para subir al servidor.
 * Llamado por fileWatcherService cuando detecta un archivo nuevo.
 *
 * Retorna false si el archivo es duplicado (ya fue subido).
 */
export async function encolarArchivo(
    rutaArchivo: string,
    nombreArchivo: string,
    carpetas: string[],
): Promise<boolean> {
    const rutaNormalizada = normalizarRutaCola(rutaArchivo);
    const rutaClave = claveRutaEnCola(rutaNormalizada);

    /* P3: Rechazar archivos dentro de .papelera — defensa en profundidad */
    if (esRutaPapelera(rutaNormalizada)) {
        console.info('[UploadQueue] Archivo en .papelera, rechazando:', nombreArchivo);
        return false;
    }

    /* Guard: rechazar archivos fuera de la carpeta de sync configurada.
     * Defensa en profundidad — complementa el guard del watcher (C378).
     * Cubre edge cases de OneDrive/Windows donde el driver FS emite rutas externas. */
    if (!estaEnCarpetaSync(rutaNormalizada)) {
        console.warn('[UploadQueue] Archivo fuera de carpeta sync, rechazando en encolamiento:', nombreArchivo, rutaNormalizada);
        return false;
    }

    /*
     * Guard síncrono: prevenir race condition entre eventos create y modify.
     * DEBE ejecutarse ANTES de cualquier await para ser efectivo.
     * Si otro llamado a encolarArchivo() ya está procesando esta ruta
     * (calculando hash, etc.), rechazar inmediatamente.
     */
    if (rutasEncolando.has(rutaClave)) {
        console.info('[UploadQueue] Archivo ya en proceso de encolamiento, ignorando:', nombreArchivo);
        return false;
    }
    rutasEncolando.add(rutaClave);

    try {
        return await encolarArchivoInterno(rutaNormalizada, nombreArchivo, carpetas);
    } finally {
        rutasEncolando.delete(rutaClave);
    }
}

/*
 * Lógica interna de encolamiento, separada para que el guard síncrono
 * de encolarArchivo() pueda usar try/finally limpiamente.
 */
async function encolarArchivoInterno(
    rutaArchivo: string,
    nombreArchivo: string,
    carpetas: string[],
): Promise<boolean> {
    /*
     * P4: Normalizar nombre (elimina prefijo timestamp de papelera) para
     * que el dedup por nombre funcione aunque el archivo haya pasado por
     * papelera y luego reaparecido con prefijo timestamp.
     */
    const nombreNormalizado = normalizarNombreParaDedup(nombreArchivo);

    /* Verificar si ya está en la cola (misma ruta) — O(1) con Set */
    const rutaClave = claveRutaEnCola(rutaArchivo);
    if (rutasEnCola.has(rutaClave) && cola.some(i => claveRutaEnCola(i.rutaArchivo) === rutaClave && i.estado !== 'error')) {
        console.info('[UploadQueue] Archivo ya en cola, ignorando:', nombreNormalizado);
        return false;
    }

    /* Calcular hash parcial para detectar duplicados por contenido */
    const hash = await calcularHashParcial(rutaArchivo);
    if (hash && hashesConocidos.has(hash)) {
        console.info('[UploadQueue] Duplicado detectado por hash:', nombreNormalizado);
        return false;
    }

    const item: ItemUploadCola = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        rutaArchivo,
        nombreArchivo: nombreNormalizado,
        carpetas,
        estado: 'pendiente',
        intentos: 0,
        timestampCreado: Date.now(),
        timestampActualizado: Date.now(),
        hashParcial: hash ?? undefined,
        idempotencyKey: crearIdempotencyKeyDeterministica(rutaArchivo, nombreNormalizado, hash ?? undefined),
    };

    cola.push(item);
    rutasEnCola.add(rutaClave);
    guardarColaDebounced();

    /* Historial per-sample: entrada inicial "detectado" (se actualiza a subiendo/sincronizado) */
    actualizarEstadoSampleHistorial({
        sampleId: 0, /* Temporal: se actualiza con sampleId real tras upload exitoso */
        nombreArchivo,
        estado: 'detectado',
        rutaLocal: rutaArchivo,
    }).catch(() => { /* No bloquear encolamiento por fallo en historial */ });

    /* Historial legacy para compatibilidad */
    registrarAccionHistorial({
        tipo: 'subida_pendiente',
        descripcion: `Archivo detectado: "${nombreArchivo}"`,
    }).catch(() => { /* No bloquear encolamiento por fallo en historial */ });

    console.info('[UploadQueue] Archivo encolado:', nombreArchivo);

    /* Si estamos online, procesar inmediatamente */
    if (estaOnline()) {
        procesarCola();
    }

    return true;
}

/*
 * Procesa la cola con paralelismo controlado.
 * El número de uploads simultáneos se lee de configAvanzada.archivosParalelos.
 * Incluye throttle inter-archivo si hay límite de velocidad configurado.
 */
async function procesarCola(): Promise<void> {
    if (procesando || !estaOnline()) return;
    procesando = true;

    const configAvanzada = estado.configAvanzada;
    const maxParalelos = Math.max(1, Math.min(5, configAvanzada.archivosParalelos));

    /* Crear o actualizar semáforo */
    if (!semaforoUpload || semaforoUpload.limite !== maxParalelos) {
        semaforoUpload = new Semaforo(maxParalelos);
    }

    const promesasActivas: Promise<void>[] = [];

    try {
        while (true) {
            const siguiente = cola.find(i => i.estado === 'pendiente');

            if (!siguiente) {
                /* No hay más pendientes: esperar a que terminen las activas */
                if (promesasActivas.length > 0) {
                    await Promise.race(promesasActivas);
                    continue;
                }
                break;
            }

            if (!estaOnline()) break;

            siguiente.estado = 'subiendo';
            siguiente.timestampActualizado = Date.now();
            emitirProgreso(siguiente);
            guardarColaDebounced();

            /* Historial per-sample: actualizar a "subiendo" solo en primer intento */
            if (siguiente.intentos === 0) {
                actualizarEstadoSampleHistorial({
                    sampleId: 0,
                    nombreArchivo: siguiente.nombreArchivo,
                    estado: 'subiendo',
                    rutaLocal: siguiente.rutaArchivo,
                }).catch(() => {});

                registrarAccionHistorial({
                    tipo: 'subiendo',
                    descripcion: `Subiendo: "${siguiente.nombreArchivo}"`,
                }).catch(() => {});
            }

            /* Adquirir slot del semáforo (espera si pool lleno) */
            await semaforoUpload.adquirir();

            const itemRef = siguiente;
            const promesa = procesarItemUpload(itemRef, configAvanzada)
                .finally(() => {
                    semaforoUpload!.liberar();
                    const idx = promesasActivas.indexOf(promesa);
                    if (idx !== -1) promesasActivas.splice(idx, 1);
                });

            promesasActivas.push(promesa);
        }

        /* Esperar que TODAS las activas terminen */
        await Promise.all(promesasActivas);
    } finally {
        procesando = false;
        await guardarHashes();
        await flushPersistencia('upload_cola');
    }
}

/*
 * Procesa un item individual de la cola.
 * Gestiona rethintos, backoff, y throttle inter-archivo.
 */
async function procesarItemUpload(
    item: ItemUploadCola,
    configAvanzada: { velocidadMaximaSubidaMbps: number },
): Promise<void> {
    const exito = await subirArchivo(item);

    if (exito) {
        item.estado = 'completado';
        if (item.hashParcial) {
            hashesConocidos.add(item.hashParcial);
            /* Persistir hash inmediatamente para que uploads paralelos lo vean.
             * No esperar al fin de procesarCola — previene duplicados por race condition. */
            guardarHashes().catch(() => {});
        }
        rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));

        /* Throttle inter-archivo: si hay límite de velocidad, esperar proporcionalmente */
        if (configAvanzada.velocidadMaximaSubidaMbps > 0 && item.hashParcial) {
            const tamanoEstimadoBytes = 5 * 1024 * 1024; /* ~5MB promedio */
            const bytesPerSegundo = configAvanzada.velocidadMaximaSubidaMbps * 125_000;
            const delayMs = Math.max(0, (tamanoEstimadoBytes / bytesPerSegundo) * 1000 - 500);
            if (delayMs > 100) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
    } else {
        item.intentos++;
        if (item.intentos >= MAX_REINTENTOS) {
            item.estado = 'error';
            rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));

            actualizarEstadoSampleHistorial({
                sampleId: 0,
                nombreArchivo: item.nombreArchivo,
                estado: 'error',
                rutaLocal: item.rutaArchivo,
                error: item.ultimoError ?? 'Máximo de reintentos alcanzado',
            }).catch(() => {});

            registrarAccionHistorial({
                tipo: 'error_subida',
                descripcion: `Error al subir: "${item.nombreArchivo}" — ${item.ultimoError ?? 'desconocido'}`,
            }).catch(() => {});

            console.error('[UploadQueue] Máximo de reintentos alcanzado:', item.nombreArchivo);
        } else {
            item.estado = 'pendiente';
            /* Backoff exponencial antes de reintentar */
            const espera = BACKOFF_BASE_MS * Math.pow(2, item.intentos - 1);
            await new Promise(r => setTimeout(r, espera));
        }
    }

    item.timestampActualizado = Date.now();
    emitirProgreso(item);
    guardarColaDebounced();
}

/*
 * Sube un archivo individual al servidor.
 *
 * Flujo:
 * 1. Verificar duplicado en tracking v2 (defensa de última línea)
 * 2. Leer archivo del disco (Tauri readFile)
 * 3. Generar título y tags desde nombre y carpetas
 * 4. Construir FormData
 * 5. POST /kamples/v1/samples/upload
 * 6. Registrar descarga en índice local
 * 7. Guardar hash inmediatamente (no esperar fin de cola)
 */
async function subirArchivo(item: ItemUploadCola): Promise<boolean> {
    try {
        /* Guard: descartar items cuya ruta está fuera de la carpeta de sync.
         * Usa función centralizada estaEnCarpetaSync (normaliza separadores + casing). */
        if (!estaEnCarpetaSync(item.rutaArchivo)) {
            console.warn('[UploadQueue] Item fuera de carpeta sync, descartando:', item.rutaArchivo);
            return true; /* true = no reintentar, simplemente descartar */
        }

        /*
         * Verificación de última línea contra tracking v2: entre el momento de encolar
         * y el momento de subir puede haber pasado tiempo (backoff, semáforo, etc.).
         * Otro upload del mismo archivo podría haber terminado en ese intervalo.
         */
        if (estado.trackingModule) {
            const enTracking = estado.trackingModule.buscarArchivoPorRuta(item.rutaArchivo)
                ?? estado.trackingModule.buscarArchivoPorNombre(item.nombreArchivo);
            if (enTracking && !enTracking.syncDeshabilitado) {
                console.info('[UploadQueue] Duplicado detectado en tracking pre-upload, omitiendo:', item.nombreArchivo);
                item.sampleIdServidor = enTracking.sampleId;
                /* Marcar como completado sin subir */
                return true;
            }
        }

        /* Re-verificar hash por si otro upload paralelo lo añadió */
        if (item.hashParcial && hashesConocidos.has(item.hashParcial)) {
            console.info('[UploadQueue] Duplicado por hash detectado pre-upload:', item.nombreArchivo);
            return true;
        }

        /*
         * Guard de hash en vuelo: si otro upload paralelo del mismo contenido
         * está en progreso, esperar a que termine en vez de subir dos veces.
         * Esto cubre la ventana entre que subirArchivo() empieza y hashesConocidos
         * se actualiza tras el POST exitoso.
         */
        if (item.hashParcial) {
            if (hashesEnVuelo.has(item.hashParcial)) {
                console.info('[UploadQueue] Hash en vuelo (upload paralelo), omitiendo:', item.nombreArchivo);
                return true;
            }
            hashesEnVuelo.add(item.hashParcial);
        }

        const { readFile, exists } = await import('@tauri-apps/plugin-fs');
        const baseUrl = obtenerBaseUrlSync();

        /*
         * P3: Verificar existencia antes de leer.
         * En entornos OneDrive el archivo puede haberse movido a papelera
         * o estar en proceso de sincronización cloud → "failed to open file".
         * Detectarlo aquí evita reintentos inútiles contra un archivo que ya no existe.
         */
        const archivoExiste = await exists(item.rutaArchivo);
        if (!archivoExiste) {
            const esOneDrive = item.rutaArchivo.includes('OneDrive');
            item.ultimoError = esOneDrive
                ? 'Archivo no encontrado (posible conflicto OneDrive/papelera)'
                : 'Archivo no encontrado en disco';
            console.warn('[UploadQueue] Archivo no existe, abortando upload:', item.rutaArchivo);
            return false;
        }

        /* Leer el archivo de audio del disco */
        const contenidoArchivo = await readFile(item.rutaArchivo);

        /* Generar metadata desde la ruta */
        const metaRuta = extraerMetadataDeRuta(item.rutaArchivo);

        /* Generar título: nombre del archivo sin extensión, humanizado */
        const titulo = humanizarNombreArchivo(metaRuta.nombreArchivo);

        /* Generar tags desde carpetas padre y nombre */
        const tags = generarTagsDesdeContexto(metaRuta.carpetas, metaRuta.nombreArchivo);

        /* Detectar MIME type por extensión */
        const mimeType = obtenerMimeType(metaRuta.extension);

        /* Construir FormData */
        const blob = new Blob([contenidoArchivo], { type: mimeType });
        const formData = new FormData();
        formData.append('audio', blob, item.nombreArchivo);
        formData.append('titulo', titulo);
        formData.append('contenido', `Subido automáticamente desde ${metaRuta.carpetas.join(' / ')}`);
        formData.append('tags', JSON.stringify(tags));
        formData.append('permitir_descarga', 'true');
        formData.append('licencia_libre', 'false');
        formData.append('es_premium', 'false');
        formData.append('mostrar_en_comunidad', 'true');

        /* POST al servidor — P5: incluir clave de idempotencia para evitar duplicados por timeout */
        const respuesta = await fetch(`${baseUrl}/kamples/v1/samples/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Idempotency-Key': item.idempotencyKey,
            },
            /* Content-Type se genera automáticamente con el boundary correcto */
        });

        if (!respuesta.ok) {
            const errorBody = await respuesta.json().catch(() => ({}));
            item.ultimoError = (errorBody as { error?: string }).error ?? `HTTP ${respuesta.status}`;
            console.error('[UploadQueue] Error del servidor:', item.ultimoError);
            return false;
        }

        const resultado = await respuesta.json() as {
            ok: boolean;
            sample_id?: number;
            id_corto?: string;
        };

        if (!resultado.ok || !resultado.sample_id) {
            item.ultimoError = 'Respuesta inesperada del servidor';
            return false;
        }

        item.sampleIdServidor = resultado.sample_id;

        /*
         * Resolver colección real a partir del nombre de carpeta local.
         * Permite pasar coleccionId a registrarSubidaLocal para tracking correcto
         * y agregar el sample a la tabla coleccion_samples en el servidor.
         */
        let coleccionIdResuelta: number | null = null;
        if (item.carpetas.length > 0) {
            const nombreCarpeta = item.carpetas[0] || '';
            if (nombreCarpeta && estado.trackingModule) {
                const coleccion = estado.trackingModule.buscarColeccionPorCarpeta(nombreCarpeta);
                if (coleccion) {
                    coleccionIdResuelta = coleccion.id;
                }
            }
        }

        /* Registrar en tracking + historial para feedback persistente en panel */
        await registrarSubidaLocal(
            resultado.sample_id,
            item.rutaArchivo,
            item.nombreArchivo,
            coleccionIdResuelta,
        );

        /* Rehidratación centralizada: usar snapshot /me/sync/colecciones como fuente
         * única para imagenes. Evita depender de slug/endpoint individual y mantiene
         * consistencia entre ventana main y ventana sync-panel. */
        rehidratarImagenesPendientesForzadoSync().catch(() => {
            /* No bloquear flujo de upload por fallo de rehidratación */
        });

        /*
         * Asignar sample a colección en el servidor.
         *
         * Dos operaciones complementarias:
         * 1. POST /colecciones/{id}/samples → inserta en coleccion_samples (asociación real).
         *    Sin esto, el sample no aparece dentro de la colección en sync ni en la web.
         * 2. PUT /me/coleccionados/{id}/carpeta → actualiza metadata.carpeta_primaria.
         *    Mantiene compatibilidad con flujos legacy que leen metadata del sample.
         */
        if (item.carpetas.length > 0 && coleccionIdResuelta) {
            /* Importar agregarSampleAColeccion dinámicamente para evitar dependencia circular */
            try {
                const { agregarSampleAColeccion } = await import('./syncCollectionService');
                await agregarSampleAColeccion(coleccionIdResuelta, resultado.sample_id);
            } catch (err) {
                console.error('[UploadQueue] Error agregando sample a colección:', err);
            }

            const primaria = item.carpetas[0] || 'General';
            const secundaria = item.carpetas[1] || '';
            await moverSampleEnServidorPublico(resultado.sample_id, primaria, secundaria);
        } else if (item.carpetas.length > 0) {
            /* Carpeta existe pero no tiene colección registrada en tracking.
             * Intentar crear la colección y agregar el sample. */
            try {
                const { crearColeccionDesdeLocal, agregarSampleAColeccion } = await import('./syncCollectionService');
                const nombreCarpeta = item.carpetas[0] || '';
                if (nombreCarpeta) {
                    const colId = await crearColeccionDesdeLocal(nombreCarpeta);
                    if (colId) {
                        await agregarSampleAColeccion(colId, resultado.sample_id);
                    }
                }
            } catch (err) {
                console.error('[UploadQueue] Error creando colección y agregando sample:', err);
            }

            const primaria = item.carpetas[0] || 'General';
            const secundaria = item.carpetas[1] || '';
            await moverSampleEnServidorPublico(resultado.sample_id, primaria, secundaria);
        } else {
            /*
             * Archivo estaba en la raíz de sync (sin subcarpeta).
             * Después de subirlo, moverlo a "Sin colección" para organización.
             */
            const nuevaRuta = await moverArchivoASinColeccion(
                item.rutaArchivo,
                item.nombreArchivo,
                resultado.sample_id,
            );
            if (nuevaRuta) {
                item.rutaArchivo = nuevaRuta;
            }
        }

        console.info(
            '[UploadQueue] Subido exitosamente:',
            item.nombreArchivo,
            '→ sample_id:',
            resultado.sample_id,
        );
        return true;
    } catch (err) {
        item.ultimoError = err instanceof Error ? err.message : String(err);
        console.error('[UploadQueue] Error subiendo archivo:', item.nombreArchivo, err);
        return false;
    } finally {
        /* Liberar hash en vuelo siempre, éxito o fallo */
        if (item.hashParcial) {
            hashesEnVuelo.delete(item.hashParcial);
        }
    }
}

/*
 * Calcula un hash parcial del archivo para detección rápida de duplicados.
 * Lee solo: primeros 8KB + últimos 8KB + tamaño total.
 * Esto evita leer archivos completos de 50MB solo para verificar duplicados.
 */
async function calcularHashParcial(rutaArchivo: string): Promise<string | null> {
    try {
        const { stat, readFile } = await import('@tauri-apps/plugin-fs');

        const info = await stat(rutaArchivo);
        const tamano = info.size;

        if (!tamano || tamano === 0) return null;

        const CHUNK_SIZE = 8192;

        /* Leer primeros 8KB */
        const inicio = await readFile(rutaArchivo, {
            offset: 0,
            length: Math.min(CHUNK_SIZE, tamano),
        } as Parameters<typeof readFile>[1]);

        /* Leer últimos 8KB */
        let fin: Uint8Array;
        if (tamano > CHUNK_SIZE) {
            fin = await readFile(rutaArchivo, {
                offset: tamano - CHUNK_SIZE,
                length: CHUNK_SIZE,
            } as Parameters<typeof readFile>[1]);
        } else {
            fin = new Uint8Array(0);
        }

        /* Concatenar: inicio + fin + tamaño como string */
        const tamanoBytes = new TextEncoder().encode(tamano.toString());
        const combinado = new Uint8Array(inicio.length + fin.length + tamanoBytes.length);
        combinado.set(inicio, 0);
        combinado.set(fin, inicio.length);
        combinado.set(tamanoBytes, inicio.length + fin.length);

        /* Hash con Web Crypto API (disponible en Tauri webview) */
        const hashBuffer = await crypto.subtle.digest('SHA-256', combinado);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
        console.warn('[UploadQueue] No se pudo calcular hash parcial:', err);
        return null;
    }
}

/*
 * Convierte nombre de archivo a título legible.
 * "deep_sub_bass_hit" → "Deep Sub Bass Hit"
 * "808-kick-hard" → "808 Kick Hard"
 */
function humanizarNombreArchivo(nombre: string): string {
    return nombre
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(palabra => {
            if (palabra.length === 0) return '';
            /* Mantener números y siglas en mayúsculas como están */
            if (/^\d+$/.test(palabra) || /^[A-Z]{2,}$/.test(palabra)) return palabra;
            return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
        })
        .join(' ');
}

/*
 * Genera tags desde el contexto de la ruta.
 * Combina carpetas padre + palabras del nombre del archivo.
 * Garantiza mínimo 2 tags (requisito del endpoint de upload).
 *
 * Ejemplo: carpetas=['Samples', '808', 'Bass'], nombre='deep_sub_hit'
 * → ['808', 'bass', 'deep', 'sub', 'hit']
 */
function generarTagsDesdeContexto(carpetas: string[], nombreArchivo: string): string[] {
    const tagsSet = new Set<string>();

    /* Tags de carpetas (ignorar carpetas genéricas) */
    const carpetasGenericas = new Set([
        'samples', 'audio', 'music', 'sounds', 'downloads',
        'descargas', 'general', 'sync', 'kamples',
    ]);

    for (const carpeta of carpetas) {
        const normalizada = carpeta.toLowerCase().trim();
        if (normalizada.length >= 2 && !carpetasGenericas.has(normalizada)) {
            tagsSet.add(normalizada);
        }
    }

    /* Tags del nombre del archivo */
    const palabras = nombreArchivo
        .replace(/[_\-\.]+/g, ' ')
        .split(/\s+/)
        .map(p => p.toLowerCase().trim())
        .filter(p => p.length >= 2 && !/^\d+$/.test(p));

    for (const palabra of palabras) {
        if (tagsSet.size < 8) {
            tagsSet.add(palabra);
        }
    }

    /* Garantizar mínimo 2 tags */
    const resultado = Array.from(tagsSet);
    if (resultado.length < 2) {
        if (resultado.length === 0) {
            resultado.push('sample', 'audio');
        } else {
            resultado.push('sample');
        }
    }

    return resultado;
}

/*
 * Determina el MIME type por extensión de archivo.
 */
function obtenerMimeType(extension: string): string {
    const mapa: Record<string, string> = {
        wav: 'audio/wav',
        mp3: 'audio/mpeg',
        flac: 'audio/flac',
        aiff: 'audio/aiff',
        aif: 'audio/aiff',
        ogg: 'audio/ogg',
    };
    return mapa[extension.toLowerCase()] ?? 'audio/wav';
}

/*
 * Emite progreso al callback registrado.
 */
function emitirProgreso(item: ItemUploadCola): void {
    if (!callbackProgreso) return;

    const pendientes = cola.filter(i => i.estado === 'pendiente' || i.estado === 'subiendo');
    const posicion = pendientes.indexOf(item);

    callbackProgreso({
        item,
        totalEnCola: pendientes.length,
        posicionEnCola: posicion >= 0 ? posicion + 1 : 0,
    });
}

/*
 * Persiste la cola filtrando items completados viejos.
 * Se usa para guardar con urgencia (reintento, eliminación manual).
 * Para persistencia frecuente en bucle, usar guardarColaDebounced().
 */
async function guardarCola(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const paraGuardar = cola.filter(i =>
            i.estado !== 'completado' ||
            (Date.now() - i.timestampActualizado < 3600_000),
        );
        await store.set(STORE_KEY_COLA, paraGuardar);
        await store.save();
    } catch {
        /* Fallo silencioso — la cola en memoria sigue viva */
    }
}

/*
 * Versión debounced de guardarCola para uso en bucles de alta frecuencia.
 * Agrupa múltiples escrituras en una sola operación de disco.
 */
function guardarColaDebounced(): void {
    if (!esDesktop()) return;
    const paraGuardar = cola.filter(i =>
        i.estado !== 'completado' ||
        (Date.now() - i.timestampActualizado < 3600_000),
    );
    persistirConDebounce('upload_cola', STORE_FILE, STORE_KEY_COLA, paraGuardar, 2000);
}

/*
 * Persiste los hashes procesados.
 */
async function guardarHashes(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        /* Limitar a últimos 5000 hashes para no crecer indefinidamente */
        const hashesArray = Array.from(hashesConocidos).slice(-5000);
        await store.set(STORE_KEY_HASHES, hashesArray);
        await store.save();
    } catch {
        /* Fallo silencioso */
    }
}

/*
 * Retorna true si hay items pendientes de subir.
 */
function tienePendientes(): boolean {
    return cola.some(i => i.estado === 'pendiente');
}

/*
 * Retorna el estado actual de la cola (para UI).
 */
export function obtenerEstadoCola(): {
    items: ItemUploadCola[];
    totalPendientes: number;
    totalErrores: number;
    procesando: boolean;
} {
    return {
        items: [...cola],
        totalPendientes: cola.filter(i => i.estado === 'pendiente' || i.estado === 'subiendo').length,
        totalErrores: cola.filter(i => i.estado === 'error').length,
        procesando,
    };
}

/*
 * Reintenta subir un item que falló.
 */
export async function reintentarItem(itemId: string): Promise<void> {
    const item = cola.find(i => i.id === itemId);
    if (item && item.estado === 'error') {
        item.estado = 'pendiente';
        item.intentos = 0;
        item.ultimoError = undefined;
        item.timestampActualizado = Date.now();
        rutasEnCola.add(claveRutaEnCola(item.rutaArchivo));
        await guardarCola(); /* Guardar inmediato: acción explícita del usuario */

        if (estaOnline()) {
            procesarCola();
        }
    }
}

/*
 * Reintenta todos los items que estén en estado "error".
 * Útil para cuando el usuario presiona "Sincronizar ahora".
 *
 * Arquitectura multi-ventana Tauri: el sync panel (sync.html) y la ventana
 * principal (index.html) son procesos JS separados con instancias de módulo
 * distintas. El sync panel tiene su cola vacía; la real vive en la ventana
 * principal. Por eso también emitimos el evento Tauri `reintentar-errores-upload`
 * para que el listener en inicializarUploadQueue() lo procese en la ventana correcta.
 */
export async function reintentarTodosConError(): Promise<void> {
    let algunActualizado = false;
    for (const item of cola) {
        if (item.estado === 'error') {
            item.estado = 'pendiente';
            item.intentos = 0;
            item.ultimoError = undefined;
            item.timestampActualizado = Date.now();
            rutasEnCola.add(claveRutaEnCola(item.rutaArchivo));
            algunActualizado = true;
        }
    }

    if (algunActualizado) {
        await guardarCola();
        if (estaOnline()) {
            procesarCola();
        }
    }

    /* Notificar a TODAS las ventanas Tauri (especialmente la principal
     * que tiene la cola real) para que también procesen el reintento. */
    try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('reintentar-errores-upload', {});
    } catch {
        /* Entorno sin Tauri — ignorar */
    }
}

/*
 * Elimina un item de la cola (cancelar upload).
 */
export async function eliminarItemCola(itemId: string): Promise<void> {
    const item = cola.find(i => i.id === itemId);
    if (item) {
        rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));
    }
    cola = cola.filter(i => i.id !== itemId);
    await guardarCola(); /* Guardar inmediato: acción explícita del usuario */
}

/*
 * Limpia items completados de la cola.
 */
export async function limpiarCompletados(): Promise<void> {
    /* Limpiar Set de rutas de items completados */
    for (const item of cola) {
        if (item.estado === 'completado') {
            rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));
        }
    }
    cola = cola.filter(i => i.estado !== 'completado');
    await guardarCola();
}

