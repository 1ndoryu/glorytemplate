/*
 * accionesNotas — Gestión de notas del piano roll.
 * C310: CRUD de NotaPianoRoll[] independiente.
 * Las notas se almacenan aquí en un store propio, no en patronesStore
 * (AG-TWO aún no tiene notas en CanalRack). Cuando AG-TWO agregue
 * notas[] al CanalRack, migrar datos a patronesStore será trivial.
 */

import { create } from 'zustand';
import type { NotaPianoRoll, SnapPianoRoll } from '../types/pianoRoll';
import { CONSTANTES_PIANO_ROLL } from '../types/pianoRoll';
import { generarIdNota, snapTick } from '../utils/pianoRollUtils';

/* Key = "patronId:canalId" para aislar notas por canal */
type CanalKey = string;

function clave(patronId: string, canalId: string): CanalKey {
    return `${patronId}:${canalId}`;
}

interface NotasState {
    /* Mapa de notas por canal: clave -> NotaPianoRoll[] */
    notasPorCanal: Map<CanalKey, NotaPianoRoll[]>;

    /* Historial undo/redo por canal */
    _historial: Map<CanalKey, NotaPianoRoll[][]>;
    _posHistorial: Map<CanalKey, number>;

    /* Obtener notas de un canal */
    obtenerNotas: (patronId: string, canalId: string) => NotaPianoRoll[];

    /* CRUD */
    crearNota: (
        patronId: string,
        canalId: string,
        nota: number,
        inicio: number,
        duracion: number,
        velocity?: number,
    ) => string;

    eliminarNota: (patronId: string, canalId: string, notaId: string) => void;
    eliminarNotas: (patronId: string, canalId: string, ids: string[]) => void;

    /* Mover */
    moverNota: (
        patronId: string,
        canalId: string,
        notaId: string,
        deltaTicks: number,
        deltaPitch: number,
    ) => void;

    moverNotasBatch: (
        patronId: string,
        canalId: string,
        ids: string[],
        deltaTicks: number,
        deltaPitch: number,
    ) => void;

    /* Redimensionar */
    redimensionarNota: (
        patronId: string,
        canalId: string,
        notaId: string,
        nuevaDuracion: number,
    ) => void;

    /* Velocity */
    setVelocityNota: (patronId: string, canalId: string, notaId: string, velocity: number) => void;
    setVelocityBatch: (patronId: string, canalId: string, ids: string[], velocity: number) => void;

    /* Pan */
    setPanNota: (patronId: string, canalId: string, notaId: string, pan: number) => void;

    /* Fine pitch (-1 a 1, se mapea a -100 a 100 cents internamente) */
    setFinePitchNota: (patronId: string, canalId: string, notaId: string, finePitch: number) => void;

    /* Color (índice en PALETA_NOTAS) */
    setColorNota: (patronId: string, canalId: string, notaId: string, color: number) => void;
    setColorBatch: (patronId: string, canalId: string, ids: string[], color: number) => void;

    /* Dividir nota en posición */
    dividirNota: (patronId: string, canalId: string, notaId: string, enTick: number) => void;

    /* Duplicar notas con offset */
    duplicarNotas: (patronId: string, canalId: string, ids: string[], offsetTicks: number) => string[];

    /* Cuantizar notas al snap activo */
    cuantizarNotas: (patronId: string, canalId: string, ids: string[], snap: SnapPianoRoll) => void;

    /* Transponer semitonos (+/-) */
    transponerNotas: (patronId: string, canalId: string, ids: string[], semitonos: number) => void;

    /* Toggle mute */
    toggleMuteNota: (patronId: string, canalId: string, notaId: string) => void;

    /* Limpiar todas las notas de un canal */
    limpiarCanal: (patronId: string, canalId: string) => void;

    /* Undo/Redo */
    _guardarSnapshot: (key: CanalKey) => void;
    deshacer: (patronId: string, canalId: string) => void;
    rehacer: (patronId: string, canalId: string) => void;
    puedeDeshacer: (patronId: string, canalId: string) => boolean;
    puedeRehacer: (patronId: string, canalId: string) => boolean;
}

const MAX_HISTORIAL = 30;

export const useNotasStore = create<NotasState>((set, get) => ({
    notasPorCanal: new Map(),
    _historial: new Map(),
    _posHistorial: new Map(),

    obtenerNotas: (patronId, canalId) => {
        return get().notasPorCanal.get(clave(patronId, canalId)) ?? [];
    },

    crearNota: (patronId, canalId, nota, inicio, duracion, velocity) => {
        const key = clave(patronId, canalId);
        const state = get();
        state._guardarSnapshot(key);

        const id = generarIdNota();
        const nuevaNota: NotaPianoRoll = {
            id,
            nota: Math.max(0, Math.min(127, nota)),
            inicio: Math.max(0, inicio),
            duracion: Math.max(1, duracion),
            velocity: velocity ?? CONSTANTES_PIANO_ROLL.VELOCITY_DEFAULT,
            pan: 0,
            finePitch: 0,
            color: 0,
            silenciada: false,
            canalId,
        };

        const notas = [...(state.notasPorCanal.get(key) ?? []), nuevaNota];
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas);
        set({ notasPorCanal: mapa });

        return id;
    },

    eliminarNota: (patronId, canalId, notaId) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.filter(n => n.id !== notaId));
        set({ notasPorCanal: mapa });
    },

    eliminarNotas: (patronId, canalId, ids) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const idsSet = new Set(ids);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.filter(n => !idsSet.has(n.id)));
        set({ notasPorCanal: mapa });
    },

    moverNota: (patronId, canalId, notaId, deltaTicks, deltaPitch) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return {
                ...n,
                inicio: Math.max(0, n.inicio + deltaTicks),
                nota: Math.max(0, Math.min(127, n.nota + deltaPitch)),
            };
        }));
        set({ notasPorCanal: mapa });
    },

    moverNotasBatch: (patronId, canalId, ids, deltaTicks, deltaPitch) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const idsSet = new Set(ids);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (!idsSet.has(n.id)) return n;
            return {
                ...n,
                inicio: Math.max(0, n.inicio + deltaTicks),
                nota: Math.max(0, Math.min(127, n.nota + deltaPitch)),
            };
        }));
        set({ notasPorCanal: mapa });
    },

    redimensionarNota: (patronId, canalId, notaId, nuevaDuracion) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return { ...n, duracion: Math.max(1, nuevaDuracion) };
        }));
        set({ notasPorCanal: mapa });
    },

    setVelocityNota: (patronId, canalId, notaId, velocity) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return { ...n, velocity: Math.max(0, Math.min(1, velocity)) };
        }));
        set({ notasPorCanal: mapa });
    },

    setVelocityBatch: (patronId, canalId, ids, velocity) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const idsSet = new Set(ids);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (!idsSet.has(n.id)) return n;
            return { ...n, velocity: Math.max(0, Math.min(1, velocity)) };
        }));
        set({ notasPorCanal: mapa });
    },

    setPanNota: (patronId, canalId, notaId, pan) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return { ...n, pan: Math.max(-1, Math.min(1, pan)) };
        }));
        set({ notasPorCanal: mapa });
    },

    setFinePitchNota: (patronId, canalId, notaId, finePitch) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return { ...n, finePitch: Math.max(-100, Math.min(100, finePitch)) };
        }));
        set({ notasPorCanal: mapa });
    },

    setColorNota: (patronId, canalId, notaId, color) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return { ...n, color: Math.max(0, Math.min(15, color)) };
        }));
        set({ notasPorCanal: mapa });
    },

    setColorBatch: (patronId, canalId, ids, color) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const idsSet = new Set(ids);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (!idsSet.has(n.id)) return n;
            return { ...n, color: Math.max(0, Math.min(15, color)) };
        }));
        set({ notasPorCanal: mapa });
    },

    dividirNota: (patronId, canalId, notaId, enTick) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const original = notas.find(n => n.id === notaId);
        if (!original) return;

        /* El tick de corte debe estar dentro de la nota */
        const posRelativa = enTick - original.inicio;
        if (posRelativa <= 0 || posRelativa >= original.duracion) return;

        state._guardarSnapshot(key);

        const notaIzq: NotaPianoRoll = {
            ...original,
            duracion: posRelativa,
        };

        const notaDer: NotaPianoRoll = {
            ...original,
            id: generarIdNota(),
            inicio: enTick,
            duracion: original.duracion - posRelativa,
        };

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => n.id === notaId ? notaIzq : n).concat(notaDer));
        set({ notasPorCanal: mapa });
    },

    duplicarNotas: (patronId, canalId, ids, offsetTicks) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return [];

        state._guardarSnapshot(key);
        const idsSet = new Set(ids);
        const originales = notas.filter(n => idsSet.has(n.id));
        const nuevas = originales.map(n => ({
            ...n,
            id: generarIdNota(),
            inicio: Math.max(0, n.inicio + offsetTicks),
        }));

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, [...notas, ...nuevas]);
        set({ notasPorCanal: mapa });

        return nuevas.map(n => n.id);
    },

    cuantizarNotas: (patronId, canalId, ids, snap) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const idsSet = new Set(ids);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (!idsSet.has(n.id)) return n;
            return { ...n, inicio: snapTick(n.inicio, snap) };
        }));
        set({ notasPorCanal: mapa });
    },

    transponerNotas: (patronId, canalId, ids, semitonos) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        state._guardarSnapshot(key);
        const idsSet = new Set(ids);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (!idsSet.has(n.id)) return n;
            return { ...n, nota: Math.max(0, Math.min(127, n.nota + semitonos)) };
        }));
        set({ notasPorCanal: mapa });
    },

    toggleMuteNota: (patronId, canalId, notaId) => {
        const key = clave(patronId, canalId);
        const state = get();
        const notas = state.notasPorCanal.get(key);
        if (!notas) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, notas.map(n => {
            if (n.id !== notaId) return n;
            return { ...n, silenciada: !n.silenciada };
        }));
        set({ notasPorCanal: mapa });
    },

    limpiarCanal: (patronId, canalId) => {
        const key = clave(patronId, canalId);
        const state = get();
        state._guardarSnapshot(key);
        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, []);
        set({ notasPorCanal: mapa });
    },

    /* Historial undo/redo por canal */
    _guardarSnapshot: (key) => {
        const state = get();
        const notasActuales = state.notasPorCanal.get(key) ?? [];
        const historial = state._historial.get(key) ?? [];
        const pos = state._posHistorial.get(key) ?? -1;

        /* Truncar historial después de la posición actual */
        const nuevoHistorial = historial.slice(0, pos + 1);
        nuevoHistorial.push(notasActuales.map(n => ({ ...n })));

        /* Limitar tamaño */
        if (nuevoHistorial.length > MAX_HISTORIAL) {
            nuevoHistorial.shift();
        }

        const mapaH = new Map(state._historial);
        const mapaP = new Map(state._posHistorial);
        mapaH.set(key, nuevoHistorial);
        mapaP.set(key, nuevoHistorial.length - 1);
        set({ _historial: mapaH, _posHistorial: mapaP });
    },

    deshacer: (patronId, canalId) => {
        const key = clave(patronId, canalId);
        const state = get();
        const historial = state._historial.get(key);
        const pos = state._posHistorial.get(key) ?? -1;

        if (!historial || pos < 0) return;

        const snapshot = historial[pos];
        if (!snapshot) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, snapshot.map(n => ({ ...n })));

        const mapaP = new Map(state._posHistorial);
        mapaP.set(key, pos - 1);

        set({ notasPorCanal: mapa, _posHistorial: mapaP });
    },

    rehacer: (patronId, canalId) => {
        const key = clave(patronId, canalId);
        const state = get();
        const historial = state._historial.get(key);
        const pos = state._posHistorial.get(key) ?? -1;

        if (!historial || pos + 1 >= historial.length) return;

        const snapshot = historial[pos + 1];
        if (!snapshot) return;

        const mapa = new Map(state.notasPorCanal);
        mapa.set(key, snapshot.map(n => ({ ...n })));

        const mapaP = new Map(state._posHistorial);
        mapaP.set(key, pos + 1);

        set({ notasPorCanal: mapa, _posHistorial: mapaP });
    },

    puedeDeshacer: (patronId, canalId) => {
        const key = clave(patronId, canalId);
        const pos = get()._posHistorial.get(key) ?? -1;
        return pos >= 0;
    },

    puedeRehacer: (patronId, canalId) => {
        const key = clave(patronId, canalId);
        const state = get();
        const historial = state._historial.get(key);
        const pos = state._posHistorial.get(key) ?? -1;
        if (!historial) return false;
        return pos + 1 < historial.length;
    },
}));
