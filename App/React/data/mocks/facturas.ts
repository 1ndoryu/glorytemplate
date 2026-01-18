export interface Factura {
    id: string;
    fecha: string;
    concepto: string;
    importe: number;
    estado: 'pagada' | 'pendiente' | 'procesando';
    metodo: string;
}

export const facturasEjemplo: Factura[] = [
    {
        id: 'INV-2023-001',
        fecha: '15/10/2023',
        concepto: 'Renovación Hosting Anual',
        importe: 120.0,
        estado: 'pagada',
        metodo: 'Tarjeta **** 4242'
    },
    {
        id: 'INV-2023-002',
        fecha: '20/11/2023',
        concepto: 'Desarrollo Landing Page',
        importe: 1500.0,
        estado: 'pagada',
        metodo: 'Transferencia'
    },
    {
        id: 'INV-2024-001',
        fecha: '05/01/2024',
        concepto: 'Mantenimiento Mensual (Enero)',
        importe: 50.0,
        estado: 'pendiente',
        metodo: 'Pendiente'
    }
];
