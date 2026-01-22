/*
 * VistaServicios: Vista dual según el rol del usuario.
 * - Admin/Proveedor: Muestra servicios publicados (los que ofrece)
 * - Cliente: Muestra servicios contratados (los que ha comprado)
 */

import React from 'react';
import {TarjetaServicioContratado} from './servicios/TarjetaServicioContratado';
import {ListaServiciosPublicados} from './servicios/ListaServiciosPublicados';
import {usePanel} from '../../../context/PanelContext';
import {useUsuario} from '../../../context/UsuarioContext';
import {serviciosPublicados, obtenerServiciosPorProveedor} from '../../../data/mocks/serviciosPublicados';

export const VistaServicios: React.FC = () => {
    const {serviciosContratados} = usePanel();
    const {usuario, esAdmin, simulando} = useUsuario();

    /* Si es admin y NO está simulando, mostrar vista de proveedor */
    const mostrarVistaProveedor = esAdmin && !simulando;

    /* Servicios publicados por el usuario actual (si es proveedor) */
    const misServiciosPublicados = mostrarVistaProveedor ? obtenerServiciosPorProveedor(usuario.id) : [];

    /* Handlers para gestión de servicios (TO-DO: implementar acciones reales) */
    const handleCrearServicio = () => {
        console.log('Crear nuevo servicio');
        /* TO-DO: Abrir modal de creación */
    };

    const handleEditarServicio = (servicio: any) => {
        console.log('Editar servicio:', servicio.id);
        /* TO-DO: Abrir modal de edición */
    };

    const handleEliminarServicio = (id: string) => {
        console.log('Eliminar servicio:', id);
        /* TO-DO: Confirmar y eliminar */
    };

    const handleToggleActivo = (id: string) => {
        console.log('Toggle activo:', id);
        /* TO-DO: Cambiar estado activo/inactivo */
    };

    /* Vista de Proveedor (Admin) */
    if (mostrarVistaProveedor) {
        return (
            <div className="bloqueVista" id="vistaServiciosProveedor">
                <header className="vistaHeader">
                    <h2 className="vistaTitulo">Mis Servicios Publicados</h2>
                    <p className="vistaSubtitulo">Gestiona los servicios que ofreces a tus clientes.</p>
                </header>

                <ListaServiciosPublicados servicios={misServiciosPublicados} onCrear={handleCrearServicio} onEditar={handleEditarServicio} onEliminar={handleEliminarServicio} onToggleActivo={handleToggleActivo} />
            </div>
        );
    }

    /* Vista de Cliente */
    const serviciosEnProgreso = serviciosContratados.filter(s => s.estado === 'pendiente' || s.estado === 'en_progreso');
    const serviciosCompletados = serviciosContratados.filter(s => s.estado === 'completado');

    return (
        <div className="bloqueVista" id="vistaServicios">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Mis Servicios</h2>
                <p className="vistaSubtitulo">Servicios contratados y su estado actual.</p>
            </header>

            {serviciosEnProgreso.length > 0 && (
                <section className="serviciosSeccion">
                    <h3 className="serviciosSeccionTitulo">En progreso</h3>
                    <div className="serviciosLista">
                        {serviciosEnProgreso.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                </section>
            )}

            {serviciosCompletados.length > 0 && (
                <section className="serviciosSeccion">
                    <h3 className="serviciosSeccionTitulo">Completados</h3>
                    <div className="serviciosLista">
                        {serviciosCompletados.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                </section>
            )}

            {serviciosContratados.length === 0 && (
                <div className="serviciosVacio">
                    <p>No tienes servicios contratados.</p>
                </div>
            )}
        </div>
    );
};
