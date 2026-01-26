/*
 * Tipos para servicios publicados y contratados.
 * ServicioPublicado: lo que un proveedor ofrece (modelo Fiverr)
 * ServicioContratado: lo que un cliente compra
 */

export type TipoServicio = 'diseno_web' | 'mantenimiento' | 'desarrollo';
export type EstadoServicio = 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
export type CategoriaServicio = 'web' | 'marketing' | 'consultoria' | 'diseno' | 'desarrollo';

/* Servicio que el proveedor publica y ofrece */
export interface ServicioPublicado {
    id: string;
    proveedorId: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagenUrl: string;
    categoria: CategoriaServicio;
    tiempoEntregaDias: number;
    activo: boolean;
    fechaCreacion: string;
}

/* Servicio que el cliente contrata */
export interface ServicioContratado {
    id: string;
    clienteId: string;
    servicioPublicadoId?: string;
    imagenUrl?: string;
    tipo: TipoServicio;
    nombre: string;
    descripcion: string;
    precio: number;
    estado: EstadoServicio;
    fechaInicio: string;
    fechaContratacion?: string;
    fechaEntregaEstimada?: string;
    progreso?: number;
    revisionesRestantes?: number;
    pagoAlFinalizar: boolean;
    incluyeHosting: boolean;
    incluyeDominio: boolean;
    hostingMesesIncluidos: number;
    proveedorNombre?: string;
    clienteNombre?: string;
}
