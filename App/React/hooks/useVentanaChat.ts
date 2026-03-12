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
import { useReportarStore } from '@app/stores/reportarStore';
import { useBloqueosStore } from '@app/stores/bloqueosStore';
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
    const [cargando, setCargando] = useState(true);
    const [menuAbierto, setMenuAbierto] = useState(false);

    /* QQ52: Staging de multimedia — preview antes de enviar */
    const [archivoStaging, setArchivoStaging] = useState<{
        archivo: File;
        tipo: 'imagen' | 'audio';
        previewUrl: string;
    } | null>(null);

    const mensajesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);

    const miId = usuario?.id ?? 1;

    /* Cargar mensajes al abrir — con cleanup */
    useEffect(() => {
        let activo = true;
        setCargando(true);
        const cargar = async () => {
            try {
                const resp = await obtenerMensajes(chat.conversacionId);
                if (activo && resp.ok && resp.data) setMensajes(resp.data);
            } catch {
                /* Error de red al cargar mensajes — se muestra chat vacío */
            } finally {
                if (activo) setCargando(false);
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

    /* QQ52: Staging — seleccionar archivo para preview, no enviar directamente */
    const manejarArchivo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        const esImagen = archivo.type.startsWith('image/');
        const esAudio = archivo.type.startsWith('audio/');
        if (!esImagen && !esAudio) return;

        const tipo = esImagen ? 'imagen' as const : 'audio' as const;
        const previewUrl = URL.createObjectURL(archivo);
        setArchivoStaging({ archivo, tipo, previewUrl });

        if (archivoRef.current) archivoRef.current.value = '';
    }, []);

    /* QQ52: Enviar el archivo staged */
    const enviarArchivoStaging = useCallback(async () => {
        if (!archivoStaging || enviando) return;
        const { archivo, tipo, previewUrl } = archivoStaging;

        setEnviando(true);
        setArchivoStaging(null);
        URL.revokeObjectURL(previewUrl);

        const msgOptimista: Mensaje = {
            id: Date.now(),
            conversacionId: chat.conversacionId,
            remitenteId: miId,
            contenido: tipo === 'imagen' ? '[Imagen]' : '[Audio]',
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
    }, [archivoStaging, enviando, chat.conversacionId, miId]);

    /* QQ52: Cancelar staging */
    const cancelarStaging = useCallback(() => {
        if (archivoStaging) {
            URL.revokeObjectURL(archivoStaging.previewUrl);
            setArchivoStaging(null);
        }
    }, [archivoStaging]);

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
        /* QQ38: Abrir modal centralizado de reporte de usuario */
        useReportarStore.getState().abrir(
            'usuario',
            chat.participanteId,
            chat.participanteUsername,
        );
    }, [chat.participanteId, chat.participanteUsername]);

    const bloquear = useCallback(async () => {
        setMenuAbierto(false);
        /* QQ23: Bloquear usuario via bloqueosStore */
        await useBloqueosStore.getState().bloquear(chat.participanteId);
        toast.exito(`Has bloqueado a @${chat.participanteUsername}`);
    }, [chat.participanteId, chat.participanteUsername]);

    return {
        mensajes, texto, setTexto, enviando, cargando, menuAbierto, miId,
        archivoStaging,
        mensajesRef, inputRef, archivoRef,
        cerrarChat, minimizarChat, restaurarChat,
        manejarEnviar, manejarArchivo, enviarArchivoStaging, cancelarStaging, manejarKeyDown,
        toggleMenu, cerrarMenuChat, verPerfil, reportar, bloquear,
    };
};
