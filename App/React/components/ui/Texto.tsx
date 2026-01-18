import React from 'react';

/*
 * Texto: Componente de tipografía semántica.
 * - Permite definir tipo (h1-h6, p, span) con variante visual independiente
 * - Facilita consistencia tipográfica en todo el proyecto
 * - Soporta peso, color y alineación personalizables
 */

type VarianteTexto = 'display' /* Títulos grandes de sección */ | 'h1' | 'h2' | 'h3' | 'h4' | 'body' /* Texto de párrafo normal */ | 'bodyGrande' /* Texto de párrafo más grande */ | 'caption' /* Texto pequeño descriptivo */ | 'etiqueta' /* Texto muy pequeño, mayúsculas */ | 'mono'; /* Texto monoespaciado */

type ColorTexto = 'activo' | 'normal' | 'secundario' | 'apagado' | 'muyApagado' | 'acento' | 'inherit';

type AlineacionTexto = 'izquierda' | 'centro' | 'derecha';
type PesoTexto = 'normal' | 'medio' | 'semibold' | 'bold';

interface TextoProps {
    /** Contenido del texto */
    children: React.ReactNode;
    /** Variante visual del texto */
    variante?: VarianteTexto;
    /** Elemento HTML a renderizar (semántico) */
    como?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';
    /** Color del texto */
    color?: ColorTexto;
    /** Peso de la fuente */
    peso?: PesoTexto;
    /** Alineación del texto */
    alineacion?: AlineacionTexto;
    /** Clases CSS adicionales */
    className?: string;
    /** ID para el elemento */
    id?: string;
    /** For para labels */
    htmlFor?: string;
}

export const Texto: React.FC<TextoProps> = ({children, variante = 'body', como, color = 'normal', peso, alineacion, className = '', id, htmlFor}) => {
    /* Determina el elemento HTML a usar */
    const determinarElemento = (): keyof JSX.IntrinsicElements => {
        if (como) return como;

        switch (variante) {
            case 'display':
            case 'h1':
                return 'h1';
            case 'h2':
                return 'h2';
            case 'h3':
                return 'h3';
            case 'h4':
                return 'h4';
            default:
                return 'p';
        }
    };

    const Elemento = determinarElemento() as keyof JSX.IntrinsicElements;

    /* Construye las clases CSS */
    const clases = ['texto', `texto--${variante}`, `texto--${color}`, peso && `texto--${peso}`, alineacion && `texto--${alineacion}`, className].filter(Boolean).join(' ');

    return (
        <Elemento className={clases} id={id} htmlFor={htmlFor as any}>
            {children}
        </Elemento>
    );
};

export default Texto;
