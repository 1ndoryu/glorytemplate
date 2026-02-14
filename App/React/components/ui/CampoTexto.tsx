/*
 * Componente: CampoTexto
 * Input y textarea reutilizables con etiqueta y error.
 */

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import '../../styles/componentes/campoTexto.css';

interface CampoTextoBaseProps {
    etiqueta?: string;
    error?: string;
    className?: string;
}

type CampoInputProps = CampoTextoBaseProps &
    InputHTMLAttributes<HTMLInputElement> & {
        multilínea?: false;
    };

type CampoAreaProps = CampoTextoBaseProps &
    TextareaHTMLAttributes<HTMLTextAreaElement> & {
        multilínea: true;
    };

type CampoTextoProps = CampoInputProps | CampoAreaProps;

export const CampoTexto = forwardRef<HTMLInputElement | HTMLTextAreaElement, CampoTextoProps>(
    (props, ref) => {
        const { etiqueta, error, className = '', multilínea, ...rest } = props;

        const claseError = error ? 'inputError' : '';

        return (
            <div className={`contenedorCampoTexto ${className}`}>
                {etiqueta && <label className="etiquetaCampoTexto">{etiqueta}</label>}
                {multilínea ? (
                    <textarea
                        className={`campoTextoArea ${claseError}`}
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <input
                        className={`campTextoInput ${claseError}`}
                        ref={ref as React.Ref<HTMLInputElement>}
                        {...(rest as InputHTMLAttributes<HTMLInputElement>)}
                    />
                )}
                {error && <span className="errorCampoTexto">{error}</span>}
            </div>
        );
    }
);

CampoTexto.displayName = 'CampoTexto';

export default CampoTexto;
