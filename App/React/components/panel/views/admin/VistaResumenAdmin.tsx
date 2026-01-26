/*
 * VistaResumenAdmin: Dashboard principal del administrador.
 * Muestra resumen global, lista de clientes, trabajos activos y alertas.
 * Diferente del dashboard de cliente que solo muestra datos propios.
 */

import React from 'react';
import {Users, Briefcase, AlertTriangle, Database} from 'lucide-react';
import {Boton} from '../../../../components/ui/Boton';
import {usePanel} from '../../../../context/PanelContext';
import {useUsuario} from '../../../../context/UsuarioContext';
import {TarjetaResumenGlobal} from './TarjetaResumenGlobal';
import {TablaClientes} from './TablaClientes';
import {ListaTrabajosActivos} from './ListaTrabajosActivos';
import {ListaAlertasAdmin} from './ListaAlertasAdmin';

/* Hooks */
import {useMetricasAdmin} from './hooks/useMetricasAdmin';
import {useClientesAdmin} from './hooks/useClientesAdmin';
import {useAlertasAdmin} from './hooks/useAlertasAdmin';
import {useAdminActions} from './hooks/useAdminActions';
import {SeccionPanel} from '../../ui/SeccionPanel';
import {CabeceraVista} from '../../ui/CabeceraVista';

export const VistaResumenAdmin: React.FC = () => {
    const {navegarA} = usePanel();
    const {usuario} = useUsuario();

    /* Hooks de lógica de negocio (Separation of Concerns) */
    const {metricas, tarjetasResumen} = useMetricasAdmin();
    const {clientesConResumen} = useClientesAdmin();
    const {alertas} = useAlertasAdmin();
    const {handleSeed} = useAdminActions();

    /* Handlers */
    const handleVerDetalleServicio = (trabajo: (typeof metricas.trabajosEnProgreso)[0]) => {
        navegarA('detalle_servicio_contratado', {id: trabajo.id});
    };

    return (
        <div className="bloqueVista animate-fade-in" id="vistaDashboardAdmin">
            <CabeceraVista titulo={`Hola, ${usuario.nombre}`} subtitulo="Panel de administración" />

            {/* Tarjetas de resumen global */}
            <section className="seccionAdmin">
                <div className="gridResumenAdmin">
                    {tarjetasResumen.map((datos, index) => (
                        <TarjetaResumenGlobal key={index} datos={datos} />
                    ))}
                </div>
            </section>

            {/* Trabajos activos */}
            {metricas.trabajosEnProgreso.length > 0 && (
                <SeccionPanel titulo="Trabajos en progreso">
                    <ListaTrabajosActivos trabajos={metricas.trabajosEnProgreso} onVerDetalle={handleVerDetalleServicio} />
                </SeccionPanel>
            )}

            {/* Lista de clientes */}
            <SeccionPanel titulo="Clientes">
                <TablaClientes clientes={clientesConResumen} />
            </SeccionPanel>

            {/* Alertas */}
            {alertas.length > 0 && (
                <SeccionPanel titulo="Alertas del sistema" className="alertaTitulo">
                    <ListaAlertasAdmin alertas={alertas} />
                </SeccionPanel>
            )}
        </div>
    );
};
