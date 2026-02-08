/**
 * Helper y Hook centralizados para gestión de imágenes dinámicas.
 * Todas las llamadas a import.meta.glob del proyecto se concentran aquí,
 * evitando duplicación (DRY) y facilitando el mantenimiento.
 */
import {useMemo} from 'react';

/* Catálogo: imágenes "colors" */
const modulosColors = import.meta.glob('../../../Glory/assets/images/colors/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

/* Catálogo: imágenes "showcase" */
const modulosShowcase = import.meta.glob('../../../Glory/assets/images/showcase/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

/* Catálogo: logos de clientes */
const modulosLogos = import.meta.glob('../../../Glory/assets/images/logos/*.svg', {
    eager: true,
    query: '?url',
    import: 'default'
});

/* Arrays de imágenes resueltos una sola vez */
export const IMAGENES_COLORS = Object.values(modulosColors) as string[];
export const IMAGENES_SHOWCASE = Object.values(modulosShowcase) as string[];
export const LOGOS_CLIENTES = Object.values(modulosLogos) as string[];

/* Alias retrocompatible */
export const IMAGENES_DISPONIBLES = IMAGENES_COLORS;

const PLACEHOLDER_DEFAULT = 'https://placehold.co/600x600/e8f0e6/151411?text=Service';
const PLACEHOLDER_SHOWCASE = 'https://placehold.co/400x500/e2e8f0/1e293b?text=Project';
const PLACEHOLDER_BLOG = 'https://placehold.co/600x400/e2e8f0/1e293b?text=Blog';

/**
 * Obtiene una imagen del catálogo "colors" de forma cíclica.
 */
export const obtenerImagen = (indice: number): string => {
    if (IMAGENES_COLORS.length === 0) return PLACEHOLDER_DEFAULT;
    return IMAGENES_COLORS[indice % IMAGENES_COLORS.length];
};

/**
 * Obtiene una imagen del catálogo "showcase" de forma cíclica.
 */
export const obtenerImagenShowcase = (indice: number): string => {
    if (IMAGENES_SHOWCASE.length === 0) return PLACEHOLDER_SHOWCASE;
    return IMAGENES_SHOWCASE[indice % IMAGENES_SHOWCASE.length];
};

/**
 * Obtiene una imagen "colors" determinista para blog (basada en ID).
 */
export const obtenerImagenBlog = (id: number): string => {
    if (IMAGENES_COLORS.length === 0) return PLACEHOLDER_BLOG;
    return IMAGENES_COLORS[id % IMAGENES_COLORS.length];
};

/**
 * Hook para usar las imágenes "colors" en componentes.
 */
export const useImagenes = () => {
    const imagenes = useMemo(() => IMAGENES_COLORS, []);

    return {
        imagenes,
        obtenerImagen
    };
};
