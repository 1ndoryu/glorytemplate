/*
 * Hook: useTabsIsla — Kamples (C174)
 * Registra tabs de TopBar para una isla keep-alive.
 * A diferencia de setTabs en useEffect([]), este hook escucha
 * islaActual y re-aplica las tabs cada vez que la isla vuelve
 * a ser visible (con PageRenderer display:none/block).
 *
 * Mejora keep-alive: guarda la última tab seleccionada por isla
 * en tabsTopBarStore.tabsPorIsla para restaurarla al volver,
 * en vez de resetear siempre a la tab inicial.
 *
 * IMPORTANTE: pasar tabs como const module-level para estabilidad.
 */

import { useEffect, useRef } from 'react';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore, type TabTopBar } from '@app/stores/tabsTopBarStore';

export function useTabsIsla(
    islaId: string,
    tabs: TabTopBar[],
    activaInicial?: string
): void {
    const islaActual = useNavigationStore(s => s.islaActual);
    const setTabs = useTabsTopBarStore(s => s.setTabs);
    const limpiar = useTabsTopBarStore(s => s.limpiar);
    const guardarTabIsla = useTabsTopBarStore(s => s.guardarTabIsla);
    const activa = useTabsTopBarStore(s => s.activa);

    /* Referencia para rastrear cambios de tab del usuario (no de setTabs) */
    const prevActivaRef = useRef<string | null>(null);

    /* Guardar la tab seleccionada cuando el usuario la cambia */
    useEffect(() => {
        if (islaActual !== islaId) return;
        if (!activa) return;
        /* Solo guardar si es una tab real (no vacía del limpiar) */
        if (prevActivaRef.current !== null && prevActivaRef.current !== activa) {
            guardarTabIsla(islaId, activa);
        }
        prevActivaRef.current = activa;
    }, [activa, islaActual, islaId, guardarTabIsla]);

    /* Re-registrar tabs cuando esta isla se activa */
    useEffect(() => {
        if (islaActual === islaId) {
            setTabs(tabs, activaInicial ?? tabs[0]?.id ?? '', islaId);
        }
    }, [islaActual, islaId, setTabs, tabs, activaInicial]);

    /* Limpiar al desmontar (si el keep-alive descarta esta isla) */
    useEffect(() => {
        return () => limpiar(islaId);
    }, [limpiar, islaId]);
}
