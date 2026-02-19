/*
 * ventanasStore — Gestión de ventanas flotantes del DAW.
 * Controla posición, minimización y ciclo de vida de las ventanas in-DAW.
 * C287: Las ventanas reemplazan modales fijos por ventanas arrastables.
 */

import { create } from 'zustand';

export interface VentanaInfo {
    id: string;
    tipo: 'configBloque' | 'configDaw' | 'pianoRoll' | 'channelRack' | 'mixer';
    titulo: string;
    minimizada: boolean;
    posicion: { x: number; y: number };
    /* ID del bloque asociado (solo para tipo configBloque) */
    bloqueId?: string;
    /* Z-index dinámico para focus */
    zIndex: number;
}

interface VentanasState {
    ventanas: VentanaInfo[];
    contadorZ: number;

    abrirVentana: (ventana: Omit<VentanaInfo, 'zIndex' | 'minimizada'>) => void;
    cerrarVentana: (id: string) => void;
    minimizarVentana: (id: string) => void;
    restaurarVentana: (id: string) => void;
    enfocarVentana: (id: string) => void;
    moverVentana: (id: string, posicion: { x: number; y: number }) => void;
    cerrarTodas: () => void;
}

/* Posición centrada por defecto para nuevas ventanas */
const posicionInicial = (): { x: number; y: number } => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    /* Offset aleatorio para evitar superponer ventanas exactas */
    const jitter = Math.round(Math.random() * 40 - 20);
    return {
        x: Math.max(20, Math.round(w / 2 - 350 + jitter)),
        y: Math.max(20, Math.round(h / 2 - 250 + jitter)),
    };
};

export const useVentanasStore = create<VentanasState>((set, get) => ({
    ventanas: [],
    contadorZ: 100,

    abrirVentana: (datos) => {
        const { ventanas, contadorZ } = get();

        /* Si ya existe una ventana con el mismo id, enfocarla o restaurarla */
        const existente = ventanas.find(v => v.id === datos.id);
        if (existente) {
            set({
                ventanas: ventanas.map(v =>
                    v.id === datos.id
                        ? { ...v, minimizada: false, zIndex: contadorZ + 1 }
                        : v
                ),
                contadorZ: contadorZ + 1,
            });
            return;
        }

        const nueva: VentanaInfo = {
            ...datos,
            minimizada: false,
            zIndex: contadorZ + 1,
            posicion: datos.posicion ?? posicionInicial(),
        };

        set({
            ventanas: [...ventanas, nueva],
            contadorZ: contadorZ + 1,
        });
    },

    cerrarVentana: (id) => {
        set(prev => ({
            ventanas: prev.ventanas.filter(v => v.id !== id),
        }));
    },

    minimizarVentana: (id) => {
        set(prev => ({
            ventanas: prev.ventanas.map(v =>
                v.id === id ? { ...v, minimizada: true } : v
            ),
        }));
    },

    restaurarVentana: (id) => {
        const { contadorZ } = get();
        set(prev => ({
            ventanas: prev.ventanas.map(v =>
                v.id === id ? { ...v, minimizada: false, zIndex: contadorZ + 1 } : v
            ),
            contadorZ: contadorZ + 1,
        }));
    },

    enfocarVentana: (id) => {
        const { contadorZ } = get();
        set(prev => ({
            ventanas: prev.ventanas.map(v =>
                v.id === id ? { ...v, zIndex: contadorZ + 1 } : v
            ),
            contadorZ: contadorZ + 1,
        }));
    },

    moverVentana: (id, posicion) => {
        set(prev => ({
            ventanas: prev.ventanas.map(v =>
                v.id === id ? { ...v, posicion } : v
            ),
        }));
    },

    cerrarTodas: () => set({ ventanas: [] }),
}));
