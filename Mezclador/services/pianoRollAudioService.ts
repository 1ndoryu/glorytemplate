/*
 * pianoRollAudioService — Audio scheduling para notas del Piano Roll.
 * C310: Gestiona preview de notas (click teclado/crear nota) y
 * programación de reproducción de todas las notas en un patrón.
 * No modifica motorAudioService — lo consume como dependencia.
 */

import { motorAudio } from './motorAudioService';
import type { NotaPianoRoll } from '../types/pianoRoll';
import { PPQ } from '../types/pianoRoll';
import { ticksASegundos } from '../utils/pianoRollUtils';

/* Nodo activo de preview para poder detenernos si hay otro preview */
let previewActivo: AudioBufferSourceNode | null = null;
let previewGain: GainNode | null = null;

/* Duración máxima del preview en segundos */
const PREVIEW_DURACION_MAX = 0.6;
/* Tiempo de fade out del preview */
const PREVIEW_FADE_OUT = 0.05;

/*
 * Reproduce un preview corto del sample del canal al pitch indicado.
 * midi: nota MIDI donde se hace click.
 * pitchBase: pitch base del canal (ej: 60 = C5).
 * buffer: AudioBuffer del sample precargado.
 * volumen: 0-1 (default 0.8).
 *
 * Detiene cualquier preview anterior activo para evitar superposiciones.
 */
export function previewNota(
    midi: number,
    pitchBase: number,
    buffer: AudioBuffer,
    volumen = 0.8,
): void {
    /* Detener preview anterior si existe */
    detenerPreview();

    const ctx = motorAudio.obtenerContexto();
    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    /* Calcular semitonos de diferencia respecto al pitch base */
    const semitonos = midi - pitchBase;
    if (semitonos !== 0) {
        fuente.detune.value = semitonos * 100;
    }

    /* Gain node para controlar volumen + fade out */
    const gain = ctx.createGain();
    gain.gain.value = volumen;
    fuente.connect(gain);
    gain.connect(ctx.destination);

    /* Programar fade out y stop */
    const duracion = Math.min(buffer.duration, PREVIEW_DURACION_MAX);
    const ahora = ctx.currentTime;
    gain.gain.setValueAtTime(volumen, ahora + duracion - PREVIEW_FADE_OUT);
    gain.gain.linearRampToValueAtTime(0, ahora + duracion);

    fuente.start(0, 0, duracion);
    fuente.onended = () => {
        if (previewActivo === fuente) {
            previewActivo = null;
            previewGain = null;
        }
    };

    previewActivo = fuente;
    previewGain = gain;
}

/*
 * Detiene el preview en curso con fade rápido.
 */
export function detenerPreview(): void {
    if (!previewActivo || !previewGain) return;

    try {
        const ctx = motorAudio.obtenerContexto();
        previewGain.gain.cancelScheduledValues(ctx.currentTime);
        previewGain.gain.setValueAtTime(previewGain.gain.value, ctx.currentTime);
        previewGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02);
        previewActivo.stop(ctx.currentTime + 0.03);
    } catch {
        /* El nodo ya fue recogido por GC o cerrado */
    }

    previewActivo = null;
    previewGain = null;
}

/*
 * Programa la reproducción de todas las notas de un canal para un patrón.
 * Se invoca desde el motor principal cuando empieza la reproducción.
 *
 * notas: lista de NotaPianoRoll activas (no silenciadas).
 * buffer: AudioBuffer del sample del canal.
 * pitchBase: nota MIDI base del canal.
 * bpm: tempo actual del proyecto.
 * cuando: tiempo del AudioContext en que comienza la reproducción (ctx.currentTime + lookahead).
 * volumen: volumen del canal (0-1).
 * pistaId: ID para enrutar al GainNode correcto del mixer.
 *
 * Retorna array de AudioBufferSourceNodes activos para poder detenerlos.
 */
export function programarNotasPianoRoll(
    notas: NotaPianoRoll[],
    buffer: AudioBuffer,
    pitchBase: number,
    bpm: number,
    cuando: number,
    volumen: number,
    pistaId: string,
): AudioBufferSourceNode[] {
    const nodosCreados: AudioBufferSourceNode[] = [];

    /* Filtrar notas silenciadas */
    const notasActivas = notas.filter(n => !n.silenciada);
    if (notasActivas.length === 0) return nodosCreados;

    for (const nota of notasActivas) {
        /* Convertir ticks a segundos usando BPM */
        const inicioSeg = ticksASegundos(nota.inicio, bpm);
        const duracionSeg = ticksASegundos(nota.duracion, bpm);

        /* Semitonos respecto al pitch base */
        const semitonos = nota.nota - pitchBase;

        /* Tiempo absoluto de inicio en el contexto de audio */
        const tiempoInicio = cuando + inicioSeg;

        /* Duración limitada al buffer */
        const durReal = Math.min(duracionSeg, buffer.duration);

        try {
            const fuente = motorAudio.programarReproduccion(
                buffer,
                pistaId,
                tiempoInicio,
                0,
                durReal,
                1,
                nota.velocity * volumen,
                false,
                0,
                0.005,
                semitonos,
                'resample',
                `pr-${nota.id}`,
                nota.pan,
                'corto',
            );
            nodosCreados.push(fuente);
        } catch {
            /* Error al programar nota individual — continuar con las demás */
        }
    }

    return nodosCreados;
}

/*
 * Calcula la duración total en segundos de un patrón dado totalCompases.
 * Útil para saber cuándo termina el loop.
 */
export function duracionPatronEnSegundos(
    totalCompases: number,
    numerador: number,
    bpm: number,
): number {
    const totalTicks = totalCompases * numerador * PPQ;
    return ticksASegundos(totalTicks, bpm);
}
