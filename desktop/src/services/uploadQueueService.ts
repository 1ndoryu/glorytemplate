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
import { extraerMetadataDeRuta, registrarSubidaLocal, registrarAccionHistorial, actualizarEstadoSampleHistorial, moverSampleEnServidorPublico, moverArchivoASinColeccion } from './syncService';
import { obtenerBaseUrlSync } from './syncGuards';
import { Semaforo } from './semaforo';
import { persistirConDebounce, flushPersistencia } from './persistenciaDebounce';
import { estado } from './syncState';

const STORE_FILE = 'upload-queue.json';
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
            /* Restaurar solo items no completados */
            cola = colaGuardada.filter(i => i.estado !== 'completado');
            /* Items que estaban "subiendo" al cerrar -> volver a pendiente */
            for (const item of cola) {
                if (item.estado === 'subiendo') {
                    item.estado = 'pendiente';
                }
            }
            /* Reconstruir Set de rutas para lookups O(1) */
            rutasEnCola = new Set(cola.map(i => i.rutaArchivo));
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
    /* Verificar si ya está en la cola (misma ruta) — O(1) con Set */
    if (rutasEnCola.has(rutaArchivo) && cola.some(i => i.rutaArchivo === rutaArchivo && i.estado !== 'error')) {
        console.info('[UploadQueue] Archivo ya en cola, ignorando:', nombreArchivo);
        return false;
    }

    /* Calcular hash parcial para detectar duplicados por contenido */
    const hash = await calcularHashParcial(rutaArchivo);
    if (hash && hashesConocidos.has(hash)) {
        console.info('[UploadQueue] Duplicado detectado por hash:', nombreArchivo);
        return false;
    }

    const item: ItemUploadCola = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        rutaArchivo,
        nombreArchivo,
        carpetas,
        estado: 'pendiente',
        intentos: 0,
        timestampCreado: Date.now(),
        timestampActualizado: Date.now(),
        hashParcial: hash ?? undefined,
    };

    cola.push(item);
    rutasEnCola.add(rutaArchivo);
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
        rutasEnCola.delete(item.rutaArchivo);

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
            rutasEnCola.delete(item.rutaArchivo);

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

        const { readFile } = await import('@tauri-apps/plugin-fs');
        const baseUrl = obtenerBaseUrlSync();

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

        /* POST al servidor */
        const respuesta = await fetch(`${baseUrl}/kamples/v1/samples/upload`, {
            method: 'POST',
            body: formData,
            /* No poner Content-Type: el browser lo genera con el boundary correcto */
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
            slug?: string;
        };

        if (!resultado.ok || !resultado.sample_id) {
            item.ultimoError = 'Respuesta inesperada del servidor';
            return false;
        }

        item.sampleIdServidor = resultado.sample_id;

        /* Registrar en tracking + historial para feedback persistente en panel */
        await registrarSubidaLocal(
            resultado.sample_id,
            item.rutaArchivo,
            item.nombreArchivo,
        );

        /* Intentar obtener imagen de portada del sample recién subido (no bloquea el flujo) */
        obtenerImagenSampleDesdeServidor(resultado.sample_id).then(imagenUrl => {
            if (imagenUrl) {
                actualizarEstadoSampleHistorial({
                    sampleId: resultado.sample_id!,
                    nombreArchivo: item.nombreArchivo,
                    estado: 'sincronizado',
                    imagenUrl,
                }).catch(() => {});
            }
        }).catch(() => { /* No bloquear flujo si falla obtener imagen */ });

        /*
         * Asignar carpeta en el servidor basada en la ubicación local.
         * PipelineAudio del backend asigna carpeta vía IA, pero la estructura
         * local del usuario tiene prioridad. carpetas[0] = primaria, [1] = secundaria.
         */
        if (item.carpetas.length > 0) {
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
        rutasEnCola.add(item.rutaArchivo);
        await guardarCola(); /* Guardar inmediato: acción explícita del usuario */

        if (estaOnline()) {
            procesarCola();
        }
    }
}

/*
 * Elimina un item de la cola (cancelar upload).
 */
export async function eliminarItemCola(itemId: string): Promise<void> {
    const item = cola.find(i => i.id === itemId);
    if (item) {
        rutasEnCola.delete(item.rutaArchivo);
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
            rutasEnCola.delete(item.rutaArchivo);
        }
    }
    cola = cola.filter(i => i.estado !== 'completado');
    await guardarCola();
}

/*
 * Obtiene la imagen de portada de un sample desde la API.
 * Usado después del upload para enriquecer el historial con la imagen.
 * No bloquea el flujo principal — llamado en segundo plano.
 *
 * Implementa retry con backoff exponencial porque el pipeline del backend
 * genera la imagen asincrónicamente (PipelineAudio), y no está lista
 * inmediatamente después del upload.
 *
 * Intentos: 4s → 12s → 30s → 60s (total ~106s de espera)
 */
const IMAGEN_RETRY_DELAYS_MS = [4000, 12000, 30000, 60000];

async function obtenerImagenSampleDesdeServidor(sampleId: number): Promise<string | null> {
    const baseUrl = obtenerBaseUrlSync();
    if (!baseUrl) return null;

    for (let intento = 0; intento <= IMAGEN_RETRY_DELAYS_MS.length; intento++) {
        /* Esperar antes de cada intento (excepto el primero que ya tiene 4s de delay) */
        if (intento > 0) {
            await new Promise(r => setTimeout(r, IMAGEN_RETRY_DELAYS_MS[intento - 1]));
        } else {
            /* Delay inicial para dar tiempo al pipeline del backend */
            await new Promise(r => setTimeout(r, IMAGEN_RETRY_DELAYS_MS[0]));
        }

        try {
            const respuesta = await fetch(`${baseUrl}/kamples/v1/samples/${sampleId}`);
            if (!respuesta.ok) continue;

            const data = await respuesta.json() as { imagenUrl?: string | null; imagen_url?: string | null };
            const url = data.imagenUrl ?? data.imagen_url ?? null;

            if (url) return url;
            /* null → pipeline aún no terminó, reintentar */
        } catch {
            /* Error de red, reintentar */
        }
    }

    return null;
}
