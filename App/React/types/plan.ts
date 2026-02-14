/*
 * Tipos base — Plan / Suscripcion
 * Tipos para planes de pago y transacciones.
 */

export type NombrePlan = 'free' | 'pro' | 'premium';
export type EstadoSuscripcion = 'activa' | 'cancelada' | 'vencida' | 'periodo_prueba';

export interface Plan {
    id: NombrePlan;
    nombre: string;
    precioMensual: number;
    precioAnual: number;
    descargasDia: number | null;
    calidadDescarga: 'mp3' | 'wav';
    subidasMes: number | null;
    almacenamientoMB: number | null;
    mensajesDia: number | null;
    accesoSamplesPremium: boolean;
    monetizacion: boolean;
    revenueShare: number | null;
    badgePerfil: string | null;
}

export interface Suscripcion {
    id: number;
    usuarioId: number;
    plan: NombrePlan;
    estado: EstadoSuscripcion;
    stripeSubscriptionId: string;
    inicioAt: string;
    finAt: string;
    creadoAt: string;
}

export interface Transaccion {
    id: number;
    compradorId: number;
    vendedorId: number | null;
    sampleId: number | null;
    tipo: 'suscripcion' | 'compra_sample' | 'payout';
    monto: number;
    moneda: string;
    estado: 'completada' | 'pendiente' | 'fallida' | 'reembolsada';
    stripePaymentId: string;
    creadoAt: string;
}
