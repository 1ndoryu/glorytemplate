/*
 * ModalEquipos
 *
 * Modal principal para el sistema de equipos.
 * Contiene pestañas para: Solicitudes recibidas, Enviadas y Compañeros.
 */

import {useEffect, useState} from 'react';
import {Modal} from '../shared/Modal';
import {FormularioSolicitud} from './FormularioSolicitud';
import {ListaSolicitudes} from './ListaSolicitudes';
import {ListaCompaneros} from './ListaCompaneros';
import {useEquipos} from '../../hooks/useEquipos';
import {useAlertas} from '../../hooks/useAlertas';
import '../../styles/dashboard/componentes/equipos.css';

interface ModalEquiposProps {
    estaAbierto: boolean;
    onCerrar: () => void;
}

type PestanaEquipos = 'recibidas' | 'enviadas' | 'companeros';

export function ModalEquipos({estaAbierto, onCerrar}: ModalEquiposProps): JSX.Element | null {
    const equipos = useEquipos();
    const {mostrarExito, mostrarError} = useAlertas();
    const [pestanaActiva, setPestanaActiva] = useState<PestanaEquipos>('companeros');

    /* Cargar datos al abrir el modal */
    useEffect(() => {
        if (estaAbierto) {
            equipos.cargarEquipo();
        }
    }, [estaAbierto]);

    /* Si hay solicitudes pendientes, mostrar esa pestaña */
    useEffect(() => {
        if (estaAbierto && equipos.contadores.recibidas > 0) {
            setPestanaActiva('recibidas');
        }
    }, [estaAbierto, equipos.contadores.recibidas]);

    const manejarEnviarSolicitud = async (email: string) => {
        const resultado = await equipos.enviarSolicitud(email);
        if (resultado.exito) {
            mostrarExito(resultado.mensaje);
            setPestanaActiva('enviadas');
        } else {
            mostrarError(resultado.mensaje);
        }
    };

    const manejarAceptar = async (id: number) => {
        const resultado = await equipos.aceptarSolicitud(id);
        if (resultado.exito) {
            mostrarExito(resultado.mensaje);
        } else {
            mostrarError(resultado.mensaje);
        }
    };

    const manejarRechazar = async (id: number) => {
        const resultado = await equipos.rechazarSolicitud(id);
        if (resultado.exito) {
            mostrarExito(resultado.mensaje);
        } else {
            mostrarError(resultado.mensaje);
        }
    };

    const manejarEliminar = async (id: number) => {
        const resultado = await equipos.eliminarConexion(id);
        if (resultado.exito) {
            mostrarExito(resultado.mensaje);
        } else {
            mostrarError(resultado.mensaje);
        }
    };

    const renderizarContenido = () => {
        if (equipos.cargando) {
            return (
                <div className="equiposCargando">
                    <span className="equiposSpinner" />
                    <p>Cargando equipo...</p>
                </div>
            );
        }

        if (equipos.error) {
            return (
                <div className="equiposError">
                    <p>{equipos.error}</p>
                    <button type="button" className="botonReintentar" onClick={() => equipos.cargarEquipo()}>
                        Reintentar
                    </button>
                </div>
            );
        }

        switch (pestanaActiva) {
            case 'recibidas':
                return <ListaSolicitudes solicitudes={equipos.recibidas} tipo="recibidas" onAceptar={manejarAceptar} onRechazar={manejarRechazar} cargando={equipos.enviando} />;
            case 'enviadas':
                return <ListaSolicitudes solicitudes={equipos.enviadas} tipo="enviadas" onCancelar={manejarEliminar} cargando={equipos.enviando} />;
            case 'companeros':
                return <ListaCompaneros companeros={equipos.companeros} onEliminar={manejarEliminar} cargando={equipos.enviando} />;
            default:
                return null;
        }
    };

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Mi Equipo" claseExtra="modalEquipos">
            <div id="modal-equipos-contenido" className="equiposContenido">
                {/* Formulario para enviar solicitud */}
                <FormularioSolicitud onEnviar={manejarEnviarSolicitud} enviando={equipos.enviando} />

                {/* Pestañas */}
                <div className="equiposPestanas">
                    <button type="button" className={`equiposPestana ${pestanaActiva === 'companeros' ? 'activa' : ''}`} onClick={() => setPestanaActiva('companeros')}>
                        Compañeros
                        {equipos.contadores.companeros > 0 && <span className="equiposContador">{equipos.contadores.companeros}</span>}
                    </button>
                    <button type="button" className={`equiposPestana ${pestanaActiva === 'recibidas' ? 'activa' : ''}`} onClick={() => setPestanaActiva('recibidas')}>
                        Recibidas
                        {equipos.contadores.recibidas > 0 && <span className="equiposContador alerta">{equipos.contadores.recibidas}</span>}
                    </button>
                    <button type="button" className={`equiposPestana ${pestanaActiva === 'enviadas' ? 'activa' : ''}`} onClick={() => setPestanaActiva('enviadas')}>
                        Enviadas
                        {equipos.contadores.enviadas > 0 && <span className="equiposContador">{equipos.contadores.enviadas}</span>}
                    </button>
                </div>

                {/* Contenido de la pestaña activa */}
                <div className="equiposListaContenedor">{renderizarContenido()}</div>
            </div>
        </Modal>
    );
}
