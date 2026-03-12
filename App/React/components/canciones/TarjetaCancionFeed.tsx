/*
 * TarjetaCancionFeed — C812
 * Tarjeta horizontal para feed de canciones, formato similar a TarjetaSample.
 * Imagen izquierda, info + sampleos count centro, acciones derecha (like + menu).
 * Click en titulo navega a /cancion/{slug}.
 */

import { type MouseEvent } from 'react';
import { Music, Heart, MoreHorizontal } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import type { Cancion } from '@app/types/cancion';

export interface TarjetaCancionFeedProps {
    cancion: Cancion;
    onClick: () => void;
    onLike: (cancionId: number) => void;
    onMenu: (e: MouseEvent, cancion: Cancion) => void;
}

export const TarjetaCancionFeed = ({ cancion, onClick, onLike, onMenu }: TarjetaCancionFeedProps): JSX.Element => {
    const manejarLike = (e: MouseEvent) => {
        e.stopPropagation();
        onLike(cancion.id);
    };

    const manejarMenu = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onMenu(e, cancion);
    };

    const href = `/cancion/${cancion.slug}`;
    const manejarClickEnlace = (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            className="tarjetaCancionFeed"
            role="article"
            tabIndex={0}
            onContextMenu={manejarMenu}
        >
            {/* Portada */}
            <a href={href} className="tarjetaCancionFeedImagen" onClick={manejarClickEnlace}>
                {cancion.imagenUrl ? (
                    <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
                ) : (
                    <div className="tarjetaCancionFeedImagenPlaceholder">
                        <Music size={24} color="var(--textoTerciario)" />
                    </div>
                )}
            </a>

            {/* Contenido central */}
            <a href={href} className="tarjetaCancionFeedContenido" onClick={manejarClickEnlace}>
                <div className="tarjetaCancionFeedCabecera">
                    <h3 className="tarjetaCancionFeedTitulo">{cancion.titulo}</h3>
                </div>
                <p className="tarjetaCancionFeedArtista">
                    {cancion.artistaNombre ?? 'Artista desconocido'}
                    {cancion.anio ? ` · ${cancion.anio}` : ''}
                    {cancion.genero ? ` · ${cancion.genero}` : ''}
                </p>

            </a>

            {/* Acciones e info derecha */}
            <div className="tarjetaCancionFeedAcciones">
                {/* Sampleos count movido al lado del like */}
                {(cancion.totalSampleada > 0 || cancion.totalSamplea > 0) && (
                    <div className="tarjetaCancionFeedSampleos">
                        
                        {cancion.totalSampleada > 0 && (
                            <Badge variante="acento" tamano="xs">
                                {cancion.totalSampleada} vez{cancion.totalSampleada !== 1 ? 'es' : ''} sampleada
                            </Badge>
                        )}
                        {cancion.totalSamplea > 0 && (
                            <Badge variante="neutro" tamano="xs">
                                Samplea {cancion.totalSamplea}
                            </Badge>
                        )}
                    </div>
                )}

                <BotonBase
                    variante="ghost"
                    className={`tarjetaAccionBtn ${cancion.liked ? 'tarjetaAccionLiked' : ''}`}
                    onClick={manejarLike}
                    type="button"
                    aria-label={cancion.liked ? 'Quitar like' : 'Dar like'}
                >
                    <Heart size={18} fill={cancion.liked ? 'currentColor' : 'none'} />
                </BotonBase>

                <BotonBase
                    variante="ghost"
                    className="tarjetaAccionBtn tarjetaMenuBtn"
                    onClick={manejarMenu}
                    type="button"
                    aria-label="Más opciones"
                >
                    <MoreHorizontal size={18} />
                </BotonBase>
            </div>
        </div>
    );
};
