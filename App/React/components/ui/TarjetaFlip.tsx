import React, { useState, useCallback } from 'react';

interface TarjetaFlipProps {
    imagenFrente: string;
    tituloFrente: string;
    textoReverso: string;
    variante?: 'dark' | 'light';
    className?: string;
}

/*
 * Tarjeta con efecto flip 3D.
 * Replica la estructura exacta de landing.php flip cards.
 * Clases: flip-card, flipped, flip-card-inner, flip-card-front, service-card,
 * card-dark/card-light, card-content, card-bg-image, flip-card-back, flip-back-content
 */
export function TarjetaFlip({
    imagenFrente,
    tituloFrente,
    textoReverso,
    variante = 'dark',
    className = '',
}: TarjetaFlipProps): React.JSX.Element {
    const [volteada, setVolteada] = useState(false);

    const toggleFlip = useCallback(() => {
        setVolteada((prev) => !prev);
    }, []);

    const claseVariante = variante === 'light' ? 'card-light' : 'card-dark';

    return (
        <div
            className={`flip-card ${volteada ? 'flipped' : ''} ${className}`}
            onClick={toggleFlip}
        >
            <div className="flip-card-inner">
                <div className={`flip-card-front service-card ${claseVariante}`}>
                    <div className="card-content">
                        <h3>{tituloFrente}</h3>
                    </div>
                    <div
                        className="card-bg-image"
                        style={{ backgroundImage: `url(${imagenFrente})` }}
                    />
                </div>
                <div className="flip-card-back">
                    <div className="flip-back-content">
                        <p>{textoReverso}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
