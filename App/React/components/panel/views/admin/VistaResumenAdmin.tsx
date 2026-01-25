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
            <div className="vistaHeader">
                <div>
                    <h2 className="vistaTitulo">Hola, {usuario.nombre}</h2>
                    <p className="vistaSubtitulo">Panel de administración</p>
                </div>
                <Boton onClick={handleSeed} tamano="sm" variante="outline" icono={<Database size={16} />} className="botonSeed">
                    Inicializar Datos Demo
                </Boton>
            </div>

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
                <section className="seccionAdmin">
                    <h3 className="seccionAdminTitulo">
                        <Briefcase size={16} />
                        Trabajos en progreso
                    </h3>
                    <ListaTrabajosActivos trabajos={metricas.trabajosEnProgreso} onVerDetalle={handleVerDetalleServicio} />
                </section>
            )}

            {/* Lista de clientes */}
            <section className="seccionAdmin">
                <h3 className="seccionAdminTitulo">
                    <Users size={16} />
                    Clientes
                </h3>
                <TablaClientes clientes={clientesConResumen} />
            </section>

            {/* Alertas */}
            {alertas.length > 0 && (
                <section className="seccionAdmin">
                    <h3 className="seccionAdminTitulo alertaTitulo">
                        <AlertTriangle size={16} />
                        Alertas del sistema
                    </h3>
                    <ListaAlertasAdmin alertas={alertas} />
                </section>
            )}
        </div>
    );
};
