/*
 * Componente: TopBar
 * Barra superior con búsqueda global, notificaciones y avatar.
 */

import { Bell, Mail } from 'lucide-react';
import { InputBusqueda } from '../ui/InputBusqueda';
import { Avatar } from '../ui/Avatar';
import '../../styles/componentes/topbar.css';

interface TopBarProps {
    onBuscar?: (valor: string) => void;
    notificacionesNoLeidas?: number;
    mensajesNoLeidos?: number;
    nombreUsuario?: string;
    avatarUrl?: string | null;
    onClickNotificaciones?: () => void;
    onClickMensajes?: () => void;
    onClickAvatar?: () => void;
}

export const TopBar = ({
    onBuscar,
    notificacionesNoLeidas = 0,
    mensajesNoLeidos = 0,
    nombreUsuario = 'Usuario',
    avatarUrl = null,
    onClickNotificaciones,
    onClickMensajes,
    onClickAvatar,
}: TopBarProps): JSX.Element => {
    return (
        <div className="topbar">
            <div className="topbarTabs">
                {/* TO-DO: tabs dinámicas por página */}
            </div>

            <div className="topbarBusqueda">
                <InputBusqueda
                    placeholder="Buscar samples..."
                    onChange={onBuscar ?? (() => {})}
                />
            </div>

            <div className="topbarAcciones">
                <button
                    className="topbarIconoBtn"
                    onClick={onClickNotificaciones}
                    aria-label="Notificaciones"
                    type="button"
                >
                    <Bell size={18} />
                    {notificacionesNoLeidas > 0 && (
                        <span className="topbarBadge">
                            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                        </span>
                    )}
                </button>

                <button
                    className="topbarIconoBtn"
                    onClick={onClickMensajes}
                    aria-label="Mensajes"
                    type="button"
                >
                    <Mail size={18} />
                    {mensajesNoLeidos > 0 && (
                        <span className="topbarBadge">
                            {mensajesNoLeidos > 99 ? '99+' : mensajesNoLeidos}
                        </span>
                    )}
                </button>

                <Avatar
                    src={avatarUrl}
                    nombre={nombreUsuario}
                    tamano="sm"
                    onClick={onClickAvatar}
                />
            </div>
        </div>
    );
};

export default TopBar;
