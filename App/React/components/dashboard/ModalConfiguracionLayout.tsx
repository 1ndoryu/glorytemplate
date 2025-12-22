/*
 * ModalConfiguracionLayout
 * Modal para configurar el layout del dashboard
 * Selector de columnas, toggles de visibilidad y orden de paneles
 */

import {Modal} from '../shared/Modal';
import {ToggleSwitch} from '../shared/ToggleSwitch';
import {Columns2, Columns3, Square, Target, Folder, Terminal, FileText, RotateCcw, ArrowUpDown} from 'lucide-react';
import {ListaOrdenPaneles} from './ListaOrdenPaneles';
import type {ModoColumnas, VisibilidadPaneles, PanelId, OrdenPanel} from '../../hooks/useConfiguracionLayout';

interface ModalConfiguracionLayoutProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    modoColumnas: ModoColumnas;
    visibilidad: VisibilidadPaneles;
    ordenPaneles: OrdenPanel[];
    onCambiarModo: (modo: ModoColumnas) => void;
    onTogglePanel: (panel: PanelId) => void;
    onMoverPanelArriba: (panelId: PanelId) => void;
    onMoverPanelAbajo: (panelId: PanelId) => void;
    onMoverPanelAColumna: (panelId: PanelId, columna: 1 | 2 | 3) => void;
    onResetearOrden: () => void;
    onResetear: () => void;
}

/* Info de paneles para los toggles */
const PANELES: {id: PanelId; nombre: string; icono: JSX.Element; descripcion: string}[] = [
    {
        id: 'focoPrioritario',
        nombre: 'Foco Prioritario',
        icono: <Target size={14} />,
        descripcion: 'Panel de hábitos y racha'
    },
    {
        id: 'proyectos',
        nombre: 'Proyectos',
        icono: <Folder size={14} />,
        descripcion: 'Lista de proyectos'
    },
    {
        id: 'ejecucion',
        nombre: 'Ejecución',
        icono: <Terminal size={14} />,
        descripcion: 'Lista de tareas activas'
    },
    {
        id: 'scratchpad',
        nombre: 'Scratchpad',
        icono: <FileText size={14} />,
        descripcion: 'Notas rápidas'
    }
];

export function ModalConfiguracionLayout({estaAbierto, onCerrar, modoColumnas, visibilidad, ordenPaneles, onCambiarModo, onTogglePanel, onMoverPanelArriba, onMoverPanelAbajo, onMoverPanelAColumna, onResetearOrden, onResetear}: ModalConfiguracionLayoutProps): JSX.Element {
    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuración de Layout">
            <div className="configLayoutContenido">
                {/* Selector de columnas */}
                <div className="configLayoutSeccion">
                    <h4 className="configLayoutSeccionTitulo">Distribución de Columnas</h4>
                    <p className="configLayoutSeccionDescripcion">Selecciona cuántas columnas quieres en el dashboard</p>

                    <div className="configLayoutColumnasOpciones">
                        <button className={`configLayoutColumnaOpcion ${modoColumnas === 1 ? 'activo' : ''}`} onClick={() => onCambiarModo(1)} title="1 columna">
                            <Square size={20} />
                            <span>1 Columna</span>
                        </button>

                        <button className={`configLayoutColumnaOpcion ${modoColumnas === 2 ? 'activo' : ''}`} onClick={() => onCambiarModo(2)} title="2 columnas">
                            <Columns2 size={20} />
                            <span>2 Columnas</span>
                        </button>

                        <button className={`configLayoutColumnaOpcion ${modoColumnas === 3 ? 'activo' : ''}`} onClick={() => onCambiarModo(3)} title="3 columnas">
                            <Columns3 size={20} />
                            <span>3 Columnas</span>
                        </button>
                    </div>
                </div>

                {/* Orden de Paneles */}
                <div className="configLayoutSeccion">
                    <div className="configLayoutSeccionHeader">
                        <div>
                            <h4 className="configLayoutSeccionTitulo">
                                <ArrowUpDown size={14} />
                                <span>Orden de Paneles</span>
                            </h4>
                            <p className="configLayoutSeccionDescripcion">Reordena los paneles usando los botones o cambia su columna</p>
                        </div>
                        <button className="configLayoutBotonResetPequeno" onClick={onResetearOrden} title="Restaurar orden por defecto">
                            <RotateCcw size={12} />
                        </button>
                    </div>

                    <ListaOrdenPaneles ordenPaneles={ordenPaneles} modoColumnas={modoColumnas} onMoverArriba={onMoverPanelArriba} onMoverAbajo={onMoverPanelAbajo} onCambiarColumna={onMoverPanelAColumna} />
                </div>

                {/* Visibilidad de paneles */}
                <div className="configLayoutSeccion">
                    <h4 className="configLayoutSeccionTitulo">Visibilidad de Paneles</h4>
                    <p className="configLayoutSeccionDescripcion">Oculta paneles que no necesites. Aparecerán en la barra lateral.</p>

                    <div className="configLayoutPaneles">
                        {PANELES.map(panel => (
                            <div key={panel.id} className="configLayoutPanelItem">
                                <div className="configLayoutPanelInfo">
                                    <span className="configLayoutPanelIcono">{panel.icono}</span>
                                    <div className="configLayoutPanelTexto">
                                        <span className="configLayoutPanelNombre">{panel.nombre}</span>
                                        <span className="configLayoutPanelDescripcion">{panel.descripcion}</span>
                                    </div>
                                </div>
                                <ToggleSwitch checked={visibilidad[panel.id]} onChange={() => onTogglePanel(panel.id)} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botón de reset */}
                <div className="configLayoutAcciones">
                    <button className="configLayoutBotonReset" onClick={onResetear} title="Restaurar configuración por defecto">
                        <RotateCcw size={12} />
                        <span>Restaurar todo por defecto</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
