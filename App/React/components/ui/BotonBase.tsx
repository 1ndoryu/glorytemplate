/*
 * Componente: BotonBase
 * Boton reutilizable con variantes y tamaños.
 * Variantes: primario, secundario, ghost, peligro
 * Tamaños: sm, md, ninguno (sin padding/height forzado)
 */

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import '../../styles/componentes/botonBase.css';

type VarianteBoton = 'primario' | 'secundario' | 'ghost' | 'peligro';
type TamanoBoton = 'sm' | 'md' | 'ninguno';

interface BotonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
    cargando?: boolean;
    soloIcono?: boolean;
    anchoCompleto?: boolean;
    children?: ReactNode;
}

const mapaVariante: Record<VarianteBoton, string> = {
    primario: 'variantePrimario',
    secundario: 'varianteSecundario',
    ghost: 'varianteGhost',
    peligro: 'variantePeligro',
};

const mapaTamano: Record<TamanoBoton, string> = {
    sm: 'tamanoSm',
    md: 'tamanoMd',
    ninguno: '',
};

export const BotonBase = ({
    variante = 'primario',
    tamano = 'md',
    cargando = false,
    soloIcono = false,
    anchoCompleto = false,
    children,
    className = '',
    disabled,
    ...props
}: BotonBaseProps): JSX.Element => {
    const clases = [
        'botonBase',
        mapaVariante[variante],
        mapaTamano[tamano],
        soloIcono ? 'soloIcono' : '',
        anchoCompleto ? 'anchoCompleto' : '',
        cargando ? 'cargando' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        /* sentinel-disable-next-line html-nativo-en-vez-de-componente — Este ES el componente base */
        <button
            className={clases}
            disabled={disabled || cargando}
            {...props}
        >
            {children}
        </button>
    );
};

export default BotonBase;
