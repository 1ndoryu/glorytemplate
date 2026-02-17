/*
 * compasUtils — Utilidades para cálculos de compás, beats y snap
 * Calcula cuántos compases ocupa un sample y sugiere el compás apropiado
 */

import type { Compas, InfoCompas } from '../types/mezclador';

/* Duración de un compás en segundos dado BPM y compás */
export const duracionCompas = (bpm: number, compas: Compas): number => {
    const beatDuration = 60 / bpm;
    return beatDuration * compas.numerador;
};

/* Duración de un beat en segundos */
export const duracionBeat = (bpm: number): number => 60 / bpm;

/* Calcular cuántos beats tiene un audio */
export const calcularBeats = (duracion: number, bpm: number): number => {
    return (duracion * bpm) / 60;
};

/* Inferir compás de un sample a partir de BPM y duración */
export const inferirCompas = (
    duracionSample: number,
    bpmSample: number,
    bpmProyecto: number,
    compasProyecto: Compas
): InfoCompas => {
    const beats = calcularBeats(duracionSample, bpmSample);
    const beatsRedondeados = Math.round(beats);

    /* Determinar si encaja en 4/4 o 3/4 */
    let compas: Compas = { numerador: 4, denominador: 4 };
    let confianza = 0.8;

    if (beatsRedondeados > 0) {
        const modulo4 = beatsRedondeados % 4;
        const modulo3 = beatsRedondeados % 3;

        if (modulo4 === 0) {
            compas = { numerador: 4, denominador: 4 };
            confianza = 0.95;
        } else if (modulo3 === 0 && modulo4 !== 0) {
            compas = { numerador: 3, denominador: 4 };
            confianza = 0.85;
        } else if (beatsRedondeados % 6 === 0) {
            compas = { numerador: 6, denominador: 8 };
            confianza = 0.75;
        }
    }

    /* Cuántos compases del proyecto ocupa este sample */
    const duracionCompasProyecto = duracionCompas(bpmProyecto, compasProyecto);
    const compasesSample = Math.max(1, Math.round(duracionSample / duracionCompasProyecto));

    /* Playback rate para adaptar al BPM del proyecto */
    const playbackRate = bpmSample > 0 ? bpmProyecto / bpmSample : 1;

    return {
        beats: beatsRedondeados,
        compas,
        duracionCompases: compasesSample,
        playbackRate: Math.max(0.5, Math.min(2.0, playbackRate)),
        confianza,
    };
};

/* Snap una posición (en compases) al beat más cercano */
export const snapABeat = (
    posicionCompases: number,
    compas: Compas
): number => {
    const beatFraccion = 1 / compas.numerador;
    return Math.round(posicionCompases / beatFraccion) * beatFraccion;
};

/* Convertir posición en compases a segundos */
export const compasesASegundos = (compases: number, bpm: number, compas: Compas): number => {
    return compases * duracionCompas(bpm, compas);
};

/* Convertir segundos a posición en compases */
export const segundosACompases = (segundos: number, bpm: number, compas: Compas): number => {
    const dc = duracionCompas(bpm, compas);
    return dc > 0 ? segundos / dc : 0;
};

/* Generar labels para la barra de compases */
export const generarLabelsCompases = (totalCompases: number): string[] => {
    return Array.from({ length: totalCompases }, (_, i) => `${i + 1}`);
};

/* Calcular ancho de un bloque en porcentaje respecto al total */
export const anchoBloquePorc = (duracionCompases: number, totalCompases: number): number => {
    return (duracionCompases / totalCompases) * 100;
};

/* Calcular posición izquierda de un bloque en porcentaje */
export const posicionBloquePorc = (compasInicio: number, totalCompases: number): number => {
    return (compasInicio / totalCompases) * 100;
};
