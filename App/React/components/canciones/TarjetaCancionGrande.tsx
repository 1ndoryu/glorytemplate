/*
 * TarjetaCancionGrande — QK18/QK22 + QL14
 * Tarjeta grande con portada cuadrada estilo Spotify.
 * Click en portada reproduce sample adjunto. Click en titulo navega a detalles.
 * Hover oscurece imagen con boton play centrado, blanco, sobre overlay.
 */

import { type MouseEvent } from 'react';
import { Music, Play, Pause } from 'lucide-react';
import type { Cancion } from '@app/types/cancion';

interface Props {
    cancion: Cancion;
    onClick: () => void;
    onLike: (cancionId: number) => void;
    onPlay: (cancion: Cancion) => void;
    reproduciendo?: boolean;
}

export const TarjetaCancionGrande = ({
    cancion,
    onClick,
    onPlay,
    reproduciendo = false,
}: Props): JSX.Element => {
    const tieneSample = !!cancion.sampleAdjunto;

    /* QL14: Click en portada reproduce sample; si no hay sample, navega a detalle */
    const manejarClickImagen = (e: MouseEvent) => {
        e.stopPropagation();
        if (tieneSample) {
            onPlay(cancion);
        } else {
            onClick();
        }
    };

    return (
        <div className="tarjetaCancionGrande" role="article" tabIndex={0}>
            {/* QL14: Portada clickeable — reproduce sample adjunto o navega si no hay */}
            <div
                className={`tarjetaCancionGrandeImagen${tieneSample ? ' tarjetaCancionGrandeImagenPlayable' : ''}`}
                onClick={manejarClickImagen}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') manejarClickImagen(e as unknown as MouseEvent); }}
                aria-label={tieneSample ? (reproduciendo ? 'Pausar' : 'Reproducir sample') : cancion.titulo}
            >
                {cancion.imagenUrl ? (
                    <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
                ) : (
                    <div className="tarjetaCancionGrandeImagenPlaceholder">
                        <Music size={32} color="var(--textoTerciario)" />
                    </div>
                )}
                {/* QL14: Overlay oscuro + boton play centrado, blanco, mas grande */}
                {tieneSample && (
                    <div className={`tarjetaCancionGrandeOverlay${reproduciendo ? ' tarjetaCancionGrandeOverlayActivo' : ''}`}>
                        {reproduciendo
                            ? <Pause size={24} fill="currentColor" />
                            : <Play size={24} fill="currentColor" />
                        }
                    </div>
                )}
            </div>
            {/* QL14: Click en titulo/info navega a detalles de la cancion */}
            <div className="tarjetaCancionGrandeInfo" onClick={onClick} role="button" tabIndex={0}>
                <p className="tarjetaCancionGrandeTitulo">{cancion.titulo}</p>
                <p className="tarjetaCancionGrandeArtista">
                    {cancion.artistaNombre ?? 'Artista desconocido'}
                </p>
            </div>
        </div>
    );
};
