/**
 * Tarjeta Component
 *
 * Contenedor con sombra y bordes redondeados.
 * Base para paneles, cards y secciones.
 */

import {type ReactNode, type HTMLAttributes} from 'react';
import './Tarjeta.css';

type VarianteTarjeta = 'default' | 'elevada' | 'outline' | 'sutil';

interface TarjetaProps extends HTMLAttributes<HTMLDivElement> {
    variante?: VarianteTarjeta;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactiva?: boolean;
    children: ReactNode;
}

export function Tarjeta({variante = 'default', padding = 'md', interactiva = false, className = '', children, ...props}: TarjetaProps): JSX.Element {
    const clases = ['capTarjeta', `capTarjeta--${variante}`, `capTarjeta--padding-${padding}`, interactiva && 'capTarjeta--interactiva', className].filter(Boolean).join(' ');

    return (
        <div className={clases} {...props}>
            {children}
        </div>
    );
}

/* Subcomponentes para estructura común */
interface TarjetaHeaderProps {
    children: ReactNode;
    className?: string;
}

export function TarjetaHeader({children, className = ''}: TarjetaHeaderProps): JSX.Element {
    return <div className={`capTarjeta__header ${className}`}>{children}</div>;
}

export function TarjetaBody({children, className = ''}: TarjetaHeaderProps): JSX.Element {
    return <div className={`capTarjeta__body ${className}`}>{children}</div>;
}

export function TarjetaFooter({children, className = ''}: TarjetaHeaderProps): JSX.Element {
    return <div className={`capTarjeta__footer ${className}`}>{children}</div>;
}

export default Tarjeta;
