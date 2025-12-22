/*
 * ListaOrdenPaneles
 * Lista de paneles con controles para reordenar
 * Permite mover paneles arriba/abajo y cambiar de columna
 */

import {ChevronUp, ChevronDown, Target, Folder, Terminal, FileText} from 'lucide-react';
import type {PanelId, OrdenPanel, ModoColumnas} from '../../hooks/useConfiguracionLayout';

interface ListaOrdenPanelesProps {
    ordenPaneles: OrdenPanel[];
    modoColumnas: ModoColumnas;
    onMoverArriba: (panelId: PanelId) => void;
    onMoverAbajo: (panelId: PanelId) => void;
    onCambiarColumna: (panelId: PanelId, columna: 1 | 2 | 3) => void;
}

/* Configuración de paneles con iconos y nombres */
const INFO_PANELES: Record<PanelId, {nombre: string; icono: JSX.Element}> = {
    focoPrioritario: {
        nombre: 'Foco Prioritario',
        icono: <Target size={14} />
    },
    proyectos: {
        nombre: 'Proyectos',
        icono: <Folder size={14} />
    },
    ejecucion: {
        nombre: 'Ejecucion',
        icono: <Terminal size={14} />
    },
    scratchpad: {
        nombre: 'Scratchpad',
        icono: <FileText size={14} />
    }
};

export function ListaOrdenPaneles({ordenPaneles, modoColumnas, onMoverArriba, onMoverAbajo, onCambiarColumna}: ListaOrdenPanelesProps): JSX.Element {
    /* Agrupar paneles por columna */
    const panelesColumna1 = ordenPaneles.filter(p => p.columna === 1).sort((a, b) => a.posicion - b.posicion);

    const panelesColumna2 = ordenPaneles.filter(p => p.columna === 2).sort((a, b) => a.posicion - b.posicion);

    const panelesColumna3 = ordenPaneles.filter(p => p.columna === 3).sort((a, b) => a.posicion - b.posicion);

    const renderizarPanel = (panel: OrdenPanel, esPrimero: boolean, esUltimo: boolean) => {
        const info = INFO_PANELES[panel.id];

        return (
            <div key={panel.id} className="listaOrdenItem">
                <div className="listaOrdenItemInfo">
                    <span className="listaOrdenItemIcono">{info.icono}</span>
                    <span className="listaOrdenItemNombre">{info.nombre}</span>
                </div>

                <div className="listaOrdenItemAcciones">
                    {/* Botones de mover arriba/abajo */}
                    <button className="listaOrdenBoton" onClick={() => onMoverArriba(panel.id)} disabled={esPrimero} title="Mover arriba">
                        <ChevronUp size={14} />
                    </button>
                    <button className="listaOrdenBoton" onClick={() => onMoverAbajo(panel.id)} disabled={esUltimo} title="Mover abajo">
                        <ChevronDown size={14} />
                    </button>

                    {/* Selector de columna (solo si hay más de 1 columna) */}
                    {modoColumnas > 1 && (
                        <div className="listaOrdenColumnas">
                            <button className={`listaOrdenColumnaBtn ${panel.columna === 1 ? 'activa' : ''}`} onClick={() => onCambiarColumna(panel.id, 1)} title="Mover a columna 1">
                                1
                            </button>
                            <button className={`listaOrdenColumnaBtn ${panel.columna === 2 ? 'activa' : ''}`} onClick={() => onCambiarColumna(panel.id, 2)} title="Mover a columna 2">
                                2
                            </button>
                            {modoColumnas === 3 && (
                                <button className={`listaOrdenColumnaBtn ${panel.columna === 3 ? 'activa' : ''}`} onClick={() => onCambiarColumna(panel.id, 3)} title="Mover a columna 3">
                                    3
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderizarColumna = (paneles: OrdenPanel[], numeroColumna: number) => {
        if (paneles.length === 0) return null;

        return (
            <div className="listaOrdenColumna">
                <span className="listaOrdenColumnaLabel">Columna {numeroColumna}</span>
                <div className="listaOrdenItems">{paneles.map((panel, index) => renderizarPanel(panel, index === 0, index === paneles.length - 1))}</div>
            </div>
        );
    };

    return (
        <div className="listaOrdenPaneles">
            {modoColumnas === 1 ? (
                /* Modo 1 columna: lista simple */
                <div className="listaOrdenItems">{panelesColumna1.map((panel, index) => renderizarPanel(panel, index === 0, index === panelesColumna1.length - 1))}</div>
            ) : (
                /* Modo 2-3 columnas: agrupado */
                <div className="listaOrdenColumnasGrid">
                    {renderizarColumna(panelesColumna1, 1)}
                    {modoColumnas >= 2 && renderizarColumna(panelesColumna2, 2)}
                    {modoColumnas === 3 && renderizarColumna(panelesColumna3, 3)}
                </div>
            )}
        </div>
    );
}
