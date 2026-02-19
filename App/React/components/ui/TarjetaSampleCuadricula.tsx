/*
 * TarjetaSampleCuadricula — Kamples (C291)
 * Versión compacta tipo cuadrícula: solo muestra portada y nombre.
 * Se usa en el Explorador cuando la vista está en modo cuadrícula.
 */

import { useCallback } from 'react';
import { obtenerImagenColor } from '../../services/imagenesColor';
import type { SampleResumen } from '../../types';

interface PropsTarjetaCuadricula {
    sample: SampleResumen;
    onClickTitulo?: (sample: SampleResumen) => void;
}

export const TarjetaSampleCuadricula = ({ sample, onClickTitulo }: PropsTarjetaCuadricula): JSX.Element => {
    const imagenPortada = sample.imagenUrl || obtenerImagenColor(sample.id);

    const manejarClick = useCallback(() => {
        onClickTitulo?.(sample);
    }, [onClickTitulo, sample]);

    return (
        <div className="tarjetaCuadricula" onClick={manejarClick} role="button" tabIndex={0}>
            <div className="tarjetaCuadriculaPortada">
                <img
                    className="tarjetaCuadriculaImg"
                    src={imagenPortada}
                    alt={sample.titulo}
                    loading="lazy"
                />
            </div>
            <span className="tarjetaCuadriculaNombre" title={sample.titulo}>
                {sample.titulo}
            </span>
        </div>
    );
};
