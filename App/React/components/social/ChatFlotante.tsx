/*
 * Componente: ChatFlotante — Kamples (FASE 5.2)
 * Chats flotantes tipo Messenger en esquina inferior derecha.
 * Se apilan horizontalmente, encima del reproductor global.
 * Soporta mensajes multimedia: texto, imagen, audio.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Minus, Send, Maximize2, Paperclip, MoreVertical, User, ShieldAlert, Flag } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BurbujaMensaje } from '@app/components/social/BurbujaMensaje';
import { useChatFlotanteStore, type ChatFlotanteInfo } from '@app/stores/chatFlotanteStore';
import { enviarMensaje, enviarMensajeMultimedia } from '@app/services/apiMensajes';
import { obtenerMensajes } from '@app/services/apiMensajes';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { toast } from '@app/stores/toastStore';
import type { Mensaje } from '@app/types';
import '../../styles/componentes/chatFlotante.css';

/* Ventana individual de chat */
const VentanaChat = ({ chat }: { chat: ChatFlotanteInfo }): JSX.Element => {
    const cerrarChat = useChatFlotanteStore(s => s.cerrarChat);
    const minimizarChat = useChatFlotanteStore(s => s.minimizarChat);
    const restaurarChat = useChatFlotanteStore(s => s.restaurarChat);
    const usuario = useAuthStore(s => s.usuario);
    const navegar = useNavigationStore(s => s.navegar);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);

    const mensajesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);

    /* Cargar mensajes al abrir */
    useEffect(() => {
        const cargar = async () => {
            try {
                const resp = await obtenerMensajes(chat.conversacionId);
                if (resp.ok && resp.data) setMensajes(resp.data);
            } catch {
                /* Error de red al cargar mensajes — se muestra chat vacío */
            }
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
            tipo: 'texto',
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        setMensajes((prev) => [...prev, mensajeOptimista]);

        try {
            await enviarMensaje(chat.conversacionId, contenido);
        } catch {
            /* Revertir mensaje optimista si falla */
            setMensajes((prev) => prev.filter((m) => m.id !== mensajeOptimista.id));
            toast.error('Error al enviar mensaje');
        }
        setEnviando(false);
        inputRef.current?.focus();
    }, [texto, enviando, chat.conversacionId, usuario]);

    /* Subir archivo multimedia */
    const manejarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        const esImagen = archivo.type.startsWith('image/');
        const esAudio = archivo.type.startsWith('audio/');
        if (!esImagen && !esAudio) return;

        setEnviando(true);
        const tipo = esImagen ? 'imagen' as const : 'audio' as const;

        /* Mensaje optimista multimedia */
        const msgOptimista: Mensaje = {
            id: Date.now(),
            conversacionId: chat.conversacionId,
            remitenteId: usuario?.id ?? 1,
            contenido: esImagen ? '[Imagen]' : '[Audio]',
            tipo,
            mediaUrl: URL.createObjectURL(archivo),
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        setMensajes((prev) => [...prev, msgOptimista]);

        try {
            await enviarMensajeMultimedia(chat.conversacionId, tipo, archivo);
        } catch {
            setMensajes((prev) => prev.filter((m) => m.id !== msgOptimista.id));
            toast.error('Error al enviar archivo');
        }
        setEnviando(false);

        /* Limpiar input file */
        if (archivoRef.current) archivoRef.current.value = '';
    }, [chat.conversacionId, usuario]);

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
                    {/* C163: Menú 3 puntos con ver perfil / reportar / bloquear */}
                    <div className="chatFlotanteMenuContenedor">
                        <button
                            onClick={() => setMenuAbierto(prev => !prev)}
                            type="button"
                            className="chatFlotanteHeaderBtn"
                            aria-label="Opciones"
                        >
                            <MoreVertical size={12} />
                        </button>
                        {menuAbierto && (
                            <div className="chatFlotanteMenu">
                                <button
                                    className="chatFlotanteMenuItem"
                                    onClick={() => {
                                        setMenuAbierto(false);
                                        navegar(`/perfil/${chat.participanteUsername}/`);
                                    }}
                                    type="button"
                                >
                                    <User size={14} />
                                    <span>Ver perfil</span>
                                </button>
                                <button
                                    className="chatFlotanteMenuItem"
                                    onClick={() => {
                                        setMenuAbierto(false);
                                        /* TO-DO: sistema de reportes */
                                        toast.info('Reporte enviado');
                                    }}
                                    type="button"
                                >
                                    <Flag size={14} />
                                    <span>Reportar</span>
                                </button>
                                <button
                                    className="chatFlotanteMenuItem chatFlotanteMenuItemPeligro"
                                    onClick={() => {
                                        setMenuAbierto(false);
                                        /* TO-DO: API de bloqueo */
                                        toast.info('Usuario bloqueado');
                                    }}
                                    type="button"
                                >
                                    <ShieldAlert size={14} />
                                    <span>Bloquear</span>
                                </button>
                            </div>
                        )}
                    </div>
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
                        <BurbujaMensaje
                            key={msg.id}
                            mensaje={msg}
                            esMio={msg.remitenteId === miId}
                            compacto
                        />
                    ))
                )}
            </div>

            {/* Input con adjuntar */}
            <div className="chatFlotanteInput">
                {/* Input oculto para archivos */}
                <input
                    ref={archivoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg"
                    onChange={manejarArchivo}
                    style={{ display: 'none' }}
                />

                <button
                    className="chatFlotanteAdjuntarBtn"
                    onClick={() => archivoRef.current?.click()}
                    type="button"
                    aria-label="Adjuntar archivo"
                    disabled={enviando}
                >
                    <Paperclip size={14} />
                </button>
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
    const chatsAbiertos = useChatFlotanteStore(s => s.chatsAbiertos);

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
