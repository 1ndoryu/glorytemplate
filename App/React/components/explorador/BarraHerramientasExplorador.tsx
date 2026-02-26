/*
 * BarraHerramientasExplorador — Kamples (C349)
 * Barra superior del explorador: breadcrumbs navegables + controles (vista, crear carpeta, sidebar toggle).
 */

import { ChevronRight, LayoutGrid, List, FolderPlus, PanelLeft, RotateCcw } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';

interface BreadcrumbSegmento {
    label: string;
    onClick: () => void;
}

interface BarraHerramientasExploradorProps {
    segmentos: BreadcrumbSegmento[];
    vistaActiva: 'lista' | 'cuadricula';
    onCambiarVista: (vista: 'lista' | 'cuadricula') => void;
    onCrearCarpeta: () => void;
    onToggleSidebar: () => void;
    onRestaurarTodos: () => void;
    sidebarAbierto: boolean;
}

export const BarraHerramientasExplorador = ({
    segmentos,
    vistaActiva,
    onCambiarVista,
    onCrearCarpeta,
    onToggleSidebar,
    onRestaurarTodos,
    sidebarAbierto,
}: BarraHerramientasExploradorProps): JSX.Element => (
    <div className="exploradorBarra">
        {/* Sidebar toggle */}
        <BotonBase variante="ghost" soloIcono className={`exploradorBarraBoton ${sidebarAbierto ? 'exploradorBarraBotonActivo' : ''}`}
            onClick={onToggleSidebar} type="button" title={sidebarAbierto ? 'Ocultar panel' : 'Mostrar panel'}>
            <PanelLeft size={18} />
        </BotonBase>

        {/* Breadcrumbs */}
        <nav className="exploradorBreadcrumbs" aria-label="Navegación explorador">
            {segmentos.map((seg, i) => (
                <span key={`${seg.label}-${i}`} className="exploradorBreadcrumbFragmento">
                    {i > 0 && <ChevronRight size={14} className="exploradorBreadcrumbSeparador" />}
                    {i < segmentos.length - 1 ? (
                        <BotonBase variante="ghost" tamano="sm" className="exploradorBreadcrumbItem"
                            onClick={seg.onClick} type="button">
                            {seg.label}
                        </BotonBase>
                    ) : (
                        <span className="exploradorBreadcrumbItem exploradorBreadcrumbActivo">
                            {seg.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>

        {/* Controles derecha */}
        <div className="exploradorBarraControles">
            <BotonBase variante="ghost" soloIcono className="exploradorBarraBoton"
                onClick={onRestaurarTodos} type="button" title="Restaurar ubicación original (IA)">
                <RotateCcw size={18} />
            </BotonBase>

            <BotonBase variante="ghost" soloIcono className="exploradorBarraBoton"
                onClick={onCrearCarpeta} type="button" title="Crear carpeta">
                <FolderPlus size={18} />
            </BotonBase>

            <div className="exploradorVistaToggle">
                <BotonBase variante="ghost" soloIcono
                    className={`exploradorVistaBoton ${vistaActiva === 'lista' ? 'exploradorVistaActiva' : ''}`}
                    onClick={() => onCambiarVista('lista')} type="button" title="Vista lista">
                    <List size={18} />
                </BotonBase>
                <BotonBase variante="ghost" soloIcono
                    className={`exploradorVistaBoton ${vistaActiva === 'cuadricula' ? 'exploradorVistaActiva' : ''}`}
                    onClick={() => onCambiarVista('cuadricula')} type="button" title="Vista cuadrícula">
                    <LayoutGrid size={18} />
                </BotonBase>
            </div>
        </div>
    </div>
);
