/*
 * PanelArrastrable
 * Sistema de reordenamiento de paneles basado en clicks
 * Más robusto que el HTML5 Drag & Drop nativo
 */

import {ReactNode, useCallback} from 'react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';

interface PanelArrastrableProps {
    panelId: PanelId;
    children: ReactNode;
    panelSeleccionado: PanelId | null;
    onSeleccionar: (panelId: PanelId | null) => void;
    onMoverAntes: (panelId: PanelId) => void;
    onMoverDespues: (panelId: PanelId) => void;
}

export function PanelArrastrable({panelId, children, panelSeleccionado, onSeleccionar, onMoverAntes, onMoverDespues}: PanelArrastrableProps): JSX.Element {
    const esteEstaSeleccionado = panelSeleccionado === panelId;
    const haySeleccion = panelSeleccionado !== null;
    const mostrarZonas = haySeleccion && !esteEstaSeleccionado;

    const manejarClickZonaSuperior = useCallback(() => {
        if (panelSeleccionado) {
            onMoverAntes(panelId);
        }
    }, [panelSeleccionado, panelId, onMoverAntes]);

    const manejarClickZonaInferior = useCallback(() => {
        if (panelSeleccionado) {
            onMoverDespues(panelId);
        }
    }, [panelSeleccionado, panelId, onMoverDespues]);

    return (
        <div className={`panelArrastrable ${esteEstaSeleccionado ? 'panelSeleccionado' : ''} ${mostrarZonas ? 'panelMostrandoZonas' : ''}`}>
            {/* Zona superior - aparece cuando hay un panel seleccionado */}
            {mostrarZonas && (
                <button className="zonaReordenamiento zonaSuperior" onClick={manejarClickZonaSuperior} type="button">
         
                </button>
            )}

            {/* Contenido del panel */}
            <div className="panelArrastrableContenido">{children}</div>

            {/* Zona inferior - aparece cuando hay un panel seleccionado */}
            {mostrarZonas && (
                <button className="zonaReordenamiento zonaInferior" onClick={manejarClickZonaInferior} type="button">
                  
                </button>
            )}
        </div>
    );
}

/*
 * HandleArrastre - Botón para activar/desactivar modo de reordenamiento
 */
interface HandleArrastreProps {
    panelId: PanelId;
    estaActivo: boolean;
    onClick: () => void;
}

export function HandleArrastre({panelId, estaActivo, onClick}: HandleArrastreProps): JSX.Element {
    return (
        <button className={`handleArrastre ${estaActivo ? 'activo' : ''}`} onClick={onClick} title={estaActivo ? 'Cancelar reordenamiento' : 'Mover panel'} type="button">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="2" cy="2" r="1.2" />
                <circle cx="2" cy="5" r="1.2" />
                <circle cx="2" cy="8" r="1.2" />
                <circle cx="5" cy="2" r="1.2" />
                <circle cx="5" cy="5" r="1.2" />
                <circle cx="5" cy="8" r="1.2" />
            </svg>
        </button>
    );
}
