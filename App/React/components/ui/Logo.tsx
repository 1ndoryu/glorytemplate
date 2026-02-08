/**
 * Componente: Logo
 * Centraliza la definición del logo del sitio.
 * Actualmente es un círculo SVG simple.
 */
import React from 'react';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export const Logo: React.FC<LogoProps> = ({className = '', width = 24, height = 24}) => {
    return (
        <svg viewBox="0 0 24 24" className={className} width={width} height={height} aria-hidden="true" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
};
