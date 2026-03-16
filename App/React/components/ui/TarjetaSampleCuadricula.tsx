/*
 * TarjetaSampleCuadricula — Kamples (C291, C326)
 * Versión compacta tipo cuadrícula: portada con play overlay, nombre 2 líneas.
 * C326: Click reproduce audio, right-click abre menú contextual.
 */

import { useCallback, type MouseEvent } from 'react';
import { Play, Pause } from 'lucide-react';
import { obtenerImagenColor } from '../../services/imagenesColor';
import { useSamplePreview } from '../../hooks/useSamplePreview';
import { useNavigationStore } from '@/core/router';
import type { SampleResumen } from '../../types';

interface PropsTarjetaCuadricula {
    sample: SampleResumen;
    onClickTitulo?: (sample: SampleResumen) => void;
    onMenu?: (e: MouseEvent, sample: SampleResumen) => void;
}

export const TarjetaSampleCuadricula = ({ sample, onClickTitulo, onMenu }: PropsTarjetaCuadricula): JSX.Element => {
    const imagenPortada = sample.imagenUrl || obtenerImagenColor(sample.id);
    const { reproduciendo, togglePlay } = useSamplePreview(sample.id, sample.rutaPreview);

    /* Click en la tarjeta → play/pause preview */
    const manejarClick = useCallback(() => {
        togglePlay();
    }, [togglePlay]);

    /* Right-click → menú contextual */
    const manejarContextMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMenu?.(e, sample);
    }, [onMenu, sample]);

    /* Click en el nombre → panel (si callback) o navegar a detalle */
    const manejarClickTitulo = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        if (onClickTitulo) {
            onClickTitulo(sample);
        } else {
            useNavigationStore.getState().navegar(`/sample/${sample.slug}/`);
        }
    }, [onClickTitulo, sample]);

    return (
        <div
            className={`tarjetaCuadricula ${reproduciendo ? 'tarjetaCuadriculaReproduciendo' : ''}`}
            onClick={manejarClick}
            onContextMenu={manejarContextMenu}
            role="button"
            tabIndex={0}
        >
            <div className="tarjetaCuadriculaPortada">
                <img
                    className="tarjetaCuadriculaImg"
                    src={imagenPortada}
                    alt={sample.titulo}
                    loading="lazy"
                    draggable={false}
                />
                {/* Overlay play/pause visible en hover y durante reproducción */}
                <div className={`tarjetaCuadriculaOverlay ${reproduciendo ? 'tarjetaCuadriculaOverlayActivo' : ''}`}>
                    {reproduciendo ? <Pause size={28} /> : <Play size={28} />}
                </div>
            </div>
            <span className="tarjetaCuadriculaNombre" title={sample.titulo} onClick={manejarClickTitulo}>
                {sample.titulo}
            </span>
        </div>
    );
};
