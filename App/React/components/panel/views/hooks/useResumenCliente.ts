import {usePanel} from '../../../../context/PanelContext';
import {diasHastaFecha} from '../../../../utils/fechaUtils';
import {ServicioContratado} from '../../../../data/types/servicio';

/**
 * Hook para manejar la lógica de negocio del Dashboard Cliente (VistaResumen).
 * Centraliza cálculos de deuda, filtrado de servicios y renovaciones.
 */
export const useResumenCliente = () => {
    const {serviciosContratados, hostingsContratados, dominiosContratados, facturas, navegarA} = usePanel();

    /* Calcular deuda pendiente (solo facturas pendientes/vencidas) */
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida');
    const deudaTotal = facturasPendientes.reduce((acc, f) => acc + f.total, 0);

    /* Servicios activos (en progreso o pendientes) */
    const serviciosActivos = serviciosContratados.filter(s => s.estado === 'en_progreso' || s.estado === 'pendiente');

    /* Próximas renovaciones (hostings y dominios próximos a vencer en los próximos 30 días) */
    const proximasRenovaciones = [
        ...hostingsContratados
            .filter(h => {
                const dias = diasHastaFecha(h.fechaProximaRenovacion);
                return dias >= 0 && dias <= 30;
            })
            .map(h => ({
                tipo: 'hosting' as const,
                nombre: h.dominio,
                fecha: h.fechaProximaRenovacion,
                dias: diasHastaFecha(h.fechaProximaRenovacion)
            })),
        ...dominiosContratados
            .filter(d => {
                const dias = diasHastaFecha(d.fechaExpiracion);
                return dias >= 0 && dias <= 30;
            })
            .map(d => ({
                tipo: 'dominio' as const,
                nombre: d.nombre,
                fecha: d.fechaExpiracion,
                dias: diasHastaFecha(d.fechaExpiracion)
            }))
    ].sort((a, b) => a.dias - b.dias);

    const tieneContenido = serviciosActivos.length > 0 || proximasRenovaciones.length > 0 || deudaTotal > 0;

    /* Handlers */
    const handleVerDetallesServicio = (servicio: ServicioContratado) => {
        navegarA('detalle_servicio_contratado', {id: servicio.id});
    };

    return {
        facturasPendientes,
        deudaTotal,
        serviciosActivos,
        proximasRenovaciones,
        tieneContenido,
        handleVerDetallesServicio
    };
};
