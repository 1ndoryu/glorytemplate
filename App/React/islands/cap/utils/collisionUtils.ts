/**
 * collisionUtils.ts
 *
 * Funciones de utilidad para cálculo de tiempos y detección de colisiones
 * en el drag & drop del calendario.
 */

import type {Clase} from '../types';
import {CALENDARIO_CONFIG, SLOTS_HORARIOS} from '../constants/cap-constants';

/* Resultado de una validación de movimiento */
export interface ResultadoValidacion {
    valido: boolean;
    conflicto?: {
        clase: Clase; // Clase con la que choca
        tipo: 'solapamiento';
    };
    nuevaHoraInicio: string;
    nuevaHoraFin: string;
}

/**
 * Convierte una hora en formato "HH:MM" a minutos totales desde el inicio del día (00:00).
 */
export function horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Convierte minutos totales a formato "HH:MM".
 */
export function minutosAHora(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = Math.floor(minutos % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calcula la hora basada en la posición Y (pixels) del drag.
 * Aplica "snapping" al intervalo más cercano (por defecto 15 min).
 */
export function calcularNuevaHora(offsetY: number, stepMinutos: number = 15): string {
    // 1. Calcular minutos desde el inicio de la columna (normalmente 08:00)
    // Formula: minutos = pixels / pixelsPerMinute
    const minutosDesdeInicioColumna = offsetY / CALENDARIO_CONFIG.PIXELS_POR_MINUTO;

    // 2. Sumar hora base de la columna (08:00 = 480 minutos)
    const minutosBase = CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
    const minutosTotales = minutosBase + minutosDesdeInicioColumna;

    // 3. Aplicar snapping (redondeo al step más cercano)
    const minutosRedondeados = Math.round(minutosTotales / stepMinutos) * stepMinutos;

    // 4. Asegurar límites (no antes de 08:00, no después de 23:00, por ejemplo)
    const limiteMin = minutosBase;
    const limiteMax = 23 * 60; // 23:00 limit hardcodeado por ahora

    const minutosFinales = Math.max(limiteMin, Math.min(minutosRedondeados, limiteMax));

    return minutosAHora(minutosFinales);
}

/**
 * Detecta si un intervalo de tiempo choca con alguna clase existente.
 */
export function detectarColision(horaInicio: string, horaFin: string, clasesDia: Clase[], ignorarClaseId?: number): Clase | undefined {
    const nuevoInicio = horaAMinutos(horaInicio);
    const nuevoFin = horaAMinutos(horaFin);

    return clasesDia.find(clase => {
        if (clase.id === ignorarClaseId) return false;

        const inicio = horaAMinutos(clase.horaInicio);
        const fin = horaAMinutos(clase.horaFin);

        // Lógica de solapamiento: (StartA < EndB) y (EndA > StartB)
        // Se usa < y > estricto para permitir que una clase empiece justo cuando otra termina
        return nuevoInicio < fin && nuevoFin > inicio;
    });
}

/**
 * Encuentra el horario disponible más cercano al intento original.
 * Usa slots predefinidos y evita solapamientos.
 */
export function encontrarHorarioDisponibleMasCercano(
    horaInicioDeseada: string,
    horaFinDeseada: string,
    clasesDia: Clase[],
    ignorarClaseId?: number
): {horaInicio: string; horaFin: string} | null {
    const duracion = horaAMinutos(horaFinDeseada) - horaAMinutos(horaInicioDeseada);
    if (duracion <= 0) return null;

    const horaDeseadaMin = horaAMinutos(horaInicioDeseada);
    const limiteMin = CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
    const limiteMax = 23 * 60;

    let mejor: {horaInicio: string; horaFin: string} | null = null;
    let mejorDistancia = Number.POSITIVE_INFINITY;

    SLOTS_HORARIOS.forEach(slot => {
        const inicioMin = horaAMinutos(slot);
        const finMin = inicioMin + duracion;

        if (inicioMin < limiteMin || finMin > limiteMax) return;

        const inicioStr = minutosAHora(inicioMin);
        const finStr = minutosAHora(finMin);
        const conflicto = detectarColision(inicioStr, finStr, clasesDia, ignorarClaseId);

        if (!conflicto) {
            const distancia = Math.abs(inicioMin - horaDeseadaMin);
            if (distancia < mejorDistancia) {
                mejorDistancia = distancia;
                mejor = {horaInicio: inicioStr, horaFin: finStr};
            }
        }
    });

    return mejor;
}

/**
 * Valida un movimiento propuesto.
 * Retorna la nueva hora calculada y si hay conflicto.
 */
export function validarMovimiento(offsetY: number, clase: Clase, clasesDestino: Clase[]): ResultadoValidacion {
    // 1. Calcular nuevas horas
    const nuevaHoraInicio = calcularNuevaHora(offsetY);
    const duracion = horaAMinutos(clase.horaFin) - horaAMinutos(clase.horaInicio);
    const nuevaHoraFin = minutosAHora(horaAMinutos(nuevaHoraInicio) + duracion);

    // 2. Buscar conflictos
    const conflicto = detectarColision(nuevaHoraInicio, nuevaHoraFin, clasesDestino, clase.id);

    if (conflicto) {
        return {
            valido: false,
            conflicto: {
                clase: conflicto,
                tipo: 'solapamiento'
            },
            nuevaHoraInicio,
            nuevaHoraFin
        };
    }

    return {
        valido: true,
        nuevaHoraInicio,
        nuevaHoraFin
    };
}

/**
 * Calcula los desplazamientos necesarios para resolver un conflicto.
 * Implementa una estrategia "Waterfall" (cascada): empuja las clases superpuestas hacia abajo.
 * Las clases bloqueadas NO se mueven y actúan como obstáculos fijos.
 */
export function resolverDesplazamientoCascada(claseMoviendo: Clase, nuevaHoraInicio: string, nuevaHoraFin: string, clasesDia: Clase[]): {clase: Clase; nuevoInicio: string; nuevoFin: string; bloqueada?: boolean}[] | null {
    const nuevoInicioMin = horaAMinutos(nuevaHoraInicio);
    const nuevoFinMin = horaAMinutos(nuevaHoraFin);

    /* Verificar si la nueva posición choca con alguna clase bloqueada */
    const claseBloqueadaEnConflicto = clasesDia.find(c => {
        if (c.id === claseMoviendo.id || !c.bloqueada) return false;
        const inicio = horaAMinutos(c.horaInicio);
        const fin = horaAMinutos(c.horaFin);
        return nuevoInicioMin < fin && nuevoFinMin > inicio;
    });

    if (claseBloqueadaEnConflicto) {
        /* No se puede desplazar porque hay una clase bloqueada en el camino */
        return null;
    }

    /* Lista de cambios a aplicar */
    const cambios = [];

    /* Añadimos el movimiento principal */
    cambios.push({
        clase: claseMoviendo,
        nuevoInicio: nuevaHoraInicio,
        nuevoFin: nuevaHoraFin
    });

    /* Filtramos las clases del día (excluyendo la que movemos y las bloqueadas) */
    /* Las clases bloqueadas NO se mueven - son obstáculos fijos */
    /* Ordenamos por hora de inicio original para procesar en orden */
    const otrasClases = clasesDia
        .filter(c => c.id !== claseMoviendo.id && !c.bloqueada)
        .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio));

    /* Pointer indica dónde termina la última clase colocada "en la cadena de empuje" */
    let pointer = nuevoFinMin;

    for (const otra of otrasClases) {
        const otraInicio = horaAMinutos(otra.horaInicio);
        const otraFin = horaAMinutos(otra.horaFin);
        const duracion = otraFin - otraInicio;

        /* Si la clase termina antes de nuestro nuevo bloque, no la tocamos (está "por encima") */
        if (otraFin <= nuevoInicioMin) continue;

        /* CONDICIÓN DE EMPUJE: Si su inicio original es ANTERIOR al pointer actual,
         * significa que la clase anterior (o la movida) se le ha echado encima */
        if (otraInicio < pointer) {
            /* Hay solapamiento con la cadena. Empujamos esta clase para que empiece en 'pointer' */
            const nuevoInicio = pointer;
            const nuevoFin = nuevoInicio + duracion;

            /* Verificar si el nuevo horario choca con alguna clase bloqueada */
            const choqueConBloqueada = clasesDia.find(c => {
                if (!c.bloqueada || c.id === otra.id) return false;
                const inicio = horaAMinutos(c.horaInicio);
                const fin = horaAMinutos(c.horaFin);
                return nuevoInicio < fin && nuevoFin > inicio;
            });

            if (choqueConBloqueada) {
                /* No se puede completar el desplazamiento porque hay una clase bloqueada en el camino */
                return null;
            }

            cambios.push({
                clase: otra,
                nuevoInicio: minutosAHora(nuevoInicio),
                nuevoFin: minutosAHora(nuevoFin)
            });

            /* Actualizamos el pointer para la siguiente iteración */
            pointer = nuevoFin;
        }
    }

    return cambios;
}
