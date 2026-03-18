/*
 * Store: panelLateralStore — Kamples (C86+C95+C111+C155)
 * Controla el panel lateral derecho (~30%) que muestra:
 * - Sugerencias "También te podría gustar"
 * - Detalle condensado de sample (click en título)
 * - Comentarios de un sample (click en icono comentar)
 * Solo activo en islas que lo soporten (Inicio, Colecciones, Librería).
 */

import { create } from 'zustand';
import type { SampleResumen, Coleccion } from '@app/types';
import { crearLogger } from '@app/services/logger';

type ModoPanelLateral = 'sugerencias' | 'detalle' | 'comentarios' | 'mezclador' | 'libreria' | 'coleccion' | null;

/* C155: Clave localStorage para persistir preferencia */
const LS_KEY_SUGERENCIAS = 'kamples:sugerenciasAlDarLike';
const log = crearLogger('panelLateralStore');

const leerPreferenciaSugerencias = (): boolean => {
    try {
        const val = localStorage.getItem(LS_KEY_SUGERENCIAS);
        return val === null ? true : val === '1';
    } catch (error) {
        log.warn('No se pudo leer preferencia de sugerencias', error);
        return true;
    }
};

interface PanelLateralState {
    modo: ModoPanelLateral;
    sampleId: number | null;
    sampleSlug: string | null;
    sample: SampleResumen | null;
    habilitado: boolean;

    /* C155: Preferencia para abrir sugerencias al dar like (persistida en localStorage) */
    sugerenciasAlDarLike: boolean;
    setSugerenciasAlDarLike: (valor: boolean) => void;

    /* Activar/desactivar el panel segun la isla actual */
    habilitar: () => void;
    deshabilitar: () => void;

    /* Mostrar detalle de un sample */
    abrirDetalle: (sample: SampleResumen) => void;

    /* Mostrar comentarios de un sample */
    abrirComentarios: (sample: SampleResumen) => void;

    /* Mostrar sugerencias tras like */
    abrirSugerencias: (sample: SampleResumen) => void;

    /* C184: Abrir modo mezclador */
    abrirMezclador: () => void;

    /* C280: Abrir modo libreria */
    abrirLibreria: () => void;

    /* [183A-54] Abrir samples de una colección en el panel */
    coleccionActiva: Coleccion | null;
    abrirColeccion: (coleccion: Coleccion) => void;

    /* C241: Expandir panel a ancho completo (toggle) */
    expandido: boolean;
    toggleExpandido: () => void;

    /* Cerrar panel */
    cerrar: () => void;
}

export const usePanelLateralStore = create<PanelLateralState>((set, get) => ({
    modo: null,
    sampleId: null,
    sampleSlug: null,
    sample: null,
    habilitado: false,
    coleccionActiva: null,
    sugerenciasAlDarLike: leerPreferenciaSugerencias(),

    setSugerenciasAlDarLike: (valor) => {
        try {
            localStorage.setItem(LS_KEY_SUGERENCIAS, valor ? '1' : '0');
        } catch (error) {
            log.warn('No se pudo guardar preferencia de sugerencias', error);
        }
        set({ sugerenciasAlDarLike: valor });
    },

    habilitar: () => set({ habilitado: true }),
    deshabilitar: () => set({ habilitado: false, modo: null, sampleId: null, sampleSlug: null, sample: null }),

    abrirDetalle: (sample) => set({
        modo: 'detalle',
        sampleId: sample.id,
        sampleSlug: sample.slug,
        sample,
    }),

    abrirComentarios: (sample) => set({
        modo: 'comentarios',
        sampleId: sample.id,
        sampleSlug: sample.slug,
        sample,
    }),

    /* [183A-72] abrirSugerencias unificado: usa el mismo panel de detalle para no tener dos paneles distintos.
     * Antes abria modo 'sugerencias'; ahora abre modo 'detalle' que ya incluye panelColeccionPortada + similares. */
    abrirSugerencias: (sample) => {
        /* C155: Solo abrir si la preferencia esta activa */
        if (!get().sugerenciasAlDarLike) return;
        /* QL55: No auto-abrir sugerencias en movil (panel no visible) */
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) return;
        set({
            modo: 'detalle',
            sampleId: sample.id,
            sampleSlug: sample.slug,
            sample,
        });
    },

    /* C184: Abrir modo mezclador — no necesita sample */
    abrirMezclador: () => set({ modo: 'mezclador', sampleId: null, sampleSlug: null, sample: null, habilitado: true }),

    /* C280: Abrir modo libreria — no necesita sample */
    abrirLibreria: () => set({ modo: 'libreria', sampleId: null, sampleSlug: null, sample: null, coleccionActiva: null, habilitado: true }),

    /* [183A-54] Abrir samples de una colección en el panel */
    abrirColeccion: (coleccion) => set({
        modo: 'coleccion',
        sampleId: null,
        sampleSlug: null,
        sample: null,
        coleccionActiva: coleccion,
        habilitado: true,
    }),

    /* C241: Expandir panel a ancho completo */
    expandido: false,
    toggleExpandido: () => set((s) => ({ expandido: !s.expandido })),

    cerrar: () => set({ modo: null, sampleId: null, sampleSlug: null, sample: null, coleccionActiva: null, expandido: false }),
}));
