/**
 * Componente: SeccionShowcase
 * Muestra una lista de proyectos organizados por categoría.
 * Diseño: Categoría a la izquierda, 3 proyectos a la derecha.
 */
import React from 'react';
import {Badge} from '../ui/Badge';
import {SeccionHeader} from '../ui/SeccionHeader';
import './SeccionShowcase.css';

// Importación dinámica de imágenes (reutilizando la lógica de CarruselShowcase)
const modulosImagenes = import.meta.glob('../../../../Glory/assets/images/showcase/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

const IMAGENES_SHOWCASE = Object.values(modulosImagenes) as string[];

interface Proyecto {
    id: number;
    titulo: string;
    cliente: string; // O subtítulo
    categorias: string; // Texto simple o array
    imagen: string;
}

// Estructura de categorías
interface CategoriaShowcase {
    titulo: string;
    proyectos: Proyecto[];
}

// Datos de ejemplo
const CATEGORIAS_SHOWCASE: CategoriaShowcase[] = [
    {
        titulo: 'Website & Digital Experiences',
        proyectos: [
            {
                id: 1,
                titulo: 'AUREVA',
                cliente: 'LUXURY INTERIOR DESIGN',
                categorias: 'Branding, Web design',
                imagen: IMAGENES_SHOWCASE[0] || 'https://placehold.co/400x500/e2e8f0/1e293b?text=Project+1'
            },
            {
                id: 2,
                titulo: 'VENTURE',
                cliente: 'DIGITAL PRODUCT DESIGN',
                categorias: 'Branding, Web design',
                imagen: IMAGENES_SHOWCASE[1] || 'https://placehold.co/400x400/e2e8f0/1e293b?text=Project+2'
            },
            {
                id: 3,
                titulo: 'PAYBY',
                cliente: 'BAKING MOBILE APP',
                categorias: 'App Design, Fintech',
                imagen: IMAGENES_SHOWCASE[2] || 'https://placehold.co/400x600/e2e8f0/1e293b?text=Project+3'
            }
        ]
    },
    {
        titulo: 'Brand Identity & Strategy',
        proyectos: [
            {
                id: 4,
                titulo: 'KINETIC',
                cliente: 'EV STARTUP',
                categorias: 'Strategy, Identity',
                imagen: IMAGENES_SHOWCASE[3] || 'https://placehold.co/400x350/e2e8f0/1e293b?text=Project+4'
            },
            {
                id: 5,
                titulo: 'LUMOS',
                cliente: 'SMART LIGHTING',
                categorias: 'Packaging, Web',
                imagen: IMAGENES_SHOWCASE[4] || 'https://placehold.co/400x550/e2e8f0/1e293b?text=Project+5'
            },
            {
                id: 6,
                titulo: 'ELEVATE',
                cliente: 'FITNESS BRAND',
                categorias: 'Social, Campaign',
                imagen: IMAGENES_SHOWCASE[5] || 'https://placehold.co/400x450/e2e8f0/1e293b?text=Project+6'
            }
        ]
    }
];

export const SeccionShowcase = (): JSX.Element => {
    return (
        <section className="seccionShowcase">
            <div className="showcaseContenedor">
                <SeccionHeader titulo="Selected Work" />

                {/* Iteramos sobre las categorías */}
                {CATEGORIAS_SHOWCASE.map((categoria, index) => (
                    <div className="showcaseFila" key={index}>
                        {/* Columna Izquierda: Categoría */}
                        <div className="showcaseCategoria">
                            <h2 className="showcaseTituloCategoria">{categoria.titulo}</h2>
                        </div>

                        {/* Columna Derecha: Grid de Proyectos */}
                        <div className="showcaseGridProyectos">
                            {categoria.proyectos.map(proyecto => (
                                <div key={proyecto.id} className="proyectoCard">
                                    <div className="proyectoImagenWrapper">
                                        <img src={proyecto.imagen} alt={proyecto.titulo} className="proyectoImagen" loading="lazy" />
                                    </div>
                                    <div className="proyectoInfo">
                                        <h3 className="proyectoTitulo">
                                            {proyecto.titulo} <span style={{fontWeight: 400, color: 'var(--text-tertiary)'}}>- {proyecto.cliente}</span>
                                        </h3>
                                        <span className="proyectoSubtitulo">{proyecto.categorias}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
