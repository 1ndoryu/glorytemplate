/* 2UPRA */

/* Algunas circunstancias las toleramos innecesariamente. Vivir evitando nuestro destino solo nos hace darnos cuenta de lo infelices que podemos llegar a ser recorriendo el camino que tomamos para huir de el. */

/*
 * Store: reproductorStore  Kamples
 * Estado global del reproductor de audio.
 * Controla play/pause, contexto de navegacion, sample actual, volumen, progreso.
 * QQ49: Reescrito  contexto reemplaza cola, progreso normalizado 0..1,
 * seek via pendingSeek, like optimista, habilitado toggle.
 */

import {create} from 'zustand';
import type {SampleResumen} from '../types';

interface EstadoReproductor {
    sampleActual: SampleResumen | null;
    contexto: SampleResumen[];
    reproduciendo: boolean;
    volumen: number;
    progreso: number;
    duracion: number;
    muted: boolean;
    repetir: boolean;
    aleatorio: boolean;
    autoplay: boolean;
    habilitado: boolean;
    pendingSeek: number | null;
    /* QQ75: ID de coleccion en modo preview (null = no preview) */
    coleccionPreviewId: number | null;

    reproducir: (sample: SampleResumen, contexto?: SampleResumen[]) => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    seek: (posicion: number) => void;
    clearSeek: () => void;
    setVolumen: (volumen: number) => void;
    toggleMute: () => void;
    setProgreso: (progreso: number) => void;
    setDuracion: (duracion: number) => void;
    toggleRepetir: () => void;
    toggleAleatorio: () => void;
    toggleAutoplay: () => void;
    siguiente: () => void;
    anterior: () => void;
    cerrar: () => void;
    setHabilitado: (v: boolean) => void;
    actualizarLike: (liked: boolean) => void;
    setColeccionPreviewId: (id: number | null) => void;
}

export const useReproductorStore = create<EstadoReproductor>((set, get) => ({
    sampleActual: null,
    contexto: [],
    reproduciendo: false,
    volumen: 0.8,
    progreso: 0,
    duracion: 0,
    muted: false,
    repetir: false,
    aleatorio: false,
    autoplay: false,
    habilitado: true,
    pendingSeek: null,
    coleccionPreviewId: null,

    reproducir: (sample, contexto) => {
        const update: Partial<EstadoReproductor> = {
            sampleActual: sample,
            reproduciendo: true,
            progreso: 0,
            duracion: sample.duracion,
        };
        if (contexto) update.contexto = contexto;
        set(update);
    },

    play: () => set({reproduciendo: true}),
    pause: () => set({reproduciendo: false}),
    togglePlay: () => set(s => ({reproduciendo: !s.reproduciendo})),

    seek: posicion => set({pendingSeek: posicion}),
    clearSeek: () => set({pendingSeek: null}),

    setVolumen: volumen => set({volumen: Math.max(0, Math.min(1, volumen))}),
    toggleMute: () => set(s => ({muted: !s.muted})),

    setProgreso: progreso => set({progreso}),
    setDuracion: duracion => set({duracion}),

    toggleRepetir: () => set(s => ({repetir: !s.repetir})),
    toggleAleatorio: () => set(s => ({aleatorio: !s.aleatorio})),
    toggleAutoplay: () => set(s => ({autoplay: !s.autoplay})),

    siguiente: () => {
        const {contexto, sampleActual, aleatorio} = get();
        if (contexto.length === 0) return;

        if (aleatorio) {
            const filtrados = contexto.filter(s => s.id !== sampleActual?.id);
            if (filtrados.length === 0) return;
            const indice = Math.floor(Math.random() * filtrados.length);
            set({sampleActual: filtrados[indice], reproduciendo: true, progreso: 0});
            return;
        }

        const indiceActual = contexto.findIndex(s => s.id === sampleActual?.id);
        const siguienteIndice = indiceActual + 1 < contexto.length ? indiceActual + 1 : 0;
        set({sampleActual: contexto[siguienteIndice], reproduciendo: true, progreso: 0});
    },

    anterior: () => {
        const {contexto, sampleActual} = get();
        if (contexto.length === 0) return;

        const indiceActual = contexto.findIndex(s => s.id === sampleActual?.id);
        const anteriorIndice = indiceActual - 1 >= 0 ? indiceActual - 1 : contexto.length - 1;
        set({sampleActual: contexto[anteriorIndice], reproduciendo: true, progreso: 0});
    },

    cerrar: () =>
        set({
            sampleActual: null,
            reproduciendo: false,
            progreso: 0,
            duracion: 0,
            coleccionPreviewId: null,
        }),

    setHabilitado: v => set({habilitado: v}),

    actualizarLike: liked =>
        set(s => {
            if (!s.sampleActual) return s;
            return {sampleActual: {...s.sampleActual, liked}};
        }),

    setColeccionPreviewId: id => set({coleccionPreviewId: id}),
}));