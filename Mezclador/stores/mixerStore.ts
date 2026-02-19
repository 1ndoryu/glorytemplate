/*
 * mixerStore — Estado de la consola de mezcla (Mixer).
 * Gestiona inserts, EQ, FX slots, peaks y routing.
 * Master = insert 0, inserts 1-16 para canales.
 */

import { create } from 'zustand';
import type { InsertMixer, BandaEQ } from '../types/mezclador';
import { CONSTANTES_MIXER, crearInsertDefault } from '../types/mezclador';

export interface MixerState {
    inserts: InsertMixer[];
    insertSeleccionado: number;
    visible: boolean;

    /* Inserts */
    setVolumenInsert: (id: number, vol: number) => void;
    setPanInsert: (id: number, pan: number) => void;
    toggleMuteInsert: (id: number) => void;
    toggleSoloInsert: (id: number) => void;
    setNombreInsert: (id: number, nombre: string) => void;
    setColorInsert: (id: number, color: string) => void;
    seleccionarInsert: (id: number) => void;

    /* EQ */
    setBandaEQ: (insertId: number, bandaIdx: number, cambios: Partial<BandaEQ>) => void;
    toggleEQ: (insertId: number) => void;

    /* FX Slots */
    setSlot: (insertId: number, slotIdx: number, tipo: string | null) => void;
    toggleSlot: (insertId: number, slotIdx: number) => void;

    /* Routing */
    setEnviarA: (insertId: number, destinoId: number) => void;

    /* Metering (llamado desde rAF) */
    actualizarPeaks: (insertId: number, peakL: number, peakR: number) => void;

    /* Toggle */
    toggleVisible: () => void;

    /* Reset */
    resetInsert: (id: number) => void;
}

/* Helper: actualizar un insert en el array */
const actualizarInserts = (
    inserts: InsertMixer[],
    id: number,
    fn: (insert: InsertMixer) => InsertMixer
): InsertMixer[] =>
    inserts.map(ins => ins.id === id ? fn({ ...ins }) : ins);

/* Crear inserts iniciales: Master + 16 inserts */
const crearInsertsIniciales = (): InsertMixer[] =>
    Array.from({ length: CONSTANTES_MIXER.TOTAL_INSERTS + 1 }, (_, i) =>
        crearInsertDefault(i)
    );

export const useMixerStore = create<MixerState>((set, get) => ({
    inserts: crearInsertsIniciales(),
    insertSeleccionado: 0,
    visible: false,

    /* Inserts */
    setVolumenInsert: (id, vol) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, id, ins => ({
                ...ins,
                volumen: Math.max(0, Math.min(CONSTANTES_MIXER.VOLUMEN_MAX, vol)),
            })),
        }));
    },

    setPanInsert: (id, pan) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, id, ins => ({
                ...ins,
                pan: Math.max(-1, Math.min(1, pan)),
            })),
        }));
    },

    toggleMuteInsert: (id) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, id, ins => ({
                ...ins,
                silenciado: !ins.silenciado,
            })),
        }));
    },

    toggleSoloInsert: (id) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, id, ins => ({
                ...ins,
                solo: !ins.solo,
            })),
        }));
    },

    setNombreInsert: (id, nombre) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, id, ins => ({
                ...ins,
                nombre,
            })),
        }));
    },

    setColorInsert: (id, color) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, id, ins => ({
                ...ins,
                color,
            })),
        }));
    },

    seleccionarInsert: (id) => set({ insertSeleccionado: id }),

    /* EQ */
    setBandaEQ: (insertId, bandaIdx, cambios) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, insertId, ins => ({
                ...ins,
                eq: ins.eq.map((banda, i) =>
                    i === bandaIdx ? { ...banda, ...cambios } : banda
                ),
            })),
        }));
    },

    toggleEQ: (insertId) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, insertId, ins => ({
                ...ins,
                eqActivo: !ins.eqActivo,
            })),
        }));
    },

    /* FX Slots */
    setSlot: (insertId, slotIdx, tipo) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, insertId, ins => ({
                ...ins,
                slots: ins.slots.map((s, i) =>
                    i === slotIdx ? { ...s, tipo } : s
                ),
            })),
        }));
    },

    toggleSlot: (insertId, slotIdx) => {
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, insertId, ins => ({
                ...ins,
                slots: ins.slots.map((s, i) =>
                    i === slotIdx ? { ...s, activo: !s.activo } : s
                ),
            })),
        }));
    },

    /* Routing */
    setEnviarA: (insertId, destinoId) => {
        /* No permitir routing circular ni master a sí mismo */
        if (insertId === 0 || insertId === destinoId) return;
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, insertId, ins => ({
                ...ins,
                enviarA: destinoId,
            })),
        }));
    },

    /* Metering — alta frecuencia, mutación mínima */
    actualizarPeaks: (insertId, peakL, peakR) => {
        const { inserts } = get();
        const ins = inserts.find(i => i.id === insertId);
        if (!ins) return;
        /*
         * Solo actualizar si el cambio es significativo (>0.01)
         * para evitar re-renders innecesarios con cada frame.
         */
        if (Math.abs(ins.peakL - peakL) < 0.01 && Math.abs(ins.peakR - peakR) < 0.01) return;
        set(prev => ({
            inserts: actualizarInserts(prev.inserts, insertId, i => ({
                ...i,
                peakL,
                peakR,
            })),
        }));
    },

    /* Toggle */
    toggleVisible: () => set(prev => ({ visible: !prev.visible })),

    /* Reset */
    resetInsert: (id) => {
        set(prev => ({
            inserts: prev.inserts.map(ins =>
                ins.id === id ? crearInsertDefault(id) : ins
            ),
        }));
    },
}));
