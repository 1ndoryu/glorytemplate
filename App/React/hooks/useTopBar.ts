/*
 * Hook: useTopBar
 * Lógica de la barra superior: stores, créditos, toggles de dropdowns, menú avatar.
 * Extraído de TopBar.tsx para cumplir SRP.
 */

import { useState, useCallback, useEffect, type MouseEvent } from 'react';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { obtenerLimites } from '@app/services/apiDescargas';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { useNotificacionesStore } from '@app/stores/notificacionesStore';
import { obtenerConversaciones } from '@app/services/apiMensajes';
import { marcarTodasLeidas, obtenerNotificaciones } from '@app/services/apiNotificaciones';
import { wsService } from '@app/services/wsService';
import { useT } from '@app/utils/i18n';

export const useTopBar = () => {
    const { t } = useT();
    const tabs = useTabsTopBarStore(s => s.tabs);
    const activa = useTabsTopBarStore(s => s.activa);
    const setActiva = useTabsTopBarStore(s => s.setActiva);
    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const busqueda = useFiltrosStore(s => s.busqueda);
    const setBusqueda = useFiltrosStore(s => s.setBusqueda);
    const navegar = useNavigationStore(s => s.navegar);
    const abrirCrear = useCrearModalStore(s => s.abrir);
    const abrirConfiguracion = useConfiguracionModalStore(s => s.abrir);
    const abrirPlanes = usePlanesModalStore(s => s.abrir);
    const modoPanelLateral = usePanelLateralStore(s => s.modo);
    const abrirMezclador = usePanelLateralStore(s => s.abrirMezclador);
    const cerrarPanel = usePanelLateralStore(s => s.cerrar);

    const setConversaciones = useMensajesStore(s => s.setConversaciones);
    const totalMensajesNoLeidos = useMensajesStore(
        s => s.conversaciones.reduce((acc, c) => acc + c.noLeidos, 0)
    );
    const hidratarNotificaciones = useNotificacionesStore(s => s.hidratarNotificaciones);
    const setCargandoSilenciosoNotificaciones = useNotificacionesStore(s => s.setCargandoSilencioso);
    const marcarTodasLeidasLocal = useNotificacionesStore(s => s.marcarTodasLeidasLocal);
    const totalNotificacionesNoLeidas = useNotificacionesStore(s => s.totalNoLeidas());

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [mensajesAbiertos, setMensajesAbiertos] = useState(false);
    const [busquedaModalAbierta, setBusquedaModalAbierta] = useState(false);
    const [creditosInfo, setCreditosInfo] = useState<{ usadas: number; limite: number; ilimitado: boolean } | null>(null);

    /* Cargar créditos de descarga al montar y cada 60s */
    useEffect(() => {
        if (!autenticado) return;
        const controller = new AbortController();
        const cargar = async () => {
            try {
                const resp = await obtenerLimites();
                if (controller.signal.aborted) return;
                if (resp.ok && resp.data) {
                    setCreditosInfo({
                        usadas: resp.data.usadas,
                        limite: resp.data.limite,
                        ilimitado: resp.data.ilimitado,
                    });
                }
                
                /* Precargar notificaciones y mensajes silenciosamente en background */
                obtenerConversaciones().then(respConv => {
                    if (!controller.signal.aborted && respConv.ok && respConv.data) {
                        setConversaciones(respConv.data);
                    }
                });
                
                setCargandoSilenciosoNotificaciones(true);
                obtenerNotificaciones().then(respNoti => {
                    if (!controller.signal.aborted && respNoti.ok && respNoti.data) {
                        hidratarNotificaciones(respNoti.data, true);
                    }
                    if (!controller.signal.aborted) setCargandoSilenciosoNotificaciones(false);
                }).catch(() => {
                    if (!controller.signal.aborted) setCargandoSilenciosoNotificaciones(false);
                });

            } catch {
                /* Error de red cargando créditos — se reintenta en el siguiente intervalo */
            }
        };
        cargar();
        const intervalo = setInterval(cargar, 60000);
        return () => {
            controller.abort();
            clearInterval(intervalo);
        };
    }, [autenticado, hidratarNotificaciones, setConversaciones, setCargandoSilenciosoNotificaciones]);

    /*
     * QK68: Listeners WS para notificaciones y mensajes en tiempo real.
     * Cuando WS recibe 'notificacion', refrescamos las notificaciones del store.
     * Cuando WS recibe 'mensaje_nuevo', refrescamos la lista de conversaciones.
     */
    useEffect(() => {
        if (!autenticado) return;

        const unsubNotif = wsService.on('notificacion', () => {
            /* Refrescar lista completa para mantener orden y datos normalizados */
            obtenerNotificaciones().then(resp => {
                if (resp.ok && resp.data) {
                    hidratarNotificaciones(resp.data, true);
                }
            });
        });

        const unsubMsg = wsService.on('mensaje_nuevo', () => {
            /* Refrescar lista de conversaciones para actualizar badge y preview */
            obtenerConversaciones().then(resp => {
                if (resp.ok && resp.data) {
                    setConversaciones(resp.data);
                }
            });
        });

        return () => {
            unsubNotif();
            unsubMsg();
        };
    }, [autenticado, hidratarNotificaciones, setConversaciones]);

    const manejarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
    }, [setBusqueda]);

    /* C169: Placeholder dinámico según la isla actual */
    const islaActual = useNavigationStore(s => s.islaActual);
    const placeholdersPorIsla: Record<string, string> = {
        LibreriaIsland: 'topbar.buscarEnLibreria',
        ExplorarCancionesIsland: 'topbar.buscarCancionesOArtistas',
        CancionDetalleIsland: 'topbar.buscarCancionesOArtistas',
    };
    const placeholderBusqueda = t(placeholdersPorIsla[islaActual ?? ''] ?? 'topbar.buscarSamples');

    const manejarClickAvatar = useCallback((e?: MouseEvent) => {
        if (!e) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        /* Alinear borde derecho del menú con borde derecho del avatar */
        setMenuPos({ x: rect.right, y: rect.bottom + 4 });
        setMenuAbierto(true);
    }, []);

    /* C352: Mostrar solo créditos disponibles, sin el límite total */
    const etiquetaCreditos = creditosInfo
        ? creditosInfo.ilimitado
            ? `${t('topbar.creditos')}: ∞`
            : `${t('topbar.creditos')}: ${creditosInfo.limite - creditosInfo.usadas}`
        : `${t('topbar.creditos')}: ...`;

    const alternarNotificaciones = useCallback(() => {
        setMensajesAbiertos(false);
        setNotificacionesAbiertas(prev => !prev);
    }, []);

    /* Marcar leídas FUERA del updater de setState para evitar
     * "Cannot update Sidebar while rendering TopBar" (Zustand set() síncrono
     * notifica suscriptores durante la fase de render del updater). */
    useEffect(() => {
        if (notificacionesAbiertas && totalNotificacionesNoLeidas > 0) {
            marcarTodasLeidasLocal();
            void marcarTodasLeidas();
        }
    }, [notificacionesAbiertas, totalNotificacionesNoLeidas, marcarTodasLeidasLocal]);

    const alternarMensajes = useCallback(() => {
        setNotificacionesAbiertas(false);
        setMensajesAbiertos(prev => !prev);
    }, []);

    const cerrarNotificaciones = useCallback(() => setNotificacionesAbiertas(false), []);
    const cerrarMensajes = useCallback(() => setMensajesAbiertos(false), []);

    const alternarMezclador = useCallback(() => {
        if (modoPanelLateral === 'mezclador') {
            cerrarPanel();
        } else {
            abrirMezclador();
        }
    }, [modoPanelLateral, abrirMezclador, cerrarPanel]);

    return {
        tabs,
        activa,
        setActiva,
        usuario,
        autenticado,
        busqueda,
        manejarBusqueda,
        navegar,
        abrirCrear,
        abrirConfiguracion,
        abrirPlanes,
        modoPanelLateral,
        alternarMezclador,
        menuAbierto,
        setMenuAbierto,
        menuPos,
        notificacionesAbiertas,
        alternarNotificaciones,
        cerrarNotificaciones,
        mensajesAbiertos,
        alternarMensajes,
        cerrarMensajes,
        busquedaModalAbierta,
        setBusquedaModalAbierta,
        totalNotificacionesNoLeidas,
        totalMensajesNoLeidos,
        etiquetaCreditos,
        placeholderBusqueda,
        manejarClickAvatar,
        islaActual,
    };
};
