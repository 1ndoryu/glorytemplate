/**
 * CampoTextarea — Textarea con label y error.
 * Reemplaza el patrón textarea + label que se repite en formularios.
 */

import type { TextareaHTMLAttributes } from 'react';

interface CampoTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    label: string;
    error?: string;
    onChange: (valor: string) => void;
}

export function CampoTextarea({
    label,
    error,
    onChange,
    className,
    ...rest
}: CampoTextareaProps): JSX.Element {
    const claseTextarea = `campoTextarea${error ? ' campoInputError' : ''}${className ? ` ${className}` : ''}`;

    return (
        <div>
            <label className="campoLabel">{label}</label>
            <textarea
                className={claseTextarea}
                onChange={e => onChange(e.target.value)}
                {...rest}
            />
            {error && <p className="campoError">{error}</p>}
        </div>
    );
}
