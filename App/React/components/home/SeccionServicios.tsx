/**
 * Componente: SeccionServicios
 * Muestra una lista de servicios ofrecidos con imágenes y enlaces.
 * Diseño minimalista con tipografía grande.
 */
import React from 'react';
import {ArrowRight} from 'lucide-react';
import {SeccionHeader} from '../ui/SeccionHeader';
import './SeccionServicios.css';

interface Servicio {
    id: number;
    titulo: string;
    imagen: string; // URL o path
    link: string;
}

// Datos de los servicios
// Nota: Usando placeholders para las imagenes ya que no tenemos los assets exactos de la referencia.
const SERVICIOS: Servicio[] = [
    {
        id: 1,
        titulo: 'Website design',
        imagen: 'https://placehold.co/300x200/f3e8ff/151411?text=WD', // Morado suave
        link: '#'
    },
    {
        id: 2,
        titulo: 'Digital product design',
        imagen: 'https://placehold.co/300x200/f0fdf4/151411?text=DPD', // Verde suave
        link: '#'
    },
    {
        id: 3,
        titulo: 'Webflow development',
        imagen: 'https://placehold.co/300x200/ecfdf5/151411?text=Webflow', // Verde azulado
        link: '#'
    },
    {
        id: 4,
        titulo: 'Framer development',
        imagen: 'https://placehold.co/300x200/ffedd5/151411?text=Framer', // Naranja suave
        link: '#'
    },
    {
        id: 5,
        titulo: 'SEO Strategy',
        imagen: 'https://placehold.co/300x200/e0f2fe/151411?text=SEO', // Azul claro suave
        link: '#'
    },
    {
        id: 6,
        titulo: 'Brand Identity',
        imagen: 'https://placehold.co/300x200/fce7f3/151411?text=Brand', // Rosa suave
        link: '#'
    }
];

export const SeccionServicios: React.FC = () => {
    return (
        <section className="seccionServicios" id="servicios">
            <div className="serviciosContenedor">
                <SeccionHeader titulo="Services" />
                <div className="serviciosLista">
                    {SERVICIOS.map(servicio => (
                        <a key={servicio.id} href={servicio.link} className="servicioItem">
                            <div className="servicioImagenWrapper">
                                <img src={servicio.imagen} alt={servicio.titulo} className="servicioImagen" loading="lazy" />
                            </div>
                            <div className="servicioContenido">
                                <h3 className="servicioTitulo">{servicio.titulo}</h3>
                                <ArrowRight className="servicioArrow" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};
