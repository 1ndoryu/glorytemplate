/*
 * Datos de showcase centralizados.
 * Proyectos organizados por categoría para la sección de portfolio.
 */
import {CategoriaShowcase} from '../types/contenido';
import {obtenerImagenShowcase} from '../hooks/useImagenes';

export const CATEGORIAS_SHOWCASE: CategoriaShowcase[] = [
    {
        titulo: 'Website & Digital Experiences',
        proyectos: [
            {
                id: 1,
                titulo: 'AUREVA',
                cliente: 'LUXURY INTERIOR DESIGN',
                categorias: 'Branding, Web design',
                imagen: obtenerImagenShowcase(0)
            },
            {
                id: 2,
                titulo: 'VENTURE',
                cliente: 'DIGITAL PRODUCT DESIGN',
                categorias: 'Branding, Web design',
                imagen: obtenerImagenShowcase(1)
            },
            {
                id: 3,
                titulo: 'PAYBY',
                cliente: 'BAKING MOBILE APP',
                categorias: 'App Design, Fintech',
                imagen: obtenerImagenShowcase(2)
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
                imagen: obtenerImagenShowcase(3)
            },
            {
                id: 5,
                titulo: 'LUMOS',
                cliente: 'SMART LIGHTING',
                categorias: 'Packaging, Web',
                imagen: obtenerImagenShowcase(4)
            },
            {
                id: 6,
                titulo: 'ELEVATE',
                cliente: 'FITNESS BRAND',
                categorias: 'Social, Campaign',
                imagen: obtenerImagenShowcase(5)
            }
        ]
    }
];
