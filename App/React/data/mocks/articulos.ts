import {ArticuloBlog} from '../../components/landing';
import {refAUrl} from '../../utils/imagenUtils';

/*
 * Datos de ejemplo para el blog.
 * Usa sistema de referencias (alias::archivo) para imágenes.
 *
 * TO-DO: Migrar a useGloryImages para obtener imágenes dinámicamente.
 */

/* Referencias de imágenes usando alias */
const IMAGENES_ARTICULOS = {
    diseno: 'colors::47252f8c0c7f5dae7657ca6eed05eeca.jpg',
    tecnologia: 'colors::c5f3015667280079a5a6299c0ac16e83.jpg',
    desarrollo: 'colors::3450083cb428563c30f4544d5e5a7e82.jpg'
};

export const articulosEjemplo: ArticuloBlog[] = [
    {
        id: 'articulo-1',
        titulo: 'El futuro del diseño web: tendencias que dominarán 2026',
        extracto: 'Exploramos las tecnologías emergentes y patrones de diseño que están redefiniendo la experiencia digital moderna.',
        categoria: 'Diseño',
        imagen: refAUrl(IMAGENES_ARTICULOS.diseno)!,
        imagenRef: IMAGENES_ARTICULOS.diseno,
        fecha: '15 Ene 2026',
        enlace: '/blog/futuro-diseno-web-2026'
    },
    {
        id: 'articulo-2',
        titulo: 'Cómo la IA está transformando el desarrollo de software',
        extracto: 'Desde la generación de código hasta la automatización de pruebas, la inteligencia artificial cambia las reglas del juego.',
        categoria: 'Tecnología',
        imagen: refAUrl(IMAGENES_ARTICULOS.tecnologia)!,
        imagenRef: IMAGENES_ARTICULOS.tecnologia,
        fecha: '12 Ene 2026',
        enlace: '/blog/ia-desarrollo-software'
    },
    {
        id: 'articulo-3',
        titulo: 'Guía completa: Optimización de rendimiento en React',
        extracto: 'Técnicas avanzadas para crear aplicaciones React ultra-rápidas y escalables.',
        categoria: 'Desarrollo',
        imagen: refAUrl(IMAGENES_ARTICULOS.desarrollo)!,
        imagenRef: IMAGENES_ARTICULOS.desarrollo,
        fecha: '8 Ene 2026',
        enlace: '/blog/optimizacion-react'
    }
];
