import React from 'react';
import {Tarjeta, TarjetaFooter, Boton} from '../ui';

/*
 * GridResenas: Grid de testimonios/reseñas de clientes.
 * Tarjetas con texto, avatar, nombre, cargo y enlace al proyecto.
 * Refactorizado para usar sistema UI base.
 */

export interface Resena {
    id: string;
    texto: string;
    autor: string;
    cargo: string;
    avatar?: string;
    proyecto?: string;
}

interface GridResenasProps {
    resenas: Resena[];
    id?: string;
}

/* Tarjeta individual de reseña usando sistema UI */
const TarjetaResena: React.FC<{resena: Resena}> = ({resena}) => {
    /* Avatar placeholder si no hay imagen */
    const iniciales = resena.autor
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Tarjeta className="tarjetaResena">
            <p className="resenaTexto">{resena.texto}</p>
            <TarjetaFooter className="resenaFooter">
                <div className="resenaAutor">
                    {resena.avatar ? <img src={resena.avatar} alt={resena.autor} className="resenaAvatar" /> : <div className="resenaAvatarPlaceholder">{iniciales}</div>}
                    <div className="resenaInfo">
                        <span className="resenaNombre">{resena.autor}</span>
                        <span className="resenaCargo">{resena.cargo}</span>
                    </div>
                </div>
                {resena.proyecto && (
                    <Boton href={resena.proyecto} variante="ghost" tamano="sm">
                        Ver proyecto
                    </Boton>
                )}
            </TarjetaFooter>
        </Tarjeta>
    );
};

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
