/*
 * Barrel export para todos los datos mock.
 * Centraliza las importaciones de datos de ejemplo.
 */

export {proyectosEjemplo} from './proyectos';
export {serviciosEjemplo} from './servicios';
export {resenasEjemplo} from './resenas';
export {articulosEjemplo} from './articulos';

/* Mocks del sistema de facturación */
export {clientesEjemplo, obtenerClientePorId} from './clientes';
export {hostingsContratados, obtenerHostingsPorCliente} from './hostingsContratados';
export {dominiosContratados, obtenerDominiosPorCliente} from './dominiosContratados';
export {serviciosContratados, obtenerServiciosPorCliente} from './serviciosContratados';
export {facturasCompletas, facturasEjemplo, obtenerFacturasPorCliente, calcularTotalPendiente} from './facturas';
