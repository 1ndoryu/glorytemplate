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
    type ArchivoTracking,
    type ColeccionLocal,
} from './syncTrackingService';

/* ==================== Tipos del endpoint ==================== */

export interface SampleSync {
    id: number;
    titulo: string;
    formato: string;
    tamano: number;
}

export interface ColeccionSync {
    id: number;
    nombre: string;
    samples: SampleSync[];
}

export interface RespuestaSyncColecciones {
    colecciones: ColeccionSync[];
    sinColeccion: SampleSync[];
}

/* ==================== Config ==================== */

const CARPETA_SIN_COLECCION = 'Sin colección';

/* Caracteres no válidos en nombres de carpeta Windows/macOS/Linux */
const REGEX_CARACTERES_INVALIDOS = /[/\\:*?"<>|]/g;

/* ==================== Utilidades ==================== */

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

function obtenerBaseUrl(): string {
    const ctx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;
    return ctx?.apiUrl ?? '/wp-json';
}

/* ==================== Fetch de colecciones ==================== */

/**
 * Obtiene las colecciones con samples del servidor para sync.
 * Usa el nuevo endpoint optimizado GET /me/sync/colecciones.
 */
export async function obtenerColeccionesDelServidor(): Promise<RespuestaSyncColecciones | null> {
    if (!estaOnline()) return null;

    try {
        const baseUrl = obtenerBaseUrl();
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

/* ==================== Sync completo ==================== */

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
 */
export async function sincronizarColecciones(
    carpetaBase: string,
    onProgreso?: CallbackProgresoColecciones,
): Promise<{ nuevos: number; errores: number }> {
    const datosServidor = await obtenerColeccionesDelServidor();
    if (!datosServidor) return { nuevos: 0, errores: 0 };

    const { mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');

    let nuevos = 0;
    let errores = 0;

    /* Calcular total de samples para progreso */
    const totalSamples = datosServidor.colecciones.reduce((sum, c) => sum + c.samples.length, 0)
        + datosServidor.sinColeccion.length;
    let procesados = 0;

    /* Fase 1: Crear/actualizar estructura de carpetas */
    onProgreso?.({ fase: 'estructura', actual: 0, total: datosServidor.colecciones.length + 1 });

    const nombresUsados = new Set<string>();

    /* Sincronizar colecciones del servidor → carpetas locales */
    for (const colServer of datosServidor.colecciones) {
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
            });

            await registrarAccion({
                tipo: 'creado',
                descripcion: `Carpeta creada para colección "${colServer.nombre}"`,
                coleccionId: colServer.id,
            });
        }
    }

    /* Asegurar carpeta "Sin colección" */
    const rutaSinCol = await join(carpetaBase, CARPETA_SIN_COLECCION);
    try {
        await mkdir(rutaSinCol, { recursive: true });
    } catch { /* puede existir */ }

    /* Fase 2: Descargar samples */
    onProgreso?.({ fase: 'descarga', actual: 0, total: totalSamples });

    /* Procesar samples de cada colección */
    for (const colServer of datosServidor.colecciones) {
        const colLocal = obtenerColeccion(colServer.id);
        if (!colLocal) continue;

        const carpetaColeccion = await join(carpetaBase, colLocal.carpetaLocal);

        for (const sample of colServer.samples) {
            procesados++;
            const resultado = await descargarSiNecesario(
                sample, colServer.id, carpetaColeccion, onProgreso, procesados, totalSamples,
            );
            if (resultado === 'nuevo') nuevos++;
            if (resultado === 'error') errores++;
        }
    }

    /* Procesar samples sin colección */
    for (const sample of datosServidor.sinColeccion) {
        procesados++;
        const resultado = await descargarSiNecesario(
            sample, null, rutaSinCol, onProgreso, procesados, totalSamples,
        );
        if (resultado === 'nuevo') {
            nuevos++;
            await agregarSinColeccion(sample.id);
        }
        if (resultado === 'error') errores++;
    }

    onProgreso?.({ fase: 'completado', actual: totalSamples, total: totalSamples });

    return { nuevos, errores };
}

/* ==================== Descarga individual ==================== */

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
        const baseUrl = obtenerBaseUrl();

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

/* ==================== Renombre de colección ==================== */

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

/* ==================== Acciones locales → servidor ==================== */

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
        const baseUrl = obtenerBaseUrl();

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
 * Crear una colección en el servidor a partir de carpeta local nueva.
 * Retorna el ID de la colección creada, o null si falla.
 */
export async function crearColeccionDesdeLocal(nombre: string): Promise<number | null> {
    if (!estaOnline()) return null;

    try {
        const baseUrl = obtenerBaseUrl();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: '', publica: false }),
        });

        if (!resp.ok) {
            console.error('[SyncCollection] Error creando colección:', resp.status);
            return null;
        }

        const json = await resp.json();
        const id = json?.data?.id ?? json?.id;

        if (id) {
            await registrarColeccion({
                id: Number(id),
                nombre,
                carpetaLocal: sanitizarNombreCarpeta(nombre),
                creadaLocalmente: true,
            });

            await registrarAccion({
                tipo: 'creado',
                descripcion: `Colección "${nombre}" creada desde carpeta local`,
                coleccionId: Number(id),
            });
        }

        return id ? Number(id) : null;
    } catch (err) {
        console.error('[SyncCollection] Error creando colección desde local:', err);
        return null;
    }
}

/**
 * Renombrar una colección en el servidor.
 * Se llama cuando el watcher detecta RENAME de una carpeta mapeada.
 */
export async function renombrarColeccionEnServidor(coleccionId: number, nuevoNombre: string): Promise<boolean> {
    if (!estaOnline()) return false;

    try {
        const baseUrl = obtenerBaseUrl();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones/${coleccionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre }),
        });

        if (!resp.ok) {
            console.error('[SyncCollection] Error renombrando colección en servidor:', resp.status);
            return false;
        }

        const carpetaNueva = sanitizarNombreCarpeta(nuevoNombre);
        await actualizarNombreColeccion(coleccionId, nuevoNombre, carpetaNueva);

        await registrarAccion({
            tipo: 'renombrado',
            descripcion: `Colección ${coleccionId} renombrada a "${nuevoNombre}"`,
            coleccionId,
        });

        return true;
    } catch (err) {
        console.error('[SyncCollection] Error renombrando colección en servidor:', err);
        return false;
    }
}
