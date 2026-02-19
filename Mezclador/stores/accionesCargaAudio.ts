/*
 * accionesCargaAudio — Cargar samples remotos y archivos locales al mezclador.
 * Extrae lógica compartida para crear bloques desde AudioBuffer.
 */

import type { SampleResumen } from '@app/types';
import type { BloqueMezclador, PistaMezclador } from '../types/mezclador';
import { COLORES_BLOQUE } from '../types/mezclador';
import { inferirCompas } from '../utils/compasUtils';
import { generarIdBloque, generarIdPista, extraerPeaks } from '../utils/audioBufferUtils';
import { motorAudio } from '../services/motorAudioService';
import type { SetMezclador, GetMezclador } from './tiposMezcladorStore';

/* Helpers reutilizables para crear pistas y bloques */

export const crearPistaVacia = (nombre?: string): PistaMezclador => ({
    id: generarIdPista(),
    nombre: nombre ?? 'Pista',
    volumen: 1,
    silenciada: false,
    bloques: [],
    clipsPatron: [],
    color: '#555',
    icono: null,
    altura: 'normal',
});

interface DatosBloqueNuevo {
    buffer: AudioBuffer;
    sample: SampleResumen;
    bpmSample: number;
    color: string;
    bloqueId: string;
    pistaDestinoId: string;
}

/*
 * Crea un BloqueMezclador a partir de un AudioBuffer decodificado.
 * Lógica compartida entre agregarSample y agregarAudioLocal.
 */
function construirBloque(datos: DatosBloqueNuevo, get: GetMezclador): BloqueMezclador {
    const { bpmProyecto, compasProyecto } = get();
    const { buffer, sample, bpmSample, color, bloqueId, pistaDestinoId } = datos;

    const info = inferirCompas(buffer.duration, bpmSample, bpmProyecto, compasProyecto);

    /* Re-leer pistas (puede haber cambiado durante await) */
    const pistasActuales = get().pistas;
    const pistaActual = pistasActuales.find(p => p.id === pistaDestinoId);
    const bloquesPista = pistaActual?.bloques ?? [];

    /* Primera posición libre en la pista */
    let compasInicio = 0;
    for (const b of bloquesPista) {
        const fin = b.compasInicio + b.duracionCompases;
        if (fin > compasInicio) compasInicio = fin;
    }

    const waveformPeaks = extraerPeaks(buffer, Math.max(60, Math.round(info.duracionCompases * 60)));

    return {
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
        duracionOriginalCompases: info.duracionCompases,
        playbackRateOriginal: info.playbackRate,
        modoResize: 'stretch',
        detune: 0,
        /* C271: Por defecto resample (pitch ligado a velocidad) */
        modoTonalidad: 'resample',
        /* C287: Nuevas propiedades de audio profesional */
        pan: 0,
        modoDeclic: 'none',
        invertirPolaridad: false,
        intercambiarEstereo: false,
    };
}

/* Busca la primera pista vacía o crea una nueva */
function resolverPistaDestino(pistas: PistaMezclador[], pistaId?: string): { id: string; nueva?: PistaMezclador } {
    if (pistaId) return { id: pistaId };
    const vacia = pistas.find(p => p.bloques.length === 0);
    if (vacia) return { id: vacia.id };
    if (pistas[0]) return { id: pistas[0].id };
    const nueva = crearPistaVacia(`Pista ${pistas.length + 1}`);
    return { id: nueva.id, nueva };
}

export function crearAccionesCargaAudio(set: SetMezclador, get: GetMezclador) {
    /* Marcar/desmarcar bloque como cargando */
    const marcarCargando = (bloqueId: string) => {
        set(prev => {
            const nuevo = new Set(prev.cargandoBuffers);
            nuevo.add(bloqueId);
            return { cargandoBuffers: nuevo };
        });
    };
    const desmarcarCargando = (bloqueId: string) => {
        set(prev => {
            const nuevo = new Set(prev.cargandoBuffers);
            nuevo.delete(bloqueId);
            return { cargandoBuffers: nuevo };
        });
    };

    /* Insertar bloque construido en el store */
    const insertarBloque = (bloque: BloqueMezclador) => {
        const finBloque = bloque.compasInicio + bloque.duracionCompases;
        get()._guardarSnapshot();
        set(prev => ({
            pistas: prev.pistas.map(p =>
                p.id === bloque.pistaId
                    ? { ...p, bloques: [...p.bloques, bloque] }
                    : p
            ),
            totalCompases: Math.max(prev.totalCompases, finBloque),
        }));
    };

    return {
        agregarSample: async (sample: SampleResumen, pistaId?: string) => {
            const { pistas } = get();
            const destino = resolverPistaDestino(pistas, pistaId);

            if (destino.nueva) {
                set(prev => ({ pistas: [...prev.pistas, destino.nueva!] }));
            }

            const bloqueId = generarIdBloque();
            const urlAudio = sample.rutaPreview;
            if (!urlAudio) return;

            marcarCargando(bloqueId);
            try {
                const buffer = await motorAudio.cargarBuffer(urlAudio, String(sample.id));
                const bpmSample = sample.bpm ?? get().bpmProyecto;
                const tipoSample = sample.tipo?.toLowerCase() ?? 'default';
                const color = COLORES_BLOQUE[tipoSample] ?? COLORES_BLOQUE.default;

                const bloque = construirBloque(
                    { buffer, sample, bpmSample, color, bloqueId, pistaDestinoId: destino.id },
                    get
                );
                insertarBloque(bloque);
            } catch (error) {
                console.error('[Mezclador] Error cargando sample:', error);
            } finally {
                desmarcarCargando(bloqueId);
            }
        },

        agregarAudioLocal: async (archivo: File, pistaId?: string) => {
            const { pistas } = get();
            const destino = resolverPistaDestino(pistas, pistaId);

            if (destino.nueva) {
                set(prev => ({ pistas: [...prev.pistas, destino.nueva!] }));
            }

            const bloqueId = generarIdBloque();
            const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

            marcarCargando(bloqueId);
            try {
                const arrayBuffer = await archivo.arrayBuffer();
                const buffer = await motorAudio.decodificarBufferLocal(arrayBuffer, localId);
                const nombreLimpio = archivo.name.replace(/\.[^.]+$/, '');

                const pseudoSample: SampleResumen = {
                    id: -Date.now(),
                    titulo: nombreLimpio,
                    slug: nombreLimpio.toLowerCase().replace(/\s+/g, '-'),
                    bpm: get().bpmProyecto,
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

                const bloque = construirBloque(
                    {
                        buffer,
                        sample: pseudoSample,
                        bpmSample: get().bpmProyecto,
                        color: COLORES_BLOQUE.default,
                        bloqueId,
                        pistaDestinoId: destino.id,
                    },
                    get
                );
                insertarBloque(bloque);
            } catch (error) {
                console.error('[Mezclador] Error cargando audio local:', error);
            } finally {
                desmarcarCargando(bloqueId);
            }
        },
    };
}
