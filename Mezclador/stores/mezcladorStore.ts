/*
 * mezcladorStore — Estado global del Mezclador (Mini DAW)
 * Gestiona pistas, bloques, reproducción y configuración.
 */

import { create } from 'zustand';
import type { SampleResumen } from '@app/types';
import type { BloqueMezclador, PistaMezclador, Compas } from '../types/mezclador';
import { CONSTANTES_MEZCLADOR, COLORES_BLOQUE } from '../types/mezclador';
import { inferirCompas, compasesASegundos } from '../utils/compasUtils';
import { generarIdBloque, generarIdPista, extraerPeaks } from '../utils/audioBufferUtils';
import { motorAudio } from '../services/motorAudioService';

const LS_KEY_BPM = 'kamples:mezclador:bpm';

const leerBpmGuardado = (): number => {
    try {
        const val = localStorage.getItem(LS_KEY_BPM);
        return val ? Number(val) : CONSTANTES_MEZCLADOR.BPM_DEFAULT;
    } catch { return CONSTANTES_MEZCLADOR.BPM_DEFAULT; }
};

interface MezcladorState {
    abierto: boolean;
    pistas: PistaMezclador[];
    bpmProyecto: number;
    compasProyecto: Compas;
    totalCompases: number;
    reproduciendo: boolean;
    tiempoActual: number;
    posicionCursor: number;
    exportando: boolean;
    cargandoBuffers: Set<string>;

    abrir: () => void;
    cerrar: () => void;
    toggle: () => void;

    setBpm: (bpm: number) => void;
    setCompas: (compas: Compas) => void;
    setTotalCompases: (total: number) => void;
    agregarCompas: () => void;
    quitarCompas: () => void;

    agregarPista: () => void;
    eliminarPista: (pistaId: string) => void;
    setVolumenPista: (pistaId: string, volumen: number) => void;
    toggleSilenciarPista: (pistaId: string) => void;

    agregarSample: (sample: SampleResumen, pistaId?: string) => Promise<void>;
    moverBloque: (bloqueId: string, pistaIdDestino: string, compasInicio: number) => void;
    eliminarBloque: (bloqueId: string) => void;

    setReproduciendo: (valor: boolean) => void;
    setTiempoActual: (tiempo: number) => void;
    setPosicionCursor: (posicion: number) => void;
    setExportando: (valor: boolean) => void;

    limpiarProyecto: () => void;
    obtenerDuracionTotal: () => number;
    obtenerTodosBloques: () => BloqueMezclador[];
}

const crearPistaVacia = (nombre?: string): PistaMezclador => ({
    id: generarIdPista(),
    nombre: nombre ?? 'Pista',
    volumen: 1,
    silenciada: false,
    bloques: [],
});

export const useMezcladorStore = create<MezcladorState>((set, get) => ({
    abierto: false,
    pistas: [crearPistaVacia('Pista 1')],
    bpmProyecto: leerBpmGuardado(),
    compasProyecto: { ...CONSTANTES_MEZCLADOR.COMPAS_DEFAULT },
    totalCompases: CONSTANTES_MEZCLADOR.COMPASES_DEFAULT,
    reproduciendo: false,
    tiempoActual: 0,
    posicionCursor: 0,
    exportando: false,
    cargandoBuffers: new Set<string>(),

    abrir: () => set({ abierto: true }),
    cerrar: () => {
        motorAudio.detenerTodo();
        set({ abierto: false, reproduciendo: false });
    },
    toggle: () => {
        const { abierto } = get();
        if (abierto) {
            motorAudio.detenerTodo();
            set({ abierto: false, reproduciendo: false });
        } else {
            set({ abierto: true });
        }
    },

    setBpm: (bpm) => {
        const clamp = Math.max(40, Math.min(300, bpm));
        try { localStorage.setItem(LS_KEY_BPM, String(clamp)); } catch {}
        set({ bpmProyecto: clamp });
    },
    setCompas: (compas) => set({ compasProyecto: compas }),
    setTotalCompases: (total) => set({ totalCompases: Math.max(1, Math.min(CONSTANTES_MEZCLADOR.COMPASES_MAX, total)) }),
    agregarCompas: () => {
        const { totalCompases } = get();
        if (totalCompases < CONSTANTES_MEZCLADOR.COMPASES_MAX) {
            set({ totalCompases: totalCompases + 1 });
        }
    },
    quitarCompas: () => {
        const { totalCompases } = get();
        if (totalCompases > 1) {
            set({ totalCompases: totalCompases - 1 });
        }
    },

    agregarPista: () => {
        const { pistas } = get();
        if (pistas.length >= CONSTANTES_MEZCLADOR.PISTAS_MAX) return;
        const nuevaPista = crearPistaVacia(`Pista ${pistas.length + 1}`);
        set({ pistas: [...pistas, nuevaPista] });
    },
    eliminarPista: (pistaId) => {
        set(prev => ({
            pistas: prev.pistas.filter(p => p.id !== pistaId),
        }));
    },
    setVolumenPista: (pistaId, volumen) => {
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId ? { ...p, volumen: Math.max(0, Math.min(1, volumen)) } : p
            ),
        }));
        motorAudio.setVolumenPista(pistaId, volumen);
    },
    toggleSilenciarPista: (pistaId) => {
        const pista = get().pistas.find(p => p.id === pistaId);
        if (!pista) return;
        const nuevoSil = !pista.silenciada;
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === pistaId ? { ...p, silenciada: nuevoSil } : p
            ),
        }));
        motorAudio.setSilenciarPista(pistaId, nuevoSil);
    },

    agregarSample: async (sample, pistaId) => {
        const { pistas, bpmProyecto, compasProyecto, cargandoBuffers } = get();

        /* Determinar pista destino (primera con espacio o crear nueva) */
        let pistaDestinoId = pistaId
            ?? pistas.find(p => p.bloques.length === 0)?.id
            ?? pistas[0]?.id;

        if (!pistaDestinoId) {
            const nuevaPista = crearPistaVacia(`Pista ${pistas.length + 1}`);
            pistaDestinoId = nuevaPista.id;
            set(prev => ({ pistas: [...prev.pistas, nuevaPista] }));
        }

        const bloqueId = generarIdBloque();
        const urlAudio = sample.rutaPreview;
        if (!urlAudio) return;

        /* Marcar como cargando */
        const nuevoCargando = new Set(cargandoBuffers);
        nuevoCargando.add(bloqueId);
        set({ cargandoBuffers: nuevoCargando });

        try {
            /* Cargar audio buffer */
            const buffer = await motorAudio.cargarBuffer(urlAudio, String(sample.id));

            /* Inferir compás y playbackRate */
            const bpmSample = sample.bpm ?? bpmProyecto;
            const info = inferirCompas(buffer.duration, bpmSample, bpmProyecto, compasProyecto);

            /*
             * Re-leer pistas desde estado actual (puede haber cambiado durante await).
             * Esto evita la race condition si el usuario agrega otro sample en paralelo.
             */
            const pistasActuales = get().pistas;
            const pistaActual = pistasActuales.find(p => p.id === pistaDestinoId);
            const bloquesPista = pistaActual?.bloques ?? [];

            /* Encontrar primera posición libre en la pista */
            let compasInicio = 0;
            for (const b of bloquesPista) {
                const fin = b.compasInicio + b.duracionCompases;
                if (fin > compasInicio) compasInicio = fin;
            }

            /* Extraer peaks para mini waveform */
            const waveformPeaks = extraerPeaks(buffer, Math.max(30, info.duracionCompases * 20));

            /* Color según tipo */
            const tipoSample = sample.tipo?.toLowerCase() ?? 'default';
            const color = COLORES_BLOQUE[tipoSample] ?? COLORES_BLOQUE.default;

            const nuevoBloque: BloqueMezclador = {
                id: bloqueId,
                pistaId: pistaDestinoId,
                sample,
                audioBuffer: buffer,
                compasInicio,
                duracionCompases: info.duracionCompases,
                volumen: 1,
                playbackRate: info.playbackRate,
                silenciado: false,
                color,
                waveformPeaks,
            };

            /* Expandir totalCompases si es necesario */
            const finBloque = compasInicio + info.duracionCompases;

            set(prev => ({
                pistas: prev.pistas.map(p =>
                    p.id === pistaDestinoId
                        ? { ...p, bloques: [...p.bloques, nuevoBloque] }
                        : p
                ),
                totalCompases: Math.max(prev.totalCompases, finBloque),
            }));
        } catch (error) {
            console.error('[Mezclador] Error cargando sample:', error);
        } finally {
            /* Quitar de cargando */
            set(prev => {
                const nuevo = new Set(prev.cargandoBuffers);
                nuevo.delete(bloqueId);
                return { cargandoBuffers: nuevo };
            });
        }
    },

    moverBloque: (bloqueId, pistaIdDestino, compasInicio) => {
        set(prev => {
            let bloque: BloqueMezclador | null = null;

            /* Encontrar y remover el bloque de su pista actual */
            const pistasActualizadas = prev.pistas.map(p => {
                const idx = p.bloques.findIndex(b => b.id === bloqueId);
                if (idx !== -1) {
                    bloque = { ...p.bloques[idx] };
                    return { ...p, bloques: p.bloques.filter(b => b.id !== bloqueId) };
                }
                return p;
            });

            if (!bloque) return prev;

            /* Colocar en la pista destino */
            (bloque as BloqueMezclador).pistaId = pistaIdDestino;
            (bloque as BloqueMezclador).compasInicio = Math.max(0, compasInicio);

            return {
                pistas: pistasActualizadas.map(p =>
                    p.id === pistaIdDestino
                        ? { ...p, bloques: [...p.bloques, bloque!] }
                        : p
                ),
            };
        });
    },

    eliminarBloque: (bloqueId) => {
        set(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.filter(b => b.id !== bloqueId),
            })),
        }));
    },

    setReproduciendo: (valor) => set({ reproduciendo: valor }),
    setTiempoActual: (tiempo) => set({ tiempoActual: tiempo }),
    setPosicionCursor: (posicion) => set({ posicionCursor: posicion }),
    setExportando: (valor) => set({ exportando: valor }),

    limpiarProyecto: () => {
        motorAudio.detenerTodo();
        set({
            pistas: [crearPistaVacia('Pista 1')],
            totalCompases: CONSTANTES_MEZCLADOR.COMPASES_DEFAULT,
            reproduciendo: false,
            tiempoActual: 0,
            posicionCursor: 0,
        });
    },

    obtenerDuracionTotal: () => {
        const { totalCompases, bpmProyecto, compasProyecto } = get();
        return compasesASegundos(totalCompases, bpmProyecto, compasProyecto);
    },

    obtenerTodosBloques: () => {
        return get().pistas.flatMap(p => p.bloques);
    },
}));
