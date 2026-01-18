import React from 'react';
import {TarjetaProyecto, Proyecto} from './TarjetaProyecto';

/*
 * GridPortafolio: Grid responsive de proyectos.
 * Recibe lista de proyectos y callback para seleccion.
 */

interface GridPortafolioProps {
    proyectos: Proyecto[];
    onSeleccionarProyecto?: (proyecto: Proyecto) => void;
}

export const GridPortafolio: React.FC<GridPortafolioProps> = ({proyectos, onSeleccionarProyecto}) => {
    return (
        <section id="seccionProyectos" className="seccionPortafolio">
            <div className="gridPortafolio">
                {proyectos.map(proyecto => (
                    <TarjetaProyecto key={proyecto.id} proyecto={proyecto} onClick={onSeleccionarProyecto} />
                ))}
            </div>
        </section>
    );
};

export default GridPortafolio;
