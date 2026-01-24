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
        const response = await apiClient.get<ApiResponse<HostingContratado[]>>('glory/v1/hostings');
        return response.data || [];
    },

    getDominiosContratados: async (): Promise<DominioContratado[]> => {
        const response = await apiClient.get<ApiResponse<DominioContratado[]>>('glory/v1/dominios');
        return response.data || [];
    },

    /* Trabajos (Servicios Contratados) */
    getServiciosContratados: async (): Promise<ServicioContratado[]> => {
        const response = await apiClient.get<ApiResponse<ServicioContratado[]>>('glory/v1/trabajos');
        return response.data || [];
    },

    getServicioContratado: async (id: string): Promise<ServicioContratado> => {
        const response = await apiClient.get<ApiResponse<ServicioContratado>>(`glory/v1/trabajos/${id}`);
        return response.data;
    },

    /* Facturas */
    getFacturas: async (): Promise<Factura[]> => {
        const response = await apiClient.get<ApiResponse<Factura[]>>('glory/v1/facturas');
        return response.data || [];
    },

    pagarFactura: async (id: string, metodoPago: string): Promise<{success: boolean; message: string}> => {
        // En fase 5 se integrará stripe, por ahora simulación backend
        return apiClient.post<{success: boolean; message: string}>(`glory/v1/facturas/${id}/pagar`, {metodo: metodoPago});
    },

    /* Admin */
    getClientes: async (): Promise<Cliente[]> => {
        const response = await apiClient.get<ApiResponse<Cliente[]>>('glory/v1/admin/clientes');
        return response.data || [];
    },

    getEstadisticasAdmin: async (): Promise<AdminStats> => {
        const response = await apiClient.get<ApiResponse<AdminStats>>('glory/v1/admin/stats');
        return response.data;
    }
};
