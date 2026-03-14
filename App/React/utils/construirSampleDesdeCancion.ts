/*
 * Utilidad: construir SampleResumen minimo desde una Cancion.sampleAdjunto.
 * Reutilizado por SeccionesMusica y BusquedaCanciones para el reproductor (QK18 DRY).
 */

import type { Cancion } from '@app/types/cancion';
import type { SampleResumen } from '@app/types/sample';

export function construirSampleDesdeCancion(cancion: Cancion): SampleResumen | null {
    const sa = cancion.sampleAdjunto;
    if (!sa) return null;

    return {
        id: sa.id,
        titulo: sa.titulo,
        slug: sa.slug,
        rutaPreview: sa.rutaPreview,
        rutaWaveform: '',
        imagenUrl: sa.imagenUrl ?? cancion.imagenUrl,
        duracion: sa.duracion,
        tipo: sa.tipo as SampleResumen['tipo'],
        bpm: null,
        key: null,
        escala: null,
        tags: [],
        esPremium: false,
        precio: null,
        totalDescargas: 0,
        totalLikes: 0,
        totalReproducciones: 0,
        metadata: null,
        creador: {
            id: sa.creadorId,
            username: '',
            nombreVisible: '',
            avatarUrl: null,
            verificado: false,
        },
    };
}
