/*
 * SidebarMenu
 *
 * [300A-2] Barra lateral vertical con iconos de paneles para el modo sidebar.
 * [multi-panel-sidebar] Soporta multi-panel: panelesActivos resalta los que están
 * en la grilla. Click izquierdo = cambiar a 1 solo panel. Click derecho = menú
 * contextual con "Agregar a la vista" para añadir a la grilla multi-panel.
 *
 * Props:
 *  - paneles: lista de paneles con id, titulo e icono
 *  - panelActivo: ID del panel actualmente seleccionado
 *  - onSeleccionarPanel: callback al hacer click izquierdo
 *  - panelesActivos: opcional — IDs de paneles actualmente en la grilla sidebar
 *  - onAgregarPanel: opcional — callback de click derecho "Agregar a la vista"
 */

import {useState, useCallback} from 'react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';
import {PanelLeftClose, PanelLeftOpen, Settings, Plus} from 'lucide-react';
import type {ReactNode} from 'react';
import {Boton} from '../ui';
import {MenuContextual} from '../shared';
import type {OpcionMenu} from '../shared';

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
    /** [multi-panel-sidebar] IDs de paneles activos en la grilla (opcional) */
    panelesActivos?: PanelId[];
    /** [multi-panel-sidebar] Callback para agregar panel a la grilla (click derecho) */
    onAgregarPanel?: (panelId: PanelId) => void;
}

/** Estado del menú contextual de click derecho */
interface ContextMenuState {
    abierto: boolean;
    panelId: PanelId | null;
    x: number;
    y: number;
}

/* [300A-8] Iconos SVG reemplazados por lucide-react: ChevronsLeft, ChevronsRight, Settings */

export function SidebarMenu({paneles, panelActivo, onSeleccionarPanel, onAbrirConfig, panelesActivos, onAgregarPanel}: SidebarMenuProps): JSX.Element | null {
    /* [300A-6] Estado de sidebar expandido/colapsado, persistido en localStorage */
    const [expandido, setExpandido] = useState<boolean>(() => {
        try {
            return localStorage.getItem('glory_sidebar_expandido') !== 'false';
        } catch {
            return true;
        }
    });

    /* [multi-panel-sidebar] Estado del menú contextual de click derecho */
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({abierto: false, panelId: null, x: 0, y: 0});

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

    /* Handler de click derecho en un botón del menú */
    const handleContextMenu = useCallback((e: React.MouseEvent, panelId: PanelId) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            abierto: true,
            panelId,
            x: e.clientX,
            y: e.clientY
        });
    }, []);

    /* Handler de selección del MenuContextual */
    const handleSeleccionContextual = useCallback((opcionId: string) => {
        if (opcionId === 'agregar-vista' && contextMenu.panelId && onAgregarPanel) {
            onAgregarPanel(contextMenu.panelId);
        }
        setContextMenu(prev => ({...prev, abierto: false}));
    }, [contextMenu.panelId, onAgregarPanel]);

    const opcionesContextual: OpcionMenu[] = [
        {
            id: 'agregar-vista',
            etiqueta: 'Agregar a la vista',
            icono: <Plus size={14} />
        }
    ];

    if (paneles.length === 0) return null;

    return (
        <nav
            className={`sidebarMenu ${expandido ? 'sidebarMenu--expandido' : 'sidebarMenu--colapsado'}`}
            aria-label="Menú de paneles"
        >
            {/* [multi-panel-sidebar] Menú contextual con MenuContextual */}
            {contextMenu.abierto && contextMenu.panelId && (
                <MenuContextual
                    opciones={opcionesContextual}
                    posicionX={contextMenu.x}
                    posicionY={contextMenu.y}
                    onSeleccionar={handleSeleccionContextual}
                    onCerrar={() => setContextMenu(prev => ({...prev, abierto: false}))}
                />
            )}
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
                {paneles.map(panel => {
                    /* [multi-panel-sidebar] En modo multi-panel, un panel puede estar activo
                     * en la grilla aunque no sea el panelActivo (foco actual) */
                    const enGrilla = panelesActivos?.includes(panel.id);
                    return (
                        <Boton
                            key={panel.id}
                            variante="ghost"
                            soloIcono={!expandido}
                            claseAdicional={`sidebarMenuBoton ${panelActivo === panel.id ? 'sidebarMenuBoton--activo' : ''} ${enGrilla ? 'sidebarMenuBoton--enGrilla' : ''}`}
                            onClick={() => onSeleccionarPanel(panel.id)}
                            onContextMenu={(e) => handleContextMenu(e, panel.id)}
                            icono={panel.icono}
                        >
                            {panel.titulo}
                        </Boton>
                    );
                })}
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