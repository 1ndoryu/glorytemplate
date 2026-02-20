/*
 * Utilidades para la matriz de disponibilidad de alumnos.
 * Extraído de useDisponibilidad para cumplir SRP y límite de líneas en hooks.
 */

import type {DiaSemana, SlotDisponibilidad} from '../types';
import {DIAS_SEMANA} from '../constants';

/* Horas disponibles por defecto (de 8:00 a 21:00) — se usa cuando no hay configuración personalizada */
export const HORAS_DISPONIBLES_DEFAULT: string[] = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

/* Alias para compatibilidad con código existente */
export const HORAS_DISPONIBLES = HORAS_DISPONIBLES_DEFAULT;

/* Genera la matriz vacía inicial con las horas proporcionadas */
export function generarMatrizVacia(horas: string[] = HORAS_DISPONIBLES_DEFAULT): SlotDisponibilidad[] {
    const slots: SlotDisponibilidad[] = [];
    for (const dia of DIAS_SEMANA) {
        for (const hora of horas) {
            slots.push({dia: dia as DiaSemana, hora, disponible: false});
        }
    }
    return slots;
}
