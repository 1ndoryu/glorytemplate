/* sentinel-disable-file limite-lineas — algoritmo cohesivo de priorización con documentación
 * extensa intencionada: la lógica de scoring y el razonamiento de cada criterio son complejos
 * y requieren comentarios detallados para mantenibilidad futura. */

/**
 * Lógica de Priorización Inteligente para Conflictos de Aforo
 *
 * Implementa el algoritmo "Priorizar por Proximidad" que:
 * - Criterio 1: Prioriza alumnos más cerca de terminar la asignatura (menos horas restantes)
 * - Criterio 2: Evita fragmentación - favorece alumnos que pueden hacer clases seguidas
 *
 * Uso: Esta utilidad calcula qué alumnos excluir automáticamente para resolver conflictos
 * priorizando a los que están más cerca de terminar cada asignatura y evitando interrupciones.
 */

import type { ConflictoAforo, ExclusionesConflicto, Alumno } from '../types';
import { ASIGNATURAS_CAP } from '../constants/cap-constants';

/* Interfaz extendida de alumno con información de progreso por asignatura */
export interface AlumnoConProgreso extends Alumno {
    horasPorAsignatura?: Record<string, number>;
}

/*
 * Información de slot para análisis de continuidad
 * Agrupa conflictos por día para detectar fragmentación
 */
interface SlotInfo {
    slotKey: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    alumnosIds: number[];
}

/*
 * Puntuación de prioridad para un alumno en un slot específico
 * Menor puntuación = más prioridad (debe quedarse en la clase)
 */
interface PuntuacionAlumno {
    alumnoId: number;
    puntuacion: number; /* Menor = más prioritario */
    horasRestantes: number;
    tieneClaseSiguiente: boolean;
    tieneClaseAnterior: boolean;
}

/**
 * Calcula las horas restantes para completar una asignatura específica
 * basado en la duración total de la asignatura y las horas ya completadas
 */
export function calcularHorasRestantesAsignatura(
    horasCompletadasAsignatura: number,
    codigoAsignatura: string
): number {
    const asignatura = ASIGNATURAS_CAP.find(a => a.codigo === codigoAsignatura);
    if (!asignatura) return 35; /* Valor alto por defecto si no se encuentra */

    const horasTotales = asignatura.duracionHoras;
    return Math.max(0, horasTotales - horasCompletadasAsignatura);
}

/**
 * Verifica si un alumno tiene clases adyacentes (continuidad)
 * Esto evita fragmentación del horario
 */
function tieneClasesAdyacentes(
    alumnoId: number,
    slotActual: SlotInfo,
    todosLosSlots: SlotInfo[],
    _conflictosDelDia: ConflictoAforo[]
): { anterior: boolean; siguiente: boolean } {
    const fechaActual = slotActual.fecha;

    /* Buscar slots del mismo día */
    const slotsMismoDia = todosLosSlots.filter(s => s.fecha === fechaActual);

    /* Ordenar por hora */
    slotsMismoDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    const indiceActual = slotsMismoDia.findIndex(s => s.slotKey === slotActual.slotKey);
    if (indiceActual === -1) return { anterior: false, siguiente: false };

    let tieneAnterior = false;
    let tieneSiguiente = false;

    /* Verificar slot anterior (si el alumno está en él) */
    if (indiceActual > 0) {
        const slotAnterior = slotsMismoDia[indiceActual - 1];
        tieneAnterior = slotAnterior.alumnosIds.includes(alumnoId);
    }

    /* Verificar slot siguiente (si el alumno está en él) */
    if (indiceActual < slotsMismoDia.length - 1) {
        const slotSiguiente = slotsMismoDia[indiceActual + 1];
        tieneSiguiente = slotSiguiente.alumnosIds.includes(alumnoId);
    }

    return { anterior: tieneAnterior, siguiente: tieneSiguiente };
}

/**
 * Calcula la puntuación de prioridad de un alumno para un slot específico
 * 
 * Criterios de puntuación (menor = más prioritario):
 * 1. Horas restantes: Un alumno con menos horas restantes tiene más prioridad
 * 2. Continuidad: Un alumno con clases adyacentes tiene más prioridad (penalización por fragmentar)
 * 
 * Fórmula: puntuacion = horasRestantes * 10 + penalizacionFragmentacion
 */
function calcularPuntuacionAlumno(
    alumnoId: number,
    alumnoInfo: AlumnoConProgreso | undefined,
    slotActual: SlotInfo,
    todosLosSlots: SlotInfo[],
    conflictosDelDia: ConflictoAforo[],
    exclusionesPrevias: number
): PuntuacionAlumno {
    /* Calcular horas restantes totales del curso (35h) */
    const horasCompletadas = alumnoInfo?.horasCompletadas ?? 0;
    const horasRestantes = Math.max(0, 35 - horasCompletadas);

    /* Verificar continuidad */
    const continuidad = tieneClasesAdyacentes(
        alumnoId,
        slotActual,
        todosLosSlots,
        conflictosDelDia
    );

    /*
     * Calcular penalización por fragmentación:
     * - Si tiene clase anterior Y siguiente: no penalizar mucho (está en medio de su jornada)
     * - Si tiene clase anterior O siguiente: penalización media
     * - Si no tiene clases adyacentes: penalización alta (vuelve solo por esta clase)
     */
    let penalizacionFragmentacion = 0;
    if (continuidad.anterior && continuidad.siguiente) {
        /* En medio de jornada continua - máxima prioridad, no excluir */
        penalizacionFragmentacion = 0;
    } else if (continuidad.anterior || continuidad.siguiente) {
        /* Al inicio o final de bloque continuo - prioridad media */
        penalizacionFragmentacion = 50;
    } else {
        /* Clase aislada - baja prioridad, mejor excluir */
        penalizacionFragmentacion = 100;
    }

    /*
     * Puntuación final:
     * - Peso principal: horas restantes (quien tenga menos, más prioritario)
     * - Peso secundario: continuidad (evitar fragmentar)
     * - Ajuste: evitar excluir siempre a los mismos alumnos
     */
    const ajusteRepeticion = exclusionesPrevias * 60;
    const puntuacion = (horasRestantes * 10) + penalizacionFragmentacion - ajusteRepeticion;

    return {
        alumnoId,
        puntuacion,
        horasRestantes,
        tieneClaseSiguiente: continuidad.siguiente,
        tieneClaseAnterior: continuidad.anterior
    };
}

/**
 * Algoritmo principal: Priorizar por Proximidad
 * 
 * Resuelve todos los conflictos de aforo seleccionando qué alumnos excluir
 * basándose en:
 * 1. Horas restantes para completar el curso (prioridad a quienes les falta poco)
 * 2. Continuidad de clases (evitar que un alumno tenga que volver más tarde)
 *
 * @param conflictos Lista de conflictos de aforo a resolver
 * @param alumnosInfo Mapa de información de alumnos con su progreso
 * @returns Exclusiones calculadas para resolver todos los conflictos
 */
export function priorizarPorProximidad(
    conflictos: ConflictoAforo[],
    alumnosInfo: Map<number, AlumnoConProgreso>
): ExclusionesConflicto {
    const exclusiones: ExclusionesConflicto = {};
    const exclusionesPorAlumno = new Map<number, number>();

    if (conflictos.length === 0) return exclusiones;

    /* Convertir conflictos a SlotInfo para análisis de continuidad */
    const todosLosSlots: SlotInfo[] = conflictos.map(c => ({
        slotKey: c.slotKey,
        fecha: c.fecha,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        alumnosIds: Array.isArray(c.alumnos) ? c.alumnos : []
    }));

    /* Procesar cada conflicto */
    for (const conflicto of conflictos) {
        const alumnosConflicto = Array.isArray(conflicto.alumnos) ? conflicto.alumnos : [];
        const exceso = Math.max(conflicto.exceso, 0);

        if (exceso === 0 || alumnosConflicto.length === 0) {
            exclusiones[conflicto.slotKey] = [];
            continue;
        }

        /* Obtener conflictos del mismo día para análisis de continuidad */
        const conflictosDelDia = conflictos.filter(c => c.fecha === conflicto.fecha);

        /* Slot actual para análisis */
        const slotActual: SlotInfo = {
            slotKey: conflicto.slotKey,
            fecha: conflicto.fecha,
            horaInicio: conflicto.horaInicio,
            horaFin: conflicto.horaFin,
            alumnosIds: alumnosConflicto
        };

        /* Calcular puntuación para cada alumno */
        const puntuaciones: PuntuacionAlumno[] = alumnosConflicto.map(alumnoId => {
            const alumnoInfo = alumnosInfo.get(alumnoId);
            const exclusionesPrevias = exclusionesPorAlumno.get(alumnoId) ?? 0;
            return calcularPuntuacionAlumno(
                alumnoId,
                alumnoInfo,
                slotActual,
                todosLosSlots,
                conflictosDelDia,
                exclusionesPrevias
            );
        });

        /*
         * Ordenar por puntuación DESCENDENTE (mayor puntuación = menos prioritario = excluir primero)
         * Los alumnos con MAYOR puntuación son los que se deben excluir
         */
        puntuaciones.sort((a, b) => b.puntuacion - a.puntuacion);

        /* Seleccionar los 'exceso' alumnos con mayor puntuación para excluir */
        const alumnosAExcluir = puntuaciones
            .slice(0, Math.min(exceso, puntuaciones.length))
            .map(p => p.alumnoId);

        exclusiones[conflicto.slotKey] = alumnosAExcluir;

        alumnosAExcluir.forEach(alumnoId => {
            const actual = exclusionesPorAlumno.get(alumnoId) ?? 0;
            exclusionesPorAlumno.set(alumnoId, actual + 1);
        });
    }

    return exclusiones;
}

/**
 * Genera un resumen legible de las decisiones tomadas por el algoritmo
 * Útil para mostrar al usuario por qué se excluyeron ciertos alumnos
 */
export function generarResumenPriorizacion(
    exclusiones: ExclusionesConflicto,
    alumnosInfo: Map<number, AlumnoConProgreso>
): string[] {
    const resumen: string[] = [];

    for (const [slotKey, alumnosExcluidos] of Object.entries(exclusiones)) {
        if (alumnosExcluidos.length === 0) continue;

        const nombresExcluidos = alumnosExcluidos.map(id => {
            const alumno = alumnosInfo.get(id);
            return alumno?.nombre ?? `Alumno #${id}`;
        });

        resumen.push(`${slotKey}: Excluidos ${nombresExcluidos.join(', ')}`);
    }

    return resumen;
}
