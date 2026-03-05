/**
 * Tipos compartidos para el proyecto Cresta Campers.
 */

/* ------------------------------------------------------------------ */
/* Vehículo                                                            */
/* ------------------------------------------------------------------ */

export interface Vehiculo {
    id: number;
    slug: string;
    nombre: string;
    descripcionCorta: string;
    capacidad: number;
    plazasViaje: number;
    precioBase: number;
    imagen: string;
    ubicacion: string;
}

export interface VehiculoDetalle extends Vehiculo {
    contenido: string;
    combustible: string;
    transmision: string;
    fianza: number;
    kmIncluidos: number;
    edadMinima: number;
    politicaCancelacion: string;
    equipamiento: string[];
    galeria: GaleriaItem[];
    precios: PrecioTemporada[];
}

export interface GaleriaItem {
    id: number;
    url: string;
    alt: string;
}

/* ------------------------------------------------------------------ */
/* Precios                                                             */
/* ------------------------------------------------------------------ */

export type NombreTemporada = 'baja' | 'media' | 'alta' | 'especial';

export interface PrecioTemporada {
    temporada: NombreTemporada;
    multiplicador: number;
    precioNoche: number;
}

export interface DesgloseNoche {
    fecha: string;
    temporada: NombreTemporada;
    multiplicador: number;
    precio: number;
}

export interface CalculoPrecio {
    total: number;
    noches: number;
    desglose: DesgloseNoche[];
}

/* ------------------------------------------------------------------ */
/* Disponibilidad                                                      */
/* ------------------------------------------------------------------ */

export interface DisponibilidadResponse {
    success: boolean;
    disponible: boolean;
    motivo?: string;
    conflictos?: string[];
    precio?: CalculoPrecio;
    vehiculo?: {
        id: number;
        nombre: string;
        fianza: number;
    };
}

export interface CalendarioDia {
    dia: number;
    disponible: boolean;
    pasado: boolean;
}

export interface CalendarioResponse {
    success: boolean;
    vehiculoId: number;
    mes: number;
    anio: number;
    dias: CalendarioDia[];
}

/* ------------------------------------------------------------------ */
/* Reserva                                                             */
/* ------------------------------------------------------------------ */

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'fallida';

export interface DatosCliente {
    nombre: string;
    email: string;
    telefono: string;
    notas?: string;
}

export interface CrearReservaPayload extends DatosCliente {
    vehiculo_id: number;
    fecha_inicio: string;
    fecha_fin: string;
}

export interface CrearReservaResponse {
    success: boolean;
    reservaId?: number;
    checkoutUrl?: string;
    precio?: CalculoPrecio;
    error?: string;
    motivo?: string;
}

export interface ReservaDetalle {
    id: number;
    estado: EstadoReserva;
    fechaInicio: string;
    fechaFin: string;
    noches: number;
    precioNoche: number;
    precioTotal: number;
    temporada: NombreTemporada;
    nombreCliente: string;
    emailCliente: string;
    telefono: string;
    notas: string;
    vehiculo: {
        id: number;
        nombre: string;
        ubicacion: string;
    };
    recogida: string;
    devolucion: string;
}

export interface ReservaDetalleResponse {
    success: boolean;
    reserva?: ReservaDetalle;
    error?: string;
}

/* ------------------------------------------------------------------ */
/* API Responses                                                       */
/* ------------------------------------------------------------------ */

export interface VehiculosListResponse {
    success: boolean;
    vehiculos: Vehiculo[];
    total: number;
}

export interface VehiculoDetalleResponse {
    success: boolean;
    vehiculo: VehiculoDetalle;
}

export interface PreciosResponse {
    success: boolean;
    precioBase: number;
    precios: PrecioTemporada[];
}

/* ------------------------------------------------------------------ */
/* Panel Admin                                                         */
/* ------------------------------------------------------------------ */

export type SeccionPanel = 'dashboard' | 'reservas' | 'flota' | 'clientes' | 'configuracion';

export interface AdminReserva {
    id: number;
    estado: EstadoReserva;
    fechaInicio: string;
    fechaFin: string;
    noches: number;
    precioTotal: number;
    precioNoche: number;
    nombreCliente: string;
    emailCliente: string;
    telefono: string;
    vehiculoNombre: string;
    vehiculoId: number;
    temporada: string;
    notas: string;
    stripeSessionId: string;
    fechaCreacion: string;
}

export interface AdminEstadisticas {
    totalReservas: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
    ingresosMes: number;
    ingresosTotales: number;
    vehiculosActivos: number;
    clientesUnicos: number;
}

export interface AdminCliente {
    email: string;
    nombre: string;
    telefono: string;
    totalReservas: number;
    ultimaReserva: string;
    gastoTotal: number;
}

export interface AdminVehiculoEditable {
    id: number;
    nombre: string;
    descripcionCorta: string;
    capacidad: number;
    plazasViaje: number;
    combustible: string;
    transmision: string;
    precioBase: number;
    activo: boolean;
    ubicacion: string;
    fianza: number;
    kmIncluidos: number;
    edadMinima: number;
    equipamiento: string[];
    imagen: string;
}

export interface AdminConfiguracion {
    empresaNombre: string;
    empresaEmail: string;
    empresaTelefono: string;
    empresaDireccion: string;
    empresaCif: string;
    horarioRecogida: string;
    horarioDevolucion: string;
    minNoches: number;
    maxNoches: number;
    diasAnticipacion: number;
    multiplicadorMedia: number;
    multiplicadorAlta: number;
    multiplicadorEspecial: number;
    emailNotificaciones: string;
    stripeSecretKey: string;
    stripePublishableKey: string;
    stripeWebhookSecret: string;
    stripeMode: string;
}

/* Actividad reciente del dashboard */
export type TipoEvento =
    | 'nueva_reserva'
    | 'reserva_confirmada'
    | 'reserva_cancelada'
    | 'pago_fallido'
    | 'entrega_hoy'
    | 'devolucion_hoy'
    | 'devolucion_manana';

export interface EventoActividad {
    tipo: TipoEvento;
    mensaje: string;
    fecha: string;
    reservaId?: number;
    vehiculoNombre?: string;
    clienteNombre?: string;
}
