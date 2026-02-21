/*
 * Componente: ChatFlotante — Kamples (FASE 5.2)
 * Chats flotantes tipo Messenger en esquina inferior derecha.
 * Lógica de VentanaChat extraída a useVentanaChat (SRP).
 */

import { X, Minus, Send, Maximize2, Paperclip, MoreVertical, User, ShieldAlert, Flag } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BurbujaMensaje } from '@app/components/social/BurbujaMensaje';
import { useChatFlotanteStore, type ChatFlotanteInfo } from '@app/stores/chatFlotanteStore';
import { useVentanaChat } from '@app/hooks/useVentanaChat';
import '../../styles/componentes/chatFlotante.css';

/* Ventana individual de chat */
const VentanaChat = ({ chat }: { chat: ChatFlotanteInfo }): JSX.Element => {
    const {
        mensajes, texto, setTexto, enviando, menuAbierto, miId,
        mensajesRef, inputRef, archivoRef,
        cerrarChat, minimizarChat, restaurarChat,
        manejarEnviar, manejarArchivo, manejarKeyDown,
        toggleMenu, verPerfil, reportar, bloquear,
    } = useVentanaChat({ chat });

    if (chat.minimizado) {
        return (
            <div className="chatFlotanteVentana chatFlotanteMinimizado">
                <div className="chatFlotanteHeader" onClick={() => restaurarChat(chat.conversacionId)}
                    role="button" tabIndex={0}>
                    <Avatar nombre={chat.nombreParticipante} src={chat.avatarUrl ?? undefined} tamano="xs" />
                    <span className="chatFlotanteNombre">{chat.nombreParticipante}</span>
                    <div className="chatFlotanteHeaderAcciones">
                        <button onClick={e => { e.stopPropagation(); restaurarChat(chat.conversacionId); }}
                            type="button" className="chatFlotanteHeaderBtn" aria-label="Restaurar">
                            <Maximize2 size={12} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); cerrarChat(chat.conversacionId); }}
                            type="button" className="chatFlotanteHeaderBtn" aria-label="Cerrar">
                            <X size={12} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chatFlotanteVentana">
            <div className="chatFlotanteHeader">
                <Avatar nombre={chat.nombreParticipante} src={chat.avatarUrl ?? undefined} tamano="xs" />
                <span className="chatFlotanteNombre">{chat.nombreParticipante}</span>
                <div className="chatFlotanteHeaderAcciones">
                    <div className="chatFlotanteMenuContenedor">
                        <button onClick={toggleMenu} type="button" className="chatFlotanteHeaderBtn" aria-label="Opciones">
                            <MoreVertical size={12} />
                        </button>
                        {menuAbierto && (
                            <div className="chatFlotanteMenu">
                                <button className="chatFlotanteMenuItem" onClick={verPerfil} type="button">
                                    <User size={14} /><span>Ver perfil</span>
                                </button>
                                <button className="chatFlotanteMenuItem" onClick={reportar} type="button">
                                    <Flag size={14} /><span>Reportar</span>
                                </button>
                                <button className="chatFlotanteMenuItem chatFlotanteMenuItemPeligro"
                                    onClick={bloquear} type="button">
                                    <ShieldAlert size={14} /><span>Bloquear</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={() => minimizarChat(chat.conversacionId)} type="button"
                        className="chatFlotanteHeaderBtn" aria-label="Minimizar">
                        <Minus size={12} />
                    </button>
                    <button onClick={() => cerrarChat(chat.conversacionId)} type="button"
                        className="chatFlotanteHeaderBtn" aria-label="Cerrar">
                        <X size={12} />
                    </button>
                </div>
            </div>

            <div className="chatFlotanteMensajes" ref={mensajesRef}>
                {mensajes.length === 0 ? (
                    <div className="chatFlotanteVacio">Inicia la conversación</div>
                ) : mensajes.map(msg => (
                    <BurbujaMensaje key={msg.id} mensaje={msg} esMio={msg.remitenteId === miId} compacto />
                ))}
            </div>

            <div className="chatFlotanteInput">
                <input ref={archivoRef} type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg"
                    onChange={manejarArchivo} style={{ display: 'none' }} />
                <button className="chatFlotanteAdjuntarBtn" onClick={() => archivoRef.current?.click()}
                    type="button" aria-label="Adjuntar archivo" disabled={enviando}>
                    <Paperclip size={14} />
                </button>
                <input ref={inputRef} type="text" placeholder="Escribe..." value={texto}
                    onChange={e => setTexto(e.target.value)} onKeyDown={manejarKeyDown} disabled={enviando} />
                <button className={`chatFlotanteEnviar ${texto.trim() ? 'chatFlotanteEnviarActivo' : ''}`}
                    onClick={manejarEnviar} disabled={!texto.trim() || enviando} type="button" aria-label="Enviar">
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
};

/* Contenedor principal: renderiza todos los chats flotantes */
export const ChatFlotante = (): JSX.Element | null => {
    const chatsAbiertos = useChatFlotanteStore(s => s.chatsAbiertos);
    if (chatsAbiertos.length === 0) return null;

    return (
        <div className="chatFlotanteContenedor">
            {chatsAbiertos.map(chat => (
                <VentanaChat key={chat.conversacionId} chat={chat} />
            ))}
        </div>
    );
};

export default ChatFlotante;
