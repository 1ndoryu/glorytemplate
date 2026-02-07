/**
 * Componente: BarraFiltros
 * Barra de búsqueda y filtrado minimalista para la página de servicios.
 */
import React from 'react';
import {Search} from 'lucide-react';
import './BarraFiltros.css';

interface FiltroCategoria {
    id: string;
    label: string;
}

interface BarraFiltrosProps {
    categorias: FiltroCategoria[];
    categoriaActiva: string;
    busqueda: string;
    onCategoriaChange: (id: string) => void;
    onBusquedaChange: (valor: string) => void;
}

export const BarraFiltros: React.FC<BarraFiltrosProps> = ({categorias, categoriaActiva, busqueda, onCategoriaChange, onBusquedaChange}) => {
    return (
        <div className="barraFiltros">
            <div className="filtrosCategorias">
                {categorias.map(cat => (
                    <button key={cat.id} className={`filtroBoton ${categoriaActiva === cat.id ? 'activo' : ''}`} onClick={() => onCategoriaChange(cat.id)}>
                        {cat.label}
                    </button>
                ))}
            </div>
            <div className="filtroBusqueda">
                <Search className="busquedaIcono" />
                <input type="text" className="busquedaInput" placeholder="Buscar servicio..." value={busqueda} onChange={e => onBusquedaChange(e.target.value)} />
            </div>
        </div>
    );
};
