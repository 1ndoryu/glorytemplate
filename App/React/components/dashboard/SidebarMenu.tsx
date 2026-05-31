/*
 * SidebarMenu
 *
 * [300A-2] Barra lateral vertical con iconos de paneles para el modo sidebar.
 * [300A-7] Solo iconos, sin texto, sin expandir/contraer.
 *
 * Props:
 *  - paneles: lista de paneles con id, titulo e icono
 *  - panelActivo: ID del panel actualmente seleccionado
 *  - onSeleccionarPanel: callback al hacer click en un icono
 */
import type {PanelId} from '../../hooks/useConfiguracionLayout';
import type {ReactNode} from 'react';
import {Boton} from '../ui';

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
            <div className="sidebarMenuItems">
                {paneles.map(panel => (
                    <Boton
                        key={panel.id}
                        variante="ghost"
                        soloIcono
                        claseAdicional={`sidebarMenuBoton ${panelActivo === panel.id ? 'sidebarMenuBoton--activo' : ''}`}
                        onClick={() => onSeleccionarPanel(panel.id)}
                        icono={panel.icono}
                    />
                ))}
            </div>
        </nav>
    );
}