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

export const useTopBar = () => {
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

    const manejarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
    }, [setBusqueda]);

    /* C169: Placeholder dinámico según la isla actual */
    const islaActual = useNavigationStore(s => s.islaActual);
    const placeholdersPorIsla: Record<string, string> = {
        LibreriaIsland: 'Buscar en librería...',
        ExplorarCancionesIsland: 'Buscar canciones o artistas...',
        CancionDetalleIsland: 'Buscar canciones o artistas...',
    };
    const placeholderBusqueda = placeholdersPorIsla[islaActual ?? ''] ?? 'Buscar samples...';

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
            ? 'Créditos: ∞'
            : `Créditos: ${creditosInfo.limite - creditosInfo.usadas}`
        : 'Créditos: ...';

    const alternarNotificaciones = useCallback(() => {
        setMensajesAbiertos(false);
        setNotificacionesAbiertas((prev) => {
            const siguiente = !prev;

            if (siguiente && totalNotificacionesNoLeidas > 0) {
                marcarTodasLeidasLocal();
                void marcarTodasLeidas();
            }

            return siguiente;
        });
    }, [marcarTodasLeidasLocal, totalNotificacionesNoLeidas]);

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
        etiquetaCreditos,
        placeholderBusqueda,
        manejarClickAvatar,
        islaActual,
    };
};
