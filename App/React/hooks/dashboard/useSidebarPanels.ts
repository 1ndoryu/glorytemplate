/*
 * useSidebarPanels
 *
 * [multi-panel-sidebar] Hook para gestionar los paneles activos en modo sidebar.
 * Estado aislado del grid — no toca useConfiguracionLayout ni ordenPaneles.
 *
 * Persiste en localStorage con clave 'glory_sidebar_paneles' para no contaminar
 * la config del grid ('glory_config_layout').
 *
 * Migración automática: si no hay datos guardados, usa el panel activo anterior
 * como único panel (compatibilidad hacia atrás).
 */

import {useState, useCallback, useEffect} from 'react';
import type {PanelId} from '../useConfiguracionLayout';

/* Máximo de paneles simultáneos en la grilla sidebar */
const MAX_PANELES = 4;

/* Ancho por defecto de columnas en sidebar con 2+ paneles */
const ANCHOS_DEFECTO: [number, number] = [50, 50];

/* Altura por defecto de filas: 50/50 para 3+ paneles */
const ALTURAS_FILAS_DEFECTO: [number, number] = [50, 50];

export interface SidebarPanelState {
    /** IDs de paneles activos, en orden de visualización.
     *  Máximo 4. Índices 0-1 → columna izquierda, 2-3 → columna derecha */
    paneles: PanelId[];
    /** Anchos de columna en porcentaje [col1%, col2%], suma = 100 */
    anchos: [number, number];
    /** Alturas de filas en porcentaje [filaSup%, filaInf%], suma = 100. Solo 3+ paneles. */
    alturaFilas: [number, number];
}

interface UseSidebarPanelesReturn {
    sidebarState: SidebarPanelState;
    /** Agrega un panel al final de la grilla. Máx 4. Si ya existe, es no-op. */
    agregarPanel: (panelId: PanelId) => void;
    /** Quita un panel de la grilla. Si era el único, no hace nada (mín 1 panel). */
    quitarPanel: (panelId: PanelId) => void;
    /** Verifica si un panel está activo en la grilla sidebar */
    tienePanel: (panelId: PanelId) => boolean;
    /** Mueve un panel a una nueva posición en el array */
    moverPanel: (panelId: PanelId, nuevoIndice: number) => void;
    /** Actualiza los anchos de columna */
    ajustarAnchos: (nuevosAnchos: [number, number]) => void;
    /** Actualiza las alturas de filas (para 3+ paneles) */
    ajustarAlturasFilas: (nuevasAlturas: [number, number]) => void;
    /** Reemplaza todos los paneles (útil al migrar desde estado anterior) */
    setPaneles: (paneles: PanelId[]) => void;
    /** Cantidad de paneles activos */
    cantidad: number;
}

function cargarEstado(): SidebarPanelState | null {
    try {
        const raw = localStorage.getItem('glory_sidebar_paneles');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.paneles) && Array.isArray(parsed.anchos)) {
                /* Migración: si no existe alturaFilas (datos legacy), agregar default */
                const state = parsed as SidebarPanelState;
                if (!Array.isArray(state.alturaFilas)) {
                    state.alturaFilas = ALTURAS_FILAS_DEFECTO;
                }
                return state;
            }
        }
    } catch {
        /* localStorage corrupto o no disponible */
    }
    return null;
}

function guardarEstado(state: SidebarPanelState): void {
    try {
        localStorage.setItem('glory_sidebar_paneles', JSON.stringify(state));
    } catch {
        /* localStorage no disponible */
    }
}

export function useSidebarPaneles(panelInicial?: PanelId): UseSidebarPanelesReturn {
    const [sidebarState, setSidebarState] = useState<SidebarPanelState>(() => {
        const guardado = cargarEstado();
        if (guardado && guardado.paneles.length > 0) {
            return guardado;
        }
        /* Migración: si no hay datos, usar el panel que venía siendo el activo */
        return {
            paneles: panelInicial ? [panelInicial] : ['ejecucion'],
            anchos: ANCHOS_DEFECTO,
            alturaFilas: ALTURAS_FILAS_DEFECTO
        };
    });

    /* Persistir en cada cambio */
    useEffect(() => {
        guardarEstado(sidebarState);
    }, [sidebarState]);

    const agregarPanel = useCallback((panelId: PanelId) => {
        setSidebarState(prev => {
            if (prev.paneles.includes(panelId)) return prev; // ya existe, no-op
            if (prev.paneles.length >= MAX_PANELES) return prev; // límite
            return {
                ...prev,
                paneles: [...prev.paneles, panelId]
            };
        });
    }, []);

    const quitarPanel = useCallback((panelId: PanelId) => {
        setSidebarState(prev => {
            if (prev.paneles.length <= 1) return prev; // mínimo 1 panel
            return {
                ...prev,
                paneles: prev.paneles.filter(id => id !== panelId)
            };
        });
    }, []);

    const tienePanel = useCallback((panelId: PanelId): boolean => {
        return sidebarState.paneles.includes(panelId);
    }, [sidebarState.paneles]);

    const moverPanel = useCallback((panelId: PanelId, nuevoIndice: number) => {
        setSidebarState(prev => {
            const indiceActual = prev.paneles.indexOf(panelId);
            if (indiceActual === -1) return prev;
            const idx = Math.max(0, Math.min(nuevoIndice, prev.paneles.length - 1));
            if (idx === indiceActual) return prev;

            const nuevos = [...prev.paneles];
            nuevos.splice(indiceActual, 1);
            nuevos.splice(idx, 0, panelId);
            return {...prev, paneles: nuevos};
        });
    }, []);

    const ajustarAnchos = useCallback((nuevosAnchos: [number, number]) => {
        setSidebarState(prev => ({
            ...prev,
            anchos: nuevosAnchos
        }));
    }, []);

    const setPaneles = useCallback((paneles: PanelId[]) => {
        setSidebarState(prev => ({
            ...prev,
            paneles: paneles.slice(0, MAX_PANELES)
        }));
    }, []);

    const ajustarAlturasFilas = useCallback((nuevasAlturas: [number, number]) => {
        setSidebarState(prev => ({
            ...prev,
            alturaFilas: nuevasAlturas
        }));
    }, []);

    return {
        sidebarState,
        agregarPanel,
        quitarPanel,
        tienePanel,
        moverPanel,
        ajustarAnchos,
        ajustarAlturasFilas,
        setPaneles,
        cantidad: sidebarState.paneles.length
    };
}
