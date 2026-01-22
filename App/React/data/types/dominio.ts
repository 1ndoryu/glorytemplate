/*
 * Tipos para dominios contratados por clientes.
 */

export type EstadoDominio = 'activo' | 'expirado' | 'pendiente';

export interface DominioContratado {
    id: string;
    clienteId: string;
    nombre: string;
    fechaExpiracion: string;
    renovacionAutomatica: boolean;
    estado: EstadoDominio;
    incluidoEnServicio?: string;
}
