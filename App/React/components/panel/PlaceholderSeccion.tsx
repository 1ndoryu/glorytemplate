/**
 * Componente: PlaceholderSeccion
 * Placeholder generico para secciones del panel aun no implementadas.
 * Muestra titulo, descripcion y badge "En construccion".
 */
import React from 'react';
import type {TabConfig} from '../../data/panel';
import './PlaceholderSeccion.css';

interface PlaceholderSeccionProps {
    tab: TabConfig;
}

export const PlaceholderSeccion: React.FC<PlaceholderSeccionProps> = ({tab}) => (
    <div className="placeholderSeccion">
        <div className="placeholderIcono">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        </div>
        <h2 className="placeholderTitulo">{tab.label}</h2>
        <p className="placeholderDescripcion">{tab.descripcion}</p>
        <div className="placeholderBadge">En construccion</div>
        <p className="placeholderNota">
            Estamos trabajando para traerte la mejor experiencia. Esta seccion estara disponible proximamente.
        </p>
    </div>
);
