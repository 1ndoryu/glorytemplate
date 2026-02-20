/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Regenerar con: npx glory schema:generate */

export interface ICapAlumnos {
  id: number
  centroId: number
  nombre: string
  email: string
  telefono: string
  dni: string
  horasCompletadas: number
  estado: 'activo' | 'completado' | 'pausado'
  createdAt: string | null
  updatedAt: string | null
}

export interface ICapAsistencia {
  id: number
  claseId: number
  alumnoId: number
  asistio: boolean
  createdAt: string | null
}

export interface ICapCentros {
  id: number
  userId: number
  nombre: string
  direccion: string
  telefono: string
  email: string
  logoUrl: string
  createdAt: string | null
  updatedAt: string | null
}

export interface ICapClases {
  id: number
  centroId: number
  fecha: string
  horaInicio: string
  horaFin: string
  asignatura: string
  duracionMinutos: number
  bloqueada: boolean
  createdAt: string | null
}

export interface ICapConfiguracion {
  id: number
  centroId: number
  timezone: string
  horaInicioManana: string
  horaFinManana: string
  horaInicioTarde: string
  horaFinTarde: string
  viernesEspecial: boolean
  horaFinViernes: string
  alumnosMaxClase: number
  duracionClase: number
  duracionDescanso: number
  horariosSemanales: Record<string, unknown> | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ICapDisponibilidad {
  id: number
  alumnoId: number
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'
  hora: string
  disponible: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface ICapSuscripciones {
  id: number
  centroId: number
  stripeCustomerId: string
  stripeSubscriptionId: string
  estado: 'activa' | 'expirada' | 'cancelada' | 'pago_fallido'
  fechaInicio: string | null
  fechaFin: string | null
  createdAt: string | null
  updatedAt: string | null
}

/* Constantes de columna (mirror de PHP) */
export const CapAlumnosCols = {
  TABLA: 'cap_alumnos',
  ID: 'id',
  CENTRO_ID: 'centro_id',
  NOMBRE: 'nombre',
  EMAIL: 'email',
  TELEFONO: 'telefono',
  DNI: 'dni',
  HORAS_COMPLETADAS: 'horas_completadas',
  ESTADO: 'estado',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const CapAsistenciaCols = {
  TABLA: 'cap_asistencia',
  ID: 'id',
  CLASE_ID: 'clase_id',
  ALUMNO_ID: 'alumno_id',
  ASISTIO: 'asistio',
  CREATED_AT: 'created_at'
} as const

export const CapCentrosCols = {
  TABLA: 'cap_centros',
  ID: 'id',
  USER_ID: 'user_id',
  NOMBRE: 'nombre',
  DIRECCION: 'direccion',
  TELEFONO: 'telefono',
  EMAIL: 'email',
  LOGO_URL: 'logo_url',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const CapClasesCols = {
  TABLA: 'cap_clases',
  ID: 'id',
  CENTRO_ID: 'centro_id',
  FECHA: 'fecha',
  HORA_INICIO: 'hora_inicio',
  HORA_FIN: 'hora_fin',
  ASIGNATURA: 'asignatura',
  DURACION_MINUTOS: 'duracion_minutos',
  BLOQUEADA: 'bloqueada',
  CREATED_AT: 'created_at'
} as const

export const CapConfiguracionCols = {
  TABLA: 'cap_configuracion',
  ID: 'id',
  CENTRO_ID: 'centro_id',
  TIMEZONE: 'timezone',
  HORA_INICIO_MANANA: 'hora_inicio_manana',
  HORA_FIN_MANANA: 'hora_fin_manana',
  HORA_INICIO_TARDE: 'hora_inicio_tarde',
  HORA_FIN_TARDE: 'hora_fin_tarde',
  VIERNES_ESPECIAL: 'viernes_especial',
  HORA_FIN_VIERNES: 'hora_fin_viernes',
  ALUMNOS_MAX_CLASE: 'alumnos_max_clase',
  DURACION_CLASE: 'duracion_clase',
  DURACION_DESCANSO: 'duracion_descanso',
  HORARIOS_SEMANALES: 'horarios_semanales',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const CapDisponibilidadCols = {
  TABLA: 'cap_disponibilidad',
  ID: 'id',
  ALUMNO_ID: 'alumno_id',
  DIA: 'dia',
  HORA: 'hora',
  DISPONIBLE: 'disponible',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const CapSuscripcionesCols = {
  TABLA: 'cap_suscripciones',
  ID: 'id',
  CENTRO_ID: 'centro_id',
  STRIPE_CUSTOMER_ID: 'stripe_customer_id',
  STRIPE_SUBSCRIPTION_ID: 'stripe_subscription_id',
  ESTADO: 'estado',
  FECHA_INICIO: 'fecha_inicio',
  FECHA_FIN: 'fecha_fin',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

/* Constantes de valores enum/check (mirror de PHP) */
export const CapAlumnosEnums = {
  ESTADO_ACTIVO: 'activo',
  ESTADO_COMPLETADO: 'completado',
  ESTADO_PAUSADO: 'pausado'
} as const

export const CapDisponibilidadEnums = {
  DIA_LUNES: 'lunes',
  DIA_MARTES: 'martes',
  DIA_MIERCOLES: 'miercoles',
  DIA_JUEVES: 'jueves',
  DIA_VIERNES: 'viernes'
} as const

export const CapSuscripcionesEnums = {
  ESTADO_ACTIVA: 'activa',
  ESTADO_EXPIRADA: 'expirada',
  ESTADO_CANCELADA: 'cancelada',
  ESTADO_PAGO_FALLIDO: 'pago_fallido'
} as const
