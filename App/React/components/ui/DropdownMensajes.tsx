/*
 * Componente: DropdownMensajes — Kamples
 * Panel dropdown con la lista de conversaciones recientes.
 * Se muestra al hacer click en el icono de correo del TopBar.
 * C192: Usa mensajesStore como cache (stale-while-revalidate) via useDropdownMensajes hook.
 */

import { Mail, Loader2, Users, UserPlus } from 'lucide-react';
import { Avatar } from './Avatar';
import { BotonBase } from './BotonBase';
import { useDropdownMensajes } from '../../hooks/useDropdownMensajes';
import '../../styles/componentes/dropdownPanel.css';

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

interface DropdownMensajesProps {
    onCerrar: () => void;
}

export const DropdownMensajes = ({ onCerrar }: DropdownMensajesProps): JSX.Element => {
    const {
        conversaciones,
        cargando,
        conversacionesCargadas,
        tabActiva,
        setTabActiva,
        totalSolicitudes,
        abrirConversacion,
    } = useDropdownMensajes({ onCerrar });

    return (
        <>
            <div className="dropdownOverlay" onClick={onCerrar} />
            <div className="dropdownPanel">
                {/* QQ52: Tabs principal / solicitudes */}
                <div className="dropdownPanelTabs">
                    <BotonBase
                        variante="ghost"
                        className={`dropdownPanelTab${tabActiva === 'principal' ? ' dropdownPanelTabActiva' : ''}`}
                        onClick={() => setTabActiva('principal')}
                        type="button"
                    >
                        <Users size={14} />
                        Principal
                    </BotonBase>
                    <BotonBase
                        variante="ghost"
                        className={`dropdownPanelTab${tabActiva === 'solicitudes' ? ' dropdownPanelTabActiva' : ''}`}
                        onClick={() => setTabActiva('solicitudes')}
                        type="button"
                    >
                        <UserPlus size={14} />
                        Solicitudes
                        {totalSolicitudes > 0 && (
                            <span className="dropdownPanelTabBadge">{totalSolicitudes}</span>
                        )}
                    </BotonBase>
                </div>

                <div className="dropdownPanelLista">
                    {cargando && !conversacionesCargadas ? (
                        <div className="dropdownPanelVacio">
                            <Loader2 size={28} className="adminSpinner" />
                            <p>Cargando...</p>
                        </div>
                    ) : conversaciones.length === 0 ? (
                        <div className="dropdownPanelVacio">
                            <Mail size={28} />
                            <p>Sin mensajes</p>
                        </div>
                    ) : (
                        conversaciones.map((conv) => (
                            <div
                                key={conv.id}
                                className={`dropdownItem ${conv.noLeidos > 0 ? 'dropdownItemNoLeido' : ''}`}
                                onClick={() => abrirConversacion(conv)}
                            >
                                <Avatar
                                    src={conv.participante?.avatarUrl}
                                    nombre={conv.participante?.nombreVisible || conv.participante?.username || '?'}
                                    tamano="sm"
                                />
                                <div className="dropdownItemContenido">
                                    <span className="dropdownItemTexto">
                                        <strong>@{conv.participante.username}</strong> {conv.ultimoMensaje}
                                    </span>
                                    <span className="dropdownItemTiempo">
                                        {formatearTiempo(conv.ultimoMensajeAt)}
                                    </span>
                                </div>
                                {conv.noLeidos > 0 && <div className="dropdownItemPunto" />}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default DropdownMensajes;
