/**
 * Boton — Componente atómico de botón.
 *
 * Variantes: primario, secundario, enlace, atras.
 * Todo botón del proyecto debe pasar por este componente.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VarianteBoton = 'primario' | 'secundario' | 'enlace' | 'atras';

const CLASE_POR_VARIANTE: Record<VarianteBoton, string> = {
    primario: 'botonPrimario',
    secundario: 'botonSecundario',
    enlace: 'mensajeExitoEnlace',
    atras: 'reservarBotonAtras',
};

interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variante?: VarianteBoton;
    children: ReactNode;
    /** Clases CSS adicionales a combinar con la variante */
    claseExtra?: string;
}

export function Boton({
    variante = 'primario',
    children,
    claseExtra,
    className,
    ...rest
}: BotonProps): JSX.Element {
    const claseVariante = CLASE_POR_VARIANTE[variante];
    const claseFinal = [claseVariante, claseExtra, className].filter(Boolean).join(' ');

    return (
        <button className={claseFinal} {...rest}>
            {children}
        </button>
    );
}
