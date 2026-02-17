/*
 * mezcladorStore — Estado global del Mezclador (Mini DAW)
 * Gestiona pistas, bloques, reproducción y configuración.
 */

import { create } from 'zustand';
import type { SampleResumen } from '@app/types';
import type { BloqueMezclador, PistaMezclador, Compas, ConfigBloque, SnapResolucion } from '../types/mezclador';
import { CONSTANTES_MEZCLADOR, COLORES_BLOQUE, EVENTO_REPROGRAMAR_AUDIO, NIVELES_ZOOM } from '../types/mezclador';
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

/* C224: Snapshot para historial de undo/redo */
interface SnapshotMezclador {
    pistas: PistaMezclador[];
    totalCompases: number;
}

const MAX_HISTORIAL = 30;

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
    modoCortarActivo: boolean;
    snapResolucion: SnapResolucion;
    nivelZoom: number;

    /* C224: Historial undo/redo */
    _historial: SnapshotMezclador[];
    _posicionHistorial: number;
    _guardarSnapshot: () => void;
    deshacer: () => void;
    rehacer: () => void;
    puedeDeshacer: () => boolean;
    puedeRehacer: () => boolean;

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
    agregarAudioLocal: (archivo: File, pistaId?: string) => Promise<void>;
    moverBloque: (bloqueId: string, pistaIdDestino: string, compasInicio: number) => void;
    eliminarBloque: (bloqueId: string) => void;
    setDuracionBloque: (bloqueId: string, nuevaDuracion: number) => void;
    duplicarBloque: (bloqueId: string) => void;
    dividirBloque: (bloqueId: string, posicionCompas: number) => void;
    actualizarConfigBloque: (bloqueId: string, config: ConfigBloque) => void;

    setReproduciendo: (valor: boolean) => void;
    setTiempoActual: (tiempo: number) => void;
    setPosicionCursor: (posicion: number) => void;
    setExportando: (valor: boolean) => void;
    toggleModoCortar: () => void;
    setSnapResolucion: (snap: SnapResolucion) => void;
    setNivelZoom: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    obtenerSnapCompas: () => number | null;

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
    modoCortarActivo: false,
    snapResolucion: 'beat' as SnapResolucion,
    nivelZoom: 1,

    /* C224: Historial undo/redo */
    _historial: [],
    _posicionHistorial: -1,

    _guardarSnapshot: () => {
        const { pistas, totalCompases, _historial, _posicionHistorial } = get();
        /* Descartar historial futuro si hicimos undo y luego una acción nueva */
        const histRecortado = _historial.slice(0, _posicionHistorial + 1);
        const nuevoSnapshot: SnapshotMezclador = { pistas, totalCompases };
        const nuevoHistorial = [...histRecortado, nuevoSnapshot].slice(-MAX_HISTORIAL);
        set({
            _historial: nuevoHistorial,
            _posicionHistorial: nuevoHistorial.length - 1,
        });
    },

    deshacer: () => {
        const { _historial, _posicionHistorial } = get();
        if (_posicionHistorial <= 0) return;
        const anterior = _historial[_posicionHistorial - 1];
        if (!anterior) return;
        set({
            pistas: anterior.pistas,
            totalCompases: anterior.totalCompases,
            _posicionHistorial: _posicionHistorial - 1,
        });
        if (get().reproduciendo) {
            window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
        }
    },

    rehacer: () => {
        const { _historial, _posicionHistorial } = get();
        if (_posicionHistorial >= _historial.length - 1) return;
        const siguiente = _historial[_posicionHistorial + 1];
        if (!siguiente) return;
        set({
            pistas: siguiente.pistas,
            totalCompases: siguiente.totalCompases,
            _posicionHistorial: _posicionHistorial + 1,
        });
        if (get().reproduciendo) {
            window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
        }
    },

    puedeDeshacer: () => get()._posicionHistorial > 0,
    puedeRehacer: () => get()._posicionHistorial < get()._historial.length - 1,

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
        get()._guardarSnapshot();
        const { pistas } = get();
        if (pistas.length >= CONSTANTES_MEZCLADOR.PISTAS_MAX) return;
        const nuevaPista = crearPistaVacia(`Pista ${pistas.length + 1}`);
        set({ pistas: [...pistas, nuevaPista] });
    },
    eliminarPista: (pistaId) => {
        get()._guardarSnapshot();
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
                invertido: false,
                fadeIn: 0,
                fadeOut: 0,
                recorteInicio: 0,
                recorteFin: null,
                normalizado: false,
            };

            /* Expandir totalCompases si es necesario */
            const finBloque = compasInicio + info.duracionCompases;

            get()._guardarSnapshot();
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

    /*
     * C208: Agregar un audio local subido desde PC.
     * Crea un pseudo-SampleResumen con datos mínimos del archivo.
     */
    agregarAudioLocal: async (archivo, pistaId) => {
        const { pistas, bpmProyecto, compasProyecto, cargandoBuffers } = get();

        /* Determinar pista destino */
        let pistaDestinoId = pistaId
            ?? pistas.find(p => p.bloques.length === 0)?.id
            ?? pistas[0]?.id;

        if (!pistaDestinoId) {
            const nuevaPista = crearPistaVacia(`Pista ${pistas.length + 1}`);
            pistaDestinoId = nuevaPista.id;
            set(prev => ({ pistas: [...prev.pistas, nuevaPista] }));
        }

        const bloqueId = generarIdBloque();
        const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        /* Marcar como cargando */
        const nuevoCargando = new Set(cargandoBuffers);
        nuevoCargando.add(bloqueId);
        set({ cargandoBuffers: nuevoCargando });

        try {
            /* Leer archivo como ArrayBuffer */
            const arrayBuffer = await archivo.arrayBuffer();
            const buffer = await motorAudio.decodificarBufferLocal(arrayBuffer, localId);

            /* Pseudo-SampleResumen para archivos locales */
            const nombreLimpio = archivo.name.replace(/\.[^.]+$/, '');
            const pseudoSample: SampleResumen = {
                id: -Date.now(),
                titulo: nombreLimpio,
                slug: nombreLimpio.toLowerCase().replace(/\s+/g, '-'),
                bpm: bpmProyecto,
                key: null,
                escala: null,
                duracion: buffer.duration,
                tags: ['local'],
                tipo: 'loop' as SampleResumen['tipo'],
                esPremium: false,
                precio: null,
                rutaPreview: '',
                rutaWaveform: '',
                imagenUrl: null,
                totalDescargas: 0,
                totalLikes: 0,
                totalReproducciones: 0,
                metadata: null,
                creador: {
                    id: 0,
                    username: 'local',
                    nombreVisible: 'Archivo local',
                    avatarUrl: null,
                    verificado: false,
                },
            };

            const info = inferirCompas(buffer.duration, bpmProyecto, bpmProyecto, compasProyecto);

            /* Re-leer pistas actuales */
            const pistasActuales = get().pistas;
            const pistaActual = pistasActuales.find(p => p.id === pistaDestinoId);
            const bloquesPista = pistaActual?.bloques ?? [];

            let compasInicio = 0;
            for (const b of bloquesPista) {
                const fin = b.compasInicio + b.duracionCompases;
                if (fin > compasInicio) compasInicio = fin;
            }

            const waveformPeaks = extraerPeaks(buffer, Math.max(30, info.duracionCompases * 20));

            const nuevoBloque: BloqueMezclador = {
                id: bloqueId,
                pistaId: pistaDestinoId,
                sample: pseudoSample,
                audioBuffer: buffer,
                compasInicio,
                duracionCompases: info.duracionCompases,
                volumen: 1,
                playbackRate: info.playbackRate,
                silenciado: false,
                color: COLORES_BLOQUE.default,
                waveformPeaks,
                invertido: false,
                fadeIn: 0,
                fadeOut: 0,
                recorteInicio: 0,
                recorteFin: null,
                normalizado: false,
            };

            const finBloque = compasInicio + info.duracionCompases;

            get()._guardarSnapshot();
            set(prev => ({
                pistas: prev.pistas.map(p =>
                    p.id === pistaDestinoId
                        ? { ...p, bloques: [...p.bloques, nuevoBloque] }
                        : p
                ),
                totalCompases: Math.max(prev.totalCompases, finBloque),
            }));
        } catch (error) {
            console.error('[Mezclador] Error cargando audio local:', error);
        } finally {
            set(prev => {
                const nuevo = new Set(prev.cargandoBuffers);
                nuevo.delete(bloqueId);
                return { cargandoBuffers: nuevo };
            });
        }
    },

    moverBloque: (bloqueId, pistaIdDestino, compasInicio) => {
        get()._guardarSnapshot();
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
        get()._guardarSnapshot();
        set(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.filter(b => b.id !== bloqueId),
            })),
        }));
    },

    /*
     * C204: Cambiar duración de un bloque (stretch/pitch).
     * Al cambiar duracionCompases, recalcular playbackRate para
     * que el buffer encaje en la nueva duración visual.
     * C213: Reprogramar audio en tiempo real si está reproduciendo.
     */
    setDuracionBloque: (bloqueId, nuevaDuracion) => {
        const { bpmProyecto, compasProyecto } = get();
        set(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.map(b => {
                    if (b.id !== bloqueId || !b.audioBuffer) return b;
                    const durClamped = Math.max(0.25, nuevaDuracion);
                    /*
                     * playbackRate = buffer.duration / duracionWallClock
                     * duracionWallClock = durClamped * duracionCompas
                     */
                    const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
                    const durWall = durClamped * durCompas;
                    const nuevoRate = Math.max(0.25, Math.min(4, b.audioBuffer.duration / durWall));
                    return { ...b, duracionCompases: durClamped, playbackRate: nuevoRate };
                }),
            })),
        }));
        /* C213: Notificar al motor de audio para reprogramar si está sonando */
        if (get().reproduciendo) {
            window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
        }
    },

    /*
     * C215: Duplicar un bloque existente.
     * Crea una copia idéntica justo después del bloque original.
     */
    duplicarBloque: (bloqueId) => {
        get()._guardarSnapshot();
        set(prev => {
            let bloqueOriginal: BloqueMezclador | null = null;
            let pistaId = '';

            for (const pista of prev.pistas) {
                const encontrado = pista.bloques.find(b => b.id === bloqueId);
                if (encontrado) {
                    bloqueOriginal = encontrado;
                    pistaId = pista.id;
                    break;
                }
            }

            if (!bloqueOriginal) return prev;

            const nuevaPosicion = bloqueOriginal.compasInicio + bloqueOriginal.duracionCompases;
            const copia: BloqueMezclador = {
                ...bloqueOriginal,
                id: generarIdBloque(),
                compasInicio: nuevaPosicion,
            };

            const finBloque = nuevaPosicion + copia.duracionCompases;

            return {
                pistas: prev.pistas.map(p =>
                    p.id === pistaId
                        ? { ...p, bloques: [...p.bloques, copia] }
                        : p
                ),
                totalCompases: Math.max(prev.totalCompases, finBloque),
            };
        });
    },

    /*
     * C214: Dividir un bloque en dos en una posición dada (en compases).
     * El primer bloque conserva el inicio, el segundo arranca desde la posición de corte.
     */
    dividirBloque: (bloqueId, posicionCompas) => {
        get()._guardarSnapshot();
        const { bpmProyecto, compasProyecto } = get();
        set(prev => {
            let bloqueOriginal: BloqueMezclador | null = null;
            let pistaId = '';

            for (const pista of prev.pistas) {
                const encontrado = pista.bloques.find(b => b.id === bloqueId);
                if (encontrado) {
                    bloqueOriginal = encontrado;
                    pistaId = pista.id;
                    break;
                }
            }

            if (!bloqueOriginal || !bloqueOriginal.audioBuffer) return prev;

            /* La posición debe estar dentro del bloque */
            const posRelativa = posicionCompas - bloqueOriginal.compasInicio;
            if (posRelativa <= 0.1 || posRelativa >= bloqueOriginal.duracionCompases - 0.1) {
                return prev;
            }

            /* Calcular recorte en segundos para el segundo bloque */
            const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
            const tiempoCorte = posRelativa * durCompas * bloqueOriginal.playbackRate;
            const recorteInicioOriginal = bloqueOriginal.recorteInicio ?? 0;

            /*
             * C228: Dividir waveformPeaks proporcionalmente.
             * El ratio de corte es la posición relativa dividida entre la duración total.
             */
            const ratioPeaks = posRelativa / bloqueOriginal.duracionCompases;
            const totalPeaks = bloqueOriginal.waveformPeaks.length;
            const cortePeaks = Math.round(totalPeaks * ratioPeaks);

            const bloqueA: BloqueMezclador = {
                ...bloqueOriginal,
                duracionCompases: posRelativa,
                waveformPeaks: bloqueOriginal.waveformPeaks.slice(0, cortePeaks),
            };

            const bloqueB: BloqueMezclador = {
                ...bloqueOriginal,
                id: generarIdBloque(),
                compasInicio: posicionCompas,
                duracionCompases: bloqueOriginal.duracionCompases - posRelativa,
                recorteInicio: recorteInicioOriginal + tiempoCorte,
                waveformPeaks: bloqueOriginal.waveformPeaks.slice(cortePeaks),
            };

            return {
                pistas: prev.pistas.map(p =>
                    p.id === pistaId
                        ? {
                            ...p,
                            bloques: p.bloques.map(b =>
                                b.id === bloqueId ? bloqueA : b
                            ).concat(bloqueB),
                        }
                        : p
                ),
            };
        });

        if (get().reproduciendo) {
            window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
        }
    },

    /*
     * C215: Actualizar configuración avanzada de un bloque.
     * Permite cambiar propiedades como invertido, fade, recorte, etc.
     */
    actualizarConfigBloque: (bloqueId, config) => {
        set(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.map(b => {
                    if (b.id !== bloqueId) return b;
                    return { ...b, ...config };
                }),
            })),
        }));

        if (get().reproduciendo) {
            window.dispatchEvent(new CustomEvent(EVENTO_REPROGRAMAR_AUDIO));
        }
    },

    setReproduciendo: (valor) => set({ reproduciendo: valor }),
    setTiempoActual: (tiempo) => set({ tiempoActual: tiempo }),
    setPosicionCursor: (posicion) => set({ posicionCursor: posicion }),
    setExportando: (valor) => set({ exportando: valor }),
    toggleModoCortar: () => set(prev => ({ modoCortarActivo: !prev.modoCortarActivo })),

    /* C216: Snap setting */
    setSnapResolucion: (snap) => set({ snapResolucion: snap }),

    /*
     * C216: Obtener fracción de compás según la resolución de snap actual.
     * Retorna null si snap='off' (libre, sin cuadrícula).
     */
    obtenerSnapCompas: () => {
        const { snapResolucion, compasProyecto } = get();
        if (snapResolucion === 'off') return null;
        if (snapResolucion === 'bar') return 1;
        const beatsPerBar = compasProyecto.numerador;
        const beatFraccion = 1 / beatsPerBar;
        if (snapResolucion === 'beat') return beatFraccion;
        if (snapResolucion === '1/2') return beatFraccion / 2;
        if (snapResolucion === '1/4') return beatFraccion / 4;
        if (snapResolucion === '1/6') return beatFraccion / 6;
        return beatFraccion;
    },

    /* C217: Zoom */
    setNivelZoom: (zoom) => set({ nivelZoom: Math.max(0.25, Math.min(4, zoom)) }),
    zoomIn: () => {
        const { nivelZoom } = get();
        const idx = NIVELES_ZOOM.findIndex(z => z >= nivelZoom);
        const siguiente = idx >= 0 && idx < NIVELES_ZOOM.length - 1
            ? NIVELES_ZOOM[idx + 1]
            : NIVELES_ZOOM[NIVELES_ZOOM.length - 1];
        set({ nivelZoom: siguiente });
    },
    zoomOut: () => {
        const { nivelZoom } = get();
        const idx = NIVELES_ZOOM.findIndex(z => z >= nivelZoom);
        const anterior = idx > 0
            ? NIVELES_ZOOM[idx - 1]
            : NIVELES_ZOOM[0];
        set({ nivelZoom: anterior });
    },

    limpiarProyecto: () => {
        get()._guardarSnapshot();
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
