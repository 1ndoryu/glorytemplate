import React from 'react';
import type { CasoExito } from '@app/types/cosmo';

interface TarjetaCasoProps {
    caso: CasoExito;
    className?: string;
}

/*
 * Tarjeta de caso de éxito con imagen, meta flotante y estadística.
 * Enlaza al post individual del caso.
 */
export function TarjetaCaso({
    caso,
    className = '',
}: TarjetaCasoProps): React.JSX.Element {
    const enlace = `/caso/${caso.slug}/`;

    return (
        <a href={enlace} className={`tarjetaCaso ${className}`} style={{ textDecoration: 'none' }}>
            <div className="metaCaso">
                <span className="metaCasoFlotante">{caso.meta.caso_tipo}</span>
                <span className="metaCasoFlotante">{caso.meta.caso_ubicacion}</span>
            </div>
            <div
                className="imagenCaso"
                style={{ backgroundImage: `url(${caso.imagen})` }}
            >
                <div className="estadisticaCaso">
                    <h4>{caso.meta.caso_valor}</h4>
                    <p>{caso.meta.caso_descripcion}</p>
                </div>
            </div>
        </a>
    );
}
