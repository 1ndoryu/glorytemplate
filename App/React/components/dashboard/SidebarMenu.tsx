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

import {useState, useCallback} from 'react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';
import {PanelLeftClose, PanelLeftOpen, Settings} from 'lucide-react';
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
    onAbrirConfig: () => void;
}

/* [300A-8] Iconos SVG reemplazados por lucide-react: ChevronsLeft, ChevronsRight, Settings */

export function SidebarMenu({paneles, panelActivo, onSeleccionarPanel, onAbrirConfig}: SidebarMenuProps): JSX.Element | null {
    /* [300A-6] Estado de sidebar expandido/colapsado, persistido en localStorage */
    const [expandido, setExpandido] = useState<boolean>(() => {
        try {
            return localStorage.getItem('glory_sidebar_expandido') !== 'false';
        } catch {
            return true;
        }
    });

    const toggleExpandido = useCallback(() => {
        setExpandido(prev => {
            const nuevo = !prev;
            try {
                localStorage.setItem('glory_sidebar_expandido', String(nuevo));
            } catch {
                /* localStorage no disponible */
            }
            return nuevo;
        });
    }, []);

    if (paneles.length === 0) return null;

    return (
        <nav
            className={`sidebarMenu ${expandido ? 'sidebarMenu--expandido' : 'sidebarMenu--colapsado'}`}
            aria-label="Menú de paneles"
        >
            {/* [300A-8] Header: nombre de app + toggle expandir/contraer */}
            <div className="sidebarMenuHeader">
                {expandido && <span className="sidebarMenuHeaderTitulo">Catask</span>}
                <Boton
                    variante="ghost"
                    soloIcono
                    claseAdicional="sidebarMenuToggleBoton"
                    onClick={toggleExpandido}
                    icono={expandido ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                />
            </div>

            <div className="sidebarMenuItems">
                {paneles.map(panel => (
                    <Boton
                        key={panel.id}
                        variante="ghost"
                        soloIcono={!expandido}
                        claseAdicional={`sidebarMenuBoton ${panelActivo === panel.id ? 'sidebarMenuBoton--activo' : ''}`}
                        onClick={() => onSeleccionarPanel(panel.id)}
                        icono={panel.icono}
                    >
                        {panel.titulo}
                    </Boton>
                ))}
            </div>
            {/* [300A-8] Footer: boton de configuracion */}
            <div className="sidebarMenuFooter">
                <Boton
                    variante="ghost"
                    soloIcono={!expandido}
                    claseAdicional="sidebarMenuConfigBoton"
                    onClick={onAbrirConfig}
                    icono={<Settings size={18} />}
                >
                    Config
                </Boton>
            </div>
        </nav>
    );
}