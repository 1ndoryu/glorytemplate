import { type InputHTMLAttributes, forwardRef } from 'react';
import '../../styles/componentes/campoTexto.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error, ...props }, ref) => {
        const claseError = error ? 'inputError' : '';
        return (
            <input
                ref={ref}
                className={`campTextoInput ${claseError} ${className}`}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
