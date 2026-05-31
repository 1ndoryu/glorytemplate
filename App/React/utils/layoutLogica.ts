/**
 * layoutLogica.ts
 *
 * Lógica de negocio pura para la gestión del layout.
 * Incluye normalización de posiciones y migración de configuraciones antiguas.
 *
 * @package App/React/utils
 */

import {generarVisibilidadDefecto, generarAlturasDefecto} from '../config/registroPaneles';
import {generarOrdenPanelesDefecto, generarConfigLayoutDefecto} from './layoutFactory';
import type {ConfiguracionLayout, ModoColumnas, OrdenPanel} from '../types/paneles';

/*
 * Normalizar posiciones dentro de una columna
 * Asegura que las posiciones sean consecutivas (0, 1, 2...)
 * Helper puro.
 */
export function normalizarPosiciones(paneles: OrdenPanel[]): OrdenPanel[] {
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
}

/*
 * Migración automática: asegura compatibilidad con usuarios existentes
 * - Si no existe ordenPaneles, generarlo
 * - Si no existen alturas, usar valores por defecto
 * - Si hay paneles nuevos en el registro, agregarlos
 */
export function migrarConfiguracion(valorActual: ConfiguracionLayout, todosLosPaneles: string[]): ConfiguracionLayout {
    let config = {...valorActual};
    const ordenDefecto = generarOrdenPanelesDefecto();
    const configDefecto = generarConfigLayoutDefecto();

    /* Migrar ordenPaneles si no existe */
    if (!config.ordenPaneles || config.ordenPaneles.length === 0) {
        config = {
            ...config,
            ordenPaneles: ordenDefecto[config.modoColumnas]
        };
    }

    /* Verificar que todos los paneles del registro existan en el orden */
    const panelesExistentes = new Set(config.ordenPaneles.map(p => p.id));
    const panelesFaltantes = todosLosPaneles.filter(id => !panelesExistentes.has(id));

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

    /* Migrar visibilidad para paneles nuevos */
    const visibilidadDefecto = generarVisibilidadDefecto();
    const visibilidadActualizada = {...config.visibilidad};
    todosLosPaneles.forEach(id => {
        if (visibilidadActualizada[id] === undefined) {
            visibilidadActualizada[id] = visibilidadDefecto[id] ?? false;
        }
    });
    config = {...config, visibilidad: visibilidadActualizada};

    /* Migrar alturas si no existen o faltan paneles */
    const alturasDefecto = generarAlturasDefecto();
    if (!config.alturas) {
        config = {...config, alturas: alturasDefecto};
    } else {
        const alturasActualizadas = {...config.alturas};
        todosLosPaneles.forEach(id => {
            if (alturasActualizadas[id] === undefined) {
                alturasActualizadas[id] = alturasDefecto[id] ?? 'auto';
            }
        });
        config = {...config, alturas: alturasActualizadas};
    }

    /* Migrar anchoTotal si no existe */
    if (config.anchoTotal === undefined) {
        config = {
            ...config,
            anchoTotal: configDefecto.anchoTotal
        };
    }

    /* [300A-1] Migrar tipoLayout: configs viejas sin el campo van a 'grid' (default histórico) */
    if (!config.tipoLayout) {
        config = {
            ...config,
            tipoLayout: 'grid'
        };
    }

    return config;
}

/* [263A-3] Crear un panel duplicado con ID sufijo (e.g., scratchpad-1).
 * Se ubica en la misma columna que el original, justo después.
 * Retorna nueva configuración sin mutar la original. */
export function crearDuplicadoPanel(
    prev: ConfiguracionLayout,
    baseId: string,
    ordenDefecto: Record<ModoColumnas, OrdenPanel[]>
): ConfiguracionLayout {
    const paneles = [...(prev.ordenPaneles || ordenDefecto[prev.modoColumnas])];
    const panelOriginal = paneles.find(p => p.id === baseId);
    if (!panelOriginal) return prev;

    /* Siguiente sufijo disponible */
    const existentes = paneles
        .filter(p => p.id.startsWith(baseId + '-'))
        .map(p => {
            const m = p.id.match(/-(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
        });
    const siguienteNum = existentes.length > 0 ? Math.max(...existentes) + 1 : 1;
    const nuevoId = `${baseId}-${siguienteNum}`;

    /* Insertar justo después del original */
    const nuevaPosicion = panelOriginal.posicion + 1;
    const panelesActualizados = paneles.map(p => {
        if (p.columna === panelOriginal.columna && p.posicion >= nuevaPosicion) {
            return {...p, posicion: p.posicion + 1};
        }
        return p;
    });
    panelesActualizados.push({id: nuevoId, columna: panelOriginal.columna, posicion: nuevaPosicion});

    return {
        ...prev,
        ordenPaneles: normalizarPosiciones(panelesActualizados),
        visibilidad: {...(prev.visibilidad || {}), [nuevoId]: true},
        alturas: {...(prev.alturas || {}), [nuevoId]: prev.alturas?.[baseId] || 'auto'}
    };
}

/* [263A-3] Eliminar un panel duplicado del layout */
export function eliminarPanelDuplicado(prev: ConfiguracionLayout, instanceId: string): ConfiguracionLayout {
    const paneles = (prev.ordenPaneles || []).filter(p => p.id !== instanceId);
    const {[instanceId]: _vis, ...restoVisibilidad} = prev.visibilidad || {};
    const {[instanceId]: _alt, ...restoAlturas} = prev.alturas || {};

    return {
        ...prev,
        ordenPaneles: normalizarPosiciones(paneles),
        visibilidad: restoVisibilidad,
        alturas: restoAlturas
    };
}
