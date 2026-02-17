/*
 * compasUtils — Utilidades para cálculos de compás, beats y snap
 * Calcula cuántos compases ocupa un sample y sugiere el compás apropiado
 */

import type { Compas, InfoCompas, SnapResolucion } from '../types/mezclador';

/* Duración de un compás en segundos dado BPM y compás */
export const duracionCompas = (bpm: number, compas: Compas): number => {
    if (bpm <= 0) return 0;
    const beatDuration = 60 / bpm;
    return beatDuration * compas.numerador;
};

/* Duración de un beat en segundos */
export const duracionBeat = (bpm: number): number => bpm > 0 ? 60 / bpm : 0;

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

    /* Playback rate para adaptar al BPM del proyecto */
    const playbackRate = bpmSample > 0 ? bpmProyecto / bpmSample : 1;
    const playbackRateClamped = Math.max(0.5, Math.min(2.0, playbackRate));

    /*
     * Cuántos compases del proyecto ocupa — usar duración ajustada por playbackRate.
     * C207 fix: sin este ajuste, el audio se cortaba antes de terminar
     * porque el bloque visual era más largo que la duración real del buffer.
     */
    const duracionAjustada = duracionSample / playbackRateClamped;
    const duracionCompasProyecto = duracionCompas(bpmProyecto, compasProyecto);
    const compasesSample = Math.max(1, Math.round(duracionAjustada / duracionCompasProyecto));

    return {
        beats: beatsRedondeados,
        compas,
        duracionCompases: compasesSample,
        playbackRate: playbackRateClamped,
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

/*
 * C216: Snap con resolución configurable.
 * Si 'off' retorna la posición sin mutar.
 */
export const snapConResolucion = (
    posicion: number,
    compas: Compas,
    resolucion: SnapResolucion
): number => {
    if (resolucion === 'off') return posicion;

    let fraccion: number;
    const beatsPerBar = compas.numerador;
    const beatFrac = 1 / beatsPerBar;

    switch (resolucion) {
        case 'bar':   fraccion = 1; break;
        case 'beat':  fraccion = beatFrac; break;
        case '1/2':   fraccion = beatFrac / 2; break;
        case '1/4':   fraccion = beatFrac / 4; break;
        case '1/6':   fraccion = beatFrac / 6; break;
        default:      fraccion = beatFrac; break;
    }

    return Math.round(posicion / fraccion) * fraccion;
};

/*
 * C216: Calcular las posiciones de las líneas de cuadrícula para la UI.
 * Retorna un array de { posicion, esCompas } para renderizar líneas.
 */
export const calcularLineasCuadricula = (
    totalCompases: number,
    compas: Compas,
    resolucion: SnapResolucion
): Array<{ posicion: number; esPrincipal: boolean }> => {
    if (resolucion === 'off') {
        /* Solo líneas de compás */
        return Array.from({ length: totalCompases + 1 }, (_, i) => ({
            posicion: i,
            esPrincipal: true,
        }));
    }

    const beatsPerBar = compas.numerador;
    const beatFrac = 1 / beatsPerBar;
    let fraccion: number;

    switch (resolucion) {
        case 'bar':   fraccion = 1; break;
        case 'beat':  fraccion = beatFrac; break;
        case '1/2':   fraccion = beatFrac / 2; break;
        case '1/4':   fraccion = beatFrac / 4; break;
        case '1/6':   fraccion = beatFrac / 6; break;
        default:      fraccion = beatFrac; break;
    }

    const resultado: Array<{ posicion: number; esPrincipal: boolean }> = [];
    const pasos = Math.round(totalCompases / fraccion);

    for (let i = 0; i <= pasos; i++) {
        const pos = i * fraccion;
        if (pos > totalCompases) break;
        resultado.push({
            posicion: pos,
            /* Una línea es principal si cae justo en un compás entero */
            esPrincipal: Math.abs(pos - Math.round(pos)) < 0.001 && pos === Math.round(pos),
        });
    }

    return resultado;
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
    if (totalCompases <= 0) return 0;
    return (duracionCompases / totalCompases) * 100;
};

/* Calcular posición izquierda de un bloque en porcentaje */
export const posicionBloquePorc = (compasInicio: number, totalCompases: number): number => {
    if (totalCompases <= 0) return 0;
    return (compasInicio / totalCompases) * 100;
};
