/*
 * ItemNotificacion
 *
 * Componente individual para cada notificación en la lista.
 * Muestra icono según tipo, título, contenido, fecha y acciones.
 */

import {Users, UserCheck, Calendar, UserPlus, UserMinus, Paperclip, MessageCircle, Target, Check, Trash2} from 'lucide-react';
import type {Notificacion, TipoNotificacion} from '../../types/dashboard';
import {formatearFechaRelativa} from '../../utils/fecha';

interface ItemNotificacionProps {
    notificacion: Notificacion;
    onClick: () => void;
    onMarcarLeida: () => void;
    onEliminar: () => void;
}

/* Mapeo de tipos a iconos y colores */
const ICONO_POR_TIPO: Record<TipoNotificacion, {icono: JSX.Element; clase: string}> = {
    solicitud_equipo: {
        icono: <Users size={16} />,
        clase: 'itemNotificacion__icono--equipo'
    },
    solicitud_aceptada: {
        icono: <UserCheck size={16} />,
        clase: 'itemNotificacion__icono--aceptada'
    },
    tarea_vence_hoy: {
        icono: <Calendar size={16} />,
        clase: 'itemNotificacion__icono--urgente'
    },
    tarea_asignada: {
        icono: <UserPlus size={16} />,
        clase: 'itemNotificacion__icono--asignada'
    },
    tarea_removida: {
        icono: <UserMinus size={16} />,
        clase: 'itemNotificacion__icono--removida'
    },
    adjunto_agregado: {
        icono: <Paperclip size={16} />,
        clase: 'itemNotificacion__icono--adjunto'
    },
    mensaje_chat: {
        icono: <MessageCircle size={16} />,
        clase: 'itemNotificacion__icono--mensaje'
    },
    habito_companero: {
        icono: <Target size={16} />,
        clase: 'itemNotificacion__icono--habito'
    }
};

export function ItemNotificacion({notificacion, onClick, onMarcarLeida, onEliminar}: ItemNotificacionProps): JSX.Element {
    const {icono, clase} = ICONO_POR_TIPO[notificacion.tipo] || {
        icono: <Users size={16} />,
        clase: ''
    };

    const manejarMarcarLeida = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarcarLeida();
    };

    const manejarEliminar = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEliminar();
    };

    const claseBase = 'itemNotificacion';
    const claseLeida = notificacion.leida ? `${claseBase}--leida` : '';

    return (
        <div className={`${claseBase} ${claseLeida}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
            {/* Icono del tipo */}
            <div className="itemNotificacion__icono">{icono}</div>

            {/* Contenido */}
            <div className="itemNotificacion__contenido">
                <div className="itemNotificacion__encabezadoTitulo">
                    {!notificacion.leida && <span className="itemNotificacion__puntoNoLeido" />}
                    <span className="itemNotificacion__titulo">{notificacion.titulo}</span>
                </div>
                {notificacion.contenido && <span className="itemNotificacion__texto">{notificacion.contenido}</span>}
                <span className="itemNotificacion__fecha">{formatearFechaRelativa(notificacion.fechaCreacion)}</span>
            </div>

            {/* Acciones */}
            <div className="itemNotificacion__acciones">
                {!notificacion.leida && (
                    <button type="button" className="itemNotificacion__boton" onClick={manejarMarcarLeida} title="Marcar como leída">
                        <Check size={12} />
                    </button>
                )}
                <button type="button" className="itemNotificacion__boton itemNotificacion__boton--eliminar" onClick={manejarEliminar} title="Eliminar">
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}
