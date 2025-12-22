/*
 * useConfiguracionLayout
 * Hook para manejar la configuración del layout del dashboard
 * Modo de columnas, anchos personalizados y paneles visibles
 */

import {useLocalStorage} from './useLocalStorage';
import {useCallback} from 'react';

/* Tipos de modo de columnas disponibles */
export type ModoColumnas = 1 | 2 | 3;

/* Identificadores de paneles del dashboard */
export type PanelId = 'focoPrioritario' | 'proyectos' | 'ejecucion' | 'scratchpad';

/* Configuración de ancho de columnas (en porcentaje 0-100) */
export interface AnchoColumnas {
    columna1: number;
    columna2: number;
    columna3: number;
}

/* Configuración de visibilidad de paneles */
export interface VisibilidadPaneles {
    focoPrioritario: boolean;
    proyectos: boolean;
    ejecucion: boolean;
    scratchpad: boolean;
}

/* Configuración completa del layout */
export interface ConfiguracionLayout {
    modoColumnas: ModoColumnas;
    anchos: AnchoColumnas;
    visibilidad: VisibilidadPaneles;
}

/* Valores por defecto */
export const ANCHO_MINIMO_COLUMNA = 20;
export const ANCHO_MAXIMO_COLUMNA = 60;

export const CONFIG_LAYOUT_DEFECTO: ConfiguracionLayout = {
    modoColumnas: 2,
    anchos: {
        columna1: 58,
        columna2: 42,
        columna3: 0
    },
    visibilidad: {
        focoPrioritario: true,
        proyectos: true,
        ejecucion: true,
        scratchpad: true
    }
};

/* Presets de anchos según modo de columnas */
export const PRESETS_ANCHOS: Record<ModoColumnas, AnchoColumnas> = {
    1: {columna1: 100, columna2: 0, columna3: 0},
    2: {columna1: 58, columna2: 42, columna3: 0},
    3: {columna1: 35, columna2: 35, columna3: 30}
};

export function useConfiguracionLayout() {
    const {valor, setValor} = useLocalStorage<ConfiguracionLayout>('glory_config_layout', {
        valorPorDefecto: CONFIG_LAYOUT_DEFECTO
    });

    /* Cambiar modo de columnas (1, 2 o 3) */
    const cambiarModoColumnas = useCallback(
        (modo: ModoColumnas) => {
            setValor(prev => ({
                ...prev,
                modoColumnas: modo,
                anchos: PRESETS_ANCHOS[modo]
            }));
        },
        [setValor]
    );

    /* Ajustar ancho de una columna específica */
    const ajustarAnchoColumna = useCallback(
        (columna: keyof AnchoColumnas, ancho: number) => {
            const anchoValidado = Math.min(Math.max(ancho, ANCHO_MINIMO_COLUMNA), ANCHO_MAXIMO_COLUMNA);
            setValor(prev => ({
                ...prev,
                anchos: {
                    ...prev.anchos,
                    [columna]: anchoValidado
                }
            }));
        },
        [setValor]
    );

    /* Ajustar múltiples anchos a la vez (para resize handles) */
    const ajustarAnchos = useCallback(
        (nuevosAnchos: Partial<AnchoColumnas>) => {
            setValor(prev => {
                const anchosActualizados = {...prev.anchos};
                Object.entries(nuevosAnchos).forEach(([columna, ancho]) => {
                    if (ancho !== undefined) {
                        anchosActualizados[columna as keyof AnchoColumnas] = Math.min(Math.max(ancho, ANCHO_MINIMO_COLUMNA), ANCHO_MAXIMO_COLUMNA);
                    }
                });
                return {...prev, anchos: anchosActualizados};
            });
        },
        [setValor]
    );

    /* Toggle de visibilidad de un panel */
    const toggleVisibilidadPanel = useCallback(
        (panel: PanelId) => {
            setValor(prev => ({
                ...prev,
                visibilidad: {
                    ...prev.visibilidad,
                    [panel]: !prev.visibilidad[panel]
                }
            }));
        },
        [setValor]
    );

    /* Mostrar un panel oculto */
    const mostrarPanel = useCallback(
        (panel: PanelId) => {
            setValor(prev => ({
                ...prev,
                visibilidad: {
                    ...prev.visibilidad,
                    [panel]: true
                }
            }));
        },
        [setValor]
    );

    /* Ocultar un panel */
    const ocultarPanel = useCallback(
        (panel: PanelId) => {
            setValor(prev => ({
                ...prev,
                visibilidad: {
                    ...prev.visibilidad,
                    [panel]: false
                }
            }));
        },
        [setValor]
    );

    /* Reset a configuración por defecto */
    const resetearLayout = useCallback(() => {
        setValor(CONFIG_LAYOUT_DEFECTO);
    }, [setValor]);

    /* Obtener paneles ocultos */
    const panelesOcultos = Object.entries(valor.visibilidad)
        .filter(([, visible]) => !visible)
        .map(([panel]) => panel as PanelId);

    /* Obtener cantidad de paneles visibles */
    const cantidadPanelesVisibles = Object.values(valor.visibilidad).filter(Boolean).length;

    return {
        configuracion: valor,
        modoColumnas: valor.modoColumnas,
        anchos: valor.anchos,
        visibilidad: valor.visibilidad,
        panelesOcultos,
        cantidadPanelesVisibles,
        cambiarModoColumnas,
        ajustarAnchoColumna,
        ajustarAnchos,
        toggleVisibilidadPanel,
        mostrarPanel,
        ocultarPanel,
        resetearLayout,
        actualizarConfiguracion: setValor
    };
}
