import React from 'react';

/*
 * Avatar: Componente reutilizable para mostrar avatares de usuario.
 * - Si se proporciona imagen, la muestra
 * - Si no hay imagen, genera placeholder con iniciales
 * - Soporta diferentes tamaños y variantes de gradiente
 */

type TamanoAvatar = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type VarianteAvatar = 'gradiente' | 'solido' | 'personalizado';

interface AvatarProps {
    /** URL de la imagen del avatar */
    src?: string;
    /** Nombre para generar iniciales si no hay imagen */
    nombre: string;
    /** Texto alternativo para la imagen */
    alt?: string;
    /** Tamaño del avatar */
    tamano?: TamanoAvatar;
    /** Variante de estilo para el placeholder */
    variante?: VarianteAvatar;
    /** Color de fondo personalizado (solo si variante='personalizado') */
    colorFondo?: string;
    /** Color de texto personalizado (solo si variante='personalizado') */
    colorTexto?: string;
    /** Clase CSS adicional */
    className?: string;
}

/*
 * Genera las iniciales a partir del nombre completo.
 * Toma la primera letra de cada palabra (máx 2).
 */
const generarIniciales = (nombre: string): string => {
    return nombre
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const Avatar: React.FC<AvatarProps> = ({src, nombre, alt, tamano = 'md', variante = 'gradiente', colorFondo, colorTexto, className = ''}) => {
    const iniciales = generarIniciales(nombre);
    const claseBase = `avatar avatar--${tamano}`;

    /* Estilos personalizados solo si variante es 'personalizado' */
    const estiloPersonalizado =
        variante === 'personalizado' && colorFondo
            ? {
                  background: colorFondo,
                  color: colorTexto || 'white'
              }
            : undefined;

    /* Si hay imagen, renderiza img */
    if (src) {
        return <img src={src} alt={alt || nombre} className={`${claseBase} avatarImagen ${className}`.trim()} />;
    }

    /* Si no hay imagen, renderiza placeholder con iniciales */
    return (
        <div className={`${claseBase} avatarPlaceholder avatarPlaceholder--${variante} ${className}`.trim()} style={estiloPersonalizado} title={nombre}>
            {iniciales}
        </div>
    );
};

export default Avatar;
