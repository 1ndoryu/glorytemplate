/**
 * Tipos compartidos para el sistema de planes de precios.
 * TO-DO: Conectar con Stripe para checkout real.
 */

export interface CaracteristicaPlan {
    texto: string;
    incluido: boolean;
}

export interface PlanServicio {
    id: string;
    nombre: string;
    precio: string;
    periodo?: string;
    descripcion: string;
    caracteristicas: CaracteristicaPlan[];
    destacado?: boolean;
    esPersonalizado?: boolean;
    ctaTexto: string;
    ctaLink: string;
}

export interface PlanesDeServicio {
    servicioSlug: string;
    servicioTitulo: string;
    planes: PlanServicio[];
}

/* Helpers para crear caracteristicas rapido */
export const incluida = (texto: string): CaracteristicaPlan => ({texto, incluido: true});
export const noIncluida = (texto: string): CaracteristicaPlan => ({texto, incluido: false});
