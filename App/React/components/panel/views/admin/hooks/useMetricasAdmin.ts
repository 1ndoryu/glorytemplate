import {useMemo} from 'react';
import {usePanel} from '../../../../../context/PanelContext';
import {DatosResumenGlobal} from '../TarjetaResumenGlobal';

export const useMetricasAdmin = () => {
    const {clientes, hostingsContratados, dominiosContratados, serviciosContratados, facturas} = usePanel();

    const metricas = useMemo(() => {
        const facturasPendientes = facturas.filter(f => f.estado === 'pendiente');
        const ingresosPendientes = facturasPendientes.reduce((acc, f) => acc + f.total, 0);

        const trabajosEnProgreso = serviciosContratados.filter(s => s.estado === 'en_progreso' || s.estado === 'pendiente');

        const hostingsImpagos = hostingsContratados.filter(h => !h.pagado);
        const dominiosImpagos = dominiosContratados.filter(d => !d.pagado);

        return {
            totalClientes: clientes.length,
            ingresosPendientes,
            facturasPendientes: facturasPendientes.length,
            trabajosActivos: trabajosEnProgreso.length,
            hostingsImpagos: hostingsImpagos.length,
            dominiosImpagos: dominiosImpagos.length,
            trabajosEnProgreso
        };
    }, [clientes, facturas, serviciosContratados, hostingsContratados, dominiosContratados]);

    const tarjetasResumen: DatosResumenGlobal[] = useMemo(
        () => [
            {
                etiqueta: 'Clientes activos',
                valor: metricas.totalClientes,
                variante: 'primario'
            },
            {
                etiqueta: 'Por cobrar',
                valor: `$${metricas.ingresosPendientes.toFixed(2)}`,
                variante: metricas.ingresosPendientes > 0 ? 'alerta' : 'exito'
            },
            {
                etiqueta: 'Trabajos activos',
                valor: metricas.trabajosActivos,
                variante: 'primario'
            },
            {
                etiqueta: 'Alertas',
                valor: metricas.hostingsImpagos + metricas.dominiosImpagos,
                variante: metricas.hostingsImpagos + metricas.dominiosImpagos > 0 ? 'error' : 'exito'
            }
        ],
        [metricas]
    );

    return {
        metricas,
        tarjetasResumen
    };
};
