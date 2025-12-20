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
    /* Campos opcionales para funcionalidades futuras */
    prioridad?: NivelPrioridad;
    fechaLimite?: string /* Fecha ISO de fecha limite */;
    descripcion?: string /* Notas adicionales expandibles */;
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
    fechaLimite?: string;
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
}
