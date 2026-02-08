/*
 * Tipos centralizados para navegación y enlaces.
 * Separados del contenido para cumplir SRP.
 */

export interface EnlaceNavegacion {
    label: string;
    href: string;
    hasDropdown?: boolean;
}

export interface EnlaceFooter {
    label: string;
    href: string;
}

export interface FiltroCategoria {
    id: string;
    label: string;
}
