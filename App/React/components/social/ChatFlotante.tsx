/*
 * Componente: ChatFlotante — Kamples (FASE 5.2)
 * Chats flotantes tipo Messenger en esquina inferior derecha.
 * Lógica de VentanaChat extraída a useVentanaChat (SRP).
 */

import { X, Minus, Send, Maximize2, Paperclip, MoreVertical, User, ShieldAlert, Flag, Loader2, Volume2 } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BurbujaMensaje } from '@app/components/social/BurbujaMensaje';
import { useChatFlotanteStore, type ChatFlotanteInfo } from '@app/stores/chatFlotanteStore';
import { useVentanaChat } from '@app/hooks/useVentanaChat';
import '../../styles/componentes/chatFlotante.css';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { Input } from '../ui/Input';
import { useT } from '@app/utils/i18n/useT';

/* Ventana individual de chat */
const VentanaChat = ({ chat }: { chat: ChatFlotanteInfo }): JSX.Element => {
    const {
        mensajes, texto, setTexto, enviando, cargando, menuAbierto, miId,
        archivoStaging,
        cargandoMas, manejarScroll,
        mensajesRef, inputRef, archivoRef,
        cerrarChat, minimizarChat, restaurarChat,
        manejarEnviar, manejarArchivo, enviarArchivoStaging, cancelarStaging, manejarKeyDown,
        toggleMenu, verPerfil, reportar, bloquear,
    } = useVentanaChat({ chat });

    const { t } = useT();

    if (chat.minimizado) {
        return (
            <div className="chatFlotanteVentana chatFlotanteMinimizado">
                <div className="chatFlotanteHeader" onClick={() => restaurarChat(chat.conversacionId)}
                    role="button" tabIndex={0}>
                    <Avatar nombre={chat.nombreParticipante} src={chat.avatarUrl ?? undefined} tamano="xs" />
                    <span className="chatFlotanteNombre">{chat.nombreParticipante}</span>
                    <div className="chatFlotanteHeaderAcciones">
                        <BotonBase variante="ghost" onClick={e => { e.stopPropagation(); restaurarChat(chat.conversacionId); }}
                            type="button" className="chatFlotanteHeaderBtn" aria-label="Restaurar">
                            <Maximize2 size={12} />
                        </BotonBase>
                        <BotonBase variante="ghost" onClick={e => { e.stopPropagation(); cerrarChat(chat.conversacionId); }}
                            type="button" className="chatFlotanteHeaderBtn" aria-label="Cerrar">
                            <X size={12} />
                        </BotonBase>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chatFlotanteVentana">
            <div className="chatFlotanteHeader">
                {/* [2003A-31] Avatar y nombre clickeables → ver perfil + cerrar chat */}
                <Avatar nombre={chat.nombreParticipante} src={chat.avatarUrl ?? undefined} tamano="xs"
                    onClick={verPerfil} className="chatFlotanteAvatarClickeable" />
                <span className="chatFlotanteNombre chatFlotanteNombreClickeable" onClick={verPerfil}
                    role="button" tabIndex={0}>{chat.nombreParticipante}</span>
                <div className="chatFlotanteHeaderAcciones">
                    <div className="chatFlotanteMenuContenedor">
                        <BotonBase variante="ghost" onClick={toggleMenu} type="button" className="chatFlotanteHeaderBtn" aria-label="Opciones">
                            <MoreVertical size={12} />
                        </BotonBase>
                        {menuAbierto && (
                            <div className="chatFlotanteMenu">
                                <BotonBase variante="ghost" className="chatFlotanteMenuItem" onClick={verPerfil} type="button">
                                    <User size={14} /><span>{t('comun.verPerfil')}</span>
                                </BotonBase>
                                <BotonBase variante="ghost" className="chatFlotanteMenuItem" onClick={reportar} type="button">
                                    <Flag size={14} /><span>{t('comun.reportar')}</span>
                                </BotonBase>
                                <BotonBase variante="ghost" className="chatFlotanteMenuItem chatFlotanteMenuItemPeligro"
                                    onClick={bloquear} type="button">
                                    <ShieldAlert size={14} /><span>{t('comun.bloquear')}</span>
                                </BotonBase>
                            </div>
                        )}
                    </div>
                    <BotonBase variante="ghost" onClick={() => minimizarChat(chat.conversacionId)} type="button"
                        className="chatFlotanteHeaderBtn" aria-label="Minimizar">
                        <Minus size={12} />
                    </BotonBase>
                    <BotonBase variante="ghost" onClick={() => cerrarChat(chat.conversacionId)} type="button"
                        className="chatFlotanteHeaderBtn" aria-label="Cerrar">
                        <X size={12} />
                    </BotonBase>
                </div>
            </div>

            <div className="chatFlotanteMensajes" ref={mensajesRef} onScroll={manejarScroll}>
                {cargandoMas && (
                    <div className="chatFlotanteVacio">
                        <Loader2 size={16} className="adminSpinner" />
                    </div>
                )}
                {cargando ? (
                    <div className="chatFlotanteVacio">
                        <Loader2 size={20} className="adminSpinner" />
                    </div>
                ) : mensajes.length === 0 ? (
                    <div className="chatFlotanteVacio">{t('chat.iniciaConversacion')}</div>
                ) : mensajes.map(msg => (
                    <BurbujaMensaje key={msg.id} mensaje={msg} esMio={msg.remitenteId === miId} compacto />
                ))}
            </div>

            <div className="chatFlotanteInput">
                {/* QQ52: Preview de archivo antes de enviar */}
                {archivoStaging && (
                    <div className="chatFlotanteStagingPreview">
                        {archivoStaging.tipo === 'imagen' ? (
                            <img src={archivoStaging.previewUrl} alt="Preview" className="chatFlotanteStagingImagen" />
                        ) : (
                            <div className="chatFlotanteStagingAudio">
                                <Volume2 size={16} />
                                <span>{archivoStaging.archivo.name}</span>
                            </div>
                        )}
                        <div className="chatFlotanteStagingAcciones">
                            <BotonBase variante="ghost" className="chatFlotanteStagingCancelar" onClick={cancelarStaging}
                                type="button" aria-label="Cancelar">
                                <X size={14} />
                            </BotonBase>
                            <BotonBase variante="ghost" className="chatFlotanteStagingEnviar" onClick={enviarArchivoStaging}
                                type="button" aria-label="Enviar" disabled={enviando}>
                                <Send size={14} />
                            </BotonBase>
                        </div>
                    </div>
                )}
                <Input ref={archivoRef} type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg"
                    onChange={manejarArchivo} style={{ display: 'none' }} />
                {/* [183A-103] Fila de controles: adjuntar + input + enviar en su propio div */}
                <div className="chatFlotanteInputFila">
                    <BotonBase variante="ghost" className="chatFlotanteAdjuntarBtn" onClick={() => archivoRef.current?.click()}
                        type="button" aria-label="Adjuntar archivo" disabled={enviando}>
                        <Paperclip size={14} />
                    </BotonBase>
                    <CampoTexto ref={inputRef}  placeholder={t('chat.escribe')} value={texto}
                        onChange={e => setTexto(e.target.value)} onKeyDown={manejarKeyDown} disabled={enviando} />
                    <BotonBase variante="ghost" tamano="ninguno" className={`chatFlotanteEnviar ${texto.trim() ? 'chatFlotanteEnviarActivo' : ''}`}
                        onClick={manejarEnviar} disabled={!texto.trim() || enviando} type="button" aria-label="Enviar">
                        <Send size={14} />
                    </BotonBase>
                </div>
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
