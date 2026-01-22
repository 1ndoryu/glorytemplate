/*
 * Tipos para servicios contratados por clientes.
 * Ej: diseño web, mantenimiento, desarrollo personalizado.
 */

export type TipoServicio = 'diseno_web' | 'mantenimiento' | 'desarrollo';
export type EstadoServicio = 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';

export interface ServicioContratado {
    id: string;
    clienteId: string;
    tipo: TipoServicio;
    nombre: string;
    descripcion: string;
    precio: number;
    estado: EstadoServicio;
    fechaInicio: string;
    fechaEntregaEstimada?: string;
    pagoAlFinalizar: boolean;
    incluyeHosting: boolean;
    incluyeDominio: boolean;
    hostingMesesIncluidos: number;
}
