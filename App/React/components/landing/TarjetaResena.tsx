import React from 'react';
import {Tarjeta, TarjetaFooter, Boton, Avatar} from '../ui';

/*
 * TarjetaResena: Tarjeta individual de reseña/testimonio.
 * Muestra texto, avatar, nombre, cargo y enlace al proyecto.
 * Extraído de GridResenas para reutilización.
 */

export interface Resena {
    id: string;
    texto: string;
    autor: string;
    cargo: string;
    avatar?: string;
    proyecto?: string;
}

interface TarjetaResenaProps {
    resena: Resena;
}

export const TarjetaResena: React.FC<TarjetaResenaProps> = ({resena}) => {
    return (
        <Tarjeta className="tarjetaResena">
            <p className="resenaTexto">{resena.texto}</p>
            <TarjetaFooter className="resenaFooter">
                <div className="resenaAutor">
                    <Avatar src={resena.avatar} nombre={resena.autor} tamano="md" />
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

export default TarjetaResena;
