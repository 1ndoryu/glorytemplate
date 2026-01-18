import React from 'react';
import {Boton} from '../ui';
import {TarjetaResena, Resena} from './TarjetaResena';

/*
 * GridResenas: Grid de testimonios/reseñas de clientes.
 * Refactorizado para usar TarjetaResena como componente separado.
 */

export type {Resena};

interface GridResenasProps {
    resenas: Resena[];
    id?: string;
}

export const GridResenas: React.FC<GridResenasProps> = ({resenas, id = 'seccionResenas'}) => {
    return (
        <section id={id} className="seccionResenas">
            <div className="resenasContenedor">
                <header className="resenasHeader">
                    <h2 className="resenasTituloGrande">RESEÑAS</h2>
                    <Boton href="/resenas" variante="outline" tamano="sm">
                        Ver todas
                    </Boton>
                </header>
                <div className="gridResenas">
                    {resenas.map(resena => (
                        <TarjetaResena key={resena.id} resena={resena} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GridResenas;
