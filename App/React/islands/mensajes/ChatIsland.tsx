/*
 * Isla: ChatIsland — Kamples (Fase 5.2)
 * Conversación individual con soporte multimedia.
 * Lógica extraída a useChatIsland (SRP).
 */

import { ArrowLeft, Send, Circle, Paperclip } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BurbujaMensaje } from '@app/components/social/BurbujaMensaje';
import { useChatIsland } from '@app/hooks/useChatIsland';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/chat.css';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';

interface ChatIslandProps {
    conversacionId?: string;
}

const ChatIslandBase = ({ conversacionId: propId }: ChatIslandProps): JSX.Element => {
    const {
        gruposMensajes, textoMensaje, setTextoMensaje,
        enviando, cargando, conversacion, miId, mensajes,
        mensajesRef, inputRef, archivoRef,
        navegar, manejarEnviar, manejarArchivo, manejarKeyDown,
    } = useChatIsland({ conversacionId: propId });

    return (
        <div className="chatIsland" id="chatIsland">
            <div className="chatHeader">
                <BotonBase variante="ghost" className="chatVolver" onClick={() => navegar('/mensajes/')}
                    type="button" aria-label="Volver a mensajes">
                    <ArrowLeft size={20} />
                </BotonBase>
                {conversacion && (
                    <div className="chatHeaderInfo">
                        <Avatar nombre={conversacion.participante.nombreVisible}
                            src={conversacion.participante.avatarUrl ?? undefined} tamano="sm" />
                        <div className="chatHeaderTexto">
                            <span className="chatHeaderNombre">{conversacion.participante.nombreVisible}</span>
                            <span className="chatHeaderEstado">
                                {conversacion.enLinea ? (
                                    <><Circle size={8} fill="var(--exito)" stroke="none" /> En línea</>
                                ) : 'Desconectado'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="chatMensajes" ref={mensajesRef}>
                {cargando ? (
                    <div className="chatVacio">Cargando mensajes...</div>
                ) : mensajes.length === 0 ? (
                    <div className="chatVacio"><p>Inicia la conversación</p></div>
                ) : (
                    gruposMensajes.map(grupo => (
                        <div key={grupo.fecha} className="chatGrupoFecha">
                            <div className="chatFechaSeparador"><span>{grupo.fecha}</span></div>
                            {grupo.mensajes.map(msg => (
                                <BurbujaMensaje key={msg.id} mensaje={msg} esMio={msg.remitenteId === miId} />
                            ))}
                        </div>
                    ))
                )}
            </div>

            <div className="chatInputArea">
                {/* sentinel-disable-next-line html-nativo: input type="file" sin equivalente UI */}
                <input ref={archivoRef} type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg"
                    onChange={manejarArchivo} style={{ display: 'none' }} />
                <BotonBase variante="ghost" className="chatAdjuntarBtn" onClick={() => archivoRef.current?.click()}
                    type="button" aria-label="Adjuntar archivo" disabled={enviando}>
                    <Paperclip size={18} />
                </BotonBase>
                <CampoTexto multilínea ref={inputRef} className="chatInput" placeholder="Escribe un mensaje..."
                    value={textoMensaje} onChange={e => setTextoMensaje(e.target.value)}
                    onKeyDown={manejarKeyDown} rows={1} disabled={enviando} />
                <BotonBase variante="ghost" className={`chatEnviarBtn ${textoMensaje.trim() ? 'chatEnviarBtnActivo' : ''}`}
                    onClick={manejarEnviar} disabled={!textoMensaje.trim() || enviando}
                    type="button" aria-label="Enviar mensaje">
                    <Send size={18} />
                </BotonBase>
            </div>
        </div>
    );
};

export const ChatIsland = conAutenticacion(ChatIslandBase);
export default ChatIsland;
