/*
 * Servicio: syncCollectionService — C355
 * Lógica de mapeo colecciones del servidor ↔ carpetas locales en disco.
 *
 * Responsabilidades:
 * - Sincronizar con el nuevo endpoint GET /me/sync/colecciones
 * - Crear/renombrar carpetas locales para colecciones
 * - Descargar samples nuevos a la carpeta correcta
 * - Detectar cambios servidor → local (polling)
 * - Sanitizar nombres de carpeta para filesystem
 *
 * NO maneja: watcher (eso es fileWatcherService), upload (uploadQueueService),
 * ni persistencia directa (eso es syncTrackingService).
 */

import { estaOnline } from './desktopService';
import { marcarDescargaEnCurso, obtenerBaseUrlSync } from './syncGuards';
import { encolarOperacion } from './offlineQueueService';
import { Semaforo } from './semaforo';
import { estado } from './syncState';
import { moverAPapelera } from './papeleraService';
import {
    obtenerArchivo,
    buscarArchivoPorSampleId,
    registrarArchivo,
    registrarColeccion,
    obtenerColeccion,
    todasLasColecciones,
    actualizarNombreColeccion,
    buscarColeccionPorCarpeta,
    registrarAccion,
    generarClaveTracking,
    agregarSinColeccion,
    iniciarLote,
    finalizarLote,
    todosLosArchivos,
    eliminarArchivo,
    type ArchivoTracking,
    type ColeccionLocal,
} from './syncTrackingService';

/* Tipos del endpoint */

export interface SampleSync {
    id: number;
    titulo: string;
    formato: string;
    tamano: number;
    imagenUrl?: string | null;
    imagen_url?: string | null;
}

export interface ColeccionSync {
    id: number;
    nombre: string;
    parent_id: number | null;
    samples: SampleSync[];
}

export interface RespuestaSyncColecciones {
    colecciones: ColeccionSync[];
    sinColeccion: SampleSync[];
}

/* Config */

const CARPETA_SIN_COLECCION = 'Sin colecci\u00f3n';
/* Nombre legacy que se escribió a disco cuando el source tenía encoding corrupto.
 * ó (U+00F3) en UTF-8 = bytes C3 B3 → interpretados como Windows-1252 = Ã (U+00C3) + ³ (U+00B3).
 * Usamos escapes Unicode explícitos para independizarnos del encoding del archivo. */
const CARPETA_SIN_COLECCION_LEGACY = 'Sin colecci\u00c3\u00b3n';

/* Caracteres no válidos en nombres de carpeta Windows/macOS/Linux */
const REGEX_CARACTERES_INVALIDOS = /[/\\:*?"<>|]/g;

/* Caché de sesión: IDs de colecciones ya normalizadas para evitar
 * llamadas repetidas a renombrarColeccionEnServidor en cada polling (60s). */
const coleccionesNormalizadasEnSesion = new Set<number>();

/*
 * Gracia de presencia en servidor para samples recién registrados localmente.
 * Evita falsos borrados cuando el endpoint /me/sync/colecciones todavía no refleja
 * un sample nuevo (pipeline async, latencia de replicación o caché).
 */
const GRACIA_PRESENCIA_SERVIDOR_MS = 15 * 60 * 1000;
const MAX_REINTENTOS_CREAR_COLECCION = 4;
const BACKOFF_BASE_CREAR_COLECCION_MS = 1200;

/* Evita POST duplicados cuando watcher/polling disparan la misma colección a la vez. */
const creacionesColeccionEnVuelo = new Map<string, Promise<number | null>>();

function dormir(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calcularBackoffCreacion(intento: number, retryAfterHeader: string | null): number {
    if (retryAfterHeader) {
        const segundos = Number(retryAfterHeader);
        if (Number.isFinite(segundos) && segundos > 0) {
            return Math.min(segundos * 1000, 60_000);
        }
    }

    const exponencial = BACKOFF_BASE_CREAR_COLECCION_MS * Math.pow(2, intento - 1);
    const jitter = Math.floor(Math.random() * 400);
    return Math.min(exponencial + jitter, 60_000);
}

async function buscarColeccionServidorPorNombre(nombreNormalizado: string): Promise<number | null> {
    const datosServidor = await obtenerColeccionesDelServidor();
    if (!datosServidor) return null;

    const objetivo = nombreNormalizado.toLowerCase();
    const existente = datosServidor.colecciones.find(c => c.nombre.toLowerCase() === objetivo);
    return existente?.id ?? null;
}

/*
 * Versión pública de buscarColeccionServidorPorNombre.
 * Usada por syncWatcherSetup para el fallback de rename:
 * si la colección no está en tracking local, buscar en servidor antes de crear duplicada.
 */
export async function buscarColeccionServidorPorNombrePublico(nombre: string): Promise<number | null> {
    return buscarColeccionServidorPorNombre(normalizarNombreColeccion(nombre));
}

function encolarCreacionColeccion(nombreNormalizado: string): void {
    const baseUrl = obtenerBaseUrlSync();
    encolarOperacion({
        tipo: 'crear_coleccion',
        endpoint: `${baseUrl}/kamples/v1/colecciones`,
        method: 'POST',
        body: { nombre: nombreNormalizado, descripcion: '', publica: false },
        claveDuplicacion: `crear_coleccion_${nombreNormalizado.toLowerCase()}`,
    }).catch(err => {
        console.error('[SyncCollection] Error encolando creación de colección:', err);
    });
}

async function registrarColeccionNuevaLocal(id: number, nombreNormalizado: string, parentId: number | null = null): Promise<void> {
    await registrarColeccion({
        id,
        nombre: nombreNormalizado,
        carpetaLocal: sanitizarNombreCarpeta(nombreNormalizado),
        creadaLocalmente: true,
        parentId,
    });

    await registrarAccion({
        tipo: 'creado',
        descripcion: `Colección "${nombreNormalizado}" creada desde carpeta local${parentId ? ` (sub de #${parentId})` : ''}`,
        coleccionId: id,
    });
}

/* Utilidades */

/**
 * Sanitiza un nombre de colección para usarlo como nombre de carpeta.
 * Reemplaza caracteres inválidos y recorta espacios.
 */
export function sanitizarNombreCarpeta(nombre: string): string {
    return nombre
        .replace(REGEX_CARACTERES_INVALIDOS, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100); /* Limitar largo para evitar problemas de path */
}

/**
 * Resuelve conflictos de nombre de carpeta agregando sufijo numérico.
 * Si "Mi Colección" ya existe, retorna "Mi Colección (2)".
 */
function resolverConflictoNombre(nombreBase: string, nombresExistentes: Set<string>): string {
    if (!nombresExistentes.has(nombreBase)) return nombreBase;

    let sufijo = 2;
    while (nombresExistentes.has(`${nombreBase} (${sufijo})`)) {
        sufijo++;
    }
    return `${nombreBase} (${sufijo})`;
}

function normalizarNombreColeccion(nombre: string): string {
    const limpio = nombre.trim();
    if (limpio === CARPETA_SIN_COLECCION_LEGACY) {
        return CARPETA_SIN_COLECCION;
    }
    return limpio.split(CARPETA_SIN_COLECCION_LEGACY).join(CARPETA_SIN_COLECCION);
}

/* Fetch de colecciones */

/**
 * Obtiene las colecciones con samples del servidor para sync.
 * Usa el nuevo endpoint optimizado GET /me/sync/colecciones.
 */
export async function obtenerColeccionesDelServidor(): Promise<RespuestaSyncColecciones | null> {
    if (!estaOnline()) return null;

    try {
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/me/sync/colecciones`);

        if (!resp.ok) {
            console.error('[SyncCollection] Error obteniendo colecciones:', resp.status);
            return null;
        }

        const json = await resp.json();
        /* PHP retorna { data: { colecciones, sinColeccion } } */
        const data = json?.data ?? json;

        return {
            colecciones: data?.colecciones ?? [],
            sinColeccion: data?.sinColeccion ?? [],
        };
    } catch (err) {
        console.error('[SyncCollection] Error en fetch colecciones:', err);
        return null;
    }
}

/* Sync completo */

export interface ProgresoSyncColecciones {
    fase: 'estructura' | 'descarga' | 'completado';
    actual: number;
    total: number;
    sampleId?: number;
    nombre?: string;
    estado?: 'descargando' | 'descargado' | 'error' | 'omitido';
}

export type CallbackProgresoColecciones = (progreso: ProgresoSyncColecciones) => void;

/**
 * Sincronización completa basada en colecciones.
 * 1. Obtiene colecciones del servidor
 * 2. Crea/actualiza carpetas locales por colección
 * 3. Descarga samples nuevos a la carpeta correspondiente
 * 4. Samples sin colección van a la carpeta especial "Sin colección"
 *
 * @param soloEstructura Si true, solo sincroniza carpetas (no descarga archivos).
 *   Usado por el polling periódico para evitar roundtrips de descarga cada 60s.
 */
export async function sincronizarColecciones(
    carpetaBase: string,
    onProgreso?: CallbackProgresoColecciones,
    soloEstructura = false,
): Promise<{ nuevos: number; errores: number }> {
    const datosServidor = await obtenerColeccionesDelServidor();
    if (!datosServidor) return { nuevos: 0, errores: 0 };

    /* Mantener tracking consistente: purgar entries de samples que el servidor ya no tiene.
     * Esto permite que el watcher re-encole archivos borrados del servidor cuando el
     * usuario los vuelva a anadir localmente. */
    const sampleIdsServidor = new Set<number>();
    for (const col of datosServidor.colecciones) {
        for (const s of col.samples) sampleIdsServidor.add(s.id);
    }
    for (const s of datosServidor.sinColeccion) sampleIdsServidor.add(s.id);

    const archivosActuales = todosLosArchivos();
    const borrarLocalSiNoEnServidor = estado.configAvanzada.borrarEnLocalAlBorrarEnServidor;

    for (const archivo of archivosActuales) {
        if (!sampleIdsServidor.has(archivo.sampleId)) {
            const esReciente = (Date.now() - (archivo.descargadoEn ?? 0)) < GRACIA_PRESENCIA_SERVIDOR_MS;
            if (esReciente) {
                console.info('[SyncCollection] Omitiendo purge por ventana de gracia (sample reciente):', archivo.sampleId, archivo.nombreLocal);
                continue;
            }

            /* Borrado bidireccional server→local: mover a papelera si esta activo */
            if (borrarLocalSiNoEnServidor && archivo.rutaLocal) {
                const { exists: existeFs } = await import('@tauri-apps/plugin-fs');
                const existeArchivo = await existeFs(archivo.rutaLocal).catch(() => false);
                if (existeArchivo && estado.config.carpetaLocal) {
                    const movido = await moverAPapelera(
                        archivo.rutaLocal,
                        archivo.nombreLocal,
                        archivo.sampleId,
                        archivo.coleccionId,
                        'servidor',
                        estado.config.carpetaLocal,
                    );
                    if (movido) {
                        console.info('[SyncCollection] Archivo local movido a papelera (borrado en servidor):', archivo.nombreLocal);
                    }
                }
            }

            await eliminarArchivo(archivo.sampleId, archivo.coleccionId);
            console.info('[SyncCollection] Eliminado de tracking (ya no existe en servidor):', archivo.nombreLocal, '(id:', archivo.sampleId, ')');
        }
    }

    const { mkdir, writeFile, exists, rename } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');

    let nuevos = 0;
    let errores = 0;

    /* Calcular total de samples para progreso */
    const totalSamples = datosServidor.colecciones.reduce((sum, c) => sum + c.samples.length, 0)
        + datosServidor.sinColeccion.length;

    /* Fase 1: Crear/actualizar estructura de carpetas */
    onProgreso?.({ fase: 'estructura', actual: 0, total: datosServidor.colecciones.length + 1 });

    const nombresUsados = new Set<string>();

    /*
     * Separar colecciones raíz y subcolecciones.
     * Procesar raíz primero para que las subcarpetas tengan un padre creado.
     */
    const coleccionesRaiz = datosServidor.colecciones.filter(c => c.parent_id === null || c.parent_id === undefined);
    const subcolecciones = datosServidor.colecciones.filter(c => c.parent_id !== null && c.parent_id !== undefined);

    /* Sincronizar colecciones raíz del servidor → carpetas locales */
    for (const colServer of coleccionesRaiz) {
        const nombreNormalizado = normalizarNombreColeccion(colServer.nombre);
        if (nombreNormalizado !== colServer.nombre && !coleccionesNormalizadasEnSesion.has(colServer.id)) {
            await renombrarColeccionEnServidor(colServer.id, nombreNormalizado);
            colServer.nombre = nombreNormalizado;
            coleccionesNormalizadasEnSesion.add(colServer.id);
        }

        const colLocal = obtenerColeccion(colServer.id);

        if (colLocal) {
            /* Verificar si el nombre cambió en el servidor */
            if (colLocal.nombre !== colServer.nombre) {
                await manejarRenombreColeccion(carpetaBase, colLocal, colServer.nombre);
            }
            nombresUsados.add(colLocal.carpetaLocal);
        } else {
            /* Colección nueva del servidor — crear carpeta local */
            const nombreCarpeta = sanitizarNombreCarpeta(colServer.nombre);
            const nombreFinal = resolverConflictoNombre(nombreCarpeta, nombresUsados);
            nombresUsados.add(nombreFinal);

            const rutaCarpeta = await join(carpetaBase, nombreFinal);
            try {
                await mkdir(rutaCarpeta, { recursive: true });
            } catch { /* puede existir */ }

            await registrarColeccion({
                id: colServer.id,
                nombre: colServer.nombre,
                carpetaLocal: nombreFinal,
                creadaLocalmente: false,
                parentId: null,
            });

            await registrarAccion({
                tipo: 'creado',
                descripcion: `Carpeta creada para colección "${colServer.nombre}"`,
                coleccionId: colServer.id,
            });
        }
    }

    /* Sincronizar subcolecciones del servidor → subcarpetas locales */
    for (const subServer of subcolecciones) {
        const padreLocal = obtenerColeccion(subServer.parent_id!);
        if (!padreLocal) {
            console.warn('[SyncCollection] Padre no encontrado para subcolección:', subServer.nombre, 'parent_id:', subServer.parent_id);
            continue;
        }

        const nombreNormalizado = normalizarNombreColeccion(subServer.nombre);
        const subLocal = obtenerColeccion(subServer.id);

        if (subLocal) {
            if (subLocal.nombre !== subServer.nombre) {
                /* Renombrar subcarpeta si cambió el nombre en servidor */
                const carpetaPadre = await join(carpetaBase, padreLocal.carpetaLocal);
                await manejarRenombreColeccion(carpetaPadre, subLocal, subServer.nombre);
            }
        } else {
            /* Subcolección nueva — crear subcarpeta dentro de la carpeta padre */
            const nombreCarpeta = sanitizarNombreCarpeta(nombreNormalizado);
            const carpetaPadre = await join(carpetaBase, padreLocal.carpetaLocal);
            const rutaSubcarpeta = await join(carpetaPadre, nombreCarpeta);

            try {
                await mkdir(rutaSubcarpeta, { recursive: true });
            } catch { /* puede existir */ }

            await registrarColeccion({
                id: subServer.id,
                nombre: subServer.nombre,
                carpetaLocal: nombreCarpeta,
                creadaLocalmente: false,
                parentId: subServer.parent_id!,
            });

            await registrarAccion({
                tipo: 'creado',
                descripcion: `Subcarpeta creada para subcolección "${subServer.nombre}" en "${padreLocal.nombre}"`,
                coleccionId: subServer.id,
            });
        }
    }

    /* Normalizar carpeta legacy "Sin colección" -> "Sin colección" */
    const rutaSinColLegacy = await join(carpetaBase, CARPETA_SIN_COLECCION_LEGACY);
    const rutaSinColCanonical = await join(carpetaBase, CARPETA_SIN_COLECCION);

    const existeLegacy = await exists(rutaSinColLegacy);
    const existeCanonical = await exists(rutaSinColCanonical);

    if (existeLegacy && !existeCanonical) {
        try {
            await rename(rutaSinColLegacy, rutaSinColCanonical);
            await registrarAccion({
                tipo: 'renombrado',
                descripcion: `Carpeta renombrada: "${CARPETA_SIN_COLECCION_LEGACY}" → "${CARPETA_SIN_COLECCION}"`,
            });
        } catch (err) {
            console.warn('[SyncCollection] No se pudo renombrar carpeta legacy Sin colección:', err);
        }
    }

    /* Reparar rutas legacy en tracking para evitar desalineación */
    let rutasCorregidas = 0;
    const archivosTracking = todosLosArchivos();
    for (const archivo of archivosTracking) {
        if (!archivo.rutaLocal.includes(CARPETA_SIN_COLECCION_LEGACY)) continue;

        const rutaCorregida = archivo.rutaLocal.replace(
            CARPETA_SIN_COLECCION_LEGACY,
            CARPETA_SIN_COLECCION,
        );

        if (rutaCorregida !== archivo.rutaLocal) {
            await registrarArchivo({
                ...archivo,
                rutaLocal: rutaCorregida,
            });
            rutasCorregidas++;
        }
    }

    if (rutasCorregidas > 0) {
        await registrarAccion({
            tipo: 'renombrado',
            descripcion: `Tracking reparado: ${rutasCorregidas} ruta(s) actualizadas a "${CARPETA_SIN_COLECCION}"`,
        });
    }

    /* Asegurar carpeta "Sin colección" */
    const rutaSinCol = await join(carpetaBase, CARPETA_SIN_COLECCION);
    try {
        await mkdir(rutaSinCol, { recursive: true });
    } catch { /* puede existir */ }

    /* Modo soloEstructura: no descargar archivos (usado por polling periodico) */
    if (soloEstructura) {
        return { nuevos: 0, errores: 0 };
    }

    /* Verificar espacio en disco antes de descargas masivas */
    const espacioSuficiente = await verificarEspacioDisco(carpetaBase, datosServidor);
    if (!espacioSuficiente) {
        console.error('[SyncColecciones] Espacio insuficiente en disco. Abortando descargas.');
        return { nuevos: 0, errores: totalSamples };
    }

    /* Fase 2: Descargar samples (modo lote para evitar 100+ escrituras individuales) */
    iniciarLote();
    onProgreso?.({ fase: 'descarga', actual: 0, total: totalSamples });

    /* Construir lista plana de descargas para procesar en paralelo */
    interface TareaDescarga {
        sample: SampleSync;
        coleccionId: number | null;
        carpetaDestino: string;
        esSinColeccion: boolean;
    }

    const tareasDescarga: TareaDescarga[] = [];

    for (const colServer of datosServidor.colecciones) {
        const colLocal = obtenerColeccion(colServer.id);
        if (!colLocal) continue;

        /* Resolver ruta de carpeta: subcolecciones viven dentro de la carpeta del padre */
        let carpetaColeccion: string;
        if (colLocal.parentId !== null) {
            const padreLocal = obtenerColeccion(colLocal.parentId);
            if (!padreLocal) continue;
            carpetaColeccion = await join(carpetaBase, padreLocal.carpetaLocal, colLocal.carpetaLocal);
        } else {
            carpetaColeccion = await join(carpetaBase, colLocal.carpetaLocal);
        }

        for (const sample of colServer.samples) {
            tareasDescarga.push({
                sample,
                coleccionId: colServer.id,
                carpetaDestino: carpetaColeccion,
                esSinColeccion: false,
            });
        }
    }

    for (const sample of datosServidor.sinColeccion) {
        tareasDescarga.push({
            sample,
            coleccionId: null,
            carpetaDestino: rutaSinCol,
            esSinColeccion: true,
        });
    }

    /* Procesar descargas en paralelo con semáforo */
    const maxParalelos = Math.max(1, Math.min(5, estado.configAvanzada.archivosParalelos));
    const semaforoDescargas = new Semaforo(maxParalelos);
    let procesados = 0;

    const promesasDescarga = tareasDescarga.map(tarea => {
        return semaforoDescargas.adquirir().then(async () => {
            try {
                procesados++;
                const resultado = await descargarSiNecesario(
                    tarea.sample, tarea.coleccionId, tarea.carpetaDestino,
                    onProgreso, procesados, totalSamples,
                );
                if (resultado === 'nuevo') {
                    nuevos++;
                    if (tarea.esSinColeccion) {
                        await agregarSinColeccion(tarea.sample.id);
                    }
                }
                if (resultado === 'error') errores++;
            } finally {
                semaforoDescargas.liberar();
            }
        });
    });

    await Promise.all(promesasDescarga);

    onProgreso?.({ fase: 'completado', actual: totalSamples, total: totalSamples });

    /* Finalizar modo lote: persistir todo de una vez */
    await finalizarLote();

    return { nuevos, errores };
}

/* Descarga individual */

/**
 * Descarga un sample si no existe en el tracking.
 * Retorna 'nuevo' | 'existente' | 'omitido' | 'error'.
 */
async function descargarSiNecesario(
    sample: SampleSync,
    coleccionId: number | null,
    carpetaDestino: string,
    onProgreso: CallbackProgresoColecciones | undefined,
    actual: number,
    total: number,
): Promise<'nuevo' | 'existente' | 'omitido' | 'error'> {
    /* Verificar si ya existe en tracking */
    const existente = obtenerArchivo(sample.id, coleccionId);
    if (existente) {
        if (existente.syncDeshabilitado) {
            onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'omitido' });
            return 'omitido';
        }
        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'descargado' });
        return 'existente';
    }

    /* Verificar si existe en otra colección (archivo ya descargado, solo necesita tracking) */
    const enOtraCol = buscarArchivoPorSampleId(sample.id);
    if (enOtraCol && !enOtraCol.syncDeshabilitado) {
        /*
         * El archivo ya existe en disco por otra colección.
         * Registrar nuevo tracking para esta colección apuntando al mismo archivo.
         * TO-DO: Copiar archivo a la carpeta de la nueva colección (hardlink/copy).
         */
        await registrarArchivo({
            sampleId: sample.id,
            coleccionId,
            rutaLocal: enOtraCol.rutaLocal,
            nombreLocal: enOtraCol.nombreLocal,
            nombreServidor: enOtraCol.nombreServidor,
            descargadoEn: enOtraCol.descargadoEn,
            tamano: enOtraCol.tamano,
            syncDeshabilitado: false,
        });
        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'descargado' });
        return 'existente';
    }

    /* Descargar desde el servidor */
    try {
        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'descargando' });

        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrlSync();

        /* Obtener URL firmada de descarga */
        const respDescarga = await fetch(`${baseUrl}/kamples/v1/samples/${sample.id}/descargar`, { method: 'POST' });
        if (!respDescarga.ok) {
            throw new Error(`No se pudo obtener URL de descarga: ${respDescarga.status}`);
        }

        interface ResultadoDescarga { url: string; nombre: string; formato: string; tamano: number }
        const { url: audioUrl, nombre, formato, tamano }: ResultadoDescarga = await respDescarga.json();

        /* Descargar el archivo de audio */
        const audioResp = await fetch(audioUrl);
        if (!audioResp.ok) {
            throw new Error(`Error al descargar audio: ${audioResp.status}`);
        }
        const buffer = await audioResp.arrayBuffer();

        const nombreArchivo = nombre.includes('.') ? nombre : `${nombre}.${formato}`;
        const rutaArchivo = await join(carpetaDestino, nombreArchivo);

        /* Marcar ruta antes de escribir para que el watcher la ignore */
        marcarDescargaEnCurso(rutaArchivo);

        await writeFile(rutaArchivo, new Uint8Array(buffer));

        /* Registrar en tracking */
        await registrarArchivo({
            sampleId: sample.id,
            coleccionId,
            rutaLocal: rutaArchivo,
            nombreLocal: nombreArchivo,
            nombreServidor: nombreArchivo,
            descargadoEn: Date.now(),
            tamano: tamano || buffer.byteLength,
            syncDeshabilitado: false,
        });

        await registrarAccion({
            tipo: 'descarga',
            descripcion: `Descargado "${sample.titulo}" (${nombreArchivo})`,
            sampleId: sample.id,
            coleccionId: coleccionId ?? undefined,
        });

        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: nombreArchivo, estado: 'descargado' });
        return 'nuevo';
    } catch (err) {
        console.error(`[SyncCollection] Error descargando sample ${sample.id}:`, err);
        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'error' });
        return 'error';
    }
}

/* Renombre de colección */

async function manejarRenombreColeccion(
    carpetaBase: string,
    colLocal: ColeccionLocal,
    nuevoNombreServer: string,
): Promise<void> {
    try {
        const { rename, exists } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');

        const nuevaCarpeta = sanitizarNombreCarpeta(nuevoNombreServer);
        const rutaAnterior = await join(carpetaBase, colLocal.carpetaLocal);
        const rutaNueva = await join(carpetaBase, nuevaCarpeta);

        /* Verificar que la carpeta anterior existe antes de renombrar */
        const existeAnterior = await exists(rutaAnterior);
        if (existeAnterior) {
            await rename(rutaAnterior, rutaNueva);
        }

        await actualizarNombreColeccion(colLocal.id, nuevoNombreServer, nuevaCarpeta);

        await registrarAccion({
            tipo: 'renombrado',
            descripcion: `Colección renombrada: "${colLocal.nombre}" → "${nuevoNombreServer}"`,
            coleccionId: colLocal.id,
        });

        console.info(`[SyncCollection] Colección ${colLocal.id} renombrada: ${colLocal.carpetaLocal} → ${nuevaCarpeta}`);
    } catch (err) {
        console.error(`[SyncCollection] Error renombrando colección ${colLocal.id}:`, err);
    }
}

/* Acciones locales → servidor */

/**
 * Mover un sample entre colecciones en el servidor.
 * Se llama cuando el watcher detecta un MOVE entre carpetas mapeadas.
 */
export async function moverSampleEntreColecciones(
    sampleId: number,
    coleccionOrigenId: number | null,
    coleccionDestinoId: number | null,
): Promise<boolean> {
    if (!estaOnline()) return false;

    try {
        const baseUrl = obtenerBaseUrlSync();

        /* Quitar de la colección origen */
        if (coleccionOrigenId !== null) {
            const respQuitar = await fetch(
                `${baseUrl}/kamples/v1/colecciones/${coleccionOrigenId}/samples`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sample_id: sampleId }),
                },
            );
            if (!respQuitar.ok) {
                console.error('[SyncCollection] Error quitando sample de colección origen:', respQuitar.status);
            }
        }

        /* Agregar a la colección destino */
        if (coleccionDestinoId !== null) {
            const respAgregar = await fetch(
                `${baseUrl}/kamples/v1/colecciones/${coleccionDestinoId}/samples`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sample_id: sampleId }),
                },
            );
            if (!respAgregar.ok) {
                console.error('[SyncCollection] Error agregando sample a colección destino:', respAgregar.status);
                return false;
            }
        }

        await registrarAccion({
            tipo: 'movido',
            descripcion: `Sample ${sampleId} movido de colección ${coleccionOrigenId ?? 'ninguna'} a ${coleccionDestinoId ?? 'ninguna'}`,
            sampleId,
            coleccionId: coleccionDestinoId ?? undefined,
        });

        return true;
    } catch (err) {
        console.error('[SyncCollection] Error moviendo sample entre colecciones:', err);
        return false;
    }
}

/**
 * Agrega un sample a una colección en el servidor via POST /colecciones/{id}/samples.
 *
 * Diferencia con moverSampleEnServidorPublico (PUT carpeta):
 * - PUT /me/coleccionados/{id}/carpeta → solo actualiza metadata del sample (label carpeta)
 * - POST /colecciones/{id}/samples → inserta en coleccion_samples (asociación real)
 *
 * Sin esta llamada, el sample no aparece dentro de la colección en sync ni en la web.
 */
export async function agregarSampleAColeccion(
    coleccionId: number,
    sampleId: number,
): Promise<boolean> {
    if (!estaOnline()) {
        encolarOperacion({
            tipo: 'agregar_sample_coleccion',
            endpoint: `${obtenerBaseUrlSync()}/kamples/v1/colecciones/${coleccionId}/samples`,
            method: 'POST',
            body: { sampleId },
            claveDuplicacion: `agregar_sample_${coleccionId}_${sampleId}`,
        });
        console.info('[SyncCollection] Agregar sample a colección encolado para cuando haya conexión:', sampleId, '→ col:', coleccionId);
        return true;
    }

    try {
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones/${coleccionId}/samples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sampleId }),
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            console.error('[SyncCollection] Error agregando sample a colección:', coleccionId, sampleId, resp.status, body);
            return false;
        }

        console.info('[SyncCollection] Sample agregado a colección:', sampleId, '→ col:', coleccionId);
        return true;
    } catch (err) {
        console.error('[SyncCollection] Error en request agregar sample a colección:', err);
        return false;
    }
}

/**
 * Crear una colección en el servidor a partir de carpeta local nueva.
 * Retorna el ID de la colección creada, o null si falla.
 */
export async function crearColeccionDesdeLocal(nombre: string, parentId: number | null = null): Promise<number | null> {
    try {
        const nombreNormalizado = normalizarNombreColeccion(nombre);
        const claveColeccion = `${parentId ?? 'raiz'}_${nombreNormalizado.toLowerCase()}`;

        if (!estaOnline()) {
            encolarCreacionColeccion(nombreNormalizado);
            return null;
        }

        /* Verificar si ya existe en tracking local antes de crear en servidor.
         * Previene duplicación cuando watcher + polling disparan casi simultáneamente. */
        const coleccionesLocales = todasLasColecciones();
        const carpetaEsperada = sanitizarNombreCarpeta(nombreNormalizado).toLowerCase();
        const yaExiste = coleccionesLocales.find(c =>
            c.parentId === parentId
            && (c.nombre.toLowerCase() === nombreNormalizado.toLowerCase()
                || c.carpetaLocal.toLowerCase() === carpetaEsperada),
        );
        if (yaExiste) {
            console.info('[SyncCollection] Colección ya existe en tracking, omitiendo POST:', nombreNormalizado, '→ id:', yaExiste.id);
            return yaExiste.id;
        }

        const enVuelo = creacionesColeccionEnVuelo.get(claveColeccion);
        if (enVuelo) return enVuelo;

        const promesa = (async (): Promise<number | null> => {
            const existenteServidor = await buscarColeccionServidorPorNombre(nombreNormalizado);
            if (existenteServidor) {
                await registrarColeccionNuevaLocal(existenteServidor, nombreNormalizado, parentId);
                return existenteServidor;
            }

            const baseUrl = obtenerBaseUrlSync();
            const bodyCrear: Record<string, unknown> = { nombre: nombreNormalizado, descripcion: '', publica: false };
            if (parentId !== null) bodyCrear.parent_id = parentId;

            for (let intento = 1; intento <= MAX_REINTENTOS_CREAR_COLECCION; intento++) {
                const resp = await fetch(`${baseUrl}/kamples/v1/colecciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyCrear),
                });

                if (resp.ok) {
                    const json = await resp.json();
                    const id = json?.data?.id ?? json?.id;
                    if (id) {
                        const idNum = Number(id);
                        await registrarColeccionNuevaLocal(idNum, nombreNormalizado, parentId);
                        return idNum;
                    }
                    return null;
                }

                if (resp.status === 409) {
                    const idExistente = await buscarColeccionServidorPorNombre(nombreNormalizado);
                    if (idExistente) {
                        await registrarColeccionNuevaLocal(idExistente, nombreNormalizado, parentId);
                        return idExistente;
                    }
                    return null;
                }

                const reintentable = resp.status === 429 || resp.status >= 500;
                if (!reintentable) {
                    console.error('[SyncCollection] Error creando colección:', resp.status);
                    return null;
                }

                if (intento < MAX_REINTENTOS_CREAR_COLECCION) {
                    const delay = calcularBackoffCreacion(intento, resp.headers.get('Retry-After'));
                    console.warn(`[SyncCollection] Crear colección reintentable (HTTP ${resp.status}), reintentando en ${delay}ms:`, nombreNormalizado);
                    await dormir(delay);
                    continue;
                }

                console.error('[SyncCollection] Crear colección agotó reintentos, encolando:', resp.status, nombreNormalizado);
                encolarCreacionColeccion(nombreNormalizado);
                return null;
            }

            return null;
        })();

        creacionesColeccionEnVuelo.set(claveColeccion, promesa);
        try {
            return await promesa;
        } finally {
            creacionesColeccionEnVuelo.delete(claveColeccion);
        }
    } catch (err) {
        console.error('[SyncCollection] Error creando colección desde local:', err);
        return null;
    }
}

/**
 * Renombrar una colección en el servidor.
 * Se llama cuando el watcher detecta RENAME de una carpeta mapeada.
 *
 * Si estamos offline, encola la operación para reintento automático.
 * Si la petición falla por error transitorio, también encola.
 */
export async function renombrarColeccionEnServidor(coleccionId: number, nuevoNombre: string): Promise<boolean> {
    const nombreNormalizado = normalizarNombreColeccion(nuevoNombre);

    if (!estaOnline()) {
        /*
         * Encolar para reintento cuando se recupere conexión.
         * Sin esto, renames offline se pierden silenciosamente.
         */
        await encolarOperacion({
            tipo: 'renombrar_coleccion',
            endpoint: `${obtenerBaseUrlSync()}/kamples/v1/colecciones/${coleccionId}`,
            method: 'PUT',
            body: { nombre: nombreNormalizado },
            claveDuplicacion: `rename-col-${coleccionId}`,
        });
        console.info('[SyncCollection] Rename encolado (offline):', coleccionId, '→', nombreNormalizado);
        return false;
    }

    try {
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones/${coleccionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombreNormalizado }),
        });

        if (!resp.ok) {
            console.error('[SyncCollection] Error renombrando colección en servidor:', resp.status);
            /*
             * Error transitorio (500, 429, timeout): encolar para reintento.
             * Solo fallos permanentes (400, 404) se descartan definitivamente.
             */
            if (resp.status >= 500 || resp.status === 429) {
                await encolarOperacion({
                    tipo: 'renombrar_coleccion',
                    endpoint: `${baseUrl}/kamples/v1/colecciones/${coleccionId}`,
                    method: 'PUT',
                    body: { nombre: nombreNormalizado },
                    claveDuplicacion: `rename-col-${coleccionId}`,
                });
            }
            return false;
        }

        const carpetaNueva = sanitizarNombreCarpeta(nombreNormalizado);
        await actualizarNombreColeccion(coleccionId, nombreNormalizado, carpetaNueva);

        await registrarAccion({
            tipo: 'renombrado',
            descripcion: `Colección ${coleccionId} renombrada a "${nombreNormalizado}"`,
            coleccionId,
        });

        return true;
    } catch (err) {
        console.error('[SyncCollection] Error renombrando colección en servidor:', err);
        /* Error de red: encolar para reintento */
        await encolarOperacion({
            tipo: 'renombrar_coleccion',
            endpoint: `${obtenerBaseUrlSync()}/kamples/v1/colecciones/${coleccionId}`,
            method: 'PUT',
            body: { nombre: nombreNormalizado },
            claveDuplicacion: `rename-col-${coleccionId}`,
        });
        return false;
    }
}

/* Verificacion de espacio en disco */

/* Margen minimo de seguridad: 500 MB libres despues de la descarga */
const MARGEN_DISCO_BYTES = 500 * 1024 * 1024;

/*
 * Estima el tamano total de descarga y verifica que haya espacio suficiente.
 * Solo cuenta samples que NO estan ya descargados (no existentes en tracking).
 * Retorna true si hay espacio suficiente o si no se puede determinar (fail open).
 */
async function verificarEspacioDisco(
    carpetaBase: string,
    datos: RespuestaSyncColecciones,
): Promise<boolean> {
    try {
        const { invoke } = await import('@tauri-apps/api/core');

        /* Calcular tamano total de samples pendientes de descarga */
        let bytesNecesarios = 0;

        for (const col of datos.colecciones) {
            for (const sample of col.samples) {
                const existente = obtenerArchivo(sample.id, col.id);
                if (!existente || existente.syncDeshabilitado) {
                    bytesNecesarios += sample.tamano || 0;
                }
            }
        }
        for (const sample of datos.sinColeccion) {
            const existente = obtenerArchivo(sample.id, null);
            if (!existente || existente.syncDeshabilitado) {
                bytesNecesarios += sample.tamano || 0;
            }
        }

        /* Si no hay nada que descargar, no verificar */
        if (bytesNecesarios === 0) return true;

        const espacioDisponible = await invoke<number>('obtener_espacio_disponible', { ruta: carpetaBase });

        if (espacioDisponible < bytesNecesarios + MARGEN_DISCO_BYTES) {
            const disponibleMB = (espacioDisponible / (1024 * 1024)).toFixed(0);
            const necesarioMB = (bytesNecesarios / (1024 * 1024)).toFixed(0);
            console.error(
                `[SyncColecciones] Espacio insuficiente: ${disponibleMB} MB disponibles, ` +
                `${necesarioMB} MB necesarios + ${(MARGEN_DISCO_BYTES / (1024 * 1024)).toFixed(0)} MB margen`,
            );
            return false;
        }

        return true;
    } catch (err) {
        /* Si no se puede verificar (ej: comando Rust no disponible), permitir descarga igualmente */
        console.warn('[SyncColecciones] No se pudo verificar espacio en disco:', err);
        return true;
    }
}
