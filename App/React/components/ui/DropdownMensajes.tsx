/*
 * Componente: DropdownMensajes — Kamples
 * Panel dropdown con la lista de conversaciones recientes.
 * Se muestra al hacer click en el icono de correo del TopBar.
 * C192: Usa mensajesStore como cache (stale-while-revalidate).
 * Primera apertura muestra "Cargando...", aperturas siguientes muestran cache al instante
 * y refrescan en background si el TTL expiro.
 */

import { useCallback, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { useChatFlotanteStore } from '@app/stores/chatFlotanteStore';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { obtenerConversaciones } from '@app/services/apiMensajes';
import type { Conversacion } from '@app/types';
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
    const abrirChat = useChatFlotanteStore(s => s.abrirChat);
    const conversaciones = useMensajesStore(s => s.conversaciones);
    const cargando = useMensajesStore(s => s.cargandoConversaciones);
    const conversacionesCargadas = useMensajesStore(s => s.conversacionesCargadas);
    const setConversaciones = useMensajesStore(s => s.setConversaciones);
    const setCargandoConversaciones = useMensajesStore(s => s.setCargandoConversaciones);
    const necesitaRefrescar = useMensajesStore(s => s.necesitaRefrescar);

    /*
     * C192: Stale-while-revalidate.
     * - Primera vez: muestra Cargando, fetch, guardar en store.
     * - Siguientes: muestra cache al instante. Si TTL expiro, refresca en background.
     */
    useEffect(() => {
        let cancelado = false;
        const debeRefrescar = necesitaRefrescar();
        if (!debeRefrescar) return;

        /* Solo mostrar spinner si no hay datos previos */
        if (!conversacionesCargadas) {
            setCargandoConversaciones(true);
        }

        obtenerConversaciones().then((resp) => {
            if (!cancelado && resp.ok && resp.data) {
                setConversaciones(resp.data);
            }
            if (!cancelado) setCargandoConversaciones(false);
        });
        return () => { cancelado = true; };
    }, []);

    const abrirConversacion = useCallback((conv: Conversacion) => {
        abrirChat({
            conversacionId: conv.id,
            participanteId: conv.participante.id,
            participanteUsername: conv.participante.username,
            nombreParticipante: conv.participante.nombreVisible,
            avatarUrl: conv.participante.avatarUrl,
        });
        onCerrar();
    }, [abrirChat, onCerrar]);

    const sinLeer = conversaciones.filter((c) => c.noLeidos > 0).length;

    return (
        <>
            <div className="dropdownOverlay" onClick={onCerrar} />
            <div className="dropdownPanel">
                <div className="dropdownPanelCabecera">
                    <span className="dropdownPanelTitulo">
                        Mensajes {sinLeer > 0 && `(${sinLeer})`}
                    </span>
                </div>

                <div className="dropdownPanelLista">
                    {cargando && !conversacionesCargadas ? (
                        <div className="dropdownPanelVacio">
                            <Loader2 size={28} className="animacionGirar" />
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
