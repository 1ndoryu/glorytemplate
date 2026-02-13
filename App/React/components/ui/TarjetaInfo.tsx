import React from 'react';

interface TarjetaInfoProps {
    icono: React.ReactNode;
    titulo: string;
    contenido: React.ReactNode;
    className?: string;
}

/*
 * Tarjeta de informacion simple con icono, titulo y contenido.
 * Usada en la pagina de contacto para email, telefono, ubicacion.
 */
export function TarjetaInfo({
    icono,
    titulo,
    contenido,
    className = '',
}: TarjetaInfoProps): React.JSX.Element {
    return (
        <div className={`tarjetaInfo ${className}`}>
            <div className="iconoInfo">{icono}</div>
            <h3>{titulo}</h3>
            <div>{contenido}</div>
        </div>
    );
}
