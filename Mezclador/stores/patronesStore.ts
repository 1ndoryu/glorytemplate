/*
 * patronesStore — Gestión de patrones, canales y steps del Channel Rack.
 * Cada patrón contiene canales con step grids independientes.
 * Separado de mezcladorStore para SRP — se comunican vía getState().
 */

import { create } from 'zustand';
import type { Patron, CanalRack, Paso } from '../types/mezclador';
import {
    CONSTANTES_CHANNEL_RACK,
    COLORES_PATRON,
    crearPasoVacio,
} from '../types/mezclador';

/* Generar ID único */
const generarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* Crear un canal vacío con N pasos */
const crearCanalVacio = (nombre: string, totalPasos: number, color?: string): CanalRack => ({
    id: generarId(),
    nombre,
    color: color ?? COLORES_PATRON[Math.floor(Math.random() * COLORES_PATRON.length)],
    sampleId: null,
    audioBuffer: null,
    rutaAudio: null,
    volumen: 1,
    pan: 0,
    silenciado: false,
    solo: false,
    mixerInsertId: 1,
    pasos: Array.from({ length: totalPasos }, () => crearPasoVacio()),
    tipo: 'oneshot',
});

/* Crear un patrón vacío */
const crearPatronVacio = (nombre: string, indice: number): Patron => ({
    id: generarId(),
    nombre,
    color: COLORES_PATRON[indice % COLORES_PATRON.length],
    canales: [],
    totalPasos: CONSTANTES_CHANNEL_RACK.PASOS_DEFAULT,
    pasosVisibles: CONSTANTES_CHANNEL_RACK.PASOS_DEFAULT,
    subdivisionPaso: CONSTANTES_CHANNEL_RACK.SUBDIVISION_DEFAULT,
    swing: CONSTANTES_CHANNEL_RACK.SWING_DEFAULT,
    loop: true,
    creadoEn: Date.now(),
    modificadoEn: Date.now(),
});

export interface PatronesState {
    patrones: Patron[];
    patronActivo: string | null;
    modoReproduccion: 'pat' | 'song';

    /* CRUD Patrones */
    crearPatron: (nombre?: string) => string;
    eliminarPatron: (id: string) => void;
    renombrarPatron: (id: string, nombre: string) => void;
    duplicarPatron: (id: string) => string;
    setPatronActivo: (id: string) => void;

    /* Canales */
    agregarCanal: (patronId: string, nombre?: string, audioBuffer?: AudioBuffer, rutaAudio?: string, sampleId?: string) => void;
    eliminarCanal: (patronId: string, canalId: string) => void;
    moverCanal: (patronId: string, canalId: string, direccion: 'up' | 'down') => void;
    clonarCanal: (patronId: string, canalId: string) => void;
    actualizarCanal: (patronId: string, canalId: string, cambios: Partial<CanalRack>) => void;

    /* Steps */
    togglePaso: (patronId: string, canalId: string, pasoIndex: number) => void;
    setPaso: (patronId: string, canalId: string, pasoIndex: number, paso: Partial<Paso>) => void;
    setTotalPasos: (patronId: string, total: number) => void;
    limpiarPasos: (patronId: string, canalId: string) => void;

    /* Config */
    setSwing: (patronId: string, swing: number) => void;
    toggleLoop: (patronId: string) => void;
    setModoReproduccion: (modo: 'pat' | 'song') => void;

    /* Queries */
    obtenerPatron: (id: string) => Patron | undefined;
    obtenerPatronActivo: () => Patron | undefined;
    obtenerDuracionPatronCompases: (id: string) => number;
}

/* Helper: actualizar un patrón en el array con timestamp */
const actualizarPatron = (
    patrones: Patron[],
    patronId: string,
    fn: (p: Patron) => Patron
): Patron[] =>
    patrones.map(p =>
        p.id === patronId ? fn({ ...p, modificadoEn: Date.now() }) : p
    );

export const usePatronesStore = create<PatronesState>((set, get) => {
    /* Inicializar con un patrón por defecto */
    const patronInicial = crearPatronVacio('Pattern 1', 0);

    return {
        patrones: [patronInicial],
        patronActivo: patronInicial.id,
        /* C313: Iniciar en modo song para que la playlist esté activa por defecto */
        modoReproduccion: 'song',

        /* CRUD Patrones */
        crearPatron: (nombre) => {
            const { patrones } = get();
            const nuevoNombre = nombre ?? `Pattern ${patrones.length + 1}`;
            const nuevo = crearPatronVacio(nuevoNombre, patrones.length);
            set({ patrones: [...patrones, nuevo], patronActivo: nuevo.id });
            return nuevo.id;
        },

        eliminarPatron: (id) => {
            const { patrones, patronActivo } = get();
            if (patrones.length <= 1) return;
            const nuevos = patrones.filter(p => p.id !== id);
            const nuevoActivo = patronActivo === id ? nuevos[0]?.id ?? null : patronActivo;
            set({ patrones: nuevos, patronActivo: nuevoActivo });
        },

        renombrarPatron: (id, nombre) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, id, p => ({ ...p, nombre })),
            }));
        },

        duplicarPatron: (id) => {
            const { patrones } = get();
            const original = patrones.find(p => p.id === id);
            if (!original) return '';
            const clon: Patron = {
                ...original,
                id: generarId(),
                nombre: `${original.nombre} (copia)`,
                canales: original.canales.map(c => ({
                    ...c,
                    id: generarId(),
                    pasos: c.pasos.map(paso => ({ ...paso })),
                })),
                creadoEn: Date.now(),
                modificadoEn: Date.now(),
            };
            set({ patrones: [...patrones, clon], patronActivo: clon.id });
            return clon.id;
        },

        setPatronActivo: (id) => set({ patronActivo: id }),

        /* Canales */
        agregarCanal: (patronId, nombre, audioBuffer, rutaAudio, sampleId) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => {
                    if (p.canales.length >= CONSTANTES_CHANNEL_RACK.CANALES_MAX) return p;
                    const canal = crearCanalVacio(
                        nombre ?? `Canal ${p.canales.length + 1}`,
                        p.totalPasos
                    );
                    if (audioBuffer) canal.audioBuffer = audioBuffer;
                    if (rutaAudio) canal.rutaAudio = rutaAudio;
                    if (sampleId) canal.sampleId = sampleId;
                    return { ...p, canales: [...p.canales, canal] };
                }),
            }));
        },

        eliminarCanal: (patronId, canalId) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    canales: p.canales.filter(c => c.id !== canalId),
                })),
            }));
        },

        moverCanal: (patronId, canalId, direccion) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => {
                    const idx = p.canales.findIndex(c => c.id === canalId);
                    if (idx < 0) return p;
                    const nuevoIdx = direccion === 'up' ? idx - 1 : idx + 1;
                    if (nuevoIdx < 0 || nuevoIdx >= p.canales.length) return p;
                    const copia = [...p.canales];
                    [copia[idx], copia[nuevoIdx]] = [copia[nuevoIdx], copia[idx]];
                    return { ...p, canales: copia };
                }),
            }));
        },

        clonarCanal: (patronId, canalId) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => {
                    const original = p.canales.find(c => c.id === canalId);
                    if (!original) return p;
                    const clon: CanalRack = {
                        ...original,
                        id: generarId(),
                        nombre: `${original.nombre} (copia)`,
                        pasos: original.pasos.map(paso => ({ ...paso })),
                    };
                    return { ...p, canales: [...p.canales, clon] };
                }),
            }));
        },

        actualizarCanal: (patronId, canalId, cambios) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    canales: p.canales.map(c =>
                        c.id === canalId ? { ...c, ...cambios } : c
                    ),
                })),
            }));
        },

        /* Steps */
        togglePaso: (patronId, canalId, pasoIndex) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    canales: p.canales.map(c => {
                        if (c.id !== canalId) return c;
                        const nuevosPasos = [...c.pasos];
                        if (pasoIndex >= 0 && pasoIndex < nuevosPasos.length) {
                            nuevosPasos[pasoIndex] = {
                                ...nuevosPasos[pasoIndex],
                                activo: !nuevosPasos[pasoIndex].activo,
                            };
                        }
                        return { ...c, pasos: nuevosPasos };
                    }),
                })),
            }));
        },

        setPaso: (patronId, canalId, pasoIndex, paso) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    canales: p.canales.map(c => {
                        if (c.id !== canalId) return c;
                        const nuevosPasos = [...c.pasos];
                        if (pasoIndex >= 0 && pasoIndex < nuevosPasos.length) {
                            nuevosPasos[pasoIndex] = { ...nuevosPasos[pasoIndex], ...paso };
                        }
                        return { ...c, pasos: nuevosPasos };
                    }),
                })),
            }));
        },

        setTotalPasos: (patronId, total) => {
            const clamped = Math.max(
                CONSTANTES_CHANNEL_RACK.PASOS_MIN,
                Math.min(CONSTANTES_CHANNEL_RACK.PASOS_MAX, total)
            );
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    totalPasos: clamped,
                    pasosVisibles: Math.min(p.pasosVisibles, clamped),
                    canales: p.canales.map(c => {
                        if (c.pasos.length === clamped) return c;
                        const nuevosPasos = c.pasos.length < clamped
                            ? [...c.pasos, ...Array.from({ length: clamped - c.pasos.length }, () => crearPasoVacio())]
                            : c.pasos.slice(0, clamped);
                        return { ...c, pasos: nuevosPasos };
                    }),
                })),
            }));
        },

        limpiarPasos: (patronId, canalId) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    canales: p.canales.map(c =>
                        c.id === canalId
                            ? { ...c, pasos: c.pasos.map(() => crearPasoVacio()) }
                            : c
                    ),
                })),
            }));
        },

        /* Config */
        setSwing: (patronId, swing) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    swing: Math.max(0, Math.min(1, swing)),
                })),
            }));
        },

        toggleLoop: (patronId) => {
            set(prev => ({
                patrones: actualizarPatron(prev.patrones, patronId, p => ({
                    ...p,
                    loop: !p.loop,
                })),
            }));
        },

        setModoReproduccion: (modo) => set({ modoReproduccion: modo }),

        /* Queries */
        obtenerPatron: (id) => get().patrones.find(p => p.id === id),

        obtenerPatronActivo: () => {
            const { patrones, patronActivo } = get();
            return patronActivo ? patrones.find(p => p.id === patronActivo) : undefined;
        },

        /*
         * Calcular duración del patrón en compases.
         * 1 paso = 1 semicorchea = 1/4 de beat.
         * En 4/4: 16 pasos = 1 compás, 32 = 2, 64 = 4.
         */
        obtenerDuracionPatronCompases: (id) => {
            const patron = get().patrones.find(p => p.id === id);
            if (!patron) return 1;
            return patron.totalPasos / 16;
        },
    };
});
