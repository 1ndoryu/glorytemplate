/*
 * Componente: Textarea
 * Área de texto reutilizable con estilos consistentes.
 * Envuelve el <textarea> nativo con clases del sistema de diseño.
 */

import { type TextareaHTMLAttributes, forwardRef } from 'react';
import '../../styles/componentes/campoTexto.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

/* sentinel-disable-next-line html-nativo-en-vez-de-componente — Este ES el componente base */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', error, ...props }, ref) => {
        const claseError = error ? 'inputError' : '';
        return (
            /* sentinel-disable-next-line html-nativo-en-vez-de-componente — Componente base, usa nativo intencionalmente */
            <textarea
                ref={ref}
                className={`campTextoInput ${claseError} ${className}`}
                {...props}
            />
        );
    }
);

Textarea.displayName = 'Textarea';
