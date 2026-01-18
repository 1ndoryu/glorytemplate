import React from 'react';

/*
 * Contenedor - Componente envolvente para secciones y contenido
 *
 * Estandariza anchos máximos, paddings y centrado.
 * Reemplaza: contenedor, contenedorTexto, contenedorFlush, contenedorFull
 */

type VarianteContenedor = 'normal' | 'texto' | 'flush' | 'full';

interface ContenedorProps {
    children: React.ReactNode;
    variante?: VarianteContenedor;
    className?: string;
    id?: string;
    como?: keyof JSX.IntrinsicElements;
}

const mapeoVariante: Record<VarianteContenedor, string> = {
    normal: 'contenedor',
    texto: 'contenedor contenedorTexto',
    flush: 'contenedor contenedorFlush',
    full: 'contenedorFull'
};

export const Contenedor: React.FC<ContenedorProps> = ({children, variante = 'normal', className = '', id, como: Componente = 'div'}) => {
    const clases = [mapeoVariante[variante], className].filter(Boolean).join(' ');

    return (
        <Componente id={id} className={clases}>
            {children}
        </Componente>
    );
};

export default Contenedor;
