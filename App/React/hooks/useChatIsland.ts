/*
 * Hook: useChatIsland — Kamples
 * Lógica de conversación individual: cargar mensajes, enviar, multimedia.
 * Cleanup con activo=false en carga de mensajes.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
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
import type { Conversacion, Mensaje } from '@app/types';

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
export const agruparPorFecha = (mensajes: Mensaje[]): { fecha: string; mensajes: Mensaje[] }[] => {
    const grupos: Record<string, Mensaje[]> = {};
    mensajes.forEach(m => {
        const clave = new Date(m.creadoAt).toDateString();
        if (!grupos[clave]) grupos[clave] = [];
        grupos[clave].push(m);
    });
    return Object.entries(grupos).map(([, msgs]) => ({
        fecha: formatearFechaGrupo(msgs[0].creadoAt),
        mensajes: msgs,
    }));
};

interface UseChatIslandParams {
    conversacionId?: string;
}

export const useChatIsland = ({ conversacionId: propId }: UseChatIslandParams) => {
    const mensajes = useMensajesStore(s => s.mensajes);
    const conversaciones = useMensajesStore(s => s.conversaciones);
    const setMensajes = useMensajesStore(s => s.setMensajes);
    const agregarMensaje = useMensajesStore(s => s.agregarMensaje);
    const setConversaciones = useMensajesStore(s => s.setConversaciones);
    const actualizarUltimoMensaje = useMensajesStore(s => s.actualizarUltimoMensaje);

    const usuario = useAuthStore(s => s.usuario);
    const navegar = useNavigationStore(s => s.navegar);

    const [textoMensaje, setTextoMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [conversacion, setConversacion] = useState<Conversacion | null>(null);

    const mensajesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);

    const miId = usuario?.id ?? 1;

    /* Obtener ID de conversación de la URL si no viene por props */
    const conversacionId = propId
        ? parseInt(propId, 10)
        : (() => {
              const path = window.location.pathname;
              const partes = path.split('/').filter(Boolean);
              const idx = partes.indexOf('mensajes');
              return idx >= 0 && partes[idx + 1] ? parseInt(partes[idx + 1], 10) : null;
          })();

    /* Cargar conversación y mensajes — con cleanup */
    useEffect(() => {
        if (!conversacionId) return;
        let activo = true;

        const cargar = async () => {
            setCargando(true);
            try {
                let convs = conversaciones;
                if (convs.length === 0) {
                    const respConvs = await obtenerConversaciones();
                    if (!activo) return;
                    if (respConvs.ok && respConvs.data) {
                        setConversaciones(respConvs.data);
                        convs = respConvs.data;
                    }
                }

                const convActiva = convs.find(c => c.id === conversacionId) ?? null;
                if (!activo) return;
                setConversacion(convActiva);

                const resp = await obtenerMensajes(conversacionId);
                if (!activo) return;
                if (resp.ok && resp.data) setMensajes(resp.data);

                if (convActiva && convActiva.noLeidos > 0) {
                    useMensajesStore.getState().marcarConversacionLeida(conversacionId);
                    await marcarConversacionLeida(conversacionId);
                }
            } catch {
                /* Fallo de carga silencioso */
            } finally {
                if (activo) setCargando(false);
            }
        };
        cargar();
        return () => { activo = false; };
    }, [conversacionId, setMensajes, setConversaciones]);

    /* Auto-scroll al final */
    useEffect(() => {
        if (mensajesRef.current) {
            mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
        }
    }, [mensajes]);

    const manejarEnviar = useCallback(async () => {
        if (!textoMensaje.trim() || !conversacionId || enviando) return;

        const contenido = textoMensaje.trim();
        setTextoMensaje('');
        setEnviando(true);

        const mensajeOptimista: Mensaje = {
            id: Date.now(),
            conversacionId,
            remitenteId: miId,
            contenido,
            tipo: 'texto',
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        agregarMensaje(mensajeOptimista);
        actualizarUltimoMensaje(conversacionId, contenido);

        try {
            await enviarMensaje(conversacionId, contenido);
        } catch {
            /* TO-DO: rollback del mensaje optimista en caso de fallo */
        } finally {
            setEnviando(false);
        }
        inputRef.current?.focus();
    }, [textoMensaje, conversacionId, enviando, miId, agregarMensaje, actualizarUltimoMensaje]);

    const manejarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo || !conversacionId) return;

        const esImagen = archivo.type.startsWith('image/');
        const esAudio = archivo.type.startsWith('audio/');
        if (!esImagen && !esAudio) return;

        setEnviando(true);
        const tipo = esImagen ? 'imagen' as const : 'audio' as const;

        const msgOptimista: Mensaje = {
            id: Date.now(),
            conversacionId,
            remitenteId: miId,
            contenido: esImagen ? '[Imagen]' : '[Audio]',
            tipo,
            mediaUrl: URL.createObjectURL(archivo),
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        agregarMensaje(msgOptimista);
        actualizarUltimoMensaje(conversacionId, esImagen ? '[Imagen]' : '[Audio]');

        try {
            await enviarMensajeMultimedia(conversacionId, tipo, archivo);
        } catch {
            /* TO-DO: rollback del mensaje multimedia optimista */
        } finally {
            setEnviando(false);
            if (archivoRef.current) archivoRef.current.value = '';
        }
    }, [conversacionId, miId, agregarMensaje, actualizarUltimoMensaje]);

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

    return {
        mensajes, gruposMensajes, textoMensaje, setTextoMensaje,
        enviando, cargando, conversacion, miId,
        mensajesRef, inputRef, archivoRef,
        navegar, manejarEnviar, manejarArchivo, manejarKeyDown,
    };
};
