/*
 * Datos mock de hostings contratados.
 * Hostings reales de Guillermo - 3 sitios activos impagos (Enero 2026).
 */

import {HostingContratado} from '../types/hosting';

export const hostingsContratados: HostingContratado[] = [
    {
        id: 'HST-001',
        clienteId: 'CLI-001',
        dominio: 'guillechatbots.es',
        plan: 'mensual',
        precioMensual: 3,
        precioAnual: 36,
        fechaInicio: '2026-01-01',
        fechaProximaRenovacion: '2026-02-01',
        estado: 'activo',
        pagado: false
    },
    {
        id: 'HST-002',
        clienteId: 'CLI-001',
        dominio: 'materialdepadel.es',
        plan: 'mensual',
        precioMensual: 3,
        precioAnual: 36,
        fechaInicio: '2026-01-01',
        fechaProximaRenovacion: '2026-02-01',
        estado: 'activo',
        pagado: false
    },
    {
        id: 'HST-003',
        clienteId: 'CLI-001',
        dominio: 'cap.wandori.us',
        dominioTemporal: 'cap.wandori.us',
        plan: 'mensual',
        precioMensual: 3,
        precioAnual: 36,
        fechaInicio: '2026-01-01',
        fechaProximaRenovacion: '2026-02-01',
        estado: 'activo',
        pagado: false
    }
];

/* Helper para obtener hostings de un cliente */
export const obtenerHostingsPorCliente = (clienteId: string): HostingContratado[] => {
    return hostingsContratados.filter(h => h.clienteId === clienteId);
};
