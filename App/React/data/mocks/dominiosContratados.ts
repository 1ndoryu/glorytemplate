/*
 * Datos mock de dominios contratados.
 * Dominios reales de Guillermo comprados en enero 2026.
 */

import {DominioContratado} from '../types/dominio';

export const dominiosContratados: DominioContratado[] = [
    {
        id: 'DOM-001',
        clienteId: 'CLI-001',
        nombre: 'guillechatbots.es',
        fechaExpiracion: '2027-01-15',
        renovacionAutomatica: false,
        estado: 'activo'
    },
    {
        id: 'DOM-002',
        clienteId: 'CLI-001',
        nombre: 'materialdepadel.es',
        fechaExpiracion: '2027-01-15',
        renovacionAutomatica: false,
        estado: 'activo'
    }
];

/* Helper para obtener dominios de un cliente */
export const obtenerDominiosPorCliente = (clienteId: string): DominioContratado[] => {
    return dominiosContratados.filter(d => d.clienteId === clienteId);
};
