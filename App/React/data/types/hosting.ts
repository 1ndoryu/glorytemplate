/*
 * Tipos para hostings contratados por clientes.
 * stackUuid es referencia interna a Coolify (no visible al cliente).
 */

export type PlanHosting = 'mensual' | 'anual';
export type EstadoHosting = 'activo' | 'suspendido' | 'cancelado';

export interface HostingContratado {
    id: string;
    clienteId: string;
    dominio: string;
    dominioTemporal?: string;
    stackUuid?: string;
    plan: PlanHosting;
    precioMensual: number;
    precioAnual: number;
    fechaInicio: string;
    fechaProximaRenovacion: string;
    estado: EstadoHosting;
    pagado: boolean;
}
