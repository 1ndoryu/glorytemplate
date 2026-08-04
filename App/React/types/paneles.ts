/*
 * types/paneles.ts
 * Tipos base e interfaces para el sistema de paneles
 * Parte del refactor OCP - Fase 1
 */

import type {ReactNode, ComponentType, RefObject} from 'react';

/* Tipos de modo de columnas disponibles */
export type ModoColumnas = 1 | 2 | 3;

/* Tipo de layout: grid (vista múltiple) o sidebar (menú lateral, un panel a la vez) */
export type TipoLayout = 'grid' | 'sidebar';

/* Configuración de posición por defecto según modo de columnas */
export interface PosicionDefectoPanel {
    columna: 1 | 2 | 3;
    posicion: number;
}

/* Props base que todo panel debe aceptar */
export interface PanelBaseProps {
    renderHandleArrastre: (titulo?: string) => ReactNode;
    handleMinimizar: ReactNode;
}

/* Props extendidas para paneles con contenedor y altura */
export interface PanelConAlturaProps extends PanelBaseProps {
    altura: string;
    contenedorRef: RefObject<HTMLDivElement>;
    esAuto: boolean;
    esMovil?: boolean;
}

/* Definición completa de un panel */
export interface DefinicionPanel<TProps extends PanelBaseProps = PanelBaseProps> {
    id: string;
    titulo: string;
    tituloMovil?: string;
    icono?: ReactNode;

    /* Configuración de layout */
    visiblePorDefecto: boolean;
    alturaDefecto: string;
    posicionDefecto: Record<ModoColumnas, PosicionDefectoPanel>;

    /* Componente que renderiza el panel */
    componente: ComponentType<TProps>;

    /* Si aparece en navegación móvil y con qué nombre */
    enNavegacionMovil?: boolean;
    idPaginaMovil?: string;
    /* Si solo debe renderizarse para administradores */
    soloAdmin?: boolean;

    /*
     * Indica si el panel maneja su propia altura (scratchpad, actividad)
     * Si es true, no se envuelve en ResizeHandlePanel
     */
    manejaAlturaPropia?: boolean;
}

/* Interfaz para el orden de un panel en el layout */
export interface OrdenPanel {
    id: string;
    columna: 1 | 2 | 3;
    posicion: number;
    /* Indica si este panel está dividido lado a lado con otro en la misma columna */
    dividido?: boolean;
    /* ID del panel con el que está dividido (opcional) */
    panelDivisionId?: string;
}

/* Configuración de ancho de columnas (en porcentaje 0-100) */
export interface AnchoColumnas {
    columna1: number;
    columna2: number;
    columna3: number;
}

/* Configuración completa del layout */
export interface ConfiguracionLayout {
    /* Tipo de layout: 'grid' (paneles en columnas) o 'sidebar' (menú lateral) */
    tipoLayout?: TipoLayout;
    modoColumnas: ModoColumnas;
    anchos: AnchoColumnas;
    anchoTotal: number;
    visibilidad: Record<string, boolean>;
    ordenPaneles: OrdenPanel[];
    alturas: Record<string, string>;
}
