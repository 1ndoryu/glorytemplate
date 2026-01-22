/*
 * Datos mock de servicios contratados por clientes.
 * Servicio real: Diseño web CAP para Guillermo (Enero 2026).
 */

import {ServicioContratado} from '../types/servicio';

export const serviciosContratados: ServicioContratado[] = [
    {
        id: 'SRV-001',
        clienteId: 'CLI-001',
        servicioPublicadoId: 'SRVPUB-001',
        imagenUrl: '/wp-content/themes/glory/assets/img/servicios/diseno-web.jpg',
        tipo: 'diseno_web',
        nombre: 'Diseño Web - CAP',
        descripcion: 'Diseño y desarrollo de landing page para CAP. Incluye dominio y hosting del primer año.',
        precio: 270,
        estado: 'en_progreso',
        fechaInicio: '2026-01-10',
        fechaEntregaEstimada: '2026-02-15',
        pagoAlFinalizar: true,
        incluyeHosting: true,
        incluyeDominio: true,
        hostingMesesIncluidos: 12
    }
];

/* Helper para obtener servicios de un cliente */
export const obtenerServiciosPorCliente = (clienteId: string): ServicioContratado[] => {
    return serviciosContratados.filter(s => s.clienteId === clienteId);
};
