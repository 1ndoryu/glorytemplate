/*
 * TarjetaCancionGrande — QK18/QK22
 * Tarjeta grande con portada cuadrada estilo Spotify.
 * Imagen arriba, titulo + artista abajo, play overlay en hover.
 * Play solo visible si la cancion tiene sample adjunto.
 */

import { type MouseEvent } from 'react';
import { Music, Play, Pause } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
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

    const manejarPlayClick = (e: MouseEvent) => {
        e.stopPropagation();
        onPlay(cancion);
    };

    return (
        <div
            className="tarjetaCancionGrande"
            role="article"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
        >
            <div className="tarjetaCancionGrandeImagen">
                {cancion.imagenUrl ? (
                    <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
                ) : (
                    <div className="tarjetaCancionGrandeImagenPlaceholder">
                        <Music size={32} color="var(--textoTerciario)" />
                    </div>
                )}
                {tieneSample && (
                    <BotonBase
                        variante="ghost"
                        className={`tarjetaCancionGrandeOverlay ${reproduciendo ? 'tarjetaCancionGrandeOverlayActivo' : ''}`}
                        onClick={manejarPlayClick}
                        type="button"
                        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
                    >
                        {reproduciendo
                            ? <Pause size={18} fill="currentColor" />
                            : <Play size={18} fill="currentColor" />
                        }
                    </BotonBase>
                )}
            </div>
            <div className="tarjetaCancionGrandeInfo">
                <p className="tarjetaCancionGrandeTitulo">{cancion.titulo}</p>
                <p className="tarjetaCancionGrandeArtista">
                    {cancion.artistaNombre ?? 'Artista desconocido'}
                </p>
            </div>
        </div>
    );
};
