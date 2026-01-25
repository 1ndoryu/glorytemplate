/*
 * VistaResumenAdmin: Dashboard principal del administrador.
 * Muestra resumen global, lista de clientes, trabajos activos y alertas.
 * Diferente del dashboard de cliente que solo muestra datos propios.
 */

import React, {useMemo} from 'react';
import {Users, Briefcase, AlertTriangle, Database} from 'lucide-react';
import {Boton} from '../../../../components/ui/Boton';
import {apiClient} from '../../../../data/api/client';
import {usePanel} from '../../../../context/PanelContext';
import {useUsuario} from '../../../../context/UsuarioContext';
import {TarjetaResumenGlobal, DatosResumenGlobal} from './TarjetaResumenGlobal';
import {TablaClientes, ClienteConResumen} from './TablaClientes';
import {ListaTrabajosActivos} from './ListaTrabajosActivos';
import {ListaAlertasAdmin, AlertaAdmin} from './ListaAlertasAdmin';
import {diasHastaFecha} from '../../../../utils/fechaUtils';

export const VistaResumenAdmin: React.FC = () => {
    const {clientes, hostingsContratados, dominiosContratados, serviciosContratados, facturas, navegarA} = usePanel();
    const {usuario} = useUsuario();

    /* Cálculos globales para las tarjetas de resumen */
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

    /* Datos para las tarjetas de resumen */
    const tarjetasResumen: DatosResumenGlobal[] = [
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
    ];

    /* Clientes con resumen de deuda y servicios */
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

    /* Generar alertas del sistema */
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

    /* Handlers */
    const handleVerDetalleServicio = (trabajo: (typeof metricas.trabajosEnProgreso)[0]) => {
        navegarA('detalle_servicio_contratado', {id: trabajo.id});
    };

    const handleSeed = async () => {
        if (!confirm('¿Estás seguro de inicializar los datos de prueba? Esto creará usuarios y posts si no existen.')) return;
        try {
            const res = await apiClient.post<any>('glory/v1/seed', {});
            alert('Seed completado: ' + JSON.stringify(res.message));
            window.location.reload();
        } catch (e) {
            alert('Error al ejecutar seed: ' + e);
        }
    };

    return (
        <div className="bloqueVista animate-fade-in" id="vistaDashboardAdmin">
            <div className="vistaHeader flex justify-between items-center">
                <div>
                    <h2 className="vistaTitulo">Hola, {usuario.nombre}</h2>
                    <p className="vistaSubtitulo">Panel de administración</p>
                </div>
                <Boton onClick={handleSeed} tamano="sm" variante="solid" icono={<Database size={16} />} className="botonSeed">
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
