/*
 * Componente: TarjetaColeccion — Kamples
 * Tarjeta visual tipo card para mostrar una colección.
 * Usa imagen de portada (imagenUrl o fallback de colors/).
 */

import { useCallback, type MouseEvent } from 'react';
import { Globe, Lock, Trash2, Edit3 } from 'lucide-react';
import type { Coleccion } from '@app/types';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import '../../styles/componentes/tarjetaColeccion.css';

interface TarjetaColeccionProps {
    coleccion: Coleccion;
    onClick?: (coleccion: Coleccion) => void;
    onEditar?: (coleccion: Coleccion) => void;
    onEliminar?: (coleccion: Coleccion) => void;
    className?: string;
}

export const TarjetaColeccion = ({
    coleccion,
    onClick,
    onEditar,
    onEliminar,
    className = '',
}: TarjetaColeccionProps): JSX.Element => {

    const manejarClick = useCallback(() => {
        onClick?.(coleccion);
    }, [onClick, coleccion]);

    const manejarEditar = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        onEditar?.(coleccion);
    }, [onEditar, coleccion]);

    const manejarEliminar = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        onEliminar?.(coleccion);
    }, [onEliminar, coleccion]);

    /* Imagen de portada: usa imagenUrl o fallback determinista de colors/ */
    const imagenPortada = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);

    const clases = ['tarjetaColeccion', className].filter(Boolean).join(' ');

    return (
        <div className={clases} onClick={manejarClick} role="button" tabIndex={0}>
            <div className="tarjetaColeccionPortada">
                <img src={imagenPortada} alt={coleccion.nombre} loading="lazy" />
            </div>

            <div className="tarjetaColeccionInfo">
                <div className="tarjetaColeccionCabecera">
                    <span className="tarjetaColeccionNombre">{coleccion.nombre}</span>
                    <span className="tarjetaColeccionVisibilidad" title={coleccion.esPublica ? 'Pública' : 'Privada'}>
                        {coleccion.esPublica ? <Globe size={12} /> : <Lock size={12} />}
                    </span>
                </div>
                <span className="tarjetaColeccionMeta">
                    {coleccion.totalSamples} sample{coleccion.totalSamples !== 1 ? 's' : ''}
                    {coleccion.usuario && ` · @${coleccion.usuario.username}`}
                </span>
            </div>

            <div className="tarjetaColeccionAcciones">
                {onEditar && (
                    <button
                        className="tarjetaColeccionBtn"
                        onClick={manejarEditar}
                        type="button"
                        aria-label="Editar colección"
                    >
                        <Edit3 size={14} />
                    </button>
                )}
                {onEliminar && (
                    <button
                        className="tarjetaColeccionBtn tarjetaColeccionBtnPeligro"
                        onClick={manejarEliminar}
                        type="button"
                        aria-label="Eliminar colección"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TarjetaColeccion;
