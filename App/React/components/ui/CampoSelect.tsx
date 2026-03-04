/**
 * CampoSelect — Select con label y error.
 * Reemplaza el patrón select + label en formularios.
 */

import type { SelectHTMLAttributes, ReactNode } from 'react';

interface CampoSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label: string;
    error?: string;
    onChange: (valor: string) => void;
    children: ReactNode;
}

export function CampoSelect({
    label,
    error,
    onChange,
    children,
    className,
    ...rest
}: CampoSelectProps): JSX.Element {
    const claseSelect = `campoInput${error ? ' campoInputError' : ''}${className ? ` ${className}` : ''}`;

    return (
        <div>
            <label className="campoLabel">{label}</label>
            <select
                className={claseSelect}
                onChange={e => onChange(e.target.value)}
                {...rest}
            >
                {children}
            </select>
            {error && <p className="campoError">{error}</p>}
        </div>
    );
}
