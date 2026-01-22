/*
 * VistaServicios: Vista dual según el rol del usuario.
 * - Admin/Proveedor: Muestra servicios publicados (los que ofrece)
 * - Cliente: Muestra servicios contratados (los que ha comprado)
 */

import React, {useState} from 'react';
import {TarjetaServicioContratado} from './servicios/TarjetaServicioContratado';
import {ListaServiciosPublicados} from './servicios/ListaServiciosPublicados';
import {ModalEditarServicio} from './servicios/ModalEditarServicio';
import {usePanel} from '../../../context/PanelContext';
import {useUsuario} from '../../../context/UsuarioContext';
import {serviciosPublicados as serviciosIniciales} from '../../../data/mocks/serviciosPublicados';
import {ServicioPublicado} from '../../../data/types/servicio';

export const VistaServicios: React.FC = () => {
    const {serviciosContratados} = usePanel();
    const {usuario, esAdmin, simulando} = useUsuario();

    /* Estado local para servicios publicados (simulación de BD) */
    const [servicios, setServicios] = useState<ServicioPublicado[]>(serviciosIniciales);

    /* Estado del modal */
    const [modalVisible, setModalVisible] = useState(false);
    const [servicioEditar, setServicioEditar] = useState<ServicioPublicado | null>(null);
    const [modoCrear, setModoCrear] = useState(false);

    /* Si es admin y NO está simulando, mostrar vista de proveedor */
    const mostrarVistaProveedor = esAdmin && !simulando;

    /* Servicios publicados por el usuario actual (si es proveedor) */
    const misServiciosPublicados = mostrarVistaProveedor ? servicios.filter(s => s.proveedorId === usuario.id) : [];

    /* Handler para crear nuevo servicio */
    const handleCrearServicio = () => {
        setServicioEditar(null);
        setModoCrear(true);
        setModalVisible(true);
    };

    /* Handler para editar servicio existente */
    const handleEditarServicio = (servicio: ServicioPublicado) => {
        setServicioEditar(servicio);
        setModoCrear(false);
        setModalVisible(true);
    };

    /* Handler para eliminar servicio */
    const handleEliminarServicio = (id: string) => {
        /* Confirmación simple por ahora, TO-DO: modal de confirmación */
        if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
            setServicios(prev => prev.filter(s => s.id !== id));
        }
    };

    /* Handler para toggle activo/inactivo */
    const handleToggleActivo = (id: string) => {
        setServicios(prev => prev.map(s => (s.id === id ? {...s, activo: !s.activo} : s)));
    };

    /* Handler para guardar (crear o actualizar) */
    const handleGuardarServicio = (servicio: ServicioPublicado) => {
        if (modoCrear) {
            /* Agregar nuevo servicio */
            setServicios(prev => [servicio, ...prev]);
        } else {
            /* Actualizar servicio existente */
            setServicios(prev => prev.map(s => (s.id === servicio.id ? servicio : s)));
        }
        setModalVisible(false);
        setServicioEditar(null);
    };

    /* Cerrar modal */
    const handleCerrarModal = () => {
        setModalVisible(false);
        setServicioEditar(null);
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

                <ModalEditarServicio servicio={servicioEditar} visible={modalVisible} onCerrar={handleCerrarModal} onGuardar={handleGuardarServicio} modoCrear={modoCrear} />
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
