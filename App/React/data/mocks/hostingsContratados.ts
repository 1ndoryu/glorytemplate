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
    },
    /* Hostings de María (CLI-002) */
    {
        id: 'HST-004',
        clienteId: 'CLI-002',
        dominio: 'tiendamaria.es',
        plan: 'anual',
        precioMensual: 3,
        precioAnual: 36,
        fechaInicio: '2025-12-15',
        fechaProximaRenovacion: '2026-12-15',
        estado: 'activo',
        pagado: true
    },
    {
        id: 'HST-005',
        clienteId: 'CLI-002',
        dominio: 'blogmaria.com',
        plan: 'mensual',
        precioMensual: 3,
        precioAnual: 36,
        fechaInicio: '2026-01-10',
        fechaProximaRenovacion: '2026-02-10',
        estado: 'activo',
        pagado: false
    }
];

/* Helper para obtener hostings de un cliente */
export const obtenerHostingsPorCliente = (clienteId: string): HostingContratado[] => {
    return hostingsContratados.filter(h => h.clienteId === clienteId);
};
