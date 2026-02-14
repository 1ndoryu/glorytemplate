import React from 'react';
import type { CasoExito } from '@app/types/cosmo';

interface TarjetaCasoProps {
    caso: CasoExito;
    className?: string;
}

/*
 * Tarjeta de caso de éxito.
 * Replica la estructura exacta de la case-card en landing.php/casos.php.
 * Clases: case-card, case-meta, case-flotante, case-image, case-stat
 */
export function TarjetaCaso({
    caso,
    className = '',
}: TarjetaCasoProps): React.JSX.Element {
    return (
        <article className={`case-card ${className}`}>
            <div className="case-meta">
                <h3 className="case-flotante">{caso.meta.caso_tipo}</h3>
                <span className="case-flotante">{caso.meta.caso_ubicacion}</span>
            </div>
            <div
                className="case-image"
                style={{ backgroundImage: `url(${caso.imagen})` }}
            >
                <div className="case-stat">
                    <h4>{caso.meta.caso_valor}</h4>
                    <p>{caso.meta.caso_descripcion}</p>
                </div>
            </div>
        </article>
    );
}
