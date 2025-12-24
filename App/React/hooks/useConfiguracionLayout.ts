/*
 * useConfiguracionLayout
 * Hook para manejar la configuración del layout del dashboard
 * Modo de columnas, anchos personalizados, paneles visibles y orden de paneles
 */

import {useLocalStorage} from './useLocalStorage';
import {useCallback, useMemo} from 'react';

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

/*
 * Configuración de orden de un panel
 * Define en qué columna está y su posición dentro de ella
 */
export interface OrdenPanel {
    id: PanelId;
    columna: 1 | 2 | 3;
    posicion: number;
}

/* Configuración de alturas de paneles (en píxeles o 'auto') */
export interface AlturasPaneles {
    focoPrioritario: string;
    proyectos: string;
    ejecucion: string;
    scratchpad: string;
}

/* Configuración completa del layout */
export interface ConfiguracionLayout {
    modoColumnas: ModoColumnas;
    anchos: AnchoColumnas;
    visibilidad: VisibilidadPaneles;
    ordenPaneles: OrdenPanel[];
    alturas: AlturasPaneles;
}

/* Valores por defecto */
export const ANCHO_MINIMO_COLUMNA = 20;
export const ANCHO_MAXIMO_COLUMNA = 60;

/* Lista de todos los paneles en orden */
export const TODOS_LOS_PANELES: PanelId[] = ['focoPrioritario', 'proyectos', 'ejecucion', 'scratchpad'];

/*
 * Orden de paneles por defecto según modo de columnas
 * Ejecución (tareas) siempre primero, Hábitos en segundo lugar
 * 1 columna: todo vertical en columna 1
 * 2 columnas: ejecucion/habitos en col1, proyectos/scratchpad en col2
 * 3 columnas: ejecucion col1, habitos col2, proyectos/scratchpad col3
 */
export const ORDEN_PANELES_DEFECTO: Record<ModoColumnas, OrdenPanel[]> = {
    1: [
        {id: 'ejecucion', columna: 1, posicion: 0},
        {id: 'focoPrioritario', columna: 1, posicion: 1},
        {id: 'proyectos', columna: 1, posicion: 2},
        {id: 'scratchpad', columna: 1, posicion: 3}
    ],
    2: [
        {id: 'ejecucion', columna: 1, posicion: 0},
        {id: 'focoPrioritario', columna: 1, posicion: 1},
        {id: 'proyectos', columna: 2, posicion: 0},
        {id: 'scratchpad', columna: 2, posicion: 1}
    ],
    3: [
        {id: 'ejecucion', columna: 1, posicion: 0},
        {id: 'focoPrioritario', columna: 2, posicion: 0},
        {id: 'proyectos', columna: 3, posicion: 0},
        {id: 'scratchpad', columna: 3, posicion: 1}
    ]
};

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
    },
    ordenPaneles: ORDEN_PANELES_DEFECTO[2],
    alturas: {
        focoPrioritario: 'auto',
        proyectos: 'auto',
        ejecucion: 'auto',
        scratchpad: '200px'
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

    /*
     * Migración automática: asegura compatibilidad con usuarios existentes
     * - Si no existe ordenPaneles, generarlo
     * - Si no existen alturas, usar valores por defecto
     */
    const configuracionNormalizada = useMemo(() => {
        let config = {...valor};

        /* Migrar ordenPaneles si no existe */
        if (!config.ordenPaneles || config.ordenPaneles.length === 0) {
            config = {
                ...config,
                ordenPaneles: ORDEN_PANELES_DEFECTO[config.modoColumnas]
            };
        }

        /* Verificar que todos los paneles existan en el orden */
        const panelesExistentes = new Set(config.ordenPaneles.map(p => p.id));
        const panelesFaltantes = TODOS_LOS_PANELES.filter(id => !panelesExistentes.has(id));

        if (panelesFaltantes.length > 0) {
            const ultimaPosicion = Math.max(...config.ordenPaneles.filter(p => p.columna === 1).map(p => p.posicion), -1);
            const panelesNuevos = panelesFaltantes.map((id, idx) => ({
                id,
                columna: 1 as const,
                posicion: ultimaPosicion + 1 + idx
            }));
            config = {
                ...config,
                ordenPaneles: [...config.ordenPaneles, ...panelesNuevos]
            };
        }

        /* Migrar alturas si no existen */
        if (!config.alturas) {
            config = {
                ...config,
                alturas: CONFIG_LAYOUT_DEFECTO.alturas
            };
        }

        return config;
    }, [valor]);

    /*
     * Normalizar posiciones dentro de una columna
     * Asegura que las posiciones sean consecutivas (0, 1, 2...)
     */
    const normalizarPosiciones = useCallback((paneles: OrdenPanel[]): OrdenPanel[] => {
        const porColumna: Record<number, OrdenPanel[]> = {1: [], 2: [], 3: []};

        paneles.forEach(p => {
            porColumna[p.columna].push(p);
        });

        /* Ordenar cada columna por posición y reasignar índices */
        const resultado: OrdenPanel[] = [];
        [1, 2, 3].forEach(col => {
            porColumna[col]
                .sort((a, b) => a.posicion - b.posicion)
                .forEach((panel, idx) => {
                    resultado.push({...panel, posicion: idx});
                });
        });

        return resultado;
    }, []);

    /* Cambiar modo de columnas (1, 2 o 3) */
    const cambiarModoColumnas = useCallback(
        (modo: ModoColumnas) => {
            setValor(prev => {
                /* Al cambiar modo, redistribuir paneles según preset */
                const nuevoOrden = ORDEN_PANELES_DEFECTO[modo].map(preset => {
                    /* Mantener visibilidad del panel actual */
                    const panelActual = prev.ordenPaneles?.find(p => p.id === preset.id);
                    return panelActual ? {...preset} : preset;
                });

                return {
                    ...prev,
                    modoColumnas: modo,
                    anchos: PRESETS_ANCHOS[modo],
                    ordenPaneles: nuevoOrden
                };
            });
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

    /*
     * Reordenar un panel a una nueva posición y/o columna
     * Recalcula las posiciones de todos los paneles afectados
     */
    const reordenarPanel = useCallback(
        (panelId: PanelId, nuevaColumna: 1 | 2 | 3, nuevaPosicion: number) => {
            setValor(prev => {
                const paneles = [...(prev.ordenPaneles || ORDEN_PANELES_DEFECTO[prev.modoColumnas])];
                const indicePanel = paneles.findIndex(p => p.id === panelId);

                if (indicePanel === -1) return prev;

                const panelActual = paneles[indicePanel];

                /* Remover panel de su posición actual */
                paneles.splice(indicePanel, 1);

                /* Ajustar posiciones en la columna origen */
                paneles
                    .filter(p => p.columna === panelActual.columna && p.posicion > panelActual.posicion)
                    .forEach(p => {
                        p.posicion--;
                    });

                /* Ajustar posiciones en la columna destino para hacer espacio */
                paneles
                    .filter(p => p.columna === nuevaColumna && p.posicion >= nuevaPosicion)
                    .forEach(p => {
                        p.posicion++;
                    });

                /* Insertar panel en nueva posición */
                paneles.push({
                    id: panelId,
                    columna: nuevaColumna,
                    posicion: nuevaPosicion
                });

                return {
                    ...prev,
                    ordenPaneles: normalizarPosiciones(paneles)
                };
            });
        },
        [setValor, normalizarPosiciones]
    );

    /* Mover un panel una posición hacia arriba dentro de su columna */
    const moverPanelArriba = useCallback(
        (panelId: PanelId) => {
            setValor(prev => {
                const paneles = [...(prev.ordenPaneles || ORDEN_PANELES_DEFECTO[prev.modoColumnas])];
                const panel = paneles.find(p => p.id === panelId);

                if (!panel || panel.posicion === 0) return prev;

                /* Encontrar el panel que está arriba */
                const panelArriba = paneles.find(p => p.columna === panel.columna && p.posicion === panel.posicion - 1);

                if (!panelArriba) return prev;

                /* Intercambiar posiciones */
                const nuevasPosiciones = paneles.map(p => {
                    if (p.id === panelId) return {...p, posicion: p.posicion - 1};
                    if (p.id === panelArriba.id) return {...p, posicion: p.posicion + 1};
                    return p;
                });

                return {...prev, ordenPaneles: nuevasPosiciones};
            });
        },
        [setValor]
    );

    /* Mover un panel una posición hacia abajo dentro de su columna */
    const moverPanelAbajo = useCallback(
        (panelId: PanelId) => {
            setValor(prev => {
                const paneles = [...(prev.ordenPaneles || ORDEN_PANELES_DEFECTO[prev.modoColumnas])];
                const panel = paneles.find(p => p.id === panelId);

                if (!panel) return prev;

                /* Encontrar máxima posición en esta columna */
                const maxPosicion = Math.max(...paneles.filter(p => p.columna === panel.columna).map(p => p.posicion));

                if (panel.posicion >= maxPosicion) return prev;

                /* Encontrar el panel que está abajo */
                const panelAbajo = paneles.find(p => p.columna === panel.columna && p.posicion === panel.posicion + 1);

                if (!panelAbajo) return prev;

                /* Intercambiar posiciones */
                const nuevasPosiciones = paneles.map(p => {
                    if (p.id === panelId) return {...p, posicion: p.posicion + 1};
                    if (p.id === panelAbajo.id) return {...p, posicion: p.posicion - 1};
                    return p;
                });

                return {...prev, ordenPaneles: nuevasPosiciones};
            });
        },
        [setValor]
    );

    /* Cambiar un panel a otra columna (al final de esa columna) */
    const moverPanelAColumna = useCallback(
        (panelId: PanelId, columnaDestino: 1 | 2 | 3) => {
            setValor(prev => {
                const paneles = [...(prev.ordenPaneles || ORDEN_PANELES_DEFECTO[prev.modoColumnas])];
                const panel = paneles.find(p => p.id === panelId);

                if (!panel || panel.columna === columnaDestino) return prev;

                /* Calcular nueva posición (al final de la columna destino) */
                const panelsEnDestino = paneles.filter(p => p.columna === columnaDestino);
                const nuevaPosicion = panelsEnDestino.length > 0 ? Math.max(...panelsEnDestino.map(p => p.posicion)) + 1 : 0;

                /* Actualizar panel */
                const nuevasPosiciones = paneles.map(p => {
                    if (p.id === panelId) {
                        return {...p, columna: columnaDestino, posicion: nuevaPosicion};
                    }
                    /* Ajustar posiciones en columna origen */
                    if (p.columna === panel.columna && p.posicion > panel.posicion) {
                        return {...p, posicion: p.posicion - 1};
                    }
                    return p;
                });

                return {...prev, ordenPaneles: normalizarPosiciones(nuevasPosiciones)};
            });
        },
        [setValor, normalizarPosiciones]
    );

    /*
     * Obtener paneles de una columna específica, ordenados por posición
     * Retorna solo los IDs de paneles visibles
     */
    const obtenerPanelesColumna = useCallback(
        (columna: 1 | 2 | 3): PanelId[] => {
            const orden = configuracionNormalizada.ordenPaneles || ORDEN_PANELES_DEFECTO[configuracionNormalizada.modoColumnas];

            return orden
                .filter(p => p.columna === columna && configuracionNormalizada.visibilidad[p.id])
                .sort((a, b) => a.posicion - b.posicion)
                .map(p => p.id);
        },
        [configuracionNormalizada]
    );

    /* Obtener información completa de orden de un panel */
    const obtenerOrdenPanel = useCallback(
        (panelId: PanelId): OrdenPanel | undefined => {
            const orden = configuracionNormalizada.ordenPaneles || ORDEN_PANELES_DEFECTO[configuracionNormalizada.modoColumnas];
            return orden.find(p => p.id === panelId);
        },
        [configuracionNormalizada]
    );

    /* Restaurar orden por defecto para el modo actual */
    const resetearOrdenPaneles = useCallback(() => {
        setValor(prev => ({
            ...prev,
            ordenPaneles: ORDEN_PANELES_DEFECTO[prev.modoColumnas]
        }));
    }, [setValor]);

    /* Reset a configuración por defecto */
    const resetearLayout = useCallback(() => {
        setValor(CONFIG_LAYOUT_DEFECTO);
    }, [setValor]);

    /* Cambiar altura de un panel específico */
    const cambiarAlturaPanel = useCallback(
        (panel: PanelId, altura: string) => {
            setValor(prev => ({
                ...prev,
                alturas: {
                    ...(prev.alturas || CONFIG_LAYOUT_DEFECTO.alturas),
                    [panel]: altura
                }
            }));
        },
        [setValor]
    );

    /* Obtener altura de un panel */
    const obtenerAlturaPanel = useCallback(
        (panel: PanelId): string => {
            return configuracionNormalizada.alturas?.[panel] || CONFIG_LAYOUT_DEFECTO.alturas[panel];
        },
        [configuracionNormalizada]
    );

    /* Obtener paneles ocultos */
    const panelesOcultos = Object.entries(configuracionNormalizada.visibilidad)
        .filter(([, visible]) => !visible)
        .map(([panel]) => panel as PanelId);

    /* Obtener cantidad de paneles visibles */
    const cantidadPanelesVisibles = Object.values(configuracionNormalizada.visibilidad).filter(Boolean).length;

    return {
        configuracion: configuracionNormalizada,
        modoColumnas: configuracionNormalizada.modoColumnas,
        anchos: configuracionNormalizada.anchos,
        visibilidad: configuracionNormalizada.visibilidad,
        ordenPaneles: configuracionNormalizada.ordenPaneles,
        alturas: configuracionNormalizada.alturas || CONFIG_LAYOUT_DEFECTO.alturas,
        panelesOcultos,
        cantidadPanelesVisibles,
        cambiarModoColumnas,
        ajustarAnchoColumna,
        ajustarAnchos,
        toggleVisibilidadPanel,
        mostrarPanel,
        ocultarPanel,
        reordenarPanel,
        moverPanelArriba,
        moverPanelAbajo,
        moverPanelAColumna,
        obtenerPanelesColumna,
        obtenerOrdenPanel,
        resetearOrdenPaneles,
        resetearLayout,
        cambiarAlturaPanel,
        obtenerAlturaPanel,
        actualizarConfiguracion: setValor
    };
}
