/*
 * Componente: CampoTexto
 * Input y textarea reutilizables con etiqueta y error.
 * Variantes: 'minimal' (border-bottom, default) y 'bordado' (border completo + padding + radius).
 */

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import '../../styles/componentes/campoTexto.css';

type VarianteCampo = 'minimal' | 'bordado';

interface CampoTextoBaseProps {
    etiqueta?: string;
    error?: string;
    className?: string;
    variante?: VarianteCampo;
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
        const { etiqueta, error, className = '', multilínea, variante = 'minimal', ...rest } = props;

        const claseError = error ? 'inputError' : '';
        const claseVariante = variante === 'bordado' ? 'campoBordado' : '';

        return (
            <div className={`contenedorCampoTexto ${className}`}>
                {etiqueta && <label className="etiquetaCampoTexto">{etiqueta}</label>}
                {multilínea ? (
                    <textarea
                        className={`campoTextoArea ${claseVariante} ${claseError}`}
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <input
                        className={`campTextoInput ${claseVariante} ${claseError}`}
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
