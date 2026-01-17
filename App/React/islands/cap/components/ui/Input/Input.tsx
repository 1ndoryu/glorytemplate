/**
 * Input Component
 *
 * Campo de entrada reutilizable con validación y estados.
 */

import {type InputHTMLAttributes, forwardRef} from 'react';
import './Input.css';

type TipoInput = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    tipo?: TipoInput;
    etiqueta?: string;
    error?: string;
    ayuda?: string;
    icono?: React.ReactNode;
    iconoDerecha?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({tipo = 'text', etiqueta, error, ayuda, icono, iconoDerecha, className = '', id, disabled, ...props}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const clasesWrapper = ['capInput', error && 'capInput--error', disabled && 'capInput--deshabilitado', icono && 'capInput--conIcono', iconoDerecha && 'capInput--conIconoDerecha', className].filter(Boolean).join(' ');

    return (
        <div className={clasesWrapper}>
            {etiqueta && (
                <label htmlFor={inputId} className="capInput__etiqueta">
                    {etiqueta}
                </label>
            )}

            <div className="capInput__contenedor">
                {icono && <span className="capInput__icono capInput__icono--izquierda">{icono}</span>}

                <input ref={ref} type={tipo} id={inputId} className="capInput__campo" disabled={disabled} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : ayuda ? `${inputId}-ayuda` : undefined} {...props} />

                {iconoDerecha && <span className="capInput__icono capInput__icono--derecha">{iconoDerecha}</span>}
            </div>

            {error && (
                <span id={`${inputId}-error`} className="capInput__error" role="alert">
                    {error}
                </span>
            )}

            {ayuda && !error && (
                <span id={`${inputId}-ayuda`} className="capInput__ayuda">
                    {ayuda}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
