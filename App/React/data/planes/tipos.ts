/**
 * Tipos compartidos para el sistema de planes de precios.
 * Integración con Stripe via stripePriceId (opcional hasta configurar IDs en Stripe Dashboard).
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
    /* ID del precio en Stripe Dashboard. Vacío = redirige a contacto */
    stripePriceId?: string;
    /* Modo de checkout: payment (único) o subscription (recurrente) */
    stripeModo?: 'payment' | 'subscription';
}

export interface PlanesDeServicio {
    servicioSlug: string;
    servicioTitulo: string;
    planes: PlanServicio[];
}

/* Helpers para crear caracteristicas rapido */
export const incluida = (texto: string): CaracteristicaPlan => ({texto, incluido: true});
export const noIncluida = (texto: string): CaracteristicaPlan => ({texto, incluido: false});
