/*
 * Componente: CampoTexto
 * Input y textarea reutilizables con etiqueta y error.
 * Variantes: 'minimal' (border-bottom, default), 'bordado' (border completo) y 'desnudo' (sin estilos base).
 */

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import '../../styles/componentes/campoTexto.css';

type VarianteCampo = 'minimal' | 'bordado' | 'desnudo';

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
        /* F15: 'desnudo' omite clases base — el caller controla 100% el estilo via className */
        const esDesnudo = variante === 'desnudo';
        const claseVariante = variante === 'bordado' ? 'campoBordado' : '';

        return (
            <div className={`contenedorCampoTexto ${className}`}>
                {etiqueta && <label className="etiquetaCampoTexto">{etiqueta}</label>}
                {multilínea ? (
                    <textarea
                        className={esDesnudo ? claseError : `campoTextoArea ${claseVariante} ${claseError}`}
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <input
                        className={esDesnudo ? claseError : `campTextoInput ${claseVariante} ${claseError}`}
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
