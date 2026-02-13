import React from 'react';

interface TarjetaFeatureProps {
    icono?: React.ReactNode;
    titulo: string;
    subtitulo?: string;
    descripcion: string;
    features?: string[];
    enlace?: string;
    textoEnlace?: string;
    /* Clase de posicion: tarjetaIzquierda, tarjetaCentro, tarjetaDerecha */
    posicion?: string;
    className?: string;
}

/*
 * Tarjeta de feature/servicio con icono, titulo, descripcion, lista y boton.
 * Usada en la pagina de Servicios para los planes de marketing y revenue.
 */
export function TarjetaFeature({
    icono,
    titulo,
    subtitulo,
    descripcion,
    features = [],
    enlace,
    textoEnlace = 'Ver más',
    posicion = '',
    className = '',
}: TarjetaFeatureProps): React.JSX.Element {
    return (
        <div className={`tarjetaMarketing ${posicion} ${className}`}>
            <div className="encabezadoTarjeta">
                {icono && <div className="iconoTarjeta">{icono}</div>}
                <h3>{titulo}</h3>
                {subtitulo && <span className="subtituloTarjeta">{subtitulo}</span>}
            </div>
            <div className="cuerpoTarjeta">
                <p className="descripcionTarjeta">{descripcion}</p>
                {features.length > 0 && (
                    <ul className="featuresListaTarjeta">
                        {features.map((f, i) => (
                            <li key={i}>
                                <span>→</span>
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {enlace && (
                <div className="pieTarjeta">
                    <a href={enlace} className="botonTarjeta">
                        {textoEnlace} <span>→</span>
                    </a>
                </div>
            )}
        </div>
    );
}
