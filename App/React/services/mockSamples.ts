/*
 * Mock data de samples — Kamples
 * Datos de ejemplo para desarrollo local cuando la API aún no está disponible.
 * Se usan en InicioIsland, SamplesIsland, etc. como fallback.
 * Datos base extraídos a datos/mockSamplesData.ts para cumplir límites de archivo.
 */

import type { SampleResumen, Sample } from '../types';
import { samplesMockBase, sampleDetalladoMockBase, RUTAS_PREVIEW_DEMO } from './datos/mockSamplesData';

/* Asigna rutas de preview cíclicas a cada sample */
export const samplesMock: SampleResumen[] = samplesMockBase.map((sample, index) => ({
    ...sample,
    rutaPreview: RUTAS_PREVIEW_DEMO[index % RUTAS_PREVIEW_DEMO.length],
}));

/* Re-exporta el sample detallado sin cambios */
export const sampleDetalladoMock: Sample = sampleDetalladoMockBase;

/* Subconjuntos pre-separados para las secciones del feed */
export const trendingMock = samplesMock.filter((_, i) => [1, 4, 7, 9, 5].includes(i)).slice(0, 5);
export const recientesMock = samplesMock.slice(6, 12);
export const descubrirMock = samplesMock.slice(0, 6);
