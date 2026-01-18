import React from 'react';

/*
 * Icono: Componente para renderizar iconos SVG de forma consistente.
 * - Encapsula iconos comunes del proyecto
 * - Permite tamaño y color personalizables
 * - Todos los iconos usan currentColor por defecto
 */

type TamanoIcono = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type NombreIcono = 'flecha-derecha' | 'flecha-izquierda' | 'cerrar' | 'menu' | 'buscar' | 'check' | 'estrella' | 'usuario' | 'mas' | 'menos' | 'externo';

interface IconoProps {
    /** Nombre del icono a mostrar */
    nombre: NombreIcono;
    /** Tamaño del icono */
    tamano?: TamanoIcono;
    /** Color del icono (usa currentColor si no se especifica) */
    color?: string;
    /** Clases CSS adicionales */
    className?: string;
    /** Etiqueta accesible para lectores de pantalla */
    label?: string;
}

/* Mapeo de tamaños a píxeles */
const tamanos: Record<TamanoIcono, number> = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
};

/*
 * Catálogo de paths SVG para cada icono.
 * Todos diseñados para viewBox="0 0 24 24"
 */
const iconos: Record<NombreIcono, React.ReactNode> = {
    'flecha-derecha': <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />,
    'flecha-izquierda': <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />,
    cerrar: <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />,
    menu: (
        <>
            <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />
        </>
    ),
    buscar: (
        <>
            <circle cx="11" cy="11" r="7" strokeWidth="2" fill="none" stroke="currentColor" />
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />
        </>
    ),
    check: <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />,
    estrella: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />,
    usuario: (
        <>
            <circle cx="12" cy="8" r="4" strokeWidth="2" fill="none" stroke="currentColor" />
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />
        </>
    ),
    mas: <path d="M12 5v14m-7-7h14" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />,
    menos: <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />,
    externo: (
        <>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />
            <path d="M15 3h6v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
            <path d="M10 14L21 3" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor" />
        </>
    )
};

export const Icono: React.FC<IconoProps> = ({nombre, tamano = 'md', color, className = '', label}) => {
    const size = tamanos[tamano];

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`icono icono--${tamano} ${className}`.trim()} style={color ? {color} : undefined} role={label ? 'img' : 'presentation'} aria-label={label} aria-hidden={!label}>
            {iconos[nombre]}
        </svg>
    );
};

export default Icono;
