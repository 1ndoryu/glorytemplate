import React from 'react';

interface TarjetaInfoProps {
    icono: React.ReactNode;
    titulo: string;
    texto: string;
    className?: string;
}

/*
 * Tarjeta de informacion de contacto.
 * Replica la estructura exacta de contact_info() en contact.php.
 * Clases: contact-info-card, info-icon, info-title, info-text
 */
export function TarjetaInfo({
    icono,
    titulo,
    texto,
    className = '',
}: TarjetaInfoProps): React.JSX.Element {
    return (
        <div className={`contact-info-card ${className}`}>
            <div className="info-icon">{icono}</div>
            <h3 className="info-title">{titulo}</h3>
            <p className="info-text">{texto}</p>
        </div>
    );
}
