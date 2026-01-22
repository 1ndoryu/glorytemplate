/*
 * Tipos para el sistema de facturación.
 * Incluye facturas completas con items detallados.
 */

export type EstadoFactura = 'pendiente' | 'pagada' | 'vencida' | 'cancelada';

export interface FacturaItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
    productoRef?: string;
}

export interface Factura {
    id: string;
    clienteId: string;
    referencia: string;
    concepto: string;
    items: FacturaItem[];
    subtotal: number;
    impuestos: number;
    total: number;
    estado: EstadoFactura;
    fechaEmision: string;
    fechaVencimiento: string;
    fechaPago?: string;
    metodoPago?: string;
    stripePaymentIntentId?: string;
}

/*
 * Interfaz simplificada para compatibilidad con el contexto actual.
 * TO-DO: Migrar a Factura completa cuando se refactorice VistaFacturas.
 */
export interface FacturaSimple {
    id: string;
    fecha: string;
    concepto: string;
    importe: number;
    estado: 'pagada' | 'pendiente' | 'procesando';
    metodo: string;
}
