/*
 * Tipos para la gestión de clientes.
 * Usado para el panel de cliente y facturación.
 */

export interface Cliente {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    fechaRegistro: string;
}
