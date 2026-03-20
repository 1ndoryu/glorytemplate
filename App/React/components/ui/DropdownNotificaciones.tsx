/*
 * Componente: DropdownNotificaciones — Kamples
 * Panel dropdown con la lista de notificaciones recientes.
 * Se muestra al hacer click en el icono de campana del TopBar.
 * Conectado a API real via useDropdownNotificaciones hook.
 *
 * QQ27: Muestra avatar del actor cuando existe, icono como fallback.
 * Items son enlaces <a> para permitir apertura en nueva pestana (click central).
 */

import { Bell, Heart, Download, UserPlus, MessageCircle, Loader2, ShieldAlert, AlertTriangle, Sparkles, CreditCard, DollarSign, X } from 'lucide-react';
import { useDropdownNotificaciones } from '../../hooks/useDropdownNotificaciones';
import type { NotificacionUI } from '@app/types/notificaciones';
import { useEsMovil } from '@app/hooks/useEsMovil';
import { useT } from '@app/utils/i18n/useT';
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
    venta: <DollarSign size={16} />,
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

/* Construye la URL de navegacion de una notificacion */
const obtenerEnlaceNotificacion = (noti: NotificacionUI): string | null => {
    if (noti.enlace) return noti.enlace;
    if (noti.datos?.sampleSlug) return `/sample/${noti.datos.sampleSlug}/`;
    if (noti.tipo === 'follow' && noti.actor?.username) return `/perfil/${noti.actor.username}`;
    return null;
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
    const esMovil = useEsMovil();
    const { t } = useT();

    return (
        <>
            {!esMovil && <div className="dropdownOverlay" onClick={onCerrar} />}
            <div className="dropdownPanel">
                {esMovil && (
                    <div className="dropdownPanelCabecera">
                        <span className="dropdownPanelTitulo">Notificaciones</span>
                        <button className="dropdownPanelCerrar" onClick={onCerrar} type="button" aria-label={t('notificaciones.cerrar')}>
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="dropdownPanelLista">
                    {cargando && !notificacionesCargadas ? (
                        <div className="dropdownPanelVacio">
                            <Loader2 size={28} className="adminSpinner" />
                            <p>{t('comun.cargando')}</p>
                        </div>
                    ) : notificaciones.length === 0 ? (
                        <div className="dropdownPanelVacio">
                            <Bell size={28} />
                            <p>{t('notificaciones.sinNotificaciones')}</p>
                        </div>
                    ) : (
                        notificaciones.map((noti) => {
                            const enlace = obtenerEnlaceNotificacion(noti);
                            const tieneAvatar = !!noti.actor?.avatarUrl;
                            return (
                                <a
                                    key={noti.id}
                                    className={`dropdownItem ${!noti.leida ? 'dropdownItemNoLeido' : ''}`}
                                    href={enlace ?? '#'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        manejarClickNotif(noti);
                                    }}
                                    onAuxClick={(e) => {
                                        /* Click central: marca leida sin cerrar dropdown */
                                        if (e.button === 1 && enlace) {
                                            manejarClickNotif(noti, true);
                                        }
                                    }}
                                >
                                    <div className={`dropdownItemIcono ${tieneAvatar ? 'dropdownItemConAvatar' : ''}`}>
                                        {tieneAvatar
                                            ? <img src={noti.actor!.avatarUrl!} alt="" className="dropdownItemAvatar" loading="lazy" />
                                            : (ICONOS_NOTIFICACION[noti.tipo] ?? <Bell size={16} />)
                                        }
                                    </div>
                                    <div className="dropdownItemContenido">
                                        <span className="dropdownItemTexto">{noti.mensaje}</span>
                                        <span className="dropdownItemTiempo">
                                            {formatearTiempo(noti.creadaAt)}
                                        </span>
                                    </div>
                                    {!noti.leida && <div className="dropdownItemPunto" />}
                                </a>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

export default DropdownNotificaciones;
