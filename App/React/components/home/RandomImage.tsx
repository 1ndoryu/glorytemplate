import React, {useState, useEffect} from 'react';
import './RandomImage.css';

interface RandomImageProps {
    image: string;
    className?: string; // Permitir clase extra opcional
    alt?: string;
}

export const RandomImage: React.FC<RandomImageProps> = ({image, className = '', alt = 'Fondo aleatorio'}) => {
    const [cargando, setCargando] = useState<boolean>(true);

    useEffect(() => {
        if (image) {
            const img = new Image();
            img.src = image;
            img.onload = () => setCargando(false);
        } else {
            setCargando(false);
        }
    }, [image]);

    return <div className={`imagenAleatoriaContenedor ${className}`}>{cargando ? <div className="imagenAleatoriaCargando" /> : <img src={image} alt={alt} className="imagenAleatoria" loading="eager" />}</div>;
};
