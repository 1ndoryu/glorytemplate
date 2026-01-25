import {apiClient} from '../data/api/client';
import {ServicioPublicado, ServicioContratado} from '../data/types/servicio';
import {Factura} from '../data/types/facturacion';
import {HostingContratado} from '../data/types/hosting';
import {DominioContratado} from '../data/types/dominio';
import {Cliente} from '../data/types/cliente';

interface AdminStats {
    totalClientes: number;
    ingresosMes: number;
    trabajosActivos: number;
    facturasPendientes: number;
    montoPendiente: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

/* Hardcoded Data for Guillermo (Requisitos del Cliente) */
const GUILLERMO_CLIENTE: Cliente = {
    id: 'usr_guillermo',
    nombre: 'Guillermo (Cliente)',
    email: 'guillermo@example.com',
    fechaRegistro: '2026-01-01'
};

const GUILLERMO_HOSTINGS: HostingContratado[] = [
    {id: 'host_g_1', clienteId: 'usr_guillermo', dominio: 'guillechatbots.es', plan: 'mensual', precioMensual: 3, precioAnual: 36, fechaInicio: '2026-01-01', fechaProximaRenovacion: '2026-02-01', estado: 'activo', pagado: false},
    {id: 'host_g_2', clienteId: 'usr_guillermo', dominio: 'materialdepadel.es', plan: 'mensual', precioMensual: 3, precioAnual: 36, fechaInicio: '2026-01-01', fechaProximaRenovacion: '2026-02-01', estado: 'activo', pagado: false},
    {id: 'host_g_3', clienteId: 'usr_guillermo', dominio: 'cap.wandori.us', plan: 'mensual', precioMensual: 3, precioAnual: 36, fechaInicio: '2026-01-01', fechaProximaRenovacion: '2026-02-01', estado: 'activo', pagado: false}
];

const GUILLERMO_DOMINIOS: DominioContratado[] = [
    {id: 'dom_g_1', clienteId: 'usr_guillermo', nombre: 'guillechatbots.es', fechaExpiracion: '2027-01-01', renovacionAutomatica: true, estado: 'activo', precioAnual: 11, pagado: false},
    {id: 'dom_g_2', clienteId: 'usr_guillermo', nombre: 'materialdepadel.es', fechaExpiracion: '2027-01-01', renovacionAutomatica: true, estado: 'activo', precioAnual: 11, pagado: false}
];

const GUILLERMO_SERVICIOS: ServicioContratado[] = [
    {
        id: 'serv_g_1',
        clienteId: 'usr_guillermo',
        tipo: 'diseno_web',
        nombre: 'Diseño Web (CAP)',
        descripcion: 'Diseño y desarrollo web completo',
        precio: 270,
        estado: 'en_progreso',
        fechaInicio: '2026-01-01',
        fechaContratacion: '2026-01-01',
        fechaEntregaEstimada: '2026-01-31',
        progreso: 65,
        revisionesRestantes: 2,
        pagoAlFinalizar: true,
        incluyeHosting: true,
        incluyeDominio: true,
        hostingMesesIncluidos: 12
    }
];

const GUILLERMO_FACTURA: Factura = {
    id: 'inv_g_001',
    clienteId: 'usr_guillermo',
    referencia: 'INV-2026-001',
    concepto: 'Servicios Enero 2026',
    items: [
        {descripcion: 'Renovación Hosting guillechatbots.es', cantidad: 1, precioUnitario: 3, total: 3, productoRef: 'host_g_1'},
        {descripcion: 'Renovación Hosting materialdepadel.es', cantidad: 1, precioUnitario: 3, total: 3, productoRef: 'host_g_2'},
        {descripcion: 'Renovación Hosting cap.wandori.us', cantidad: 1, precioUnitario: 3, total: 3, productoRef: 'host_g_3'},
        {descripcion: 'Renovación Dominio guillechatbots.es', cantidad: 1, precioUnitario: 11, total: 11, productoRef: 'dom_g_1'},
        {descripcion: 'Renovación Dominio materialdepadel.es', cantidad: 1, precioUnitario: 11, total: 11, productoRef: 'dom_g_2'}
    ],
    subtotal: 31,
    impuestos: 0,
    total: 31,
    estado: 'pendiente',
    fechaEmision: '2026-01-01',
    fechaVencimiento: '2026-02-15'
};

export const facturacionService = {
    /* Servicios Publicados (Catálogo) */
    getServiciosPublicados: async (): Promise<ServicioPublicado[]> => {
        const response = await apiClient.get<ApiResponse<ServicioPublicado[]>>('glory/v1/servicios');
        return response.data || [];
    },

    getServicioPublicado: async (id: string): Promise<ServicioPublicado> => {
        const response = await apiClient.get<ApiResponse<ServicioPublicado>>(`glory/v1/servicios/${id}`);
        return response.data;
    },

    /* Hostings y Dominios */
    getHostingsContratados: async (): Promise<HostingContratado[]> => {
        try {
            const response = await apiClient.get<ApiResponse<HostingContratado[]>>('glory/v1/hostings');
            const data = response.data || [];
            return [...data, ...GUILLERMO_HOSTINGS.filter(gh => !data.some(d => d.dominio === gh.dominio))];
        } catch (error) {
            console.warn('API Error fetching hostings, returning fallback data:', error);
            return GUILLERMO_HOSTINGS;
        }
    },

    getDominiosContratados: async (): Promise<DominioContratado[]> => {
        try {
            const response = await apiClient.get<ApiResponse<DominioContratado[]>>('glory/v1/dominios');
            const data = response.data || [];
            return [...data, ...GUILLERMO_DOMINIOS.filter(gd => !data.some(d => d.nombre === gd.nombre))];
        } catch (error) {
            console.warn('API Error fetching dominios, returning fallback data:', error);
            return GUILLERMO_DOMINIOS;
        }
    },

    /* Trabajos (Servicios Contratados) */
    getServiciosContratados: async (): Promise<ServicioContratado[]> => {
        try {
            const response = await apiClient.get<ApiResponse<ServicioContratado[]>>('glory/v1/trabajos');
            const data = response.data || [];
            return [...data, ...GUILLERMO_SERVICIOS];
        } catch (error) {
            console.warn('API Error fetching trabajos, returning fallback data:', error);
            return GUILLERMO_SERVICIOS;
        }
    },

    getServicioContratado: async (id: string): Promise<ServicioContratado> => {
        const response = await apiClient.get<ApiResponse<ServicioContratado>>(`glory/v1/trabajos/${id}`);
        return response.data;
    },

    /* Facturas */
    getFacturas: async (): Promise<Factura[]> => {
        try {
            const response = await apiClient.get<ApiResponse<Factura[]>>('glory/v1/facturas');
            const data = response.data || [];
            return [...data, GUILLERMO_FACTURA];
        } catch (error) {
            console.warn('API Error fetching facturas, returning fallback data:', error);
            return [GUILLERMO_FACTURA];
        }
    },

    pagarFactura: async (id: string, metodoPago: string): Promise<{success: boolean; message: string}> => {
        // En fase 5 se integrará stripe, por ahora simulación backend
        return apiClient.post<{success: boolean; message: string}>(`glory/v1/facturas/${id}/pagar`, {metodo: metodoPago});
    },

    /* Admin */
    getClientes: async (): Promise<Cliente[]> => {
        try {
            const response = await apiClient.get<ApiResponse<Cliente[]>>('glory/v1/admin/clientes');
            const data = response.data || [];
            if (!data.some(c => c.email === GUILLERMO_CLIENTE.email)) {
                return [GUILLERMO_CLIENTE, ...data];
            }
            return data;
        } catch (error) {
            console.warn('API Error fetching clientes, returning fallback data:', error);
            return [GUILLERMO_CLIENTE];
        }
    },

    getEstadisticasAdmin: async (): Promise<AdminStats> => {
        const response = await apiClient.get<ApiResponse<AdminStats>>('glory/v1/admin/stats');
        return response.data;
    }
};
