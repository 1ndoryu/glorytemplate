import React from 'react';
import {TarjetaProyecto, Proyecto} from './TarjetaProyecto';

/*
 * GridPortafolio: Grid responsive de proyectos.
 * Permite controlar cantidad de casos visibles y columnas.
 */

interface GridPortafolioProps {
    proyectos: Proyecto[];
    onSeleccionarProyecto?: (proyecto: Proyecto) => void;
    columnas?: number;
    cantidadVisible?: number;
}

export const GridPortafolio: React.FC<GridPortafolioProps> = ({proyectos, onSeleccionarProyecto, columnas = 2, cantidadVisible}) => {
    /* Limitar proyectos si se especifica cantidad */
    const proyectosMostrar = cantidadVisible ? proyectos.slice(0, cantidadVisible) : proyectos;

    const estiloGrid = {
        gridTemplateColumns: `repeat(${columnas}, 1fr)`
    };

    return (
        <section id="seccionProyectos" className="seccionPortafolio">
            <div className="gridPortafolio" style={estiloGrid}>
                {proyectosMostrar.map(proyecto => (
                    <TarjetaProyecto key={proyecto.id} proyecto={proyecto} onClick={onSeleccionarProyecto} />
                ))}
            </div>
        </section>
    );
};

export default GridPortafolio;
