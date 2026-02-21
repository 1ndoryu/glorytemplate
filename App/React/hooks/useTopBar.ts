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
    }, [autenticado]);

    const manejarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
    }, [setBusqueda]);

    /* C169: Placeholder dinámico según la isla actual */
    const islaActual = useNavigationStore(s => s.islaActual);
    const placeholderBusqueda = islaActual === 'LibreriaIsland' ? 'Buscar en librería...' : 'Buscar samples...';

    const manejarClickAvatar = useCallback((e?: MouseEvent) => {
        if (!e) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        /* Alinear borde derecho del menú con borde derecho del avatar */
        setMenuPos({ x: rect.right, y: rect.bottom + 4 });
        setMenuAbierto(true);
    }, []);

    const etiquetaCreditos = creditosInfo
        ? creditosInfo.ilimitado
            ? 'Créditos: ∞'
            : `Créditos: ${creditosInfo.limite - creditosInfo.usadas}/${creditosInfo.limite}`
        : 'Créditos: ...';

    const alternarNotificaciones = useCallback(() => {
        setMensajesAbiertos(false);
        setNotificacionesAbiertas(prev => !prev);
    }, []);

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
        etiquetaCreditos,
        placeholderBusqueda,
        manejarClickAvatar,
    };
};
