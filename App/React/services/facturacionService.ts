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

export const facturacionService = {
    /* Servicios Publicados (Catálogo) */
    getServiciosPublicados: async (): Promise<ServicioPublicado[]> => {
        return apiClient.get<ServicioPublicado[]>('glory/v1/servicios');
    },

    getServicioPublicado: async (id: string): Promise<ServicioPublicado> => {
        return apiClient.get<ServicioPublicado>(`glory/v1/servicios/${id}`);
    },

    /* Hostings y Dominios */
    getHostingsContratados: async (): Promise<HostingContratado[]> => {
        return apiClient.get<HostingContratado[]>('glory/v1/hostings');
    },

    getDominiosContratados: async (): Promise<DominioContratado[]> => {
        return apiClient.get<DominioContratado[]>('glory/v1/dominios');
    },

    /* Trabajos (Servicios Contratados) */
    getServiciosContratados: async (): Promise<ServicioContratado[]> => {
        return apiClient.get<ServicioContratado[]>('glory/v1/trabajos');
    },

    getServicioContratado: async (id: string): Promise<ServicioContratado> => {
        return apiClient.get<ServicioContratado>(`glory/v1/trabajos/${id}`);
    },

    /* Facturas */
    getFacturas: async (): Promise<Factura[]> => {
        return apiClient.get<Factura[]>('glory/v1/facturas');
    },

    pagarFactura: async (id: string, metodoPago: string): Promise<{success: boolean; message: string}> => {
        // En fase 5 se integrará stripe, por ahora simulación backend
        return apiClient.post<{success: boolean; message: string}>(`glory/v1/facturas/${id}/pagar`, {metodo: metodoPago});
    },

    /* Admin */
    getClientes: async (): Promise<Cliente[]> => {
        return apiClient.get<Cliente[]>('glory/v1/admin/clientes');
    },

    getEstadisticasAdmin: async (): Promise<AdminStats> => {
        return apiClient.get<AdminStats>('glory/v1/admin/stats');
    }
};
