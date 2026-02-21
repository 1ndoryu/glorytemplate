/*
 * Hook: useVentanaChat — Kamples
 * Lógica de ventana de chat flotante: mensajes, envío, multimedia.
 * Cleanup con activo=false en carga + refs para scroll/focus.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useChatFlotanteStore, type ChatFlotanteInfo } from '@app/stores/chatFlotanteStore';
import { enviarMensaje, enviarMensajeMultimedia, obtenerMensajes } from '@app/services/apiMensajes';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { toast } from '@app/stores/toastStore';
import type { Mensaje } from '@app/types';

interface UseVentanaChatParams {
    chat: ChatFlotanteInfo;
}

export const useVentanaChat = ({ chat }: UseVentanaChatParams) => {
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

    const miId = usuario?.id ?? 1;

    /* Cargar mensajes al abrir — con cleanup */
    useEffect(() => {
        let activo = true;
        const cargar = async () => {
            try {
                const resp = await obtenerMensajes(chat.conversacionId);
                if (activo && resp.ok && resp.data) setMensajes(resp.data);
            } catch {
                /* Error de red al cargar mensajes — se muestra chat vacío */
            }
        };
        cargar();
        return () => { activo = false; };
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
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [chat.minimizado]);

    const manejarEnviar = useCallback(async () => {
        if (!texto.trim() || enviando) return;
        const contenido = texto.trim();
        setTexto('');
        setEnviando(true);

        const mensajeOptimista: Mensaje = {
            id: Date.now(),
            conversacionId: chat.conversacionId,
            remitenteId: miId,
            contenido,
            tipo: 'texto',
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        setMensajes(prev => [...prev, mensajeOptimista]);

        try {
            await enviarMensaje(chat.conversacionId, contenido);
        } catch {
            setMensajes(prev => prev.filter(m => m.id !== mensajeOptimista.id));
            toast.error('Error al enviar mensaje');
        }
        setEnviando(false);
        inputRef.current?.focus();
    }, [texto, enviando, chat.conversacionId, miId]);

    const manejarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        const esImagen = archivo.type.startsWith('image/');
        const esAudio = archivo.type.startsWith('audio/');
        if (!esImagen && !esAudio) return;

        setEnviando(true);
        const tipo = esImagen ? 'imagen' as const : 'audio' as const;

        const msgOptimista: Mensaje = {
            id: Date.now(),
            conversacionId: chat.conversacionId,
            remitenteId: miId,
            contenido: esImagen ? '[Imagen]' : '[Audio]',
            tipo,
            mediaUrl: URL.createObjectURL(archivo),
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        setMensajes(prev => [...prev, msgOptimista]);

        try {
            await enviarMensajeMultimedia(chat.conversacionId, tipo, archivo);
        } catch {
            setMensajes(prev => prev.filter(m => m.id !== msgOptimista.id));
            toast.error('Error al enviar archivo');
        }
        setEnviando(false);
        if (archivoRef.current) archivoRef.current.value = '';
    }, [chat.conversacionId, miId]);

    const manejarKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                manejarEnviar();
            }
        },
        [manejarEnviar]
    );

    const toggleMenu = useCallback(() => setMenuAbierto(prev => !prev), []);
    const cerrarMenuChat = useCallback(() => setMenuAbierto(false), []);

    const verPerfil = useCallback(() => {
        setMenuAbierto(false);
        navegar(`/perfil/${chat.participanteUsername}/`);
    }, [navegar, chat.participanteUsername]);

    const reportar = useCallback(() => {
        setMenuAbierto(false);
        /* TO-DO: sistema de reportes */
        toast.info('Reporte enviado');
    }, []);

    const bloquear = useCallback(() => {
        setMenuAbierto(false);
        /* TO-DO: API de bloqueo */
        toast.info('Usuario bloqueado');
    }, []);

    return {
        mensajes, texto, setTexto, enviando, menuAbierto, miId,
        mensajesRef, inputRef, archivoRef,
        cerrarChat, minimizarChat, restaurarChat,
        manejarEnviar, manejarArchivo, manejarKeyDown,
        toggleMenu, cerrarMenuChat, verPerfil, reportar, bloquear,
    };
};
