import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: 'primario' | 'secundario' | 'outline';
    tamano?: 'pequeno' | 'mediano' | 'grande';
}

/**
 * Componente Boton reutilizable
 * Soporta variantes y tamaños configurables via props.
 */
export const Button: React.FC<ButtonProps> = ({children, className = '', variante = 'primario', tamano = 'mediano', ...props}) => {
    // Construccion de clases CSS basadas en props
    const claseVariante = `boton${variante.charAt(0).toUpperCase() + variante.slice(1)}`;
    const claseTamano = `boton${tamano.charAt(0).toUpperCase() + tamano.slice(1)}`;

    return (
        <button className={`botonBase ${claseVariante} ${claseTamano} ${className}`} {...props}>
            {children}
        </button>
    );
};
