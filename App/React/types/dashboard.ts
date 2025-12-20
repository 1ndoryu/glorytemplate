/*
 * Tipos para el Dashboard
 * Definiciones de interfaces para los datos del dashboard
 */

/*
 * Niveles de importancia para habitos
 * Alta: habitos criticos para objetivos principales
 * Media: habitos importantes pero no criticos
 * Baja: habitos deseables pero opcionales
 */
export type NivelImportancia = 'Alta' | 'Media' | 'Baja';

/*
 * Niveles de prioridad para tareas
 * Usado para ordenar y destacar tareas urgentes
 */
export type NivelPrioridad = 'alta' | 'media' | 'baja';

/*
 * Tipos de frecuencia para habitos
 * Define cada cuanto tiempo debe realizarse un habito
 */
export type TipoFrecuencia = 'diario' | 'cadaXDias' | 'semanal' | 'diasEspecificos' | 'mensual';

/*
 * Dias de la semana para frecuencia diasEspecificos
 */
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

/*
 * Configuracion de frecuencia para un habito
 * Permite definir cuando debe realizarse el habito
 */
export interface FrecuenciaHabito {
    tipo: TipoFrecuencia;
    /* Para 'cadaXDias': numero de dias entre repeticiones */
    cadaDias?: number;
    /* Para 'diasEspecificos': dias de la semana */
    diasSemana?: DiaSemana[];
    /* Para 'mensual': veces por mes */
    vecesAlMes?: number;
}

/*
 * Frecuencia por defecto: diario
 */
export const FRECUENCIA_POR_DEFECTO: FrecuenciaHabito = {
    tipo: 'diario'
};

export interface Habito {
    id: number;
    nombre: string;
    importancia: NivelImportancia;
    diasInactividad: number;
    racha: number;
    tags: string[];
    historialCompletados: string[] /* Fechas ISO de completados */;
    ultimoCompletado?: string /* Fecha ISO del ultimo completado */;
    fechaCreacion: string /* Fecha ISO de cuando se creo el habito */;
    /* Frecuencia del habito (opcional, por defecto diario) */
    frecuencia?: FrecuenciaHabito;
}

/*
 * Tipos de repeticion para tareas
 * despuesCompletar: La tarea reaparece X dias despues de completarla
 * intervaloFijo: La tarea reaparece en fechas fijas (cada X dias o dias especificos)
 */
export type TipoRepeticion = 'despuesCompletar' | 'intervaloFijo';

/*
 * Configuracion de repeticion para una tarea
 */
export interface RepeticionTarea {
    tipo: TipoRepeticion;
    /* Dias de intervalo (para ambos tipos) */
    intervalo: number;
    /* Para intervalo fijo semanal: dias de la semana */
    diasSemana?: DiaSemana[];
    /* Fecha de la ultima repeticion generada */
    ultimaRepeticion?: string;
}

/*
 * Archivo adjunto a una tarea
 */
export interface Adjunto {
    id: number;
    tipo: 'imagen' | 'audio' | 'archivo';
    url: string;
    nombre: string;
    tamano: number /* en bytes */;
    fechaSubida: string;
}

/*
 * Configuracion avanzada de una tarea
 */
export interface TareaConfiguracion {
    fechaMaxima?: string /* Fecha limite ISO */;
    descripcion?: string /* Notas detalladas */;
    repeticion?: RepeticionTarea;
    adjuntos?: Adjunto[];
}

export interface Tarea {
    id: number;
    texto: string;
    completado: boolean;
    fechaCreacion?: string /* Fecha ISO de cuando se creo la tarea */;
    fechaCompletado?: string /* Fecha ISO de cuando se completo la tarea */;
    /* Orden manual para drag & drop (menor = primero) */
    orden?: number;
    /* ID de tarea padre para subtareas (solo un nivel de anidacion) */
    parentId?: number;
    /* Campos opcionales */
    prioridad?: NivelPrioridad;
    /* Configuracion avanzada (fecha limite, descripcion, repeticion, adjuntos) */
    configuracion?: TareaConfiguracion;
}

export interface DashboardData {
    habitos: Habito[];
    tareas: Tarea[];
    notasIniciales?: string;
}

/*
 * Configuracion del Dashboard
 * Parametros ajustables para el comportamiento de habitos
 */
export interface ConfiguracionDashboard {
    /* Dias de inactividad maximos antes de resetear la racha */
    umbralReseteoRacha: number;
    /* Dias restantes para mostrar advertencia de perdida de racha */
    diasAdvertenciaRacha: number;
}

/*
 * Datos para crear un nuevo habito
 */
export interface DatosNuevoHabito {
    nombre: string;
    importancia: NivelImportancia;
    tags: string[];
    frecuencia?: FrecuenciaHabito;
}

/*
 * Datos para crear una nueva tarea
 */
export interface DatosNuevaTarea {
    texto: string;
    prioridad?: NivelPrioridad;
    configuracion?: TareaConfiguracion;
}

/*
 * Datos para editar una tarea existente
 * prioridad puede ser null para eliminar la prioridad de la tarea
 */
export interface DatosEdicionTarea {
    texto?: string;
    prioridad?: NivelPrioridad | null;
    completado?: boolean;
    parentId?: number;
    /* ID de la tarea después de la cual insertar (solo para creación) */
    insertarDespuesDe?: number;
    /* Configuración avanzada de la tarea */
    configuracion?: TareaConfiguracion;
}
