import React from 'react';

/*
 * GridResenas: Grid de testimonios/reseñas de clientes.
 * Tarjetas con texto, avatar, nombre, cargo y enlace al proyecto.
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

/* Tarjeta individual de reseña */
const TarjetaResena: React.FC<{resena: Resena}> = ({resena}) => {
    /* Avatar placeholder si no hay imagen */
    const iniciales = resena.autor
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <article className="tarjetaResena">
            <p className="resenaTexto">{resena.texto}</p>
            <div className="resenaFooter">
                <div className="resenaAutor">
                    {resena.avatar ? <img src={resena.avatar} alt={resena.autor} className="resenaAvatar" /> : <div className="resenaAvatarPlaceholder">{iniciales}</div>}
                    <div className="resenaInfo">
                        <span className="resenaNombre">{resena.autor}</span>
                        <span className="resenaCargo">{resena.cargo}</span>
                    </div>
                </div>
                {resena.proyecto && (
                    <a href={resena.proyecto} className="resenaBotonProyecto">
                        Ver proyecto
                    </a>
                )}
            </div>
        </article>
    );
};

export const GridResenas: React.FC<GridResenasProps> = ({resenas, id = 'seccionResenas'}) => {
    return (
        <section id={id} className="seccionResenas">
            <div className="resenasContenedor">
                <header className="resenasHeader">
                    <h2 className="resenasTituloGrande">RESEÑAS</h2>
                    <a href="/resenas" className="resenasBotonVer">
                        Ver todas
                    </a>
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
