/*
 * Tipos centralizados para navegación y enlaces.
 * Separados del contenido para cumplir SRP.
 */

export interface SubEnlace {
    label: string;
    href: string;
}

export interface EnlaceNavegacion {
    label: string;
    href: string;
    hasDropdown?: boolean;
    subEnlaces?: SubEnlace[];
}

export interface EnlaceFooter {
    label: string;
    href: string;
}

export interface FiltroCategoria {
    id: string;
    label: string;
}
