/**
 * Constantes del CAP (Certificado de Aptitud Profesional)
 *
 * Reglas legales inmutables y definiciones de asignaturas.
 * Basado en el Real Decreto 1032/2007 y normativa vigente.
 */

import type {Asignatura, DiaSemana} from '../types';

/* Configuraciones visuales del calendario */
export const CALENDARIO_CONFIG = {
    PIXELS_POR_MINUTO: 1.5,
    HORA_INICIO_DIA: 8, // 08:00
    ALTO_MINIMO_CLASE: 30,
    ALTURA_TOTAL_COLUMNA: 1350 // 15 horas * 60 min * 1.5px
} as const;

/* Reglas legales del curso CAP */
export const CAP_REGLAS = {
    /** Total de horas del curso */
    HORAS_TOTALES: 35,

    /** Mínimo de días para completar el curso */
    DIAS_MINIMOS: 4,

    /** Máximo de horas por día por alumno */
    MAX_HORAS_DIA: 9,

    /** Duración estándar de una clase en minutos */
    DURACION_CLASE_MINUTOS: 45,

    /** Descanso obligatorio tras 6 horas (en minutos) */
    DESCANSO_6H_MINUTOS: 30,

    /** Descanso obligatorio tras 9 horas (en minutos) */
    DESCANSO_9H_MINUTOS: 45,

    /** Horas a partir de las cuales se requiere descanso corto */
    UMBRAL_DESCANSO_CORTO: 6,

    /** Horas a partir de las cuales se requiere descanso largo */
    UMBRAL_DESCANSO_LARGO: 9
} as const;

/* Días laborables de la semana */
export const DIAS_SEMANA: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

/* Labels para los días de la semana */
export const DIAS_LABELS: Record<DiaSemana, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes'
};

/* Definición de las 8 asignaturas del CAP */
export const ASIGNATURAS_CAP: Asignatura[] = [
    {
        id: 1,
        nombre: 'Conducción racional',
        codigo: 'CR',
        duracionHoras: 7,
        color: 'var(--cap-asignatura-1)'
    },
    {
        id: 2,
        nombre: 'Reglamentación',
        codigo: 'REG',
        duracionHoras: 4,
        color: 'var(--cap-asignatura-2)'
    },
    {
        id: 3,
        nombre: 'Seguridad vial',
        codigo: 'SV',
        duracionHoras: 6,
        color: 'var(--cap-asignatura-3)'
    },
    {
        id: 4,
        nombre: 'Servicio y logística',
        codigo: 'SL',
        duracionHoras: 4,
        color: 'var(--cap-asignatura-4)'
    },
    {
        id: 5,
        nombre: 'Salud y seguridad',
        codigo: 'SS',
        duracionHoras: 4,
        color: 'var(--cap-asignatura-5)'
    },
    {
        id: 6,
        nombre: 'Medio ambiente',
        codigo: 'MA',
        duracionHoras: 4,
        color: 'var(--cap-asignatura-6)'
    },
    {
        id: 7,
        nombre: 'Mercancías peligrosas',
        codigo: 'MP',
        duracionHoras: 3,
        color: 'var(--cap-asignatura-7)'
    },
    {
        id: 8,
        nombre: 'Viajeros',
        codigo: 'VIA',
        duracionHoras: 3,
        color: 'var(--cap-asignatura-8)'
    }
];

/* Mapa de asignaturas por ID para acceso rápido */
export const ASIGNATURAS_MAP = new Map(ASIGNATURAS_CAP.map(asig => [asig.id, asig]));

/* Mapa de asignaturas por código para acceso rápido */
export const ASIGNATURAS_POR_CODIGO = new Map(ASIGNATURAS_CAP.map(asig => [asig.codigo, asig]));

/*
 * Mapeo de códigos snake_case (del seeder PHP) a códigos estándar
 * Esto permite compatibilidad entre backend y frontend
 */
const CODIGOS_ALIAS: Record<string, string> = {
    racionalizacion: 'CR',
    conduccion_racional: 'CR',
    reglamentacion: 'REG',
    seguridad_vial: 'SV',
    servicio_logistica: 'SL',
    salud_ergonomia: 'SS',
    salud_seguridad: 'SS',
    entorno_economico: 'MA',
    medio_ambiente: 'MA',
    evaluacion: 'VIA',
    viajeros: 'VIA',
    mercancias_peligrosas: 'MP'
};

/* Función helper para obtener asignatura por ID o Código */
export function getAsignatura(idOrCodigo: number | string): Asignatura | undefined {
    if (typeof idOrCodigo === 'number') {
        return ASIGNATURAS_MAP.get(idOrCodigo);
    }

    /* Si es string, probar si es número parseable */
    const parsed = parseInt(idOrCodigo, 10);
    if (!isNaN(parsed) && ASIGNATURAS_MAP.has(parsed)) {
        return ASIGNATURAS_MAP.get(parsed);
    }

    /* Si no, buscar por código */
    return getAsignaturaPorCodigo(idOrCodigo);
}

/* Función helper para obtener asignatura por código (soporta alias snake_case) */
export function getAsignaturaPorCodigo(codigo: string): Asignatura | undefined {
    /* Intentar primero con el código directo */
    const directa = ASIGNATURAS_POR_CODIGO.get(codigo);
    if (directa) return directa;

    /* Buscar alias si existe */
    const codigoNormalizado = CODIGOS_ALIAS[codigo];
    if (codigoNormalizado) {
        return ASIGNATURAS_POR_CODIGO.get(codigoNormalizado);
    }

    return undefined;
}

/* Colores de asignaturas para uso directo */
export const COLORES_ASIGNATURAS: Record<number, string> = {
    1: 'var(--cap-asignatura-1)',
    2: 'var(--cap-asignatura-2)',
    3: 'var(--cap-asignatura-3)',
    4: 'var(--cap-asignatura-4)',
    5: 'var(--cap-asignatura-5)',
    6: 'var(--cap-asignatura-6)',
    7: 'var(--cap-asignatura-7)',
    8: 'var(--cap-asignatura-8)'
};

/*
 * Slots horarios disponibles (formato 24h).
 * Incluye tanto intervalos de 45 min como horas redondas para
 * compatibilidad con datos del seeder y del motor de generación.
 */
export const SLOTS_HORARIOS = ['08:00', '08:45', '09:00', '09:30', '10:00', '10:15', '11:00', '11:45', '12:00', '12:30', '13:00', '13:15', '14:00', '15:00', '15:45', '16:00', '16:30', '17:00', '17:15', '18:00', '18:45', '19:00', '19:30', '20:00', '20:15', '21:00'].sort();

/* Helpers de formato de fecha */
export function formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

export function formatearFechaCorta(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}

/* Obtener el lunes de una semana dada */
export function getLunesDeSemana(fecha: Date): Date {
    const dia = fecha.getDay();
    const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
    /* Crear nueva fecha usando componentes locales para evitar offset UTC */
    const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), diff, 0, 0, 0, 0);
    return lunes;
}

/* Obtener array de fechas para una semana */
export function getFechasSemana(lunesSemana: Date): Date[] {
    return DIAS_SEMANA.map((_, idx) => {
        /* Crear fecha usando componentes locales para evitar offset UTC */
        const fecha = new Date(
            lunesSemana.getFullYear(),
            lunesSemana.getMonth(),
            lunesSemana.getDate() + idx,
            0, 0, 0, 0
        );
        return fecha;
    });
}
