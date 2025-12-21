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

/*
 * Entidad Proyecto
 * Contenedor de alto nivel para agrupar tareas relacionadas
 */
export interface Proyecto {
    id: number;
    nombre: string;
    descripcion?: string;
    prioridad: NivelPrioridad;
    fechaLimite?: string;
    estado: 'activo' | 'completado' | 'pausado';
    /* Progreso calculado (0-100) */
    progreso?: number;
    fechaCreacion: string;
    fechaCompletado?: string;
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
    /* ID del proyecto al que pertenece la tarea (opcional) */
    proyectoId?: number;
    /* Campos opcionales */
    prioridad?: NivelPrioridad;
    /* Configuracion avanzada (fecha limite, descripcion, repeticion, adjuntos) */
    configuracion?: TareaConfiguracion;
}

export interface DashboardData {
    habitos: Habito[];
    tareas: Tarea[];
    proyectos?: Proyecto[];
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
    proyectoId?: number;
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
    proyectoId?: number;
}

/*
 * Tipos para el sistema de suscripción (Freemium)
 */

export type PlanSuscripcion = 'free' | 'premium';
export type EstadoSuscripcion = 'activa' | 'trial' | 'expirada';

/*
 * Límites por plan
 */
export interface LimitesPlan {
    habitos: number /* -1 = ilimitado */;
    tareasActivas: number /* -1 = ilimitado */;
    proyectos: number /* -1 = ilimitado */;
    adjuntosPorTarea: number /* 0 = no disponible */;
    sincronizacion: boolean;
    estadisticasAvanzadas: boolean;
    temas: boolean;
    cifradoE2E: boolean;
}

/*
 * Información completa de suscripción
 */
export interface InfoSuscripcion {
    plan: PlanSuscripcion;
    estado: EstadoSuscripcion;
    esPremium: boolean;
    diasRestantes: number | null;
    trialDisponible: boolean;
    limites: LimitesPlan;
    fechaInicio: string;
    fechaExpiracion: string | null;
}

/*
 * Error de límite excedido
 */
export interface ErrorLimite {
    tipo: 'habitos' | 'tareas' | 'proyectos' | 'adjuntos';
    limite: number;
    actual: number;
    mensaje: string;
}

/*
 * Tipos para el Panel de Administración
 */

/*
 * Información de suscripción para administración
 */
export interface SuscripcionAdmin {
    plan: PlanSuscripcion;
    estado: EstadoSuscripcion;
    fechaInicio: string | null;
    fechaExpiracion: string | null;
    diasRestantes: number | null;
    stripeCustomerId: string | null;
    ultimoPago: string | null;
}

/*
 * Estadísticas de uso de un usuario
 */
export interface EstadisticasUsuario {
    habitos: number;
    tareas: number;
    proyectos: number;
    tareasCompletadas: number;
}

/*
 * Usuario con información de administración
 */
export interface UsuarioAdmin {
    id: number;
    nombre: string;
    email: string;
    avatar: string;
    fechaRegistro: string;
    suscripcion: SuscripcionAdmin;
    estadisticas?: EstadisticasUsuario;
    cifradoActivo: boolean;
}

/*
 * Filtros para listar usuarios
 */
export interface FiltrosAdmin {
    plan: 'todos' | 'premium' | 'free' | 'trial';
    busqueda: string;
    ordenarPor: 'nombre' | 'fechaRegistro' | 'ultimoPago' | 'estado';
    orden: 'asc' | 'desc';
    pagina: number;
    porPagina: number;
}

/*
 * Información de paginación
 */
export interface PaginacionAdmin {
    pagina: number;
    porPagina: number;
    totalPaginas: number;
}

/*
 * Respuesta de listado de usuarios
 */
export interface RespuestaListaUsuarios {
    usuarios: UsuarioAdmin[];
    total: number;
    paginacion: PaginacionAdmin;
}

/*
 * Resumen global de estadísticas
 */
export interface ResumenAdmin {
    totalUsuarios: number;
    premium: number;
    trial: number;
    free: number;
}
