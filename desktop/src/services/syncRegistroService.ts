/*
 * Servicio: syncRegistroService — Operaciones de registro y movimiento de archivos sync.
 *
 * Extraído de syncService.ts (TA6) para cumplir SRP.
 * Contiene: registrarDescarga, registrarSubidaLocal, registrarAccionHistorial,
 * moverArchivoASinColeccion, actualizarEstadoSampleHistorial.
 */

import {
    marcarDescargaEnCurso,
    marcarMovimientoInterno,
} from './syncGuards';
import {
    estado,
    guardarIndice,
} from './syncState';
import type { AccionHistorial } from './syncTrackingService';

/*
 * Registra un archivo descargado en tracking v2 + índice v1 legacy.
 */
export async function registrarDescarga(
    sampleId: number,
    ruta: string,
    nombreOriginal: string,
    nombreServidor: string,
    coleccionId?: number | null,
): Promise<void> {
    const { trackingModule } = estado;

    if (trackingModule) {
        await trackingModule.registrarArchivo({
            sampleId,
            coleccionId: coleccionId ?? null,
            rutaLocal: ruta,
            nombreLocal: nombreServidor,
            nombreServidor,
            descargadoEn: Date.now(),
            tamano: 0,
            syncDeshabilitado: false,
        });
    }

    estado.indiceArchivos = estado.indiceArchivos.filter(a => a.sampleId !== sampleId);
    estado.indiceArchivos.push({
        ruta,
        nombre: nombreOriginal,
        sampleId,
        hash: '',
        descargadoEn: Date.now(),
        nombreOriginal,
        nombreServidor,
    });

    await guardarIndice();
}

/* Historial de acciones (wrapper público) */

/*
 * Registra una acción en el historial del panel de sync.
 * Wrapper público de trackingModule.registrarAccion() para que otros servicios
 * (uploadQueueService) puedan escribir historial sin acceso directo al tracking.
 */
export async function registrarAccionHistorial(datos: {
    tipo: string;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
}): Promise<void> {
    const { trackingModule } = estado;
    if (!trackingModule) return;
    /* El tipo se valida por TipoAccionHistorial en el tracking module.
     * Hacemos cast seguro porque los callers internos usan tipos conocidos. */
    await trackingModule.registrarAccion(datos as Omit<AccionHistorial, 'timestamp'>);
}

/* Registro de subidas locales */

/*
 * Registra un archivo subido desde carpeta local:
 * - actualiza índice/tracking igual que una descarga
 * - agrega entrada de historial tipo "subida" para feedback persistente en panel
 */
export async function registrarSubidaLocal(
    sampleId: number,
    ruta: string,
    nombreArchivo: string,
    coleccionId?: number | null,
): Promise<void> {
    await registrarDescarga(sampleId, ruta, nombreArchivo, nombreArchivo, coleccionId);

    const { trackingModule } = estado;
    if (!trackingModule) return;

    await trackingModule.registrarAccion({
        tipo: 'subida',
        descripcion: `Archivo subido: "${nombreArchivo}"`,
        sampleId,
        coleccionId: coleccionId ?? undefined,
    });

    /* Historial per-sample v2: marcar como sincronizado */
    if (trackingModule.actualizarEstadoSample) {
        await trackingModule.actualizarEstadoSample({
            sampleId,
            nombreArchivo,
            estado: 'sincronizado',
            rutaLocal: ruta,
        });
    }
}

/*
 * Mueve un archivo de la raíz de sync a la carpeta "Sin colección" y actualiza tracking.
 */
export async function moverArchivoASinColeccion(
    rutaActual: string,
    nombreArchivo: string,
    sampleId: number,
): Promise<string | null> {
    if (!estado.config.carpetaLocal) return null;

    try {
        const { mkdir, rename } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { trackingModule } = estado;

        const carpetaSinCol = await join(estado.config.carpetaLocal, 'Sin colección');
        await mkdir(carpetaSinCol, { recursive: true }).catch(() => { /* ya existe */ });

        const nuevaRuta = await join(carpetaSinCol, nombreArchivo);

        /*
         * FIX: Marcar la nueva ruta como "descarga en curso" ANTES del rename.
         * El rename produce un evento CREATE en el watcher que, sin este guard,
         * genera una subida duplicada por race condition:
         * el watcher detecta el CREATE antes de que el tracking se actualice.
         *
         * También marcar la ruta ORIGINAL como movimiento interno para que
         * el evento DELETE no dispare manejarBorradoLocal → softDeleteEnServidor
         * si la actualización de tracking falla.
         */
        marcarDescargaEnCurso(nuevaRuta);
        marcarMovimientoInterno(rutaActual);

        await rename(rutaActual, nuevaRuta);

        if (trackingModule) {
            const archivo = trackingModule.buscarArchivoPorSampleId(sampleId);
            if (archivo) {
                await trackingModule.registrarArchivo({
                    ...archivo,
                    rutaLocal: nuevaRuta,
                    coleccionId: null,
                });
            }
            await trackingModule.agregarSinColeccion(sampleId);
            await trackingModule.registrarAccion({
                tipo: 'movido',
                descripcion: `${nombreArchivo} → Sin colección`,
                sampleId,
            });

            /* Historial per-sample v2: actualizar ruta tras mover */
            if (trackingModule.actualizarEstadoSample) {
                await trackingModule.actualizarEstadoSample({
                    sampleId,
                    nombreArchivo,
                    estado: 'sincronizado',
                    rutaLocal: nuevaRuta,
                    coleccionNombre: 'Sin colección',
                });
            }
        }

        const archivoV1 = estado.indiceArchivos.find(a => a.sampleId === sampleId);
        if (archivoV1) {
            archivoV1.ruta = nuevaRuta;
            await guardarIndice();
        }

        console.info('[Sync] Archivo movido a Sin colección:', nombreArchivo);
        return nuevaRuta;
    } catch (err) {
        console.error('[Sync] Error moviendo archivo a Sin colección:', err);
        return null;
    }
}

/**
 * Upsert en historial per-sample: actualiza el estado de un sample existente
 * o crea nueva entrada. Un sample = una fila, estado mutable.
 */
export async function actualizarEstadoSampleHistorial(datos: {
    sampleId: number;
    nombreArchivo: string;
    estado: string;
    imagenUrl?: string | null;
    rutaLocal?: string | null;
    coleccionNombre?: string;
    error?: string;
}): Promise<void> {
    const { trackingModule } = estado;
    if (!trackingModule?.actualizarEstadoSample) return;
    await trackingModule.actualizarEstadoSample(
        datos as Parameters<typeof trackingModule.actualizarEstadoSample>[0],
    );
}
