/*
 * Componente: DropdownNotificaciones — Kamples
 * Panel dropdown con la lista de notificaciones recientes.
 * Se muestra al hacer click en el icono de campana del TopBar.
 * Conectado a API real via useDropdownNotificaciones hook.
 */

import { Bell, Heart, Download, UserPlus, MessageCircle, Loader2, ShieldAlert, AlertTriangle, Sparkles, CreditCard } from 'lucide-react';
import { useDropdownNotificaciones } from '../../hooks/useDropdownNotificaciones';
import '../../styles/componentes/dropdownPanel.css';

const ICONOS_NOTIFICACION: Record<string, JSX.Element> = {
    like: <Heart size={16} />,
    encanta: <Sparkles size={16} />,
    descarga: <Download size={16} />,
    follow: <UserPlus size={16} />,
    seguidor: <UserPlus size={16} />,
    comentario: <MessageCircle size={16} />,
    sistema: <Bell size={16} />,
    mensaje: <MessageCircle size={16} />,
    pago: <CreditCard size={16} />,
    moderacion: <ShieldAlert size={16} />,
    duplicado_detectado: <AlertTriangle size={16} />,
};

/* Formatea fecha ISO a texto relativo */
const formatearTiempo = (fecha: string): string => {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `Hace ${min} min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const dias = Math.floor(hrs / 24);
    return dias === 1 ? 'Ayer' : `Hace ${dias}d`;
};

interface DropdownNotificacionesProps {
    onCerrar: () => void;
}

export const DropdownNotificaciones = ({ onCerrar }: DropdownNotificacionesProps): JSX.Element => {
    const {
        notificaciones,
        cargando,
        notificacionesCargadas,
        manejarClickNotif,
    } = useDropdownNotificaciones({ onCerrar });

    return (
        <>
            <div className="dropdownOverlay" onClick={onCerrar} />
            <div className="dropdownPanel">
                <div className="dropdownPanelLista">
                    {cargando && !notificacionesCargadas ? (
                        <div className="dropdownPanelVacio">
                            <Loader2 size={28} className="adminSpinner" />
                            <p>Cargando...</p>
                        </div>
                    ) : notificaciones.length === 0 ? (
                        <div className="dropdownPanelVacio">
                            <Bell size={28} />
                            <p>Sin notificaciones</p>
                        </div>
                    ) : (
                        notificaciones.map((noti) => (
                            <div
                                key={noti.id}
                                className={`dropdownItem ${!noti.leida ? 'dropdownItemNoLeido' : ''}`}
                                onClick={() => manejarClickNotif(noti)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        manejarClickNotif(noti);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="dropdownItemIcono">
                                    {ICONOS_NOTIFICACION[noti.tipo] ?? <Bell size={16} />}
                                </div>
                                <div className="dropdownItemContenido">
                                    <span className="dropdownItemTexto">{noti.mensaje}</span>
                                    <span className="dropdownItemTiempo">
                                        {formatearTiempo(noti.creadaAt)}
                                    </span>
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
