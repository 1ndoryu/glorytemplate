/**
 * CampoTexto — Input de texto con label y error.
 * Reemplaza el patrón input + label + error que se repite en formularios.
 */

import type { InputHTMLAttributes } from 'react';

interface CampoTextoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label: string;
    error?: string;
    onChange: (valor: string) => void;
}

export function CampoTexto({
    label,
    error,
    onChange,
    className,
    ...rest
}: CampoTextoProps): JSX.Element {
    const claseInput = `campoInput${error ? ' campoInputError' : ''}${className ? ` ${className}` : ''}`;

    return (
        <div>
            <label className="campoLabel">{label}</label>
            <input
                className={claseInput}
                onChange={e => onChange(e.target.value)}
                {...rest}
            />
            {error && <p className="campoError">{error}</p>}
        </div>
    );
}
