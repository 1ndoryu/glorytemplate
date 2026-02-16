/*
 * Isla: ChatIsland — Kamples (Fase 5.2)
 * Conversación individual con soporte multimedia.
 * Indicador "escribiendo...", scroll infinito, marcar leído.
 * TO-DO: conectar WebSocket para tiempo real (5.3).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    ArrowLeft,
    Send,
    Circle,
    Paperclip,
} from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BurbujaMensaje } from '@app/components/social/BurbujaMensaje';
import {
    obtenerMensajes,
    obtenerConversaciones,
    enviarMensaje,
    enviarMensajeMultimedia,
    marcarConversacionLeida,
} from '@app/services/apiMensajes';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { Conversacion, Mensaje } from '@app/types';
import '../../styles/componentes/chat.css';



/* Formatear fecha para agrupación */
const formatearFechaGrupo = (fecha: string): string => {
    const hoy = new Date();
    const msg = new Date(fecha);
    const diff = hoy.getTime() - msg.getTime();
    const dias = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return msg.toLocaleDateString('es', { weekday: 'long' });
    return msg.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

/* Agrupar mensajes por fecha */
const agruparPorFecha = (mensajes: Mensaje[]): { fecha: string; mensajes: Mensaje[] }[] => {
    const grupos: Record<string, Mensaje[]> = {};
    mensajes.forEach((m) => {
        const clave = new Date(m.creadoAt).toDateString();
        if (!grupos[clave]) grupos[clave] = [];
        grupos[clave].push(m);
    });
    return Object.entries(grupos).map(([, msgs]) => ({
        fecha: formatearFechaGrupo(msgs[0].creadoAt),
        mensajes: msgs,
    }));
};

interface ChatIslandProps {
    conversacionId?: string;
}

const ChatIslandBase = ({ conversacionId: propId }: ChatIslandProps): JSX.Element => {
    const {
        mensajes,
        conversaciones,
        setMensajes,
        agregarMensaje,
        setConversaciones,
        actualizarUltimoMensaje,
    } = useMensajesStore();

    const { usuario } = useAuthStore();
    const { navegar } = useNavigationStore();

    const [textoMensaje, setTextoMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [conversacion, setConversacion] = useState<Conversacion | null>(null);

    const mensajesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);

    /* Obtener ID de conversación de la URL si no viene por props */
    const conversacionId = propId
        ? parseInt(propId, 10)
        : (() => {
              const path = window.location.pathname;
              const partes = path.split('/').filter(Boolean);
              const idx = partes.indexOf('mensajes');
              return idx >= 0 && partes[idx + 1] ? parseInt(partes[idx + 1], 10) : null;
          })();

    /* Cargar conversación y mensajes */
    useEffect(() => {
        if (!conversacionId) return;

        const cargar = async () => {
            setCargando(true);

            /* Cargar lista de conversaciones si no se tiene */
            let convs = conversaciones;
            if (convs.length === 0) {
                const respConvs = await obtenerConversaciones();
                if (respConvs.ok && respConvs.data) {
                    setConversaciones(respConvs.data);
                    convs = respConvs.data;
                }
            }

            /* Buscar conversación activa */
            const convActiva = convs.find((c) => c.id === conversacionId) ?? null;
            setConversacion(convActiva);

            /* Cargar mensajes */
            const resp = await obtenerMensajes(conversacionId);
            if (resp.ok && resp.data) {
                setMensajes(resp.data);
            }

            /* Marcar como leída */
            if (convActiva && convActiva.noLeidos > 0) {
                useMensajesStore.getState().marcarConversacionLeida(conversacionId);
                await marcarConversacionLeida(conversacionId);
            }

            setCargando(false);
        };
        cargar();
    }, [conversacionId, setMensajes, setConversaciones]);

    /* Auto-scroll al final al cargar mensajes o enviar */
    useEffect(() => {
        if (mensajesRef.current) {
            mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
        }
    }, [mensajes]);

    /* Enviar mensaje */
    const manejarEnviar = useCallback(async () => {
        if (!textoMensaje.trim() || !conversacionId || enviando) return;

        const contenido = textoMensaje.trim();
        setTextoMensaje('');
        setEnviando(true);

        /* Optimistic: agregar al state local */
        const mensajeOptimista: Mensaje = {
            id: Date.now(),
            conversacionId,
            remitenteId: usuario?.id ?? 1,
            contenido,
            tipo: 'texto',
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        agregarMensaje(mensajeOptimista);
        actualizarUltimoMensaje(conversacionId, contenido);

        await enviarMensaje(conversacionId, contenido);
        setEnviando(false);

        /* Enfocar input de nuevo */
        inputRef.current?.focus();
    }, [textoMensaje, conversacionId, enviando, usuario, agregarMensaje, actualizarUltimoMensaje]);

    /* Subir archivo multimedia (imagen/audio) */
    const manejarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo || !conversacionId) return;

        const esImagen = archivo.type.startsWith('image/');
        const esAudio = archivo.type.startsWith('audio/');
        if (!esImagen && !esAudio) return;

        setEnviando(true);
        const tipo = esImagen ? 'imagen' as const : 'audio' as const;

        /* Optimistic multimedia */
        const msgOptimista: Mensaje = {
            id: Date.now(),
            conversacionId,
            remitenteId: usuario?.id ?? 1,
            contenido: esImagen ? '[Imagen]' : '[Audio]',
            tipo,
            mediaUrl: URL.createObjectURL(archivo),
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        agregarMensaje(msgOptimista);
        actualizarUltimoMensaje(conversacionId, esImagen ? '[Imagen]' : '[Audio]');

        await enviarMensajeMultimedia(conversacionId, tipo, archivo);
        setEnviando(false);
        if (archivoRef.current) archivoRef.current.value = '';
    }, [conversacionId, usuario, agregarMensaje, actualizarUltimoMensaje]);

    /* Enviar con Enter (Shift+Enter para nueva línea) */
    const manejarKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                manejarEnviar();
            }
        },
        [manejarEnviar]
    );

    const gruposMensajes = agruparPorFecha(mensajes);
    const miId = usuario?.id ?? 1;

    return (
        <div className="chatIsland" id="chatIsland">
            {/* Header del chat */}
            <div className="chatHeader">
                <button
                    className="chatVolver"
                    onClick={() => navegar('/mensajes/')}
                    type="button"
                    aria-label="Volver a mensajes"
                >
                    <ArrowLeft size={20} />
                </button>

                {conversacion && (
                    <div className="chatHeaderInfo">
                        <Avatar
                            nombre={conversacion.participante.nombreVisible}
                            src={conversacion.participante.avatarUrl ?? undefined}
                            tamano="sm"
                        />
                        <div className="chatHeaderTexto">
                            <span className="chatHeaderNombre">
                                {conversacion.participante.nombreVisible}
                            </span>
                            <span className="chatHeaderEstado">
                                {conversacion.enLinea ? (
                                    <>
                                        <Circle size={8} fill="var(--exito)" stroke="none" />
                                        En línea
                                    </>
                                ) : (
                                    'Desconectado'
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Área de mensajes */}
            <div className="chatMensajes" ref={mensajesRef}>
                {cargando ? (
                    <div className="chatVacio">Cargando mensajes...</div>
                ) : mensajes.length === 0 ? (
                    <div className="chatVacio">
                        <p>Inicia la conversación</p>
                    </div>
                ) : (
                    gruposMensajes.map((grupo) => (
                        <div key={grupo.fecha} className="chatGrupoFecha">
                            <div className="chatFechaSeparador">
                                <span>{grupo.fecha}</span>
                            </div>
                            {grupo.mensajes.map((msg) => (
                                <BurbujaMensaje
                                    key={msg.id}
                                    mensaje={msg}
                                    esMio={msg.remitenteId === miId}
                                />
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Input de mensaje con adjuntar */}
            <div className="chatInputArea">
                {/* Input oculto para archivos */}
                <input
                    ref={archivoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg"
                    onChange={manejarArchivo}
                    style={{ display: 'none' }}
                />

                <button
                    className="chatAdjuntarBtn"
                    onClick={() => archivoRef.current?.click()}
                    type="button"
                    aria-label="Adjuntar archivo"
                    disabled={enviando}
                >
                    <Paperclip size={18} />
                </button>

                <textarea
                    ref={inputRef}
                    className="chatInput"
                    placeholder="Escribe un mensaje..."
                    value={textoMensaje}
                    onChange={(e) => setTextoMensaje(e.target.value)}
                    onKeyDown={manejarKeyDown}
                    rows={1}
                    disabled={enviando}
                />
                <button
                    className={`chatEnviarBtn ${textoMensaje.trim() ? 'chatEnviarBtnActivo' : ''}`}
                    onClick={manejarEnviar}
                    disabled={!textoMensaje.trim() || enviando}
                    type="button"
                    aria-label="Enviar mensaje"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export const ChatIsland = conAutenticacion(ChatIslandBase);
export default ChatIsland;
