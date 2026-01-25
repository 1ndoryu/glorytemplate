import {useMemo} from 'react';
import {usePanel} from '../../../../../context/PanelContext';
import {ClienteConResumen} from '../TablaClientes';

export const useClientesAdmin = () => {
    const {clientes, hostingsContratados, serviciosContratados, dominiosContratados} = usePanel();

    const clientesConResumen: ClienteConResumen[] = useMemo(() => {
        return clientes.map(cliente => {
            const hostingsCliente = hostingsContratados.filter(h => h.clienteId === cliente.id);
            const serviciosCliente = serviciosContratados.filter(s => s.clienteId === cliente.id);

            const hostingsImpagos = hostingsCliente.filter(h => !h.pagado);
            const deudaHostings = hostingsImpagos.reduce((acc, h) => acc + h.precioMensual, 0);

            const dominiosCliente = dominiosContratados.filter(d => d.clienteId === cliente.id);
            const dominiosImpagos = dominiosCliente.filter(d => !d.pagado);
            const deudaDominios = dominiosImpagos.reduce((acc, d) => acc + d.precioAnual, 0);

            return {
                ...cliente,
                deudaPendiente: deudaHostings + deudaDominios,
                serviciosActivos: serviciosCliente.filter(s => s.estado === 'en_progreso').length,
                hostingsActivos: hostingsCliente.length
            };
        });
    }, [clientes, hostingsContratados, serviciosContratados, dominiosContratados]);

    return {clientesConResumen};
};
