/*
 * Datos mock de facturas.
 * Factura pendiente de enero 2026 de Guillermo.
 * Incluye: 3 hostings ($9) + 2 dominios ($22) = $31 total
 */

import {Factura, FacturaSimple} from '../types/facturacion';

/* Facturas completas con items detallados */
export const facturasCompletas: Factura[] = [
    {
        id: 'FAC-2026-001',
        clienteId: 'CLI-001',
        referencia: 'INV-2026-001',
        concepto: 'Servicios Enero 2026 - Hostings y Dominios',
        items: [
            {
                descripcion: 'Hosting guillechatbots.es (Enero 2026)',
                cantidad: 1,
                precioUnitario: 3,
                total: 3,
                productoRef: 'HST-001'
            },
            {
                descripcion: 'Hosting materialdepadel.es (Enero 2026)',
                cantidad: 1,
                precioUnitario: 3,
                total: 3,
                productoRef: 'HST-002'
            },
            {
                descripcion: 'Hosting cap.wandori.us (Enero 2026)',
                cantidad: 1,
                precioUnitario: 3,
                total: 3,
                productoRef: 'HST-003'
            },
            {
                descripcion: 'Dominio guillechatbots.es (anual)',
                cantidad: 1,
                precioUnitario: 11,
                total: 11,
                productoRef: 'DOM-001'
            },
            {
                descripcion: 'Dominio materialdepadel.es (anual)',
                cantidad: 1,
                precioUnitario: 11,
                total: 11,
                productoRef: 'DOM-002'
            }
        ],
        subtotal: 31,
        impuestos: 0,
        total: 31,
        estado: 'pendiente',
        fechaEmision: '2026-01-01',
        fechaVencimiento: '2026-01-31'
    },
    /* Factura de María (CLI-002) */
    {
        id: 'FAC-2026-002',
        clienteId: 'CLI-002',
        referencia: 'INV-2026-002',
        concepto: 'Hosting blogmaria.com - Enero 2026',
        items: [
            {
                descripcion: 'Hosting blogmaria.com (Enero 2026)',
                cantidad: 1,
                precioUnitario: 3,
                total: 3,
                productoRef: 'HST-005'
            }
        ],
        subtotal: 3,
        impuestos: 0,
        total: 3,
        estado: 'pendiente',
        fechaEmision: '2026-01-10',
        fechaVencimiento: '2026-02-10'
    }
];

/*
 * Facturas en formato simplificado para compatibilidad con VistaFacturas actual.
 * TO-DO: Eliminar cuando se migre a facturasCompletas.
 */
export const facturasEjemplo: FacturaSimple[] = facturasCompletas.map(f => ({
    id: f.referencia,
    fecha: formatearFecha(f.fechaEmision),
    concepto: f.concepto,
    importe: f.total,
    estado: f.estado === 'vencida' ? 'pendiente' : (f.estado as 'pagada' | 'pendiente' | 'procesando'),
    metodo: f.metodoPago || 'Pendiente'
}));

/* Helper para formatear fecha ISO a formato legible */
function formatearFecha(fechaIso: string): string {
    const [anio, mes, dia] = fechaIso.split('-');
    return `${dia}/${mes}/${anio}`;
}

/* Helper para obtener facturas de un cliente */
export const obtenerFacturasPorCliente = (clienteId: string): Factura[] => {
    return facturasCompletas.filter(f => f.clienteId === clienteId);
};

/* Helper para calcular total pendiente de un cliente */
export const calcularTotalPendiente = (clienteId: string): number => {
    return facturasCompletas.filter(f => f.clienteId === clienteId && (f.estado === 'pendiente' || f.estado === 'vencida')).reduce((sum, f) => sum + f.total, 0);
};

/* Re-export para compatibilidad */
export type {Factura, FacturaSimple} from '../types/facturacion';
