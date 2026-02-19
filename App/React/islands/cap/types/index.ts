/**
 * CAP Module - TypeScript Types
 *
 * Interfaces y tipos centrales del módulo CAP (Certificado de Aptitud Profesional).
 * Organizado por dominio para facilitar importaciones.
 *
 * Los tipos de enum y dia derivan del schema generado (schema.ts)
 * para mantener consistencia frontend/backend.
 */

import type {ICapAlumnos, ICapDisponibilidad, ICapSuscripciones} from '../../../types/_generated/schema';
export {CapAlumnosEnums, CapDisponibilidadEnums, CapSuscripcionesEnums} from '../../../types/_generated/schema';

/* Usuario y Autenticación */
export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'cap_admin' | 'administrator';
}

export interface ContextoUsuario {
    user: Usuario;
    restNonce: string;
    centroId: number;
}

/* Centro/Autoescuela */
export interface Centro {
    id: number;
    userId: number;
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    logo?: string;
    createdAt: string;
}

/* Configuración del Centro */
export interface ConfiguracionHorario {
    timezone?: string;
    mananaInicio: string;
    mananaFin: string;
    tardeInicio: string;
    tardeFin: string;
    viernesFin: string;
    duracionDescanso: number;
}

export interface ConfiguracionCapacidad {
    alumnosMaximosPorClase: number;
}

export interface Configuracion {
    id: number;
    centroId: number;
    horario: ConfiguracionHorario;
    capacidad: ConfiguracionCapacidad;
}

/* Alumnos */
export interface Alumno {
    id: number;
    centroId: number;
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
    horasCompletadas: number;
    estado: ICapAlumnos['estado'];
    createdAt: string;
}

/* Derivado del schema generado para consistencia con la BD */
export type EstadoAlumno = ICapAlumnos['estado'];

/* Disponibilidad */
export interface SlotDisponibilidad {
    dia: DiaSemana;
    hora: string;
    disponible: boolean;
}

export interface DisponibilidadAlumno {
    alumnoId: number;
    slots: SlotDisponibilidad[];
}

/* Calendario y Clases */
/* Derivado del schema generado para consistencia con la BD */
export type DiaSemana = ICapDisponibilidad['dia'];

/*
 * Datos del alumno asignado a una clase.
 * Viene directamente de la API (obtenerAlumnosClase).
 */
export interface AlumnoClase {
    id: number;
    nombre: string;
    asistio: boolean;
}

export interface Clase {
    id: number;
    centroId: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    /** ID numérico o código string de la asignatura (el seeder PHP usa códigos) */
    asignaturaId: number | string;
    bloqueada: boolean;
    alumnosIds: number[];
    /** Datos completos de los alumnos asignados (viene de la API) */
    alumnosData: AlumnoClase[];
}

/* Asignaturas CAP */
export interface Asignatura {
    id: number;
    nombre: string;
    codigo: string;
    duracionHoras: number;
    color: string;
}

/* Suscripciones */
/* Derivado del schema generado — trial/grace eliminados (no existen en BD), pago_fallido agregado */
export type EstadoSuscripcion = ICapSuscripciones['estado'];

export interface Suscripcion {
    id: number;
    centroId: number;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    estado: EstadoSuscripcion;
    planId: string;
    fechaInicio: string;
    fechaProximaFacturacion: string;
    fechaExpiracion?: string;
}

/* Navegación */
export type SeccionDashboard = 'calendario' | 'alumnos' | 'configuracion' | 'reportes';

/* Respuestas API */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/* Conflictos de Aforo */
export interface ConflictoAforo {
    tipo: 'aforo';
    slotKey: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    demanda: number;
    capacidad: number;
    exceso: number;
    alumnos: number[];
}

/* Exclusiones para resolver conflictos */
export interface ExclusionesConflicto {
    [slotKey: string]: number[];
}

/* Resultado de generación */
export interface ResultadoGeneracion {
    exito: boolean;
    clases: Clase[];
    conflictos: ConflictoAforo[];
    mensaje?: string;
    /** Avisos informativos (ej: horas no cubiertas) */
    avisos?: AvisoGeneracion[];
}

/* Aviso de horas no cubiertas por día */
export interface AvisoGeneracion {
    tipo: 'horas_no_cubiertas';
    fecha: string;
    diaSemana: string;
    horasDisponiblesCentro: number;
    horasAsignadas: number;
    horasSinCubrir: number;
    /** Rangos horarios consecutivos sin cubrir (ej: ["09:00 - 11:00", "14:00 - 15:00"]) */
    rangosNoCubiertos?: string[];
    /** Campos opcionales de contexto */
    alumnosActivos?: number;
    maxHorasDiaAlumno?: number;
    capacidadClase?: number;
}

/* Preview de generación */
export interface PreviewGeneracion {
    totalSlots: number;
    totalHorasEstimadas: number;
    conflictos: number;
    alumnos: number;
    puedeGenerar: boolean;
}
