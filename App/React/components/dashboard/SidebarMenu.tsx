/*
 * SidebarMenu
 *
 * [300A-2] Barra lateral vertical con iconos de paneles para el modo sidebar.
 * Permite seleccionar un panel activo entre todos los paneles visibles registrados.
 *
 * Props:
 *  - paneles: lista de paneles con id, titulo e icono
 *  - panelActivo: ID del panel actualmente seleccionado
 *  - onSeleccionarPanel: callback al hacer click en un icono
 */

import type {PanelId} from '../../hooks/useConfiguracionLayout';
import type {ReactNode} from 'react';

export interface PanelSidebar {
    id: PanelId;
    titulo: string;
    icono?: ReactNode;
}

interface SidebarMenuProps {
    paneles: PanelSidebar[];
    panelActivo: PanelId;
    onSeleccionarPanel: (panelId: PanelId) => void;
}

export function SidebarMenu({paneles, panelActivo, onSeleccionarPanel}: SidebarMenuProps): JSX.Element | null {
    if (paneles.length === 0) return null;

    return (
        <nav className="sidebarMenu" aria-label="Menú de paneles">
            {paneles.map(panel => (
                <button
                    key={panel.id}
                    className={`sidebarMenuBoton ${panelActivo === panel.id ? 'sidebarMenuBoton--activo' : ''}`}
                    onClick={() => onSeleccionarPanel(panel.id)}
                    aria-current={panelActivo === panel.id ? 'page' : undefined}
                >
                    <span className="sidebarMenuBotonIcono">{panel.icono || panel.titulo.charAt(0)}</span>
                    <span className="sidebarMenuBotonTexto">{panel.titulo}</span>
                </button>
            ))}
        </nav>
    );
}