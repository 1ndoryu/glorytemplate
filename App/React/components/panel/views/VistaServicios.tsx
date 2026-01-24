/*
 * VistaServicios: Muestra servicios PUBLICADOS por el usuario.
 * Tanto admins como clientes pueden publicar servicios (modelo Fiverr).
 * Los servicios CONTRATADOS se muestran en el Dashboard (VistaResumen).
 */

import React, {useState, useEffect} from 'react';
import {ListaServiciosPublicados} from './servicios/ListaServiciosPublicados';
import {ModalEditarServicio} from './servicios/ModalEditarServicio';
import {useUsuario} from '../../../context/UsuarioContext';
import {usePanel} from '../../../context/PanelContext';
import {ServicioPublicado} from '../../../data/types/servicio';

export const VistaServicios: React.FC = () => {
    const {usuario} = useUsuario();
    const {servicios: serviciosContext} = usePanel();

    /* Estado local para servicios publicados */
    const [servicios, setServicios] = useState<ServicioPublicado[]>([]);

    useEffect(() => {
        setServicios(serviciosContext);
    }, [serviciosContext]);

    /* Estado del modal */
    const [modalVisible, setModalVisible] = useState(false);
    const [servicioEditar, setServicioEditar] = useState<ServicioPublicado | null>(null);
    const [modoCrear, setModoCrear] = useState(false);

    /* Servicios publicados por el usuario actual */
    const misServiciosPublicados = servicios.filter(s => s.proveedorId === usuario.id);

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

    return (
        <div className="bloqueVista" id="vistaServiciosPublicados">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Mis Servicios</h2>
                <p className="vistaSubtitulo">Gestiona los servicios que ofreces a otros usuarios.</p>
            </header>

            <ListaServiciosPublicados servicios={misServiciosPublicados} onCrear={handleCrearServicio} onEditar={handleEditarServicio} onEliminar={handleEliminarServicio} onToggleActivo={handleToggleActivo} />

            <ModalEditarServicio servicio={servicioEditar} visible={modalVisible} onCerrar={handleCerrarModal} onGuardar={handleGuardarServicio} modoCrear={modoCrear} />
        </div>
    );
};
