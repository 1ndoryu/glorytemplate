/*
 * Componente: SelectorBase
 * Select reutilizable con etiqueta y error.
 * Envuelve el <select> nativo con estilos consistentes.
 */

import { type SelectHTMLAttributes, forwardRef } from 'react';
import '../../styles/componentes/campoTexto.css';

interface SelectorBaseProps extends SelectHTMLAttributes<HTMLSelectElement> {
    etiqueta?: string;
    error?: string;
    children: React.ReactNode;
}

/* sentinel-disable-next-line html-nativo-en-vez-de-componente — Este ES el componente base */
export const SelectorBase = forwardRef<HTMLSelectElement, SelectorBaseProps>(
    ({ etiqueta, error, className = '', children, ...props }, ref) => {
        const claseError = error ? 'inputError' : '';

        return (
            <div className={`contenedorCampoTexto ${className}`}>
                {etiqueta && <label className="etiquetaCampoTexto">{etiqueta}</label>}
                {/* sentinel-disable-next-line html-nativo-en-vez-de-componente — Componente base, usa nativo intencionalmente */}
                <select
                    className={`campTextoInput ${claseError}`}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                {error && <span className="errorCampoTexto">{error}</span>}
            </div>
        );
    }
);

SelectorBase.displayName = 'SelectorBase';

export default SelectorBase;
