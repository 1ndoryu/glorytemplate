/*
 * mezcladorStore — Estado global del Mezclador (Mini DAW).
 * Orquestador delgado que combina slices de acciones especializadas.
 * Refactorizado C255: 931→~150 líneas (lógica extraída a accionesHistorial,
 * accionesSeleccion, accionesBloques, accionesCargaAudio).
 */

import { create } from 'zustand';
import type { SnapResolucion } from '../types/mezclador';
import { CONSTANTES_MEZCLADOR, EVENTO_REPROGRAMAR_AUDIO, ZOOM_MIN, ZOOM_MAX, ZOOM_PASO, RELLENO_COMPASES, COMPASES_VISIBLES_MIN } from '../types/mezclador';
import { compasesASegundos, segundosACompases } from '../utils/compasUtils';
import { motorAudio } from '../services/motorAudioService';

import type { MezcladorState } from './tiposMezcladorStore';
import { LS_KEY_BPM } from './tiposMezcladorStore';
import { crearAccionesHistorial } from './accionesHistorial';
import { crearAccionesSeleccion } from './accionesSeleccion';
import { crearAccionesBloques } from './accionesBloques';
import { crearAccionesCargaAudio, crearPistaVacia } from './accionesCargaAudio';
import { crearAccionesPista } from './accionesPista';

const leerBpmGuardado = (): number => {
    try {
        const val = localStorage.getItem(LS_KEY_BPM);
        return val ? Number(val) : CONSTANTES_MEZCLADOR.BPM_DEFAULT;
    } catch { return CONSTANTES_MEZCLADOR.BPM_DEFAULT; }
};

export const useMezcladorStore = create<MezcladorState>((set, get) => ({
    /* Estado inicial */
    abierto: false,
    pistas: Array.from({ length: 20 }, (_, i) => crearPistaVacia(`Pista ${i + 1}`)),
    bpmProyecto: leerBpmGuardado(),
    compasProyecto: { ...CONSTANTES_MEZCLADOR.COMPAS_DEFAULT },
    totalCompases: CONSTANTES_MEZCLADOR.COMPASES_DEFAULT,
    reproduciendo: false,
    tiempoActual: 0,
    posicionCursor: 0,
    exportando: false,
    cargandoBuffers: new Set<string>(),
    modoCortarActivo: false,
    snapResolucion: 'beat' as SnapResolucion,
    nivelZoom: 1,
    /* C296: Total extendido congelado durante resize */
    _totalExtendidoFijado: null,

    /* Slices de acciones especializadas */
    ...crearAccionesHistorial(set, get),
    ...crearAccionesSeleccion(set, get),
    ...crearAccionesBloques(set, get),
    ...crearAccionesCargaAudio(set, get),

    /* Lifecycle UI */
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

    /* Proyecto — BPM con reprogramación en tiempo real */
    setBpm: (bpm) => {
        const clamp = Math.max(40, Math.min(300, bpm));
        try { localStorage.setItem(LS_KEY_BPM, String(clamp)); } catch {}

        const { reproduciendo, tiempoActual, bpmProyecto: bpmAnterior, compasProyecto, pistas } = get();

        /*
         * C317: Recalcular playbackRate de todos los bloques proporcionalmente
         * al cambio de BPM para mantener sync visual ondas-timeline.
         * ratio > 1 = más rápido, ratio < 1 = más lento.
         */
        const ratio = clamp / bpmAnterior;
        const pistasActualizadas = pistas.map(p => ({
            ...p,
            bloques: p.bloques.map(b => ({
                ...b,
                playbackRate: Math.max(0.25, Math.min(4, b.playbackRate * ratio)),
                playbackRateOriginal: Math.max(0.25, Math.min(4, b.playbackRateOriginal * ratio)),
            })),
        }));

        set({ bpmProyecto: clamp, pistas: pistasActualizadas });

        if (reproduciendo) {
            const posicionCompases = segundosACompases(tiempoActual, bpmAnterior, compasProyecto);
            window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO, {
                detail: { posicionCompases }
            }));
        }
    },
    setCompas: (compas) => set({ compasProyecto: compas }),
    setTotalCompases: (total) => set({
        totalCompases: Math.max(1, Math.min(CONSTANTES_MEZCLADOR.COMPASES_MAX, total))
    }),
    agregarCompas: () => {
        const { totalCompases } = get();
        if (totalCompases < CONSTANTES_MEZCLADOR.COMPASES_MAX) {
            set({ totalCompases: totalCompases + 1 });
        }
    },
    quitarCompas: () => {
        const { totalCompases } = get();
        if (totalCompases > 1) set({ totalCompases: totalCompases - 1 });
    },

    /* Pistas */
    agregarPista: () => {
        get()._guardarSnapshot();
        const { pistas } = get();
        if (pistas.length >= CONSTANTES_MEZCLADOR.PISTAS_MAX) return;
        const nuevaPista = crearPistaVacia(`Pista ${pistas.length + 1}`);
        set({ pistas: [...pistas, nuevaPista] });
    },
    eliminarPista: (pistaId) => {
        get()._guardarSnapshot();
        set(prev => ({ pistas: prev.pistas.filter(p => p.id !== pistaId) }));
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
        motorAudio.setSilenciarPista(pistaId, nuevoSil, pista.volumen);
    },

    /* C297: Acciones de pista extraídas a slice */
    ...crearAccionesPista(set, get),

    /* Reproduccion */
    setReproduciendo: (valor) => set({ reproduciendo: valor }),
    setTiempoActual: (tiempo) => set({ tiempoActual: tiempo }),
    setPosicionCursor: (posicion) => set({ posicionCursor: posicion }),
    setExportando: (valor) => set({ exportando: valor }),
    toggleModoCortar: () => set(prev => ({ modoCortarActivo: !prev.modoCortarActivo })),

    /* Zoom y snap */
    setSnapResolucion: (snap) => set({ snapResolucion: snap }),
    setNivelZoom: (zoom) => set({ nivelZoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),
    zoomIn: () => {
        const { nivelZoom } = get();
        /* C285: Paso proporcional — 10% del nivel actual para zoom natural */
        const paso = Math.max(ZOOM_PASO, nivelZoom * 0.1);
        const totalExt = get().obtenerTotalExtendido();
        const maxZ = Math.max(4, totalExt / COMPASES_VISIBLES_MIN);
        set({ nivelZoom: Math.min(maxZ, Math.round((nivelZoom + paso) * 100) / 100) });
    },
    zoomOut: () => {
        const { nivelZoom } = get();
        const paso = Math.max(ZOOM_PASO, nivelZoom * 0.1);
        set({ nivelZoom: Math.max(ZOOM_MIN, Math.round((nivelZoom - paso) * 100) / 100) });
    },
    obtenerSnapCompas: () => {
        const { snapResolucion, compasProyecto } = get();
        if (snapResolucion === 'off') return null;
        if (snapResolucion === 'bar') return 1;
        const beatFraccion = 1 / compasProyecto.numerador;
        if (snapResolucion === 'beat') return beatFraccion;
        if (snapResolucion === '1/2') return beatFraccion / 2;
        if (snapResolucion === '1/4') return beatFraccion / 4;
        if (snapResolucion === '1/6') return beatFraccion / 6;
        return beatFraccion;
    },

    /* Proyecto — limpieza y queries */
    limpiarProyecto: () => {
        get()._guardarSnapshot();
        motorAudio.detenerTodo();
        /* Liberar caches de audio al limpiar proyecto */
        motorAudio.limpiarCache();
        set({
            pistas: Array.from({ length: 20 }, (_, i) => crearPistaVacia(`Pista ${i + 1}`)),
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
    obtenerTodosBloques: () => get().pistas.flatMap(p => p.bloques),

    /*
     * C285+C315: Total extendido = max(totalCompases, último bloque + relleno)
     * C296: Si hay un valor fijado (durante resize), devolver exactamente ese
     * valor para evitar que el minimap se mueva al redimensionar bloques.
     */
    obtenerTotalExtendido: () => {
        const state = get();
        const fijado = state._totalExtendidoFijado;
        if (fijado !== null) return fijado;

        const { pistas, totalCompases } = state;
        let ultimoFin = 0;
        for (const pista of pistas) {
            for (const bloque of pista.bloques) {
                const fin = bloque.compasInicio + bloque.duracionCompases;
                if (fin > ultimoFin) ultimoFin = fin;
            }
        }
        return Math.max(totalCompases, Math.ceil(ultimoFin) + RELLENO_COMPASES);
    },

    /* C296: Fijar total extendido al valor actual (llamar al iniciar resize) */
    fijarTotalExtendido: () => {
        const total = get().obtenerTotalExtendido();
        set({ _totalExtendidoFijado: total });
    },

    /* C296: Desfijar total extendido (llamar al terminar resize) */
    desfijarTotalExtendido: () => {
        set({ _totalExtendidoFijado: null });
    },
}));
