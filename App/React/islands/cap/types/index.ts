/**
 * CAP Module - TypeScript Types
 *
 * Interfaces y tipos centrales del módulo CAP (Certificado de Aptitud Profesional).
 * Organizado por dominio para facilitar importaciones.
 */

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
    estado: 'activo' | 'completado' | 'pausado';
    createdAt: string;
}

export type EstadoAlumno = Alumno['estado'];

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
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export interface Clase {
    id: number;
    centroId: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    asignaturaId: number;
    bloqueada: boolean;
    alumnosIds: number[];
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
export type EstadoSuscripcion = 'activa' | 'expirada' | 'cancelada' | 'trial' | 'grace';

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
}

/* Preview de generación */
export interface PreviewGeneracion {
    totalSlots: number;
    totalHorasEstimadas: number;
    conflictos: number;
    alumnos: number;
    puedeGenerar: boolean;
}
