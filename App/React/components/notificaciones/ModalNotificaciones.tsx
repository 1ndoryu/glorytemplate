/*
 * ModalNotificaciones
 *
 * Modal/Dropdown que muestra la lista de notificaciones del usuario.
 * Se abre al hacer clic en el icono de campana del header.
 */

import {useEffect, useRef} from 'react';
import {Bell, Check, CheckCheck, Trash2} from 'lucide-react';
import type {Notificacion} from '../../types/dashboard';
import {ItemNotificacion} from './ItemNotificacion';

interface ModalNotificacionesProps {
    notificaciones: Notificacion[];
    noLeidas: number;
    total: number;
    cargando: boolean;
    posicionX: number;
    posicionY: number;
    onMarcarLeida: (id: number) => Promise<boolean>;
    onMarcarTodasLeidas: () => Promise<boolean>;
    onEliminar: (id: number) => Promise<boolean>;
    onClickNotificacion: (notificacion: Notificacion) => void;
    onCerrar: () => void;
}

export function ModalNotificaciones({notificaciones, noLeidas, total, cargando, posicionX, posicionY, onMarcarLeida, onMarcarTodasLeidas, onEliminar, onClickNotificacion, onCerrar}: ModalNotificacionesProps): JSX.Element {
    const modalRef = useRef<HTMLDivElement>(null);

    /* Cerrar al hacer clic fuera */
    useEffect(() => {
        const manejarClickFuera = (evento: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(evento.target as Node)) {
                onCerrar();
            }
        };

        const manejarEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                onCerrar();
            }
        };

        document.addEventListener('mousedown', manejarClickFuera);
        document.addEventListener('keydown', manejarEscape);

        return () => {
            document.removeEventListener('mousedown', manejarClickFuera);
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [onCerrar]);

    /* Ajustar posición para que no se salga de la pantalla */
    const calcularEstilo = () => {
        const anchoModal = 360;
        const altoMaximo = 480;
        const margen = 12;

        let x = posicionX;
        let y = posicionY;

        /* Evitar que se salga por la derecha */
        if (x + anchoModal > window.innerWidth - margen) {
            x = window.innerWidth - anchoModal - margen;
        }

        /* Evitar que se salga por abajo */
        if (y + altoMaximo > window.innerHeight - margen) {
            y = posicionY - altoMaximo - 40;
            if (y < margen) y = margen;
        }

        return {
            left: `${Math.max(margen, x)}px`,
            top: `${y}px`
        };
    };

    const manejarClickNotificacion = async (notificacion: Notificacion) => {
        if (!notificacion.leida) {
            await onMarcarLeida(notificacion.id);
        }
        onClickNotificacion(notificacion);
    };

    return (
        <div id="modal-notificaciones" className="modalNotificaciones" ref={modalRef} style={calcularEstilo()}>
            {/* Lista de notificaciones */}
            <div className="modalNotificaciones__lista">
                {cargando && notificaciones.length === 0 ? (
                    <div className="modalNotificaciones__estado">
                        <span className="modalNotificaciones__cargando">Cargando...</span>
                    </div>
                ) : notificaciones.length === 0 ? (
                    <div className="modalNotificaciones__estado">
                        <Bell size={32} className="modalNotificaciones__iconoVacio" />
                        <span className="modalNotificaciones__textoVacio">No tienes notificaciones</span>
                    </div>
                ) : (
                    notificaciones.map(notificacion => <ItemNotificacion key={notificacion.id} notificacion={notificacion} onClick={() => manejarClickNotificacion(notificacion)} onMarcarLeida={() => onMarcarLeida(notificacion.id)} onEliminar={() => onEliminar(notificacion.id)} />)
                )}
            </div>

            {/* Pie con resumen */}
            {total > 0 && (
                <div className="modalNotificaciones__pie">
                    {noLeidas > 0 && (
                        <button type="button" className="modalNotificaciones__botonAccion" onClick={onMarcarTodasLeidas} title="Marcar todas como leídas">
                            <CheckCheck size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
