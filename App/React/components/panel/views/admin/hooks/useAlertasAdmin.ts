import {useMemo} from 'react';
import {usePanel} from '../../../../../context/PanelContext';
import {diasHastaFecha} from '../../../../../utils/fechaUtils';
import {AlertaAdmin} from '../ListaAlertasAdmin';

export const useAlertasAdmin = () => {
    const {hostingsContratados, dominiosContratados, clientes} = usePanel();

    const alertas: AlertaAdmin[] = useMemo(() => {
        const listaAlertas: AlertaAdmin[] = [];

        /* Hostings impagos */
        hostingsContratados
            .filter(h => !h.pagado)
            .forEach(h => {
                const cliente = clientes.find(c => c.id === h.clienteId);
                listaAlertas.push({
                    id: `hosting-${h.id}`,
                    tipo: 'hosting_impago',
                    titulo: 'Hosting impago',
                    descripcion: h.dominio,
                    clienteNombre: cliente?.nombre,
                    monto: h.precioMensual
                });
            });

        /* Dominios impagos */
        dominiosContratados
            .filter(d => !d.pagado)
            .forEach(d => {
                const cliente = clientes.find(c => c.id === d.clienteId);
                listaAlertas.push({
                    id: `dominio-${d.id}`,
                    tipo: 'dominio_expira',
                    titulo: 'Dominio impago',
                    descripcion: d.nombre,
                    clienteNombre: cliente?.nombre,
                    monto: d.precioAnual
                });
            });

        /* Dominios por expirar en 30 días */
        dominiosContratados
            .filter(d => {
                const dias = diasHastaFecha(d.fechaExpiracion);
                return dias >= 0 && dias <= 30;
            })
            .forEach(d => {
                const cliente = clientes.find(c => c.id === d.clienteId);
                const dias = diasHastaFecha(d.fechaExpiracion);
                listaAlertas.push({
                    id: `dominio-exp-${d.id}`,
                    tipo: 'dominio_expira',
                    titulo: `Dominio expira en ${dias} días`,
                    descripcion: d.nombre,
                    clienteNombre: cliente?.nombre
                });
            });

        return listaAlertas;
    }, [hostingsContratados, dominiosContratados, clientes]);

    return {alertas};
};
