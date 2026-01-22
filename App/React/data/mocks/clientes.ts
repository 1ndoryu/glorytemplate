/*
 * Datos mock de clientes reales.
 * Guillermo es el primer cliente con productos activos.
 */

import {Cliente} from '../types/cliente';

export const clientesEjemplo: Cliente[] = [
    {
        id: 'CLI-001',
        nombre: 'Guillermo',
        email: 'guillermo@example.com',
        telefono: '+34 600 000 000',
        fechaRegistro: '2025-11-01'
    }
];

/* Helper para obtener cliente por ID */
export const obtenerClientePorId = (id: string): Cliente | undefined => {
    return clientesEjemplo.find(c => c.id === id);
};
