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
    type ArchivoTracking,
    type ColeccionLocal,
} from './syncTrackingService';

/* Tipos del endpoint */

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

    const { mkdir, writeFile, exists, rename } = await import('@tauri-apps/plugin-fs');
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
            });

            await registrarAccion({
                tipo: 'creado',
                descripcion: `Carpeta creada para colección "${colServer.nombre}"`,
                coleccionId: colServer.id,
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
 * Crear una colección en el servidor a partir de carpeta local nueva.
 * Retorna el ID de la colección creada, o null si falla.
 */
export async function crearColeccionDesdeLocal(nombre: string): Promise<number | null> {
    if (!estaOnline()) return null;

    try {
        const nombreNormalizado = normalizarNombreColeccion(nombre);
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombreNormalizado, descripcion: '', publica: false }),
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
                nombre: nombreNormalizado,
                carpetaLocal: sanitizarNombreCarpeta(nombreNormalizado),
                creadaLocalmente: true,
            });

            await registrarAccion({
                tipo: 'creado',
                descripcion: `Colección "${nombreNormalizado}" creada desde carpeta local`,
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
        const nombreNormalizado = normalizarNombreColeccion(nuevoNombre);
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/colecciones/${coleccionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombreNormalizado }),
        });

        if (!resp.ok) {
            console.error('[SyncCollection] Error renombrando colección en servidor:', resp.status);
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
