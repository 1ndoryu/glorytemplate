/*
 * PanelAdministracion
 *
 * Panel principal de administración para gestionar usuarios.
 * Muestra lista de usuarios con filtros y acciones administrativas.
 */

import {useEffect, useState} from 'react';
import {Modal} from '../shared/Modal';
import {FiltrosUsuarios} from './FiltrosUsuarios';
import {ListaUsuarios} from './ListaUsuarios';
import {ResumenAdmin} from './ResumenAdmin';
import {DetalleUsuario} from './DetalleUsuario';
import {useAdministracion} from '../../hooks/useAdministracion';
import type {UsuarioAdmin} from '../../types/dashboard';

interface PanelAdministracionProps {
    estaAbierto: boolean;
    onCerrar: () => void;
}

export function PanelAdministracion({estaAbierto, onCerrar}: PanelAdministracionProps): JSX.Element | null {
    const admin = useAdministracion();
    const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioAdmin | null>(null);
    const [cargandoAccion, setCargandoAccion] = useState<number | null>(null);

    /* Cargar datos al abrir el panel */
    useEffect(() => {
        if (estaAbierto) {
            admin.cargarUsuarios();
            admin.cargarResumen();
        }
    }, [estaAbierto]);

    /* Manejar activar premium */
    const manejarActivarPremium = async (userId: number, duracion?: number) => {
        setCargandoAccion(userId);
        const resultado = await admin.activarPremium(userId, duracion);
        setCargandoAccion(null);

        if (resultado.exito && usuarioDetalle?.id === userId) {
            const actualizado = await admin.obtenerDetalleUsuario(userId);
            if (actualizado) {
                setUsuarioDetalle(actualizado);
            }
        }
    };

    /* Manejar cancelar premium */
    const manejarCancelarPremium = async (userId: number) => {
        setCargandoAccion(userId);
        const resultado = await admin.cancelarPremium(userId);
        setCargandoAccion(null);

        if (resultado.exito && usuarioDetalle?.id === userId) {
            const actualizado = await admin.obtenerDetalleUsuario(userId);
            if (actualizado) {
                setUsuarioDetalle(actualizado);
            }
        }
    };

    /* Manejar extender trial */
    const manejarExtenderTrial = async (userId: number, dias: number) => {
        setCargandoAccion(userId);
        const resultado = await admin.extenderTrial(userId, dias);
        setCargandoAccion(null);

        if (resultado.exito && usuarioDetalle?.id === userId) {
            const actualizado = await admin.obtenerDetalleUsuario(userId);
            if (actualizado) {
                setUsuarioDetalle(actualizado);
            }
        }
    };

    /* Manejar ver detalle */
    const manejarVerDetalle = async (usuario: UsuarioAdmin) => {
        const detalle = await admin.obtenerDetalleUsuario(usuario.id);
        if (detalle) {
            setUsuarioDetalle(detalle);
        }
    };

    /* Cerrar detalle */
    const cerrarDetalle = () => {
        setUsuarioDetalle(null);
    };

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Panel de Administración" claseExtra="panelAdministracionModal">
            <div id="panel-administracion" className="panelAdministracion">
                {/* Resumen global */}
                {admin.resumen && <ResumenAdmin resumen={admin.resumen} />}

                {/* Filtros */}
                <FiltrosUsuarios filtros={admin.filtros} onFiltrarPlan={admin.filtrarPorPlan} onBuscar={admin.buscar} onReiniciar={admin.reiniciarFiltros} />

                {/* Lista de usuarios */}
                <ListaUsuarios usuarios={admin.usuarios} cargando={admin.cargando} error={admin.error} paginacion={admin.paginacion} onCambiarPagina={admin.cambiarPagina} onVerDetalle={manejarVerDetalle} onActivarPremium={u => manejarActivarPremium(u.id)} onCancelarPremium={u => manejarCancelarPremium(u.id)} cargandoAccion={cargandoAccion} />

                {/* Modal de detalle de usuario */}
                {usuarioDetalle && <DetalleUsuario usuario={usuarioDetalle} onCerrar={cerrarDetalle} onActivarPremium={d => manejarActivarPremium(usuarioDetalle.id, d)} onCancelarPremium={() => manejarCancelarPremium(usuarioDetalle.id)} onExtenderTrial={d => manejarExtenderTrial(usuarioDetalle.id, d)} cargando={cargandoAccion === usuarioDetalle.id} />}
            </div>
        </Modal>
    );
}
