/*
 * pianoRollUtils — Funciones de conversión para el Piano Roll.
 * C310: Conversiones ticks<->tiempo, MIDI<->nombre, snap, pitch rate.
 */

import {
    PPQ,
    NOTA_DEFAULT,
    NOMBRES_NOTAS,
    SNAP_TICKS,
    type SnapPianoRoll,
} from '../types/pianoRoll';

/* Ticks a segundos: ticks * (60 / bpm) / PPQ */
export function ticksASegundos(ticks: number, bpm: number): number {
    if (bpm <= 0) return 0;
    return ticks * (60 / bpm) / PPQ;
}

/* Segundos a ticks: segundos * PPQ * bpm / 60 */
export function segundosATicks(segundos: number, bpm: number): number {
    if (bpm <= 0) return 0;
    return Math.round(segundos * PPQ * bpm / 60);
}

/* Ticks a compases (fracción decimal). Assume 4/4 por defecto */
export function ticksACompases(ticks: number, numerador: number = 4): number {
    const ticksPorCompas = PPQ * numerador;
    if (ticksPorCompas <= 0) return 0;
    return ticks / ticksPorCompas;
}

/* Compases a ticks */
export function compasesATicks(compases: number, numerador: number = 4): number {
    return Math.round(compases * PPQ * numerador);
}

/* Número MIDI a nombre: 60 -> "C5", 61 -> "C#5" */
export function midiANombre(midi: number): string {
    const octava = Math.floor(midi / 12) - 1;
    const nota = NOMBRES_NOTAS[midi % 12];
    return `${nota}${octava}`;
}

/* Nombre a número MIDI: "C5" -> 60, "D#3" -> 51 */
export function nombreAMidi(nombre: string): number {
    const match = nombre.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return NOTA_DEFAULT;
    const indice = NOMBRES_NOTAS.indexOf(match[1] as typeof NOMBRES_NOTAS[number]);
    if (indice === -1) return NOTA_DEFAULT;
    const octava = parseInt(match[2]);
    return (octava + 1) * 12 + indice;
}

/* Aplicar snap a posición en ticks */
export function snapTick(tick: number, snap: SnapPianoRoll): number {
    const step = SNAP_TICKS[snap];
    if (step <= 1) return Math.max(0, Math.round(tick));
    return Math.max(0, Math.round(tick / step) * step);
}

/* Frecuencia Hz de nota MIDI. A4 (69) = 440Hz */
export function midiAFrecuencia(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/* PlaybackRate para transponer un sample del pitchBase al destino */
export function calcularRateParaPitch(pitchBase: number, notaDestino: number): number {
    const semitonos = notaDestino - pitchBase;
    return Math.pow(2, semitonos / 12);
}

/* Verificar si una nota MIDI es tecla negra */
export function esTeclaNegra(midi: number): boolean {
    const n = midi % 12;
    return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
}

/* Verificar si una nota MIDI es C (para resaltar en el piano) */
export function esNotaC(midi: number): boolean {
    return midi % 12 === 0;
}

/* Generar ID corto para notas */
let contadorNota = 0;
export function generarIdNota(): string {
    contadorNota++;
    return `n${Date.now().toString(36)}${contadorNota.toString(36)}`;
}

/*
 * Calcular ancho en px de un tick dado el zoom.
 * Base: 1 beat (PPQ ticks) = 60px a zoomX=1.
 */
export function ticksAPx(ticks: number, zoomX: number): number {
    return (ticks / PPQ) * 60 * zoomX;
}

/* Calcular ticks desde px y zoom */
export function pxATicks(px: number, zoomX: number): number {
    if (zoomX <= 0) return 0;
    return (px / (60 * zoomX)) * PPQ;
}

/* Calcular Y en px de una nota MIDI (0=arriba=G9, 127=abajo=C-1) */
export function notaAPx(midi: number, alturaNota: number, zoomY: number): number {
    /* MIDI 127 arriba, MIDI 0 abajo — invertido */
    return (127 - midi) * alturaNota * zoomY;
}

/* Calcular nota MIDI desde posición Y en px */
export function pxANota(y: number, alturaNota: number, zoomY: number): number {
    if (alturaNota <= 0 || zoomY <= 0) return NOTA_DEFAULT;
    const midi = 127 - Math.floor(y / (alturaNota * zoomY));
    return Math.max(0, Math.min(127, midi));
}

/* Total de px en el eje Y (128 notas) */
export function alturaTotal(alturaNota: number, zoomY: number): number {
    return 128 * alturaNota * zoomY;
}

/* Total de px en el eje X para N compases */
export function anchoTotalCompases(totalCompases: number, numerador: number, zoomX: number): number {
    const totalTicks = totalCompases * PPQ * numerador;
    return ticksAPx(totalTicks, zoomX);
}
