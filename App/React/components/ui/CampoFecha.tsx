/**
 * CampoFecha — Input de tipo date con label opcional y clases condicionales.
 *
 * Especialización para inputs de fecha: soporta min, disabled,
 * focus tracking y hint formateado.
 */

import type { InputHTMLAttributes } from 'react';

interface CampoFechaProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
    label?: string;
    error?: string;
    /** onChange recibe el valor string (YYYY-MM-DD) */
    onChange: (valor: string) => void;
}

export function CampoFecha({
    label,
    error,
    onChange,
    className,
    ...rest
}: CampoFechaProps): JSX.Element {
    const claseInput = `campoInput${error ? ' campoInputError' : ''}${className ? ` ${className}` : ''}`;

    return (
        <div>
            {label && <label className="campoLabel">{label}</label>}
            <input
                type="date"
                className={claseInput}
                onChange={e => onChange(e.target.value)}
                {...rest}
            />
            {error && <p className="campoError">{error}</p>}
        </div>
    );
}
