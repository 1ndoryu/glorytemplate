/*
 * Componente: ChatFlotante — Kamples (FASE 5.1)
 * Chats flotantes tipo Messenger en esquina inferior derecha.
 * Se apilan horizontalmente, encima del reproductor global.
 * Minimizables, cerrables, múltiples simultáneos.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Minus, Send, Maximize2 } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { useChatFlotanteStore, type ChatFlotanteInfo } from '@app/stores/chatFlotanteStore';
import { obtenerMensajes, enviarMensaje } from '@app/services/apiMensajes';
import { useAuthStore } from '@app/stores/authStore';
import type { Mensaje } from '@app/types';
import '../../styles/componentes/chatFlotante.css';

/* Ventana individual de chat */
const VentanaChat = ({ chat }: { chat: ChatFlotanteInfo }): JSX.Element => {
    const { cerrarChat, minimizarChat, restaurarChat } = useChatFlotanteStore();
    const { usuario } = useAuthStore();
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const mensajesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Cargar mensajes al abrir */
    useEffect(() => {
        const cargar = async () => {
            const resp = await obtenerMensajes(chat.conversacionId);
            if (resp.ok && resp.data) setMensajes(resp.data);
        };
        cargar();
    }, [chat.conversacionId]);

    /* Auto-scroll al fondo */
    useEffect(() => {
        if (mensajesRef.current) {
            mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
        }
    }, [mensajes]);

    /* Enfocar input al restaurar */
    useEffect(() => {
        if (!chat.minimizado) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [chat.minimizado]);

    const manejarEnviar = useCallback(async () => {
        if (!texto.trim() || enviando) return;
        const contenido = texto.trim();
        setTexto('');
        setEnviando(true);

        /* Optimistic */
        const mensajeOptimista: Mensaje = {
            id: Date.now(),
            conversacionId: chat.conversacionId,
            remitenteId: usuario?.id ?? 1,
            contenido,
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        setMensajes((prev) => [...prev, mensajeOptimista]);

        await enviarMensaje(chat.conversacionId, contenido);
        setEnviando(false);
        inputRef.current?.focus();
    }, [texto, enviando, chat.conversacionId, usuario]);

    const manejarKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                manejarEnviar();
            }
        },
        [manejarEnviar]
    );

    const miId = usuario?.id ?? 1;

    /* Minimizado: solo barra de título */
    if (chat.minimizado) {
        return (
            <div className="chatFlotanteVentana chatFlotanteMinimizado">
                <div
                    className="chatFlotanteHeader"
                    onClick={() => restaurarChat(chat.conversacionId)}
                    role="button"
                    tabIndex={0}
                >
                    <Avatar
                        nombre={chat.nombreParticipante}
                        src={chat.avatarUrl ?? undefined}
                        tamano="xs"
                    />
                    <span className="chatFlotanteNombre">{chat.nombreParticipante}</span>
                    <div className="chatFlotanteHeaderAcciones">
                        <button
                            onClick={(e) => { e.stopPropagation(); restaurarChat(chat.conversacionId); }}
                            type="button"
                            className="chatFlotanteHeaderBtn"
                            aria-label="Restaurar"
                        >
                            <Maximize2 size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); cerrarChat(chat.conversacionId); }}
                            type="button"
                            className="chatFlotanteHeaderBtn"
                            aria-label="Cerrar"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chatFlotanteVentana">
            {/* Header */}
            <div className="chatFlotanteHeader">
                <Avatar
                    nombre={chat.nombreParticipante}
                    src={chat.avatarUrl ?? undefined}
                    tamano="xs"
                />
                <span className="chatFlotanteNombre">{chat.nombreParticipante}</span>
                <div className="chatFlotanteHeaderAcciones">
                    <button
                        onClick={() => minimizarChat(chat.conversacionId)}
                        type="button"
                        className="chatFlotanteHeaderBtn"
                        aria-label="Minimizar"
                    >
                        <Minus size={12} />
                    </button>
                    <button
                        onClick={() => cerrarChat(chat.conversacionId)}
                        type="button"
                        className="chatFlotanteHeaderBtn"
                        aria-label="Cerrar"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Mensajes */}
            <div className="chatFlotanteMensajes" ref={mensajesRef}>
                {mensajes.length === 0 ? (
                    <div className="chatFlotanteVacio">Inicia la conversación</div>
                ) : (
                    mensajes.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chatFlotanteBurbuja ${msg.remitenteId === miId ? 'chatFlotanteBurbujaMia' : 'chatFlotanteBurbujaOtra'}`}
                        >
                            <p>{msg.contenido}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="chatFlotanteInput">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escribe..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={manejarKeyDown}
                    disabled={enviando}
                />
                <button
                    className={`chatFlotanteEnviar ${texto.trim() ? 'chatFlotanteEnviarActivo' : ''}`}
                    onClick={manejarEnviar}
                    disabled={!texto.trim() || enviando}
                    type="button"
                    aria-label="Enviar"
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
};

/* Contenedor principal: renderiza todos los chats flotantes */
export const ChatFlotante = (): JSX.Element | null => {
    const { chatsAbiertos } = useChatFlotanteStore();

    if (chatsAbiertos.length === 0) return null;

    return (
        <div className="chatFlotanteContenedor">
            {chatsAbiertos.map((chat) => (
                <VentanaChat key={chat.conversacionId} chat={chat} />
            ))}
        </div>
    );
};

export default ChatFlotante;
