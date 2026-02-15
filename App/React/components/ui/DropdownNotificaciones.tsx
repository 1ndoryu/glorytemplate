/*
 * Componente: DropdownNotificaciones — Kamples
 * Panel dropdown con la lista de notificaciones recientes.
 * Se muestra al hacer click en el icono de campana del TopBar.
 */

import { useCallback } from 'react';
import { Bell, Heart, Download, UserPlus, MessageCircle } from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/dropdownPanel.css';

interface Notificacion {
    id: number;
    tipo: 'like' | 'descarga' | 'seguidor' | 'comentario' | 'sistema';
    texto: string;
    tiempo: string;
    leida: boolean;
}

/* Mock de notificaciones para demostración */
const notificacionesMock: Notificacion[] = [
    { id: 1, tipo: 'like', texto: 'A @beatmaker le gustó tu sample "Kick Drill 808"', tiempo: 'Hace 5 min', leida: false },
    { id: 2, tipo: 'seguidor', texto: '@prodmusic comenzó a seguirte', tiempo: 'Hace 20 min', leida: false },
    { id: 3, tipo: 'descarga', texto: '@trapking descargó "Hi-Hat Roll Clean"', tiempo: 'Hace 1h', leida: true },
    { id: 4, tipo: 'comentario', texto: '@lofibeats comentó en "Ambient Pad Cm"', tiempo: 'Hace 3h', leida: true },
    { id: 5, tipo: 'sistema', texto: 'Tu sample "Snare Tight" fue aprobado', tiempo: 'Ayer', leida: true },
];

const ICONOS_NOTIFICACION: Record<string, JSX.Element> = {
    like: <Heart size={16} />,
    descarga: <Download size={16} />,
    seguidor: <UserPlus size={16} />,
    comentario: <MessageCircle size={16} />,
    sistema: <Bell size={16} />,
};

interface DropdownNotificacionesProps {
    onCerrar: () => void;
}

export const DropdownNotificaciones = ({ onCerrar }: DropdownNotificacionesProps): JSX.Element => {
    const { navegar } = useNavigationStore();

    const irANotificaciones = useCallback(() => {
        navegar('/notificaciones');
        onCerrar();
    }, [navegar, onCerrar]);

    const noLeidas = notificacionesMock.filter((n) => !n.leida).length;

    return (
        <>
            <div className="dropdownOverlay" onClick={onCerrar} />
            <div className="dropdownPanel">
                <div className="dropdownPanelCabecera">
                    <span className="dropdownPanelTitulo">
                        Notificaciones {noLeidas > 0 && `(${noLeidas})`}
                    </span>
                    <button className="dropdownPanelEnlace" onClick={irANotificaciones} type="button">
                        Ver todas
                    </button>
                </div>

                <div className="dropdownPanelLista">
                    {notificacionesMock.length === 0 ? (
                        <div className="dropdownPanelVacio">
                            <Bell size={28} />
                            <p>Sin notificaciones</p>
                        </div>
                    ) : (
                        notificacionesMock.map((noti) => (
                            <div
                                key={noti.id}
                                className={`dropdownItem ${!noti.leida ? 'dropdownItemNoLeido' : ''}`}
                            >
                                <div className="dropdownItemIcono">
                                    {ICONOS_NOTIFICACION[noti.tipo] ?? <Bell size={16} />}
                                </div>
                                <div className="dropdownItemContenido">
                                    <span className="dropdownItemTexto">{noti.texto}</span>
                                    <span className="dropdownItemTiempo">{noti.tiempo}</span>
                                </div>
                                {!noti.leida && <div className="dropdownItemPunto" />}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default DropdownNotificaciones;
