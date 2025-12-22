/*
 * ListaSolicitudes
 *
 * Lista de solicitudes recibidas o enviadas.
 * Muestra acciones según el tipo.
 */

import {Check, X, Clock, UserX} from 'lucide-react';
import type {SolicitudEquipo} from '../../types/dashboard';
import {formatearFechaRelativa} from '../../utils/fecha';

interface ListaSolicitudesProps {
    solicitudes: SolicitudEquipo[];
    tipo: 'recibidas' | 'enviadas';
    onAceptar?: (id: number) => void;
    onRechazar?: (id: number) => void;
    onCancelar?: (id: number) => void;
    cargando: boolean;
}

export function ListaSolicitudes({solicitudes, tipo, onAceptar, onRechazar, onCancelar, cargando}: ListaSolicitudesProps): JSX.Element {
    if (solicitudes.length === 0) {
        return (
            <div className="equiposVacio">
                <Clock size={32} />
                <p>{tipo === 'recibidas' ? 'No tienes solicitudes pendientes' : 'No has enviado solicitudes'}</p>
            </div>
        );
    }

    return (
        <ul className="listaSolicitudes">
            {solicitudes.map(solicitud => (
                <li key={solicitud.id} className="solicitudItem">
                    <div className="solicitudInfo">
                        {solicitud.usuario ? (
                            <>
                                <img src={solicitud.usuario.avatar} alt={solicitud.usuario.nombre} className="solicitudAvatar" />
                                <div className="solicitudDatos">
                                    <span className="solicitudNombre">{solicitud.usuario.nombre}</span>
                                    <span className="solicitudEmail">{solicitud.usuario.email}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="solicitudAvatarPlaceholder">
                                    <UserX size={20} />
                                </div>
                                <div className="solicitudDatos">
                                    <span className="solicitudNombre pendiente">Usuario no registrado</span>
                                    <span className="solicitudEmail">{solicitud.email}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="solicitudMeta">
                        <span className="solicitudFecha">{formatearFechaRelativa(solicitud.fechaSolicitud)}</span>

                        {solicitud.estado === 'pendiente_registro' && <span className="solicitudEstado pendienteRegistro">Pendiente de registro</span>}
                    </div>

                    <div className="solicitudAcciones">
                        {tipo === 'recibidas' && onAceptar && onRechazar && (
                            <>
                                <button type="button" className="solicitudBoton aceptar" onClick={() => onAceptar(solicitud.id)} disabled={cargando} title="Aceptar solicitud">
                                    <Check size={16} />
                                </button>
                                <button type="button" className="solicitudBoton rechazar" onClick={() => onRechazar(solicitud.id)} disabled={cargando} title="Rechazar solicitud">
                                    <X size={16} />
                                </button>
                            </>
                        )}

                        {tipo === 'enviadas' && onCancelar && (
                            <button type="button" className="solicitudBoton cancelar" onClick={() => onCancelar(solicitud.id)} disabled={cargando} title="Cancelar solicitud">
                                <X size={16} />
                                <span>Cancelar</span>
                            </button>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
