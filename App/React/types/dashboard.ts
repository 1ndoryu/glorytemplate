/* sentinel-disable-file limite-lineas — archivo central de tipos/interfaces del dashboard, no es un componente */
/*
 * Tipos para el Dashboard
 * Definiciones de interfaces para los datos del dashboard
 */

/*
 * Niveles de importancia para habitos
 * Muy Alta: habitos críticos e innegociables (máxima prioridad)
 * Alta: habitos criticos para objetivos principales
 * Media: habitos importantes pero no criticos
 * Baja: habitos deseables pero opcionales
 */
export type NivelImportancia = 'Muy Alta' | 'Alta' | 'Media' | 'Baja' | 'Muy Baja';

/*
 * Niveles de prioridad para tareas (importancia)
 * Usado para ordenar y destacar tareas importantes
 * muy_alta: tareas críticas e innegociables (máxima prioridad)
 */
export type NivelPrioridad = 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja';

/*
 * Niveles de urgencia para tareas y proyectos (temporalidad)
 * Diferencia entre importancia y temporalidad:
 * - Prioridad: cuán importante es la tarea
 * - Urgencia: cuándo debe hacerse
 *
 * bloqueante: Debe hacerse SÍ o SÍ, no se puede evitar (200% urgente)
 * urgente: Debe hacerse pronto, no puede esperar mucho
 * normal: Default. No muestra badge (valor asumido si no se especifica)
 * chill: Puede hacerse en cualquier momento sin presión temporal
 */
export type NivelUrgencia = 'bloqueante' | 'urgente' | 'normal' | 'chill';

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

/*
 * SubHabito: Hábito anidado dentro de otro hábito
 * Solo permite un nivel de anidación (sin subhábitos recursivos)
 * Hereda inicialmente propiedades del padre pero puede tener frecuencia e importancia independiente
 */
export interface SubHabito {
    id: number;
    nombre: string;
    importancia: NivelImportancia;
    frecuencia?: FrecuenciaHabito;
    historialCompletados: string[];
    historialPospuestos?: string[];
    ultimoCompletado?: string;
    fechaCreacion: string;
    /* Campos heredados del padre al crear (pueden modificarse independientemente) */
    diasInactividad: number;
    racha: number;
    pausado?: boolean;
    fechaPausa?: string;
    /* Posposición temporal individual (diferente de historialPospuestos que es por día) */
    pospuestoHasta?: string;
    /* Ventana de oportunidad individual (hereda del padre si no se define) */
    ventanaOportunidad?: VentanaOportunidad;
}

export interface Habito {
    id: number;
    nombre: string;
    importancia: NivelImportancia;
    diasInactividad: number;
    racha: number;
    tags: string[];
    historialCompletados: string[] /* Fechas ISO de completados */;
    /* Historial de fechas pospuestas (no cuentan como incumplimiento) */
    historialPospuestos?: string[];
    ultimoCompletado?: string /* Fecha ISO del ultimo completado */;
    fechaCreacion: string /* Fecha ISO de cuando se creo el habito */;
    /* Frecuencia del habito (opcional, por defecto diario) */
    frecuencia?: FrecuenciaHabito;
    /* Campos esteticos */
    descripcion?: string;
    icono?: string;
    colorIcono?: string;
    /* Estado de pausa: el habito no aparece en pendientes y la racha se congela */
    pausado?: boolean;
    fechaPausa?: string /* Fecha ISO de cuando se pauso el habito */;
    /* IDs de tareas asociadas al habito, en orden personalizado (Fase 14.8) */
    tareasIds?: number[];
    /* SubHabitos: hábitos anidados con frecuencia e importancia independiente */
    subhabitos?: SubHabito[];
    /* Ventana de oportunidad: período de tiempo óptimo para realizar el hábito */
    ventanaOportunidad?: VentanaOportunidad;
    /* [2303A-41] Fecha ISO hasta la que el hábito está pospuesto por tiempo (diferente de historialPospuestos que es por día) */
    pospuestoHasta?: string;
    /* [014A-19] Timestamp de última modificación local (ms). Usado para resolución de
     * conflictos per-entity: el backend rechaza writes con updatedAt menor al existente. */
    updatedAt?: number;
}

/*
 * Ventana de oportunidad para un hábito
 * Define el período de tiempo óptimo para realizar el hábito
 */
export interface VentanaOportunidad {
    /* Hora de inicio (0-23) */
    horaInicio: number;
    /* Minuto de inicio (0-59) */
    minutoInicio: number;
    /* Hora de fin (0-23) */
    horaFin: number;
    /* Minuto de fin (0-59) */
    minutoFin: number;
    /* Si la ventana está habilitada */
    habilitada: boolean;
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
    /* URL del thumbnail (sin cifrar, solo para imágenes) */
    thumbnailUrl?: string;
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
    /* Icono del proyecto (id del icono de lucide) */
    icono?: string;
    /* Color del icono (hex) */
    colorIcono?: string;
    prioridad: NivelPrioridad;
    /* Urgencia: temporalidad (bloqueante, urgente, normal, chill) */
    urgencia?: NivelUrgencia;
    fechaLimite?: string;
    estado: 'activo' | 'completado' | 'pausado';
    /* Progreso calculado (0-100) */
    progreso?: number;
    fechaCreacion: string;
    fechaCompletado?: string;
    /* Metadata para proyectos compartidos conmigo */
    esCompartido?: boolean;
    propietarioId?: number;
    propietarioNombre?: string;
    propietarioAvatar?: string;
    miRol?: RolCompartido;
    /* Adjuntos del proyecto (Fase 9) */
    adjuntos?: Adjunto[];
    /* Hitos del proyecto (Fase 9) */
    hitos?: Hito[];
    /* [014A-19] Timestamp de última modificación local (ms) para resolución de conflictos. */
    updatedAt?: number;
}

export interface Hito {
    id: number;
    titulo: string;
    completado: boolean;
    prioridad: NivelPrioridad;
    fechaLimite?: string;
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
    /* ID del habito al que pertenece la tarea - Fase 14.8 (opcional) */
    habitoId?: number;
    /* ID del grupo/seccion al que pertenece la tarea (TAREA 3) */
    grupoId?: number;
    /* Campos opcionales */
    prioridad?: NivelPrioridad;
    /* Urgencia: temporalidad (bloqueante, urgente, normal, chill) */
    urgencia?: NivelUrgencia;
    /* Configuracion avanzada (fecha limite, descripcion, repeticion, adjuntos) */
    configuracion?: TareaConfiguracion;
    /* Asignacion de tarea a un participante */
    asignadoA?: number /* ID del usuario asignado */;
    asignadoANombre?: string /* Nombre del usuario para evitar lookups */;
    asignadoAAvatar?: string /* Avatar del usuario asignado */;
    /* Metadata para tareas compartidas/asignadas a mi */
    esCompartido?: boolean;
    propietarioId?: number;
    propietarioNombre?: string;
    propietarioAvatar?: string;
    miRol?: RolCompartido;
    /* Tags (Fase 9.7.3) */
    tags?: string[];
    /* [2303A-41] Fecha ISO hasta la que la tarea está pospuesta. Si es futuro, se oculta del panel. */
    pospuestoHasta?: string;
    /* [014A-19] Timestamp de última modificación local (ms) para resolución de conflictos. */
    updatedAt?: number;
}

/*
 * GrupoTareas: Seccion/agrupacion de tareas (TAREA 3)
 * Permite organizar tareas en grupos colapsables con titulo editable
 */
export interface GrupoTareas {
    id: number;
    nombre: string;
    /* Orden del grupo en la lista (menor = primero) */
    orden: number;
    /* Estado de colapso (true = colapsado) */
    colapsado: boolean;
    /* Proyecto al que pertenece (opcional - si no, es grupo global) */
    proyectoId?: number;
    /* Fecha de creacion */
    fechaCreacion: string;
    /* Grupo del sistema (no editable/eliminable, ej: Libres) */
    esSistema?: boolean;
}

/*
 * Tarea virtual derivada de un hábito
 * Aparece en Ejecución cuando "toca hoy" y está habilitada la opción
 * La urgencia se calcula automáticamente basada en días de inactividad
 */
export interface TareaHabito extends Tarea {
    /* Indica que es una tarea virtual de hábito */
    esHabito: true;
    /* ID del hábito origen */
    habitoId: number;
    /* Nombre del hábito (para mostrar badge) */
    habitoNombre: string;
    /* Racha actual del hábito */
    habitoRacha: number;
    /* Importancia del hábito */
    habitoImportancia: NivelImportancia;
    /* Si el hábito está en su ventana de oportunidad */
    enVentanaOportunidad?: boolean;
}

/*
 * Tipo unión para tareas regulares y tareas-hábito
 */
export type TareaOHabito = Tarea | TareaHabito | TareaSubHabito;

/*
 * Type guard para verificar si una tarea es un hábito virtual
 */
export function esTareaHabito(tarea: TareaOHabito): tarea is TareaHabito {
    return 'esHabito' in tarea && tarea.esHabito === true;
}

/*
 * [207A-3] Tarea virtual derivada de un subhábito
 * Similar a TareaHabito pero para subhábitos individuales.
 * Permite routing correcto en menú contextual y registro de actividad.
 */
export interface TareaSubHabito extends Tarea {
    esSubHabito: true;
    habitoPadreId: number;
    subHabitoId: number;
}

/*
 * Type guard para verificar si una tarea es un subhábito virtual
 */
export function esTareaSubHabito(tarea: TareaOHabito): tarea is TareaSubHabito {
    return 'esSubHabito' in tarea && tarea.esSubHabito === true;
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
    descripcion?: string;
    icono?: string;
    colorIcono?: string;
    /* TAREA 4: Ventana de oportunidad */
    ventanaOportunidad?: VentanaOportunidad;
}

/*
 * Datos para crear un nuevo subhabito
 * Hereda inicialmente propiedades del habito padre
 */
export interface DatosNuevoSubHabito {
    nombre: string;
    importancia: NivelImportancia;
    frecuencia?: FrecuenciaHabito;
    ventanaOportunidad?: VentanaOportunidad;
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
 * urgencia puede ser null para eliminar la urgencia (vuelve a 'normal')
 */
export interface DatosEdicionTarea {
    texto?: string;
    prioridad?: NivelPrioridad | null;
    /* Urgencia: temporalidad (bloqueante, urgente, normal, chill) */
    urgencia?: NivelUrgencia | null;
    completado?: boolean;
    parentId?: number;
    /* ID de la tarea después de la cual insertar (solo para creación) */
    insertarDespuesDe?: number;
    /* Configuración avanzada de la tarea */
    configuracion?: TareaConfiguracion;
    proyectoId?: number;
    /* ID del habito al que pertenece la tarea - Fase 14.8 */
    habitoId?: number;
    /* ID del grupo/seccion al que pertenece la tarea (TAREA 3) */
    grupoId?: number;
    /* Asignación de tarea */
    asignadoA?: number | null;
    asignadoANombre?: string;
    asignadoAAvatar?: string;

    tags?: string[];
    /* [2303A-41] Posponer tarea hasta fecha ISO. null = quitar posposición. */
    pospuestoHasta?: string | null;
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

/*
 * Información de almacenamiento del usuario
 * Usado para mostrar uso de espacio y límites
 */
export interface InfoAlmacenamiento {
    usado: number;
    usadoFormateado: string;
    limite: number;
    limiteFormateado: string;
    disponible: number;
    disponibleFormateado: string;
    porcentaje: number;
    cercaDelLimite: boolean;
    limiteExcedido: boolean;
    esPremium: boolean;
}

/*
 * Tipos para el Sistema de Equipos (Social)
 */

/*
 * Estados posibles de una solicitud de equipo
 */
export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'rechazada' | 'pendiente_registro';

/*
 * Datos básicos de un usuario en el contexto de equipos
 */
export interface UsuarioEquipo {
    id: number;
    nombre: string;
    email: string;
    avatar: string;
}

/*
 * Solicitud de conexión (recibida o enviada)
 */
export interface SolicitudEquipo {
    id: number;
    estado: EstadoSolicitud;
    fechaSolicitud: string;
    fechaRespuesta: string | null;
    email: string | null;
    usuario: UsuarioEquipo | null;
    esMia: boolean;
}

/*
 * Compañero activo (conexión aceptada)
 */
export interface CompaneroEquipo {
    id: number;
    companeroId: number;
    nombre: string;
    email: string;
    avatar: string;
    fechaConexion: string;
}

/*
 * Contadores del equipo
 */
export interface ContadoresEquipo {
    recibidas: number;
    enviadas: number;
    companeros: number;
}

/*
 * Estructura completa del equipo
 */
export interface EquipoCompleto {
    recibidas: SolicitudEquipo[];
    enviadas: SolicitudEquipo[];
    companeros: CompaneroEquipo[];
    contadores: ContadoresEquipo;
}

/*
 * Tipos para el Sistema de Notificaciones In-App
 */

/*
 * Tipos de notificación disponibles
 */
export type TipoNotificacion = 'solicitud_equipo' | 'solicitud_aceptada' | 'tarea_vence_hoy' | 'tarea_asignada' | 'tarea_removida' | 'adjunto_agregado' | 'mensaje_chat' | 'habito_companero' | 'elemento_compartido';

/*
 * Datos extra específicos por tipo de notificación
 */
export interface DatosExtraSolicitudEquipo {
    solicitudId: number;
    usuarioId: number;
    usuarioNombre: string;
    usuarioEmail: string;
    usuarioAvatar: string;
}

export interface DatosExtraTareaVence {
    tareaId: number;
    tareaTexto: string;
    proyectoId?: number;
}

export interface DatosExtraTareaAsignada {
    tareaId: number;
    tareaTexto: string;
    asignadoPor: number;
    asignadoPorNombre: string;
}

/*
 * Datos extra genéricos (unión de todos los tipos específicos)
 */
export type DatosExtraNotificacion = DatosExtraSolicitudEquipo | DatosExtraTareaVence | DatosExtraTareaAsignada | Record<string, unknown> | null;

/*
 * Notificación individual
 */
export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    titulo: string;
    contenido: string | null;
    leida: boolean;
    fechaCreacion: string;
    fechaLectura: string | null;
    datosExtra: DatosExtraNotificacion;
}

/*
 * Paginación de notificaciones
 */
export interface PaginacionNotificaciones {
    pagina: number;
    porPagina: number;
    totalPaginas: number;
}

/*
 * Respuesta de listado de notificaciones
 */
export interface RespuestaNotificaciones {
    notificaciones: Notificacion[];
    total: number;
    paginacion: PaginacionNotificaciones;
}

/*
 * Tipos para el Sistema de Compartidos (Colaboración)
 */

/*
 * Tipos de elemento que pueden compartirse
 */
export type TipoElementoCompartido = 'tarea' | 'proyecto' | 'habito';

/*
 * Roles de usuario en un elemento compartido
 * propietario: Control total (solo el creador original)
 * colaborador: Puede editar pero no eliminar
 * observador: Solo lectura
 */
export type RolCompartido = 'propietario' | 'colaborador' | 'observador';

/*
 * Elemento compartido conmigo (lo veo en mi dashboard)
 */
export interface ElementoCompartidoConmigo {
    id: number;
    tipo: TipoElementoCompartido;
    elementoId: number;
    propietarioId: number;
    propietarioNombre: string;
    propietarioEmail: string;
    propietarioAvatar: string;
    rol: RolCompartido;
    fechaCompartido: string;
}

/*
 * Elemento que yo he compartido con alguien
 */
export interface ElementoCompartidoPorMi {
    id: number;
    tipo: TipoElementoCompartido;
    elementoId: number;
    usuarioId: number;
    usuarioNombre: string;
    usuarioEmail: string;
    usuarioAvatar: string;
    rol: RolCompartido;
    fechaCompartido: string;
}

/*
 * Participante de un elemento compartido
 */
export interface Participante {
    id: number;
    usuarioId: number;
    nombre: string;
    email: string;
    avatar: string;
    rol: RolCompartido;
    esPropietario: boolean;
}

/*
 * Permisos de acceso a un elemento
 */
export interface PermisosAcceso {
    rol: RolCompartido;
    puedeEditar: boolean;
    puedeEliminar: boolean;
}

/*
 * Contadores de elementos compartidos
 */
export interface ContadoresCompartidos {
    tareas: number;
    proyectos: number;
    habitos: number;
    total: number;
}

/*
 * Datos para compartir un elemento
 */
export interface DatosCompartir {
    tipo: TipoElementoCompartido;
    elementoId: number;
    usuarioId: number;
    rol?: RolCompartido;
}

/*
 * Información de sincronización
 * Estado actual de la conexión con el servidor
 */
export interface SincronizacionInfo {
    sincronizado: boolean;
    pendiente: boolean;
    error: string | null;
    estaLogueado: boolean;
    sincronizarAhora: () => Promise<boolean>;
    onLogin?: () => void;
    onLogout?: () => void;
    cargandoDesdeServidor?: boolean;
}
