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
    },
    /* Dominios de María (CLI-002) */
    {
        id: 'DOM-003',
        clienteId: 'CLI-002',
        nombre: 'tiendamaria.es',
        fechaExpiracion: '2026-12-15',
        renovacionAutomatica: true,
        estado: 'activo'
    },
    {
        id: 'DOM-004',
        clienteId: 'CLI-002',
        nombre: 'blogmaria.com',
        fechaExpiracion: '2027-01-10',
        renovacionAutomatica: false,
        estado: 'activo'
    }
];

/* Helper para obtener dominios de un cliente */
export const obtenerDominiosPorCliente = (clienteId: string): DominioContratado[] => {
    return dominiosContratados.filter(d => d.clienteId === clienteId);
};
