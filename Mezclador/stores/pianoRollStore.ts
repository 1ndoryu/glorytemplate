/*
 * pianoRollStore — Estado UI del editor Piano Roll.
 * C310: Solo estado de vista y herramientas. Los datos de notas viven en
 * accionesNotas.ts (independiente, no acopla a patronesStore de AG-TWO).
 */

import { create } from 'zustand';
import type {
    HerramientaPianoRoll,
    SnapPianoRoll,
    TipoControl,
    VistaPianoRoll,
    NotaPianoRoll,
} from '../types/pianoRoll';
import { VISTA_DEFAULT, CONSTANTES_PIANO_ROLL, PPQ } from '../types/pianoRoll';

interface PianoRollState {
    /* Canal editándose */
    canalId: string | null;
    patronId: string | null;
    abierto: boolean;

    /* Herramienta y snap */
    herramienta: HerramientaPianoRoll;
    snap: SnapPianoRoll;
    duracionDefault: number;

    /* Vista */
    vista: VistaPianoRoll;

    /* Panel de control inferior */
    controlActivo: TipoControl;
    controlAbierto: boolean;

    /* Selección */
    notasSeleccionadas: Set<string>;

    /* Clipboard */
    clipboard: NotaPianoRoll[] | null;

    /* Ghost notes */
    ghostHabilitado: boolean;

    /* Preview audio al hacer click */
    previewActivo: boolean;

    /* Lifecycle */
    abrir: (patronId: string, canalId: string) => void;
    cerrar: () => void;

    /* Herramientas */
    setHerramienta: (h: HerramientaPianoRoll) => void;
    setSnap: (s: SnapPianoRoll) => void;
    setDuracionDefault: (ticks: number) => void;

    /* Vista */
    setScrollX: (x: number) => void;
    setScrollY: (y: number) => void;
    setZoomX: (z: number) => void;
    setZoomY: (z: number) => void;
    ajustarScrollX: (delta: number) => void;
    ajustarScrollY: (delta: number) => void;

    /* Control inferior */
    setControlActivo: (tipo: TipoControl) => void;
    toggleControlAbierto: () => void;

    /* Selección */
    seleccionarNota: (id: string, ctrl: boolean) => void;
    seleccionarRango: (ids: string[]) => void;
    seleccionarTodas: (todasIds: string[]) => void;
    limpiarSeleccion: () => void;

    /* Clipboard */
    copiar: (notas: NotaPianoRoll[]) => void;
    cortar: (notas: NotaPianoRoll[]) => void;
    obtenerClipboard: () => NotaPianoRoll[] | null;

    /* Ghost */
    toggleGhost: () => void;

    /* Preview */
    togglePreview: () => void;
}

export const usePianoRollStore = create<PianoRollState>((set, get) => ({
    canalId: null,
    patronId: null,
    abierto: false,

    herramienta: 'dibujar',
    snap: '1/4',
    duracionDefault: PPQ,

    vista: { ...VISTA_DEFAULT },

    controlActivo: 'velocity',
    controlAbierto: true,

    notasSeleccionadas: new Set(),

    clipboard: null,

    ghostHabilitado: false,

    previewActivo: true,

    abrir: (patronId, canalId) => set({
        patronId,
        canalId,
        abierto: true,
        notasSeleccionadas: new Set(),
    }),

    cerrar: () => set({
        abierto: false,
        notasSeleccionadas: new Set(),
    }),

    setHerramienta: (h) => set({ herramienta: h }),

    setSnap: (s) => set({ snap: s }),

    setDuracionDefault: (ticks) => set({
        duracionDefault: Math.max(1, ticks),
    }),

    setScrollX: (x) => set(prev => ({
        vista: { ...prev.vista, scrollX: Math.max(0, x) },
    })),

    setScrollY: (y) => set(prev => ({
        vista: { ...prev.vista, scrollY: Math.max(0, y) },
    })),

    setZoomX: (z) => set(prev => ({
        vista: {
            ...prev.vista,
            zoomX: Math.max(
                CONSTANTES_PIANO_ROLL.ZOOM_X_MIN,
                Math.min(CONSTANTES_PIANO_ROLL.ZOOM_X_MAX, z)
            ),
        },
    })),

    setZoomY: (z) => set(prev => ({
        vista: {
            ...prev.vista,
            zoomY: Math.max(
                CONSTANTES_PIANO_ROLL.ZOOM_Y_MIN,
                Math.min(CONSTANTES_PIANO_ROLL.ZOOM_Y_MAX, z)
            ),
        },
    })),

    ajustarScrollX: (delta) => set(prev => ({
        vista: { ...prev.vista, scrollX: Math.max(0, prev.vista.scrollX + delta) },
    })),

    ajustarScrollY: (delta) => set(prev => ({
        vista: { ...prev.vista, scrollY: Math.max(0, prev.vista.scrollY + delta) },
    })),

    setControlActivo: (tipo) => set({ controlActivo: tipo }),

    toggleControlAbierto: () => set(prev => ({
        controlAbierto: !prev.controlAbierto,
    })),

    seleccionarNota: (id, ctrl) => set(prev => {
        const seleccion = new Set(ctrl ? prev.notasSeleccionadas : []);
        if (seleccion.has(id)) {
            seleccion.delete(id);
        } else {
            seleccion.add(id);
        }
        return { notasSeleccionadas: seleccion };
    }),

    seleccionarRango: (ids) => set({
        notasSeleccionadas: new Set(ids),
    }),

    seleccionarTodas: (todasIds) => set({
        notasSeleccionadas: new Set(todasIds),
    }),

    limpiarSeleccion: () => set({
        notasSeleccionadas: new Set(),
    }),

    copiar: (notas) => set({
        clipboard: notas.map(n => ({ ...n })),
    }),

    cortar: (notas) => set({
        clipboard: notas.map(n => ({ ...n })),
    }),

    obtenerClipboard: () => get().clipboard,

    toggleGhost: () => set(prev => ({
        ghostHabilitado: !prev.ghostHabilitado,
    })),

    togglePreview: () => set(prev => ({
        previewActivo: !prev.previewActivo,
    })),
}));
