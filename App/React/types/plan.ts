/*
 * Tipos base — Plan / Suscripcion
 * Tipos para planes de pago y transacciones.
 * Union types derivados del Schema System (CHECK constraints de la DB).
 */

import type { IUsuariosExt, ISuscripciones, ITransacciones } from './_generated/schema';

/* Derivados del schema — se actualizan automaticamente con npx glory schema:generate */
export type NombrePlan = IUsuariosExt['plan'];
export type EstadoSuscripcion = ISuscripciones['estado'];
export type TipoTransaccion = ITransacciones['tipo'];
export type EstadoTransaccion = ITransacciones['estado'];

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
    tipo: TipoTransaccion;
    monto: number;
    moneda: string;
    estado: EstadoTransaccion;
    stripePaymentId: string;
    creadoAt: string;
}
