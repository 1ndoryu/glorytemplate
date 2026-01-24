import React from 'react';

/*
 * Etiqueta - Componente para badges/tags de categorías
 *
 * Variantes: default, categoria, precio, estado, destacado
 * Tamaños: xs, sm, md
 *
 * Reemplaza: tarjetaEtiqueta, precioEtiqueta, servicioCategoria, blogEtiqueta
 */

type VarianteEtiqueta = 'default' | 'categoria' | 'precio' | 'estado' | 'destacado' | 'exito' | 'alerta' | 'info' | 'neutro';
type TamanoEtiqueta = 'xs' | 'sm' | 'md';

interface EtiquetaProps {
    children: React.ReactNode;
    variante?: VarianteEtiqueta;
    tamano?: TamanoEtiqueta;
    className?: string;
    icono?: React.ReactNode;
}

const mapeoTamano: Record<TamanoEtiqueta, string> = {
    xs: 'etiquetaXs',
    sm: 'etiquetaSm',
    md: 'etiquetaMd'
};

const mapeoVariante: Record<VarianteEtiqueta, string> = {
    default: 'etiquetaDefault',
    categoria: 'etiquetaCategoria',
    precio: 'etiquetaPrecio',
    estado: 'etiquetaEstado',
    destacado: 'etiquetaDestacado',
    exito: 'etiquetaExito',
    alerta: 'etiquetaAlerta',
    info: 'etiquetaInfo',
    neutro: 'etiquetaNeutro'
};

export const Etiqueta: React.FC<EtiquetaProps> = ({children, variante = 'default', tamano = 'sm', className = '', icono}) => {
    const clases = ['etiqueta', mapeoTamano[tamano], mapeoVariante[variante], className].filter(Boolean).join(' ');

    return (
        <span className={clases}>
            {icono && <span className="etiquetaIcono">{icono}</span>}
            {children}
        </span>
    );
};

export default Etiqueta;
