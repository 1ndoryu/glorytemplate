/**
 * layoutFactory.ts
 *
 * Funciones de fábrica y constantes para la configuración del layout.
 * Extraído de useConfiguracionLayout.ts para separar la creación de datos de la gestión de estado.
 *
 * @package App/React/utils
 */

import {generarOrdenDefecto, generarVisibilidadDefecto, generarAlturasDefecto} from '../config/registroPaneles';
import type {ConfiguracionLayout, ModoColumnas, OrdenPanel, AnchoColumnas} from '../types/paneles';

export const ANCHO_MINIMO_COLUMNA = 20;
export const ANCHO_MAXIMO_COLUMNA = 60;

/* Presets de anchos según modo de columnas */
export const PRESETS_ANCHOS: Record<ModoColumnas, AnchoColumnas> = {
    1: {columna1: 100, columna2: 0, columna3: 0},
    2: {columna1: 58, columna2: 42, columna3: 0},
    3: {columna1: 35, columna2: 35, columna3: 30}
};

/*
 * Generar orden por defecto desde el registro
 */
export function generarOrdenPanelesDefecto(): Record<ModoColumnas, OrdenPanel[]> {
    return {
        1: generarOrdenDefecto(1),
        2: generarOrdenDefecto(2),
        3: generarOrdenDefecto(3)
    };
}

/*
 * Generar configuración por defecto desde el registro
 */
/* [303A-4] Default cambiado a 2 columnas para nuevos registros.
 * Los anchos usan el preset de 2 columnas (58/42/0). */
export function generarConfigLayoutDefecto(): ConfiguracionLayout {
    return {
        tipoLayout: 'grid',
        modoColumnas: 2,
        anchos: {
            columna1: 58,
            columna2: 42,
            columna3: 0
        },
        anchoTotal: 100,
        visibilidad: generarVisibilidadDefecto(),
        ordenPaneles: generarOrdenDefecto(2),
        alturas: generarAlturasDefecto()
    };
}

/*
 * Cache para evitar regenerar objetos constantemente
 */
let _ordenPanelesDefectoCache: Record<ModoColumnas, OrdenPanel[]> | null = null;
let _configLayoutDefectoCache: ConfiguracionLayout | null = null;

export function obtenerOrdenPanelesDefecto(): Record<ModoColumnas, OrdenPanel[]> {
    if (!_ordenPanelesDefectoCache) {
        _ordenPanelesDefectoCache = generarOrdenPanelesDefecto();
    }
    return _ordenPanelesDefectoCache;
}

export function obtenerConfigLayoutDefecto(): ConfiguracionLayout {
    if (!_configLayoutDefectoCache) {
        _configLayoutDefectoCache = generarConfigLayoutDefecto();
    }
    return _configLayoutDefectoCache;
}

/*
 * Alias para compatibilidad hacia atrás
 * Usar las funciones obtenerOrdenPanelesDefecto() y obtenerConfigLayoutDefecto() en su lugar
 */
export const ORDEN_PANELES_DEFECTO: Record<ModoColumnas, OrdenPanel[]> = {
    get 1() {
        return obtenerOrdenPanelesDefecto()[1];
    },
    get 2() {
        return obtenerOrdenPanelesDefecto()[2];
    },
    get 3() {
        return obtenerOrdenPanelesDefecto()[3];
    }
};

export const CONFIG_LAYOUT_DEFECTO: ConfiguracionLayout = {
    get tipoLayout() {
        return obtenerConfigLayoutDefecto().tipoLayout;
    },
    get modoColumnas() {
        return obtenerConfigLayoutDefecto().modoColumnas;
    },
    get anchos() {
        return obtenerConfigLayoutDefecto().anchos;
    },
    get anchoTotal() {
        return obtenerConfigLayoutDefecto().anchoTotal;
    },
    get visibilidad() {
        return obtenerConfigLayoutDefecto().visibilidad;
    },
    get ordenPaneles() {
        return obtenerConfigLayoutDefecto().ordenPaneles;
    },
    get alturas() {
        return obtenerConfigLayoutDefecto().alturas;
    }
};
