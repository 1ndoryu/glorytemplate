import React from 'react';
import {ArrowRight} from 'lucide-react';
import {Badge} from './Badge';
import {Servicio} from '../../types/servicios';
import './ServiceCard.css';

interface ServiceCardProps {
    servicio: Servicio;
    variant?: 'simple' | 'detailed'; /* 'simple' para Home/Relacionados, 'detailed' para Pagina Servicios */
}

export const ServiceCard: React.FC<ServiceCardProps> = ({servicio, variant = 'simple'}) => {
    if (variant === 'detailed') {
        return (
            <a href={servicio.link} className="serviceCard detailed">
                <div className="cardImageWrapper">
                    <img src={servicio.imagen} alt={servicio.titulo} className="cardImage" loading="lazy" />
                    <div className="cardOverlay" />
                </div>
                <div className="cardContent">
                    <h3 className="cardTitle">{servicio.titulo}</h3>
                    <p className="cardDescription">{servicio.descripcion}</p>
                    {servicio.categorias && (
                        <div className="cardTags">
                            {servicio.categorias.map((cat, idx) => (
                                <Badge key={idx} label={cat} />
                            ))}
                        </div>
                    )}
                </div>
            </a>
        );
    }

    /* Variante simple (Home / Relacionados) */
    return (
        <a href={servicio.link} className="serviceCard simple">
            <div className="simpleImageWrapper">
                <img src={servicio.imagen} alt={servicio.titulo} className="simpleImage" loading="lazy" />
            </div>
            <div className="simpleContent">
                <h3 className="simpleTitle">{servicio.titulo}</h3>
                <ArrowRight className="simpleArrow" />
            </div>
        </a>
    );
};
