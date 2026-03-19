/* sentinel-disable-file limite-lineas
 * Justificacion: Servicio central de sincronizacion de colecciones. Concentra logica
 * de mapeo servidor<->local, descarga de samples, reconciliacion, renombres, purgas y espacios.
 * Dividirlo requeriria refactoring mayor no relacionado a ninguna tarea actual. */
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
import { marcarDescargaEnCurso, marcarMovimientoInterno, marcarDescargaMasiva, obtenerBaseUrlSync, obtenerHeadersSync, obtenerHeadersSyncGet, extraerErrorRespuesta, tieneTokenSync } from './syncGuards';
import { encolarOperacion } from './offlineQueueService';
import { Semaforo } from './semaforo';
import { estado } from './syncState';
import { moverAPapelera } from './papeleraService';
import { logSync } from './syncLogger';
import { verificarTamano } from './hashService';
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
    eliminarColeccion,
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
    version: number;
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

/*
 * B-Rename: Permite al handler de rename esperar una creación en vuelo para
 * el nombre anterior. Si hay un POST pendiente para la colección vieja,
 * lo espera y retorna el ID creado para que pueda renombrarse en vez de duplicarse.
 */
export async function esperarCreacionEnVuelo(nombre: string, parentId: number | null = null): Promise<number | null> {
    const nombreNormalizado = normalizarNombreColeccion(nombre);
    const clave = `${parentId ?? 'raiz'}_${nombreNormalizado.toLowerCase()}`;
    const enVuelo = creacionesColeccionEnVuelo.get(clave);
    if (!enVuelo) return null;
    try {
        return await enVuelo;
    } catch {
        return null;
    }
}

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

/* [193A-3] parentId agregado para distinguir subcarpetas con el mismo nombre bajo padres distintos.
 * Sin este filtro, Carpeta_A/Sub_A y Carpeta_B/Sub_A comparten la misma colección del servidor. */
async function buscarColeccionServidorPorNombre(nombreNormalizado: string, parentId: number | null = null): Promise<number | null> {
    const datosServidor = await obtenerColeccionesDelServidor();
    if (!datosServidor) return null;

    const objetivo = nombreNormalizado.toLowerCase();
    const existente = datosServidor.colecciones.find(c => {
        if (c.nombre.toLowerCase() !== objetivo) return false;
        /* Filtrar por parent_id para no confundir subcarpetas homónimas bajo padres distintos */
        if (parentId !== null) return c.parent_id === parentId;
        /* Sin parentId buscamos solo colecciones raíz */
        return c.parent_id === null || c.parent_id === undefined;
    });
    return existente?.id ?? null;
}

/*
 * Versión pública de buscarColeccionServidorPorNombre.
 * Usada por syncWatcherSetup para el fallback de rename:
 * si la colección no está en tracking local, buscar en servidor antes de crear duplicada.
 */
export async function buscarColeccionServidorPorNombrePublico(nombre: string, parentId: number | null = null): Promise<number | null> {
    return buscarColeccionServidorPorNombre(normalizarNombreColeccion(nombre), parentId);
}

function encolarCreacionColeccion(nombreNormalizado: string): void {
    const baseUrl = obtenerBaseUrlSync();
    encolarOperacion({
        tipo: 'crear_coleccion',
        endpoint: `${baseUrl}/kamples/v1/colecciones`,
        method: 'POST',
        body: { nombre: nombreNormalizado, descripcion: '', publica: true },
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
        version: 0,
    });

    await registrarAccion({
        tipo: 'creado',
        descripcion: `Colección "${nombreNormalizado}" creada desde carpeta local${parentId ? ` (sub de #${parentId})` : ''}`,
        coleccionId: id,
    });
}

/* Utilidades */

/**
 * Busca una colección en tracking cuya carpeta ya NO existe en disco (huérfana).
 * Esto ocurre cuando una carpeta fue renombrada pero el tracking todavía tiene
 * el nombre viejo. Se usa como último recurso en el fallback de rename para
 * evitar crear colecciones duplicadas.
 *
 * Solo retorna colecciones raíz (parentId === null por defecto)
 * y excluye la carpeta nueva que sabemos existe.
 */
export async function buscarColeccionHuerfana(
    carpetaNuevaExcluir: string,
    parentId: number | null = null,
): Promise<ColeccionLocal | null> {
    try {
        const { exists } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { obtenerConfigSync } = await import('./syncService');

        const config = obtenerConfigSync();
        if (!config?.carpetaLocal) return null;

        const colecciones = todasLasColecciones().filter(c => c.parentId === parentId);
        const excluirLower = carpetaNuevaExcluir.toLowerCase();

        for (const col of colecciones) {
            /* No considerar la colección que coincide con la nueva carpeta */
            if (col.carpetaLocal.toLowerCase() === excluirLower
                || col.nombre.toLowerCase() === excluirLower) continue;

            const rutaCarpeta = await join(config.carpetaLocal, col.carpetaLocal);
            const encontrada = await exists(rutaCarpeta);
            if (!encontrada) {
                console.info('[SyncCollection] Colección huérfana encontrada:', col.id, col.nombre, '→ carpeta no existe:', col.carpetaLocal);
                return col;
            }
        }
        return null;
    } catch (err) {
        console.error('[SyncCollection] Error buscando colección huérfana:', err);
        return null;
    }
}

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

/*
 * C289: Cache client-side para evitar 429.
 * obtenerColeccionesDelServidor se llama desde múltiples puntos
 * (sincronizarColecciones, rehidratacion, buscarColeccionServidorPorNombre).
 * Sin caché, cada call es un roundtrip → agota rate limit rápidamente.
 */
const CACHE_COLECCIONES_TTL_MS = 10_000;
let cacheColecciones: { datos: RespuestaSyncColecciones; timestamp: number } | null = null;

/** Invalida el caché manualmente (ej: después de crear/renombrar colección). */
export function invalidarCacheColecciones(): void {
    cacheColecciones = null;
}

/**
 * Obtiene las colecciones con samples del servidor para sync.
 * Usa el nuevo endpoint optimizado GET /me/sync/colecciones.
 * C289: Con caché TTL de 10s para evitar 429 por llamadas concurrentes.
 */
export async function obtenerColeccionesDelServidor(): Promise<RespuestaSyncColecciones | null> {
    if (!estaOnline()) return null;

    /* QK77-B: No intentar si no hay token — evita 401 ruidoso en consola */
    if (!tieneTokenSync()) return null;

    /* C289: Retornar caché si es suficientemente fresca */
    if (cacheColecciones && (Date.now() - cacheColecciones.timestamp) < CACHE_COLECCIONES_TTL_MS) {
        return cacheColecciones.datos;
    }

    try {
        const baseUrl = obtenerBaseUrlSync();
        /* C7: Cache-busting + no-cache para que imágenes recién asignadas se obtengan frescas */
        const resp = await fetch(`${baseUrl}/kamples/v1/me/sync/colecciones?_t=${Date.now()}`, {
            headers: { ...obtenerHeadersSyncGet(), 'Cache-Control': 'no-cache' },
        });

        if (!resp.ok) {
            const detalle = await extraerErrorRespuesta(resp);
            console.error('[SyncCollection] Error obteniendo colecciones:', resp.status, detalle);
            return null;
        }

        const json = await resp.json();
        /* PHP retorna { data: { colecciones, sinColeccion } } */
        const data = json?.data ?? json;

        const resultado: RespuestaSyncColecciones = {
            colecciones: data?.colecciones ?? [],
            sinColeccion: data?.sinColeccion ?? [],
        };

        /* C289: Guardar en caché */
        cacheColecciones = { datos: resultado, timestamp: Date.now() };

        return resultado;
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
 * Reconciliación local→servidor: detecta samples cuya ruta física en disco
 * pertenece a una carpeta de colección diferente a la registrada en tracking.
 *
 * Causa típica: un move local fue procesado por el watcher pero no se
 * actualizó coleccion_samples en el servidor (bug pre-actualizarColeccionEnMovimiento).
 * El tracking actualizó rutaLocal pero no coleccionId.
 *
 * Para cada discrepancia: actualiza coleccion_samples en servidor + re-registra
 * el tracking entry con el coleccionId correcto.
 */
async function reconciliarRutasConColecciones(carpetaBase: string): Promise<number> {
    const archivos = todosLosArchivos();
    const coleccionesLocales = todasLasColecciones();
    const baseNorm = carpetaBase.replace(/\\/g, '/').replace(/\/+$/, '');
    let corregidos = 0;

    for (const archivo of archivos) {
        const rutaNorm = archivo.rutaLocal.replace(/\\/g, '/');
        if (!rutaNorm.startsWith(baseNorm + '/')) continue;

        const relativa = rutaNorm.slice(baseNorm.length + 1);
        const partes = relativa.split('/');
        if (partes.length < 2) continue;

        const carpetaPrimaria = partes[0];
        const esSinCol = carpetaPrimaria === CARPETA_SIN_COLECCION
            || carpetaPrimaria === CARPETA_SIN_COLECCION_LEGACY;

        let coleccionIdEsperado: number | null = null;

        if (!esSinCol) {
            const colPadre = buscarColeccionPorCarpeta(carpetaPrimaria);
            if (!colPadre) continue;
            coleccionIdEsperado = colPadre.id;

            /*
             * Subcollections N niveles: caminar cada carpeta intermedia
             * del path (excluyendo la primera y el archivo final) buscando
             * subcollections anidadas. La más profunda que resuelve gana.
             * Ej: k1/k4/k5/sample.wav → k1 → k4 (sub de k1) → k5 (sub de k4)
             */
            let padreActual = colPadre.id;
            for (let nivel = 1; nivel < partes.length - 1; nivel++) {
                const carpetaNivel = partes[nivel];
                const sub = coleccionesLocales.find(
                    c => c.parentId === padreActual
                        && c.carpetaLocal.toLowerCase() === carpetaNivel.toLowerCase(),
                );
                if (!sub) break;
                coleccionIdEsperado = sub.id;
                padreActual = sub.id;
            }
        }

        /* Verificar si hay discrepancia */
        if (archivo.coleccionId === coleccionIdEsperado) continue;

        try {
            /* Actualizar servidor: agregar a colección destino real */
            if (coleccionIdEsperado !== null) {
                await agregarSampleAColeccion(coleccionIdEsperado, archivo.sampleId);
            }

            /* Re-registrar tracking con coleccionId correcto */
            await eliminarArchivo(archivo.sampleId, archivo.coleccionId);
            await registrarArchivo({
                ...archivo,
                coleccionId: coleccionIdEsperado,
            });

            corregidos++;
            logSync.info('collectionSync',
                `Reconciliación: sample ${archivo.sampleId} — tracking col ${archivo.coleccionId} → col ${coleccionIdEsperado} (ruta: ${relativa})`);
        } catch (err) {
            logSync.warn('collectionSync',
                `Error reconciliando sample ${archivo.sampleId}`,
                { error: err instanceof Error ? err.message : String(err) });
        }
    }

    return corregidos;
}

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

    /*
     * Purga de tracking: eliminar entries de samples ausentes en el servidor.
     * SOLO se ejecuta en sync completo (no en soloEstructura/polling).
     *
     * Sin este guard, el polling periódico (cada 60s) borraba tracking de
     * archivos locales si el servidor devolvía datos vacíos o incompletos
     * (auth no lista, latencia pipeline, error transitorio).
     * Esto causaba que al iniciar el programa TODAS las colecciones se vaciaran
     * porque la primera llamada de estructura purgaba el tracking entero.
     *
     * Protección adicional: si el servidor retorna 0 samples pero localmente
     * hay >5 archivos trackeados, es casi seguro una respuesta inválida.
     * En ese caso se omite la purga para evitar data loss.
     */
    const sampleIdsServidor = new Set<number>();
    for (const col of datosServidor.colecciones) {
        for (const s of col.samples) sampleIdsServidor.add(s.id);
    }
    for (const s of datosServidor.sinColeccion) sampleIdsServidor.add(s.id);

    const archivosActuales = todosLosArchivos();

    if (!soloEstructura) {
        const borrarLocalSiNoEnServidor = estado.configAvanzada.borrarEnLocalAlBorrarEnServidor;

        /* Seguridad: no purgar si servidor devuelve vacío pero hay muchos archivos locales */
        const esRespuestaVaciaSospechosa = sampleIdsServidor.size === 0 && archivosActuales.length > 5;
        if (esRespuestaVaciaSospechosa) {
            console.warn('[SyncCollection] Servidor retornó 0 samples pero hay', archivosActuales.length, 'locales. Omitiendo purga (posible error de auth/red).');
        } else {
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
        }
    }

    /*
     * C289: Purga de colecciones fantasma del tracking.
     * Si una colección existe en tracking local pero NO existe en el servidor,
     * eliminarla del tracking. Esto resuelve colecciones borradas del servidor
     * que persisten en tracking y causan 403 en renames, huérfanas y reconciliación.
     *
     * Protección: si el servidor retornó 0 colecciones pero localmente hay >3,
     * posible fallo de auth/red parcial — no purgar para evitar data loss.
     */
    const idsColeccionesServidor = new Set<number>();
    for (const col of datosServidor.colecciones) {
        idsColeccionesServidor.add(col.id);
    }

    const coleccionesLocales = todasLasColecciones();
    const purgaColeccionesSegura = idsColeccionesServidor.size > 0 || coleccionesLocales.length <= 3;

    if (purgaColeccionesSegura) {
        let colPurgadas = 0;
        for (const colLocal of coleccionesLocales) {
            if (!idsColeccionesServidor.has(colLocal.id)) {
                logSync.info('syncCollection',
                    `Purgando colección fantasma: #${colLocal.id} "${colLocal.nombre}" (ausente en servidor)`);
                await eliminarColeccion(colLocal.id);
                colPurgadas++;
            }
        }
        if (colPurgadas > 0) {
            logSync.info('syncCollection', `${colPurgadas} colección(es) fantasma eliminadas del tracking`);
        }
    }

    const { mkdir, writeFile, exists, rename } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');

    let nuevos = 0;
    let errores = 0;

    /* Calcular total de samples para progreso */
    const totalSamples = datosServidor.colecciones.reduce((sum, c) => sum + c.samples.length, 0)
        + datosServidor.sinColeccion.length;

    /*
     * QL103: Activar flag de descarga masiva para suprimir eventos de carpeta
     * en el watcher. Sin esto, cada mkdir + writeFile genera cientos de eventos
     * de carpeta/subcarpeta redundantes que saturan crearColeccionDesdeLocal.
     */
    marcarDescargaMasiva(true);

    try {

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
            /* F5.2: Actualizar version local desde servidor */
            const versionServidor = colServer.version ?? 1;
            if ((colLocal.version ?? 0) !== versionServidor) {
                await registrarColeccion({ ...colLocal, version: versionServidor });
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
                version: colServer.version ?? 1,
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
            /* F5.2: Actualizar version local desde servidor */
            const versionSub = subServer.version ?? 1;
            if ((subLocal.version ?? 0) !== versionSub) {
                await registrarColeccion({ ...subLocal, version: versionSub });
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
                version: subServer.version ?? 1,
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
    /* QL106: Defensa en profundidad — si borrarAlSubirExitoso está activo,
     * forzar soloEstructura aunque el caller no lo indique. Evita que
     * cualquier ruta futura dispare descargas cuando el usuario quiere
     * mantener archivos solo en servidor. */
    if (soloEstructura || estado.configAvanzada.borrarAlSubirExitoso) {
        if (estado.configAvanzada.borrarAlSubirExitoso && !soloEstructura) {
            logSync.debug('collectionSync', 'Descargas bloqueadas: borrarAlSubirExitoso activo');
        }
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
            } catch (err) {
                /* TM1: Per-sample error boundary — un fallo no detiene el resto del batch.
                 * Sin esto, una excepción inesperada en descargarSiNecesario (FS error,
                 * permiso denegado, disco lleno) deja contadores inconsistentes. */
                errores++;
                logSync.error('collectionSync', `Error descargando sample ${tarea.sample.id}`, {
                    error: err instanceof Error ? err.message : String(err),
                    coleccionId: tarea.coleccionId,
                });
            } finally {
                semaforoDescargas.liberar();
            }
        });
    });

    await Promise.all(promesasDescarga);

    onProgreso?.({ fase: 'completado', actual: totalSamples, total: totalSamples });

    /* Finalizar modo lote: persistir todo de una vez */
    await finalizarLote();

    /*
     * Reconciliación local→servidor: detectar samples cuya ruta física
     * no coincide con su coleccionId en tracking. Esto ocurre cuando un
     * move local fue procesado por el watcher pero no se actualizó
     * coleccion_samples en el servidor (bug pre-fix actualizarColeccionEnMovimiento).
     * Recorre todos los archivos tracked, infiere la colección real desde
     * la ruta y corrige tanto tracking como servidor si hay discrepancia.
     */
    const corregidos = await reconciliarRutasConColecciones(carpetaBase);
    if (corregidos > 0) {
        logSync.info('collectionSync', `Reconciliación local→servidor: ${corregidos} sample(s) corregidos`);
    }

    return { nuevos, errores };

    } finally {
        /* QL103: Desactivar flag de descarga masiva, incluso si hubo error */
        marcarDescargaMasiva(false);
    }
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
    const { exists: existeEnDisco } = await import('@tauri-apps/plugin-fs');

    /* Verificar si ya existe en tracking */
    const existente = obtenerArchivo(sample.id, coleccionId);
    if (existente) {
        if (existente.syncDeshabilitado) {
            onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'omitido' });
            return 'omitido';
        }

        /*
         * C289c: Verificar existencia real en disco.
         * Si el tracking dice que el archivo existe pero NO está en disco
         * (movido a duplicados, borrado externamente, etc.), limpiar la
         * entrada corrupta y continuar a la fase de descarga.
         */
        const archivoExisteEnDisco = await existeEnDisco(existente.rutaLocal);
        if (archivoExisteEnDisco) {
            onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'descargado' });
            return 'existente';
        }

        logSync.warn('collectionSync', `Tracking inconsistente: sample ${sample.id} registrado en "${existente.rutaLocal}" pero no existe en disco. Limpiando y re-descargando.`);
        await eliminarArchivo(existente.sampleId, existente.coleccionId);
    }

    /*
     * D4.2: Antes de descargar, verificar si el archivo existe localmente en
     * otra coleccion (sample movido server-side). Si existe en disco, mover
     * en vez de re-descargar para ahorrar ancho de banda.
     */
    const archivoEnOtraCol = buscarArchivoPorSampleId(sample.id);
    if (archivoEnOtraCol && archivoEnOtraCol.coleccionId !== coleccionId) {
        /*
         * Grace period: si el archivo fue registrado recientemente (upload o descarga
         * reciente), confiar en el tracking sobre los datos del servidor que pueden
         * ser stale. Esto previene la race condition donde:
         * 1. Upload → registrarSubidaLocal(sampleId, ruta, colId=85)
         * 2. sincronizarColecciones usa cache stale → sample aparece en sinColeccion
         * 3. D4.2 intenta mover de col 85 → sin-coleccion (INCORRECTO)
         * El tracking del upload es más reciente y confiable que el cache del servidor.
         */
        const GRACIA_UPLOAD_RECIENTE_MS = 60_000;
        const esRegistroReciente = (Date.now() - (archivoEnOtraCol.descargadoEn ?? 0)) < GRACIA_UPLOAD_RECIENTE_MS;
        if (esRegistroReciente) {
            logSync.info('collectionSync', `Sample ${sample.id} registrado hace <60s en col ${archivoEnOtraCol.coleccionId}, omitiendo D4.2 move a col ${coleccionId} (posible cache stale)`);
            onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'descargado' });
            return 'existente';
        }

        const { exists: existeEnDisco, rename: renombrarArchivo } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const existeLocal = await existeEnDisco(archivoEnOtraCol.rutaLocal);

        if (existeLocal) {
            try {
                const nombreArchivo = archivoEnOtraCol.nombreLocal || archivoEnOtraCol.nombreServidor;
                const rutaNueva = await join(carpetaDestino, nombreArchivo);

                /*
                 * Guard noop: si el archivo ya está en la ruta de destino
                 * (mismo path normalizado), no mover — solo actualizar tracking.
                 * Esto previene moves espurios cuando el tracking tiene un
                 * coleccionId obsoleto pero el archivo físico ya está correcto.
                 */
                const rutaActualNorm = archivoEnOtraCol.rutaLocal.replace(/\\/g, '/');
                const rutaNuevaNorm = rutaNueva.replace(/\\/g, '/');
                if (rutaActualNorm === rutaNuevaNorm) {
                    /* Solo re-registrar con coleccionId correcto */
                    await eliminarArchivo(archivoEnOtraCol.sampleId, archivoEnOtraCol.coleccionId);
                    await registrarArchivo({
                        sampleId: sample.id,
                        coleccionId,
                        rutaLocal: archivoEnOtraCol.rutaLocal,
                        nombreLocal: nombreArchivo,
                        nombreServidor: archivoEnOtraCol.nombreServidor,
                        descargadoEn: archivoEnOtraCol.descargadoEn,
                        tamano: archivoEnOtraCol.tamano,
                        syncDeshabilitado: false,
                    });
                    logSync.info('collectionSync', `Sample ${sample.id} re-registrado en colección ${coleccionId} (archivo ya en ruta correcta)`);
                    onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: nombreArchivo, estado: 'descargado' });
                    return 'existente';
                }

                marcarDescargaEnCurso(rutaNueva);
                /*
                 * Marcar ruta ORIGEN como movimiento interno para que el watcher
                 * ignore el evento DELETE generado por el rename. Sin esto,
                 * manejarBorradoLocal procesa el DELETE y puede disparar
                 * softDeleteEnServidor → borra el sample del servidor.
                 */
                marcarMovimientoInterno(archivoEnOtraCol.rutaLocal);
                await renombrarArchivo(archivoEnOtraCol.rutaLocal, rutaNueva);

                /* Limpiar tracking viejo y registrar nuevo */
                await eliminarArchivo(archivoEnOtraCol.sampleId, archivoEnOtraCol.coleccionId);
                await registrarArchivo({
                    sampleId: sample.id,
                    coleccionId,
                    rutaLocal: rutaNueva,
                    nombreLocal: nombreArchivo,
                    nombreServidor: archivoEnOtraCol.nombreServidor,
                    descargadoEn: archivoEnOtraCol.descargadoEn,
                    tamano: archivoEnOtraCol.tamano,
                    syncDeshabilitado: false,
                });
                await registrarAccion({
                    tipo: 'movido',
                    descripcion: `Sample "${sample.titulo}" movido localmente entre colecciones`,
                    sampleId: sample.id,
                    coleccionId: coleccionId ?? undefined,
                });

                logSync.info('collectionSync', `Sample ${sample.id} movido localmente (evitada re-descarga)`);
                onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: nombreArchivo, estado: 'descargado' });
                return 'nuevo';
            } catch (err) {
                logSync.warn('collectionSync', `No se pudo mover sample ${sample.id} localmente, se descargara`, {
                    error: err instanceof Error ? err.message : String(err),
                });
                /* Fallthrough a descarga normal */
            }
        } else {
            /* Archivo no existe en disco, limpiar tracking corrupto */
            await eliminarArchivo(archivoEnOtraCol.sampleId, archivoEnOtraCol.coleccionId);
        }
    }

    /* Descargar desde el servidor */
    try {
        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'descargando' });

        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrlSync();

        /* Obtener URL firmada de descarga */
        const respDescarga = await fetch(`${baseUrl}/kamples/v1/samples/${sample.id}/descargar`, {
            method: 'POST',
            headers: obtenerHeadersSyncGet(),
        });
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

        /* F3.3: Verificación post-descarga — confirmar que el archivo no está truncado */
        const tamanoEsperado = tamano || buffer.byteLength;
        if (tamanoEsperado > 0) {
            const tamanoOk = await verificarTamano(rutaArchivo, tamanoEsperado);
            if (!tamanoOk) {
                logSync.warn('syncCollection', `Archivo truncado post-descarga: ${nombreArchivo} (esperado: ${tamanoEsperado})`);
                /* Reintentar la descarga (retry simple: tirar excepción para que el caller reintente) */
                throw new Error(`Archivo truncado post-descarga: esperado ${tamanoEsperado} bytes`);
            }
        }

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
        logSync.error('syncCollection', `Error descargando sample ${sample.id}`, { error: err instanceof Error ? err.message : String(err) });
        onProgreso?.({ fase: 'descarga', actual, total, sampleId: sample.id, nombre: sample.titulo, estado: 'error' });
        return 'error';
    }
}

/* Renombre de colección — Operación atómica con rollback (F5.1) */

async function manejarRenombreColeccion(
    carpetaBase: string,
    colLocal: ColeccionLocal,
    nuevoNombreServer: string,
): Promise<void> {
    const { TransaccionSync } = await import('./transaccionSync');

    const nuevaCarpeta = sanitizarNombreCarpeta(nuevoNombreServer);
    const nombreAnterior = colLocal.nombre;
    const carpetaAnterior = colLocal.carpetaLocal;

    const tx = new TransaccionSync(`rename-col-${colLocal.id}`);

    /* Paso 1: Renombrar carpeta en disco */
    tx.agregar(
        'renombrar-carpeta-disco',
        async () => {
            const { rename, exists } = await import('@tauri-apps/plugin-fs');
            const { join } = await import('@tauri-apps/api/path');
            const rutaAnterior = await join(carpetaBase, carpetaAnterior);
            const rutaNueva = await join(carpetaBase, nuevaCarpeta);
            const existeAnterior = await exists(rutaAnterior);
            if (existeAnterior) {
                await rename(rutaAnterior, rutaNueva);
            }
        },
        async () => {
            const { rename, exists } = await import('@tauri-apps/plugin-fs');
            const { join } = await import('@tauri-apps/api/path');
            const rutaNueva = await join(carpetaBase, nuevaCarpeta);
            const rutaAnterior = await join(carpetaBase, carpetaAnterior);
            const existeNueva = await exists(rutaNueva);
            if (existeNueva) {
                await rename(rutaNueva, rutaAnterior);
            }
        },
    );

    /* Paso 2: Actualizar tracking local */
    tx.agregar(
        'actualizar-tracking',
        async () => {
            await actualizarNombreColeccion(colLocal.id, nuevoNombreServer, nuevaCarpeta);
        },
        async () => {
            await actualizarNombreColeccion(colLocal.id, nombreAnterior, carpetaAnterior);
        },
    );

    const exito = await tx.ejecutar();

    if (exito) {
        await registrarAccion({
            tipo: 'renombrado',
            descripcion: `Colección renombrada: "${nombreAnterior}" → "${nuevoNombreServer}"`,
            coleccionId: colLocal.id,
        });
        logSync.info('syncCollection', `Colección ${colLocal.id} renombrada: ${carpetaAnterior} → ${nuevaCarpeta}`);
    } else {
        logSync.error('syncCollection', `Error renombrando colección ${colLocal.id} — rollback ejecutado`);
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
                    headers: obtenerHeadersSync(),
                    body: JSON.stringify({ sample_id: sampleId }),
                },
            );
            if (!respQuitar.ok) {
                const detalle = await extraerErrorRespuesta(respQuitar);
                console.error('[SyncCollection] Error quitando sample de colección origen:', respQuitar.status, detalle);
            }
        }

        /* Agregar a la colección destino */
        if (coleccionDestinoId !== null) {
            const respAgregar = await fetch(
                `${baseUrl}/kamples/v1/colecciones/${coleccionDestinoId}/samples`,
                {
                    method: 'POST',
                    headers: obtenerHeadersSync(),
                    body: JSON.stringify({ sample_id: sampleId }),
                },
            );
            if (!respAgregar.ok) {
                const detalle = await extraerErrorRespuesta(respAgregar);
                console.error('[SyncCollection] Error agregando sample a colección destino:', respAgregar.status, detalle);
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
            headers: obtenerHeadersSync(),
            body: JSON.stringify({ sampleId }),
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            console.error('[SyncCollection] Error agregando sample a colección:', coleccionId, sampleId, resp.status, body);

            /*
             * 403: la colección no pertenece al usuario.
             * Desvincular del tracking para evitar intentos repetidos.
             * El upload flow creará una colección nueva si es necesario.
             */
            if (resp.status === 403) {
                logSync.warn('SyncCollection', `Colección #${coleccionId} no pertenece al usuario. Desvinculando.`);
                try {
                    const tracking = (await import('./syncTrackingService'));
                    await tracking.eliminarColeccion(coleccionId);
                } catch (cleanupErr) {
                    console.error('[SyncCollection] Error desvinculando colección:', cleanupErr);
                }
            }

            return false;
        }

        console.info('[SyncCollection] Sample agregado a colección:', sampleId, '→ col:', coleccionId);
        /* Invalidar cache para que la próxima sincronización obtenga datos frescos.
         * Sin esto, delta sync puede usar datos stale donde el sample aparece en
         * sinColeccion (fue creado por upload antes de ser asignado a colección),
         * causando que D4.2 mueva archivos recién subidos a la carpeta equivocada. */
        invalidarCacheColecciones();
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
            /* [193A-3] Pasar parentId para evitar colisión con subcarpetas homónimas bajo otro padre */
            const existenteServidor = await buscarColeccionServidorPorNombre(nombreNormalizado, parentId);
            if (existenteServidor) {
                await registrarColeccionNuevaLocal(existenteServidor, nombreNormalizado, parentId);
                return existenteServidor;
            }

            const baseUrl = obtenerBaseUrlSync();
            const bodyCrear: Record<string, unknown> = { nombre: nombreNormalizado, descripcion: '', publica: true };
            if (parentId !== null) bodyCrear.parent_id = parentId;

            for (let intento = 1; intento <= MAX_REINTENTOS_CREAR_COLECCION; intento++) {
                const resp = await fetch(`${baseUrl}/kamples/v1/colecciones`, {
                    method: 'POST',
                    headers: obtenerHeadersSync(),
                    body: JSON.stringify(bodyCrear),
                });

                if (resp.ok) {
                    const json = await resp.json();
                    const id = json?.data?.id ?? json?.id;
                    if (id) {
                        const idNum = Number(id);
                        await registrarColeccionNuevaLocal(idNum, nombreNormalizado, parentId);
                        /* C289: Invalidar caché para que la próxima consulta incluya la nueva colección */
                        invalidarCacheColecciones();
                        return idNum;
                    }
                    return null;
                }

                if (resp.status === 409) {
                    /* [193A-29] Pasar parentId para distinguir subcarpetas homónimas bajo padres distintos.
                     * Sin parentId, un 409 en "Carpeta A/Sub" podría retornar el ID de "Carpeta B/Sub". */
                    const idExistente = await buscarColeccionServidorPorNombre(nombreNormalizado, parentId);
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

    /* F5.2: Enviar version actual para optimistic locking */
    const colLocal = obtenerColeccion(coleccionId);
    const bodyRename: Record<string, unknown> = { nombre: nombreNormalizado };
    if (colLocal?.version) {
        bodyRename.version = colLocal.version;
    }

    if (!estaOnline()) {
        /*
         * Encolar para reintento cuando se recupere conexión.
         * Sin esto, renames offline se pierden silenciosamente.
         */
        await encolarOperacion({
            tipo: 'renombrar_coleccion',
            endpoint: `${obtenerBaseUrlSync()}/kamples/v1/colecciones/${coleccionId}`,
            method: 'PUT',
            body: bodyRename,
            claveDuplicacion: `rename-col-${coleccionId}`,
        });
        console.info('[SyncCollection] Rename encolado (offline):', coleccionId, '→', nombreNormalizado);
        return false;
    }

    try {
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones/${coleccionId}`, {
            method: 'PUT',
            headers: obtenerHeadersSync(),
            body: JSON.stringify(bodyRename),
        });

        if (!resp.ok) {
            const detalle = await extraerErrorRespuesta(resp);
            console.error('[SyncCollection] Error renombrando colección en servidor:', resp.status, detalle);

            /* F5.2: Conflicto de version — forzar re-sync en el proximo ciclo */
            if (resp.status === 409) {
                logSync.warn('SyncCollection', `Conflicto de versión al renombrar col #${coleccionId}. Se re-sincronizará.`);
                return false;
            }

            /*
             * 403 no_autorizado: la colección no pertenece al usuario actual.
             * Esto ocurre cuando el tracking local tiene colecciones de otra sesión
             * o cuenta. Desvincular del tracking evita que la detección de huérfanas
             * intente renombrarla en cada escaneo (loop infinito de 403s).
             */
            if (resp.status === 403) {
                logSync.warn('SyncCollection', `Colección #${coleccionId} no pertenece al usuario. Desvinculando del tracking local.`);
                try {
                    const tracking = (await import('./syncTrackingService'));
                    await tracking.eliminarColeccion(coleccionId);
                } catch (cleanupErr) {
                    console.error('[SyncCollection] Error desvinculando colección del tracking:', cleanupErr);
                }
                return false;
            }

            /*
             * Error transitorio (500, 429, timeout): encolar para reintento.
             * Solo fallos permanentes (400, 404) se descartan definitivamente.
             */
            if (resp.status >= 500 || resp.status === 429) {
                await encolarOperacion({
                    tipo: 'renombrar_coleccion',
                    endpoint: `${baseUrl}/kamples/v1/colecciones/${coleccionId}`,
                    method: 'PUT',
                    body: bodyRename,
                    claveDuplicacion: `rename-col-${coleccionId}`,
                });
            }
            return false;
        }

        const carpetaNueva = sanitizarNombreCarpeta(nombreNormalizado);
        await actualizarNombreColeccion(coleccionId, nombreNormalizado, carpetaNueva);

        /* C289: Invalidar caché para que la próxima consulta refleje el rename */
        invalidarCacheColecciones();

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
