/*
 * DashboardSidebarGrid
 *
 * [multi-panel-sidebar] Grilla multi-panel para modo sidebar.
 * Renderiza hasta 4 paneles en disposición responsive:
 *   1 panel  → 1 columna 100% (como antes)
 *   2 paneles → 2 columnas iguales
 *   3 paneles → 2 columnas arriba, 1 fila completa abajo
 *   4 paneles → 2×2
 *
 * Los botones de cerrar/reordenar se inyectan en seccionAcciones
 * de cada panel via DashboardPanelView.accionesExtra.
 *
 * Redimensionamiento:
 *  - Horizontal (entre columnas): handle de resize entre col1 y col2
 *  - Vertical (entre filas): handle de resize entre fila sup e inf (3+ paneles)
 *  - Ambos ajustan proporciones internas (no alturas individuales de paneles)
 */

import {useCallback, useRef, useState} from 'react';
import {X, ChevronUp, ChevronDown} from 'lucide-react';
import {DashboardPanelView} from './DashboardPanelView';
import type {DashboardCompletoRetorno} from '../../hooks/useDashboardCompleto';
import type {PanelId} from '../../hooks/useConfiguracionLayout';
import {Boton} from '../ui';

interface DashboardSidebarGridProps {
    paneles: PanelId[];
    ctx: DashboardCompletoRetorno;
    anchos: [number, number];
    alturaFilas: [number, number];
    onQuitarPanel: (panelId: PanelId) => void;
    onAjustarAnchos?: (nuevosAnchos: [number, number]) => void;
    onAjustarAlturasFilas?: (nuevasAlturas: [number, number]) => void;
    onMoverPanel?: (panelId: PanelId, nuevoIndice: number) => void;
}

export function DashboardSidebarGrid({paneles, ctx, anchos, alturaFilas, onQuitarPanel, onAjustarAnchos, onAjustarAlturasFilas, onMoverPanel}: DashboardSidebarGridProps): JSX.Element | null {
    if (paneles.length === 0) return null;

    const count = paneles.length;

    if (count === 1) {
        return (
            <div className="sidebarGrid sidebarGrid--uno">
                <SidebarGridCell
                    panelId={paneles[0]}
                    ctx={ctx}
                    onQuitar={onQuitarPanel}
                    indice={0}
                    total={1}
                />
            </div>
        );
    }

    /* 2+ paneles: dividir en columnas según cantidad */
    let col1: PanelId[];
    let col2: PanelId[];

    if (count === 2) {
        col1 = [paneles[0]];
        col2 = [paneles[1]];
    } else if (count === 3) {
        /* 3 paneles: 2 arriba, 1 abajo (full width) */
        col1 = [paneles[0]];
        col2 = [paneles[1]];
    } else {
        /* 4 paneles: 2x2 */
        col1 = [paneles[0], paneles[1]];
        col2 = [paneles[2], paneles[3]];
    }

    const renderCell = (panelId: PanelId, indice: number) => (
        <SidebarGridCell
            key={panelId}
            panelId={panelId}
            ctx={ctx}
            onQuitar={onQuitarPanel}
            indice={indice}
            total={count}
            onMoverArriba={onMoverPanel ? () => onMoverPanel(panelId, indice - 1) : undefined}
            onMoverAbajo={onMoverPanel ? () => onMoverPanel(panelId, indice + 1) : undefined}
        />
    );

    return (
        <div className="sidebarGrid sidebarGrid--multi">
            {/* Fila superior */}
            <div className="sidebarGridRow">
                <div className="sidebarGridCol" style={{/* sentinel-disable inline-style-prohibido */ flex: `0 0 ${anchos[0]}%`, width: `${anchos[0]}%`}}>
                    {col1.map((id, i) => renderCell(id, i))}
                </div>

                {onAjustarAnchos && (
                    <ResizeHandleSidebar
                        anchos={anchos}
                        onAjustarAnchos={onAjustarAnchos}
                    />
                )}

                <div className="sidebarGridCol" style={{/* sentinel-disable inline-style-prohibido */ flex: `0 0 ${anchos[1]}%`, width: `${anchos[1]}%`}}>
                    {col2.map((id, i) => renderCell(id, i + col1.length))}
                </div>
            </div>

            {/* Handle de resize vertical entre filas (3+ paneles) */}
            {(count === 3 || count === 4) && onAjustarAlturasFilas && (
                <ResizeHandleRow
                    alturas={alturaFilas}
                    onAjustarAlturas={onAjustarAlturasFilas}
                />
            )}

            {/* 3 paneles: tercero abajo a todo ancho */}
            {count === 3 && (
                <div className="sidebarGridRow sidebarGridRow--bottom" style={{/* sentinel-disable inline-style-prohibido */ flex: `0 0 ${alturaFilas[1]}%`}}>
                    {renderCell(paneles[2], 2)}
                </div>
            )}

            {/* 4 paneles: fila inferior con 2 columnas */}
            {count === 4 && (
                <div className="sidebarGridRow sidebarGridRow--bottom" style={{/* sentinel-disable inline-style-prohibido */ flex: `0 0 ${alturaFilas[1]}%`}}>
                    <div className="sidebarGridCol" style={{/* sentinel-disable inline-style-prohibido */ flex: `0 0 ${anchos[0]}%`, width: `${anchos[0]}%`}}>
                        {renderCell(paneles[2], 2)}
                    </div>
                    <div className="sidebarGridResizeHandle sidebarGridResizeHandle--vertical sidebarGridResizeHandle--ghost" />
                    <div className="sidebarGridCol" style={{/* sentinel-disable inline-style-prohibido */ flex: `0 0 ${anchos[1]}%`, width: `${anchos[1]}%`}}>
                        {renderCell(paneles[3], 3)}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ===== CELDA INDIVIDUAL (sin resize propio) ===== */

interface SidebarGridCellProps {
    panelId: PanelId;
    ctx: DashboardCompletoRetorno;
    onQuitar: (panelId: PanelId) => void;
    indice: number;
    total: number;
    onMoverArriba?: () => void;
    onMoverAbajo?: () => void;
}

function SidebarGridCell({panelId, ctx, onQuitar, indice, total, onMoverArriba, onMoverAbajo}: SidebarGridCellProps): JSX.Element {
    const handleQuitar = useCallback(() => {
        onQuitar(panelId);
    }, [panelId, onQuitar]);

    /* Acciones extra inyectadas en seccionAcciones via DashboardPanelView */
    const accionesExtra = total > 1 ? (
        <>
            {onMoverArriba && (
                <Boton variante="badge" soloIcono onClick={onMoverArriba} icono={<ChevronUp size={12} />} title="Mover arriba" disabled={indice === 0} />
            )}
            {onMoverAbajo && (
                <Boton variante="badge" soloIcono onClick={onMoverAbajo} icono={<ChevronDown size={12} />} title="Mover abajo" disabled={indice === total - 1} />
            )}
            <Boton variante="badge" soloIcono onClick={handleQuitar} icono={<X size={12} />} title="Cerrar panel" />
        </>
    ) : undefined;

    return (
        <div className="sidebarGridCelda">
            <DashboardPanelView panelId={panelId} ctx={ctx} accionesExtra={accionesExtra} />
        </div>
    );
}

/* ===== RESIZE HANDLE HORIZONTAL ===== */

interface ResizeHandleSidebarProps {
    anchos: [number, number];
    onAjustarAnchos: (nuevosAnchos: [number, number]) => void;
}

function ResizeHandleSidebar({anchos, onAjustarAnchos}: ResizeHandleSidebarProps): JSX.Element {
    const [arrastrando, setArrastrando] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(true);

        const startX = e.clientX;
        const contenedor = contenedorRef.current?.parentElement;
        if (!contenedor) return;

        const rect = contenedor.getBoundingClientRect();
        const anchoTotal = rect.width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaPorcentaje = (deltaX / anchoTotal) * 100;

            const nuevoAncho1 = Math.min(75, Math.max(25, anchos[0] + deltaPorcentaje));
            const nuevoAncho2 = 100 - nuevoAncho1;

            if (nuevoAncho2 >= 25 && nuevoAncho2 <= 75) {
                onAjustarAnchos([Math.round(nuevoAncho1 * 10) / 10, Math.round(nuevoAncho2 * 10) / 10]);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            setArrastrando(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [anchos, onAjustarAnchos]);

    return (
        <div
            ref={contenedorRef}
            className={`sidebarGridResizeHandle ${arrastrando ? 'sidebarGridResizeHandle--arrastrando' : ''}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => onAjustarAnchos([50, 50])}
            title="Arrastrar para redimensionar. Doble clic para 50/50."
        >
            <div className="sidebarGridResizeHandleLinea" />
        </div>
    );
}

/* ===== RESIZE HANDLE VERTICAL (entre filas) ===== */

interface ResizeHandleRowProps {
    alturas: [number, number];
    onAjustarAlturas: (nuevasAlturas: [number, number]) => void;
}

function ResizeHandleRow({alturas, onAjustarAlturas}: ResizeHandleRowProps): JSX.Element {
    const [arrastrando, setArrastrando] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(true);

        const startY = e.clientY;
        const contenedor = contenedorRef.current?.parentElement;
        if (!contenedor) return;

        const rect = contenedor.getBoundingClientRect();
        const altoTotal = rect.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const deltaPorcentaje = (deltaY / altoTotal) * 100;

            const nuevaAltura1 = Math.min(75, Math.max(25, alturas[0] + deltaPorcentaje));
            const nuevaAltura2 = 100 - nuevaAltura1;

            if (nuevaAltura2 >= 25 && nuevaAltura2 <= 75) {
                onAjustarAlturas([Math.round(nuevaAltura1 * 10) / 10, Math.round(nuevaAltura2 * 10) / 10]);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            setArrastrando(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, [alturas, onAjustarAlturas]);

    return (
        <div
            ref={contenedorRef}
            className={`sidebarGridResizeHandle sidebarGridResizeHandle--horizontal ${arrastrando ? 'sidebarGridResizeHandle--arrastrando' : ''}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => onAjustarAlturas([50, 50])}
            title="Arrastrar para redimensionar filas. Doble clic para 50/50."
        >
            <div className="sidebarGridResizeHandleLinea" />
        </div>
    );
}

