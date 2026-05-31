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

/* Icono chevron doble izquierda (colapsar) */
function IconoContraer(): JSX.Element {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 19l-7-7 7-7" />
            <path d="M18 5l-7 7 7 7" />
        </svg>
    );
}

/* Icono chevron doble derecha (expandir) */
function IconoExpandir(): JSX.Element {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 17l7-7-7-7" />
            <path d="M6 7l7 7-7 7" />
        </svg>
    );
}

export function SidebarMenu({paneles, panelActivo, onSeleccionarPanel}: SidebarMenuProps): JSX.Element | null {
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
            <div className="sidebarMenuToggle">
                <Boton
                    variante="ghost"
                    soloIcono
                    claseAdicional="sidebarMenuToggleBoton"
                    onClick={toggleExpandido}
                    icono={expandido ? <IconoContraer /> : <IconoExpandir />}
                />
            </div>
        </nav>
    );
}