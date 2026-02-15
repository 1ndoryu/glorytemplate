/*
 * Store: reproductorStore — Kamples
 * Estado global del reproductor de audio.
 * Controla play/pause, cola, sample actual, volumen, progreso.
 */

import {create} from 'zustand';
import type {SampleResumen} from '../types';

interface EstadoReproductor {
    sampleActual: SampleResumen | null;
    cola: SampleResumen[];
    reproduciendo: boolean;
    volumen: number;
    progreso: number;
    duracion: number;
    muted: boolean;
    repetir: boolean;
    aleatorio: boolean;

    /* Acciones */
    setSample: (sample: SampleResumen) => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setVolumen: (volumen: number) => void;
    toggleMute: () => void;
    setProgreso: (progreso: number) => void;
    setDuracion: (duracion: number) => void;
    toggleRepetir: () => void;
    toggleAleatorio: () => void;
    agregarACola: (sample: SampleResumen) => void;
    quitarDeCola: (sampleId: number) => void;
    limpiarCola: () => void;
    siguiente: () => void;
    anterior: () => void;
    cerrar: () => void;
}

export const useReproductorStore = create<EstadoReproductor>((set, get) => ({
    sampleActual: null,
    cola: [],
    reproduciendo: false,
    volumen: 0.8,
    progreso: 0,
    duracion: 0,
    muted: false,
    repetir: false,
    aleatorio: false,

    setSample: sample =>
        set({
            sampleActual: sample,
            reproduciendo: true,
            progreso: 0,
            duracion: sample.duracion
        }),

    play: () => set({reproduciendo: true}),
    pause: () => set({reproduciendo: false}),
    togglePlay: () => set(s => ({reproduciendo: !s.reproduciendo})),

    setVolumen: volumen => set({volumen: Math.max(0, Math.min(1, volumen))}),
    toggleMute: () => set(s => ({muted: !s.muted})),

    setProgreso: progreso => set({progreso}),
    setDuracion: duracion => set({duracion}),

    toggleRepetir: () => set(s => ({repetir: !s.repetir})),
    toggleAleatorio: () => set(s => ({aleatorio: !s.aleatorio})),

    agregarACola: sample =>
        set(s => {
            /* Evitar duplicados en cola */
            if (s.cola.some(item => item.id === sample.id)) return s;
            return {cola: [...s.cola, sample]};
        }),

    quitarDeCola: sampleId => set(s => ({cola: s.cola.filter(item => item.id !== sampleId)})),

    limpiarCola: () => set({cola: []}),

    siguiente: () => {
        const {cola, sampleActual, aleatorio} = get();
        if (cola.length === 0) return;

        if (aleatorio) {
            const indice = Math.floor(Math.random() * cola.length);
            set({sampleActual: cola[indice], reproduciendo: true, progreso: 0});
            return;
        }

        const indiceActual = cola.findIndex(s => s.id === sampleActual?.id);
        const siguienteIndice = indiceActual + 1 < cola.length ? indiceActual + 1 : 0;
        set({sampleActual: cola[siguienteIndice], reproduciendo: true, progreso: 0});
    },

    anterior: () => {
        const {cola, sampleActual} = get();
        if (cola.length === 0) return;

        const indiceActual = cola.findIndex(s => s.id === sampleActual?.id);
        const anteriorIndice = indiceActual - 1 >= 0 ? indiceActual - 1 : cola.length - 1;
        set({sampleActual: cola[anteriorIndice], reproduciendo: true, progreso: 0});
    },

    /* Cierra el reproductor completamente, limpiando el estado */
    cerrar: () =>
        set({
            sampleActual: null,
            reproduciendo: false,
            progreso: 0,
            duracion: 0
        })
}));
