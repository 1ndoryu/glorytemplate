/**
 * Boton Component
 *
 * Botón reutilizable con múltiples variantes y estados.
 * Sigue el sistema de diseño CAP.
 */

import {type ReactNode, type ButtonHTMLAttributes} from 'react';
import './Boton.css';

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'ghost' | 'outline';
type TamanoBoton = 'sm' | 'md' | 'lg';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
    cargando?: boolean;
    icono?: ReactNode;
    iconoDerecha?: boolean;
    anchoCompleto?: boolean;
    children: ReactNode;
}

export function Boton({variante = 'primario', tamano = 'md', cargando = false, icono, iconoDerecha = false, anchoCompleto = false, disabled, className = '', children, ...props}: BotonProps): JSX.Element {
    const clases = ['capBoton', `capBoton--${variante}`, `capBoton--${tamano}`, anchoCompleto && 'capBoton--anchoCompleto', cargando && 'capBoton--cargando', iconoDerecha && 'capBoton--iconoDerecha', className].filter(Boolean).join(' ');

    return (
        <button className={clases} disabled={disabled || cargando} {...props}>
            {cargando && <span className="capBoton__spinner" aria-hidden="true" />}
            {icono && !cargando && <span className="capBoton__icono">{icono}</span>}
            <span className="capBoton__texto">{children}</span>
        </button>
    );
}

export default Boton;
