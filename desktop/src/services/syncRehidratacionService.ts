/*
 * Servicio: syncRehidratacionService — Rehidratación de imágenes de portada.
 *
 * Extraído de syncService.ts (TA6) para cumplir SRP.
 * Reconcilia imágenes de portada de samples del historial con el servidor.
 */

import { estaOnline } from './desktopService';
import { logSync } from './syncLogger';
import { estado } from './syncState';

/* C7: Reducido de 15s a 5s para que imágenes asignadas via web se muestren más rápido */
const REHIDRATAR_IMAGENES_INTERVALO_MS = 5_000;
let ultimaRehidratacionImagenes = 0;

function normalizarUrlImagenHistorial(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.trim() || null;
}

/**
 * Rehidratación periódica de portadas para entradas del historial.
 * Si la URL cambió en el servidor, reemplaza también la portada ya persistida.
 * Diseñada para ser llamada frecuentemente (ej: polling UI); tiene throttle interno.
 */
export async function rehidratarImagenesPendientesSync(): Promise<void> {
    const ahora = Date.now();
    if (ahora - ultimaRehidratacionImagenes < REHIDRATAR_IMAGENES_INTERVALO_MS) return;
    ultimaRehidratacionImagenes = ahora;
    await rehidratarImagenesPendientes();
}

export async function rehidratarImagenesPendientesForzadoSync(): Promise<void> {
    const ahora = Date.now();
    /* Forzado: permite rehidratación inmediata tras upload exitoso,
     * pero actualiza marca temporal para evitar tormenta de requests. */
    ultimaRehidratacionImagenes = ahora;
    await rehidratarImagenesPendientes();
}

/*
 * Rehidrata imágenes de portada para entradas del historial que no las tienen.
 * Usa batch fetch: GET /samples?creador=username para obtener todas las imágenes
 * del usuario en una sola request, luego mapea sampleId → imagenUrl.
 *
 * Se lanza en background al inicializar el sync service. No bloquea el flujo.
 * Reconciliación eventual: corrige tanto imágenes ausentes como imágenes reemplazadas
 * en el servidor.
 */
export async function rehidratarImagenesPendientes(): Promise<void> {
    const { trackingModule, collectionModule } = estado;
    if (!trackingModule?.obtenerHistorialSamples || !trackingModule?.actualizarEstadoSample) return;
    if (!collectionModule?.obtenerColeccionesDelServidor) return;
    if (!estaOnline()) return;

    const historial = trackingModule.obtenerHistorialSamples(100);
    const historialConSample = historial.filter(e => e.sampleId > 0);
    if (historialConSample.length === 0) return;

    try {
        const datos = await collectionModule.obtenerColeccionesDelServidor();
        if (!datos) return;

        /* Construir mapa sampleId → imagenUrl para O(1) lookup desde snapshot de sync. */
        const mapaImagenes = new Map<number, string>();
        for (const coleccion of datos.colecciones) {
            for (const sample of coleccion.samples) {
                const imagen = sample.imagenUrl ?? sample.imagen_url ?? null;
                if (sample.id && imagen) {
                    mapaImagenes.set(sample.id, imagen);
                }
            }
        }
        for (const sample of datos.sinColeccion) {
            const imagen = sample.imagenUrl ?? sample.imagen_url ?? null;
            if (sample.id && imagen) {
                mapaImagenes.set(sample.id, imagen);
            }
        }

        /* Reconciliar entradas cuyo snapshot remoto ya tiene portada disponible. */
        let actualizadas = 0;
        for (const entrada of historialConSample) {
            const urlImagen = normalizarUrlImagenHistorial(mapaImagenes.get(entrada.sampleId));
            const urlActual = normalizarUrlImagenHistorial(entrada.imagenUrl);
            if (urlImagen && urlImagen !== urlActual) {
                await trackingModule.actualizarEstadoSample({
                    sampleId: entrada.sampleId,
                    nombreArchivo: entrada.nombreArchivo,
                    estado: entrada.estado,
                    imagenUrl: urlImagen,
                });
                actualizadas++;
            }
        }

        if (actualizadas > 0) {
            console.info(`[Sync] Reconciliadas ${actualizadas} imágenes de samples en historial`);
        }
    } catch (err) {
        logSync.error('syncService', 'Error rehidratando imágenes pendientes', { error: err instanceof Error ? err.message : String(err) });
    }
}
