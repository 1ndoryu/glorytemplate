import React, { useState, useCallback } from 'react';

interface TarjetaFlipProps {
    /* Contenido del frente: imagen de fondo + titulo */
    imagenFrente: string;
    tituloFrente: string;
    /* Texto del reverso */
    textoReverso: string;
    className?: string;
}

/*
 * Tarjeta con efecto flip 3D al hacer click.
 * Frente: imagen con overlay gradiente + titulo.
 * Reverso: fondo blanco con texto descriptivo.
 */
export function TarjetaFlip({
    imagenFrente,
    tituloFrente,
    textoReverso,
    className = '',
}: TarjetaFlipProps): React.JSX.Element {
    const [volteada, setVolteada] = useState(false);

    const toggleFlip = useCallback(() => {
        setVolteada((prev) => !prev);
    }, []);

    return (
        <div
            className={`flipCard ${volteada ? 'volteada' : ''} ${className}`}
            onClick={toggleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFlip(); }}
            aria-label={`${tituloFrente} - click para ver mas`}
        >
            <div className="flipCardInner">
                {/* Frente */}
                <div className="flipCardFrente">
                    <div className="tarjetaServicio">
                        <div
                            className="imagenFondo"
                            style={{ backgroundImage: `url(${imagenFrente})` }}
                        />
                        <div className="contenidoTarjeta">
                            <h3>{tituloFrente}</h3>
                        </div>
                    </div>
                </div>
                {/* Reverso */}
                <div className="flipCardReverso">
                    <div className="contenidoReverso">
                        <p>{textoReverso}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
