import React from 'react';
import { GloryLink } from '@/core/router';

interface TarjetaFeatureProps {
    icono?: React.ReactNode;
    titulo: string;
    subtitulo?: string;
    descripcion: string;
    features?: string[];
    enlace?: string;
    textoEnlace?: string;
    /* Clase de posicion original: left, center, right, right-bottom */
    posicion?: string;
    className?: string;
}

/*
 * Tarjeta de feature/servicio.
 * Replica la estructura exacta de render_marketing_card() en services.php.
 * Clases: marketing-card, marketing-card-left/center/right, card-header,
 * card-icon-wrapper, card-subtitle, card-body, card-desc, card-features,
 * feature-check, feature-text, card-footer, btn-card
 */
export function TarjetaFeature({
    icono,
    titulo,
    subtitulo,
    descripcion,
    features = [],
    enlace,
    textoEnlace = 'Solicitar info',
    posicion = '',
    className = '',
}: TarjetaFeatureProps): React.JSX.Element {
    /* Mapear posicion a clase CSS original */
    const claseCard = posicion ? `marketing-card-${posicion}` : 'marketing-card';

    return (
        <div className={`${claseCard} ${className}`}>
            <div className="card-header">
                {icono && <div className="card-icon-wrapper">{icono}</div>}
                <h3>{titulo}</h3>
                {subtitulo && <span className="card-subtitle">{subtitulo}</span>}
            </div>
            <div className="card-body">
                <p className="card-desc">{descripcion}</p>
                {features.length > 0 && (
                    <ul className="card-features">
                        {features.map((f, i) => (
                            <li key={i}>
                                <span className="feature-check">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="11" stroke="#8c8c8c" strokeWidth="1" />
                                        <path d="M8 12L11 15L16 9" stroke="#8c8c8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <span className="feature-text">{f}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {enlace && (
                <div className="card-footer">
                    <GloryLink href={enlace} className="btn-card">{textoEnlace}</GloryLink>
                </div>
            )}
        </div>
    );
}
