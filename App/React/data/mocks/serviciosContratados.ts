/*
 * Datos mock de servicios contratados por clientes.
 * Servicio real: Diseño web CAP para Guillermo (Enero 2026).
 * La imagen se hereda del ServicioPublicado original.
 */

import {ServicioContratado} from '../types/servicio';
import {obtenerServicioPublicadoPorId} from './serviciosPublicados';

/* Obtener imagen del servicio publicado original */
const imagenServicioDiseno = obtenerServicioPublicadoPorId('SRVPUB-001')?.imagenUrl;

export const serviciosContratados: ServicioContratado[] = [
    {
        id: 'SRV-001',
        clienteId: 'CLI-001',
        servicioPublicadoId: 'SRVPUB-001',
        imagenUrl: imagenServicioDiseno,
        tipo: 'diseno_web',
        nombre: 'Diseño Web - CAP',
        descripcion: 'Diseño y desarrollo de landing page para CAP. Incluye dominio y hosting del primer año.',
        precio: 270,
        estado: 'en_progreso',
        fechaInicio: '2026-01-10',
        fechaContratacion: '2026-01-08',
        fechaEntregaEstimada: '2026-02-15',
        progreso: 65,
        revisionesRestantes: 2,
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
