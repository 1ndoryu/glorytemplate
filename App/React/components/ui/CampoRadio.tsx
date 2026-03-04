/**
 * CampoRadio — Opción de radio button con label y texto visual.
 * Abstrae el patrón label > input[radio] + span que se repite en grupos de filtros.
 */

import type { InputHTMLAttributes } from 'react';

interface CampoRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    /** Texto visible junto al radio */
    label: string;
    onChange: () => void;
    /** Clase CSS para el elemento <label> contenedor */
    labelClase?: string;
    /** Clase CSS para el <span> de texto */
    textoClase?: string;
}

export function CampoRadio({
    label,
    onChange,
    labelClase = 'campoRadioLabel',
    textoClase = 'campoRadioTexto',
    className = 'campoRadio',
    ...rest
}: CampoRadioProps): JSX.Element {
    return (
        <label className={labelClase}>
            <input
                type="radio"
                className={className}
                onChange={onChange}
                {...rest}
            />
            <span className={textoClase}>{label}</span>
        </label>
    );
}
