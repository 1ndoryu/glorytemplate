import React from 'react';

/*
 * Tarjeta - Componente base para tarjetas reutilizables
 *
 * Base abstracta que puede extenderse para:
 * - TarjetaServicio
 * - TarjetaProyecto
 * - TarjetaResena
 * - TarjetaBlog
 *
 * Reemplaza estructuras repetidas de tarjeta con estilos inline
 */

type RatioTarjeta = '16-10' | '16-9' | '4-3' | '1-1' | 'auto';

interface TarjetaProps {
    children: React.ReactNode;
    interactiva?: boolean;
    animada?: boolean;
    visible?: boolean;
    delay?: number;
    ratio?: RatioTarjeta;
    className?: string;
    onClick?: () => void;
}

const mapeoRatio: Record<RatioTarjeta, string> = {
    '16-10': 'tarjetaRatio16-10',
    '16-9': 'tarjetaRatio16-9',
    '4-3': 'tarjetaRatio4-3',
    '1-1': 'tarjetaRatio1-1',
    auto: ''
};

export const Tarjeta: React.FC<TarjetaProps> = ({children, interactiva = false, animada = false, visible = true, delay = 0, ratio = 'auto', className = '', onClick}) => {
    const clases = ['tarjeta', interactiva && 'tarjetaInteractiva', animada && 'tarjetaAnimada', animada && visible && 'tarjetaAnimadaVisible', mapeoRatio[ratio], className].filter(Boolean).join(' ');

    const estiloConDelay = animada && delay > 0 ? ({'--delay': `${delay}s`} as React.CSSProperties) : undefined;

    return (
        <article className={clases} style={estiloConDelay} onClick={onClick} role={interactiva ? 'button' : undefined} tabIndex={interactiva ? 0 : undefined}>
            {children}
        </article>
    );
};

/* Sub-componentes para estructura interna de tarjetas */
interface TarjetaSeccionProps {
    children: React.ReactNode;
    className?: string;
}

export const TarjetaImagen: React.FC<{
    src: string;
    alt: string;
    className?: string;
}> = ({src, alt, className = ''}) => (
    <div className={`tarjetaImagenContenedor ${className}`}>
        <img src={src} alt={alt} className="tarjetaImagen" loading="lazy" />
    </div>
);

export const TarjetaOverlay: React.FC<TarjetaSeccionProps> = ({children, className = ''}) => <div className={`tarjetaOverlay ${className}`}>{children}</div>;

export const TarjetaCuerpo: React.FC<TarjetaSeccionProps & {grande?: boolean}> = ({children, grande = false, className = ''}) => <div className={`tarjetaCuerpo ${grande ? 'tarjetaCuerpoLg' : ''} ${className}`}>{children}</div>;

export const TarjetaHeader: React.FC<TarjetaSeccionProps> = ({children, className = ''}) => <header className={`tarjetaHeader ${className}`}>{children}</header>;

export const TarjetaFooter: React.FC<TarjetaSeccionProps> = ({children, className = ''}) => <footer className={`tarjetaFooter ${className}`}>{children}</footer>;

export default Tarjeta;
