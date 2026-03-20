/*
 * Hook: useVentanaChat — Kamples
 * [183A-62] Lógica de ventana de chat flotante: mensajes con cursor pagination, 
 * envío, multimedia, WebSocket. Scroll arriba carga mensajes más antiguos.
 */

import {useState, useRef, useCallback, useEffect} from 'react';
import {useChatFlotanteStore, type ChatFlotanteInfo} from '@app/stores/chatFlotanteStore';
import {enviarMensaje, enviarMensajeMultimedia, obtenerMensajes, marcarConversacionLeida} from '@app/services/apiMensajes';
import {useAuthStore} from '@app/stores/authStore';
import {useMensajesStore} from '@app/stores/mensajesStore';
import {useNavigationStore} from '@/core/router';
import {toast} from '@app/stores/toastStore';
import {getT} from '@app/utils/i18n';
import {useReportarStore} from '@app/stores/reportarStore';
import {useBloqueosStore} from '@app/stores/bloqueosStore';
import {wsService} from '@app/services/wsService';
import type {Mensaje} from '@app/types';

interface UseVentanaChatParams {
    chat: ChatFlotanteInfo;
}

export const useVentanaChat = ({chat}: UseVentanaChatParams) => {
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
    /* [183A-62] Estado de paginación por cursor */
    const [hayMas, setHayMas] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);

    /* QQ52: Staging de multimedia — preview antes de enviar */
    const [archivoStaging, setArchivoStaging] = useState<{
        archivo: File;
        tipo: 'imagen' | 'audio';
        previewUrl: string;
    } | null>(null);

    const mensajesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const archivoRef = useRef<HTMLInputElement>(null);
    /* [183A-62] Flag para evitar auto-scroll al cargar mensajes antiguos */
    const cargandoAntiguosRef = useRef(false);

    const miId = usuario?.id ?? 1;

    /* Cargar mensajes más recientes al abrir — con cleanup + marcar leída (QQ69) */
    useEffect(() => {
        let activo = true;
        setCargando(true);
        const cargar = async () => {
            try {
                const resp = await obtenerMensajes(chat.conversacionId);
                if (activo && resp.ok && resp.data) {
                    /* QQ69: Marcar conversacion leida al abrir ventana flotante */
                    setMensajes(resp.data);
                    setHayMas(resp.hayMas ?? false);
                    useMensajesStore.getState().marcarConversacionLeida(chat.conversacionId);
                    marcarConversacionLeida(chat.conversacionId);
                }
            } catch {
                /* Error de red al cargar mensajes — se muestra chat vacío */
            } finally {
                if (activo) setCargando(false);
            }
        };
        cargar();
        return () => {
            activo = false;
        };
    }, [chat.conversacionId]);

    /* Auto-scroll al fondo (solo si no se están cargando mensajes antiguos) */
    useEffect(() => {
        if (cargandoAntiguosRef.current) return;
        if (mensajesRef.current) {
            mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
        }
    }, [mensajes]);

    /*
     * QK68: Recibir mensajes nuevos vía WebSocket en tiempo real.
     * Si WS envía un mensaje para esta conversación, se agrega al estado local.
     */
    useEffect(() => {
        const unsub = wsService.on('mensaje_nuevo', (datos: unknown) => {
            const d = datos as { conversacionId: number; mensaje: Mensaje };
            if (d.conversacionId === chat.conversacionId && d.mensaje) {
                setMensajes(prev => {
                    /* Evitar duplicados (el mismo mensaje puede llegar por polling + WS) */
                    if (prev.some(m => m.id === d.mensaje.id)) return prev;
                    return [...prev, d.mensaje];
                });
                useMensajesStore.getState().marcarConversacionLeida(chat.conversacionId);
                marcarConversacionLeida(chat.conversacionId);
            }
        });
        return unsub;
    }, [chat.conversacionId]);

    /*
     * QK58/QK68: Polling de mensajes como fallback.
     * [183A-62] Adaptado a cursor-based: polling obtiene los últimos 50 y fusiona
     * con mensajes antiguos ya cargados. No reemplaza todo el array.
     */
    useEffect(() => {
        if (chat.minimizado) return;

        const obtenerIntervalo = () => wsService.estaConectado() ? 30000 : 5000;

        let timeoutId: number;

        const poll = async () => {
            try {
                const resp = await obtenerMensajes(chat.conversacionId);
                if (resp.ok && resp.data) {
                    const nuevos = resp.data;
                    setMensajes(prev => {
                        if (nuevos.length === 0) return prev;
                        /* Obtener el ID más pequeño que ya teníamos (mensajes antiguos cargados por scroll) */
                        const idMinPrev = prev.length > 0 ? prev[0].id : Infinity;
                        const idMinNuevos = nuevos[0]?.id ?? Infinity;
                        /* Si tenemos mensajes más antiguos que los últimos 50, conservarlos */
                        const antiguos = idMinPrev < idMinNuevos
                            ? prev.filter(m => m.id < idMinNuevos)
                            : [];
                        const fusionados = [...antiguos, ...nuevos];
                        /* Solo actualizar si realmente cambió algo */
                        if (fusionados.length === prev.length) {
                            const ultimoFusion = fusionados[fusionados.length - 1]?.id ?? 0;
                            const ultimoPrev = prev[prev.length - 1]?.id ?? 0;
                            if (ultimoFusion === ultimoPrev) return prev;
                        }
                        return fusionados;
                    });
                    /* Marcar leidos silenciosamente */
                    useMensajesStore.getState().marcarConversacionLeida(chat.conversacionId);
                }
            } catch {
                /* Fallo silencioso en polling — se reintenta en el siguiente ciclo */
            }
            timeoutId = window.setTimeout(poll, obtenerIntervalo());
        };

        timeoutId = window.setTimeout(poll, obtenerIntervalo());

        return () => clearTimeout(timeoutId);
    }, [chat.conversacionId, chat.minimizado]);

    /* Enfocar input al restaurar */
    useEffect(() => {
        if (!chat.minimizado) {
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [chat.minimizado]);

    /* [183A-62] Cargar mensajes más antiguos (scroll hacia arriba) */
    const cargarMasAntiguos = useCallback(async () => {
        if (cargandoMas || !hayMas || mensajes.length === 0) return;

        const primerMensajeId = mensajes[0]?.id;
        if (!primerMensajeId) return;

        setCargandoMas(true);
        cargandoAntiguosRef.current = true;

        const contenedor = mensajesRef.current;
        const scrollHeightAntes = contenedor?.scrollHeight ?? 0;

        try {
            const resp = await obtenerMensajes(chat.conversacionId, primerMensajeId);
            if (resp.ok && resp.data && resp.data.length > 0) {
                setMensajes(prev => [...resp.data!, ...prev]);
                setHayMas(resp.hayMas ?? false);

                requestAnimationFrame(() => {
                    if (contenedor) {
                        const scrollHeightDespues = contenedor.scrollHeight;
                        contenedor.scrollTop = scrollHeightDespues - scrollHeightAntes;
                    }
                    cargandoAntiguosRef.current = false;
                });
                return;
            }
            setHayMas(false);
        } catch {
            /* Error silencioso */
        } finally {
            setCargandoMas(false);
            cargandoAntiguosRef.current = false;
        }
    }, [chat.conversacionId, cargandoMas, hayMas, mensajes]);

    /* [183A-62] Detectar scroll arriba para cargar más */
    const manejarScroll = useCallback(() => {
        const contenedor = mensajesRef.current;
        if (!contenedor || cargandoMas || !hayMas) return;
        if (contenedor.scrollTop < 100) {
            cargarMasAntiguos();
        }
    }, [cargarMasAntiguos, cargandoMas, hayMas]);

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
            creadoAt: new Date().toISOString()
        };
        setMensajes(prev => [...prev, mensajeOptimista]);

        try {
            await enviarMensaje(chat.conversacionId, contenido);
            /* QK60: Marcar conversacion como aceptada (optimistic — backend ya lo hizo) */
            useMensajesStore.getState().aceptarConversacion(chat.conversacionId);
        } catch {
            setMensajes(prev => prev.filter(m => m.id !== mensajeOptimista.id));
            toast.error(getT()('error.enviarMensaje'));
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

        const tipo = esImagen ? ('imagen' as const) : ('audio' as const);
        const previewUrl = URL.createObjectURL(archivo);
        setArchivoStaging({archivo, tipo, previewUrl});

        if (archivoRef.current) archivoRef.current.value = '';
    }, []);

    /* QQ52: Enviar el archivo staged */
    const enviarArchivoStaging = useCallback(async () => {
        if (!archivoStaging || enviando) return;
        const {archivo, tipo, previewUrl} = archivoStaging;

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
            creadoAt: new Date().toISOString()
        };
        setMensajes(prev => [...prev, msgOptimista]);

        try {
            await enviarMensajeMultimedia(chat.conversacionId, tipo, archivo);
            /* QK60: Marcar conversacion como aceptada */
            useMensajesStore.getState().aceptarConversacion(chat.conversacionId);
        } catch {
            setMensajes(prev => prev.filter(m => m.id !== msgOptimista.id));
            toast.error(getT()('error.enviarArchivo'));
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

    /* [2003A-31] Ver perfil cierra el chat y navega al perfil */
    const verPerfil = useCallback(() => {
        setMenuAbierto(false);
        cerrarChat(chat.conversacionId);
        navegar(`/perfil/${chat.participanteUsername}/`);
    }, [navegar, cerrarChat, chat.conversacionId, chat.participanteUsername]);

    const reportar = useCallback(() => {
        setMenuAbierto(false);
        /* QQ38: Abrir modal centralizado de reporte de usuario */
        useReportarStore.getState().abrir('usuario', chat.participanteId, chat.participanteUsername);
    }, [chat.participanteId, chat.participanteUsername]);

    const bloquear = useCallback(async () => {
        setMenuAbierto(false);
        /* QQ23: Bloquear usuario via bloqueosStore */
        await useBloqueosStore.getState().bloquear(chat.participanteId);
        toast.exito(`Has bloqueado a @${chat.participanteUsername}`);
    }, [chat.participanteId, chat.participanteUsername]);

    return {
        mensajes,
        texto,
        setTexto,
        enviando,
        cargando,
        menuAbierto,
        miId,
        archivoStaging,
        hayMas,
        cargandoMas,
        manejarScroll,
        mensajesRef,
        inputRef,
        archivoRef,
        cerrarChat,
        minimizarChat,
        restaurarChat,
        manejarEnviar,
        manejarArchivo,
        enviarArchivoStaging,
        cancelarStaging,
        manejarKeyDown,
        toggleMenu,
        cerrarMenuChat,
        verPerfil,
        reportar,
        bloquear
    };
};
