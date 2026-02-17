/*
 * Hook: useTabsIsla — Kamples (C174)
 * Registra tabs de TopBar para una isla keep-alive.
 * A diferencia de setTabs en useEffect([]), este hook escucha
 * islaActual y re-aplica las tabs cada vez que la isla vuelve
 * a ser visible (con PageRenderer display:none/block).
 * IMPORTANTE: pasar tabs como const module-level para estabilidad.
 */

import { useEffect } from 'react';
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

    useEffect(() => {
        if (islaActual === islaId) {
            setTabs(tabs, activaInicial ?? tabs[0]?.id ?? '');
        }
    }, [islaActual, islaId, setTabs, tabs, activaInicial]);

    /* Limpiar al desmontar (si el keep-alive descarta esta isla) */
    useEffect(() => {
        return () => limpiar();
    }, [limpiar]);
}
