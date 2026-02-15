/*
 * Componente: TarjetaPublicacion — Kamples
 * Tarjeta de publicación social en el feed.
 * Muestra autor, contenido, imágenes, samples adjuntos y acciones.
 */

import { useCallback, type MouseEvent } from 'react';
import { Heart, MessageCircle, Repeat2, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import type { Publicacion, SampleResumen } from '@app/types';
import '../../styles/componentes/tarjetaPublicacion.css';

interface TarjetaPublicacionProps {
    publicacion: Publicacion;
    onLike?: (pubId: number) => void;
    onComentar?: (pubId: number) => void;
    onRepost?: (pubId: number) => void;
    onClickAutor?: (username: string) => void;
    onPlaySample?: (sample: SampleResumen) => void;
    onPauseSample?: () => void;
    sampleActualId?: number;
    reproduciendo?: boolean;
    className?: string;
}

/* Formatear fecha relativa */
const formatearTiempo = (fecha: string): string => {
    const ahora = Date.now();
    const ts = new Date(fecha).getTime();
    const diff = ahora - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    const dias = Math.floor(hrs / 24);
    if (dias < 7) return `${dias}d`;
    const semanas = Math.floor(dias / 7);
    if (semanas < 4) return `${semanas}sem`;
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

/* Formatear número abreviado */
const formatearNumero = (n: number): string => {
    if (n < 1000) return `${n}`;
    if (n < 1000000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
    return `${(n / 1000000).toFixed(1).replace('.0', '')}M`;
};

export const TarjetaPublicacion = ({
    publicacion,
    onLike,
    onComentar,
    onRepost,
    onClickAutor,
    onPlaySample,
    onPauseSample,
    sampleActualId,
    reproduciendo = false,
    className = '',
}: TarjetaPublicacionProps): JSX.Element => {
    const manejarLike = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onLike?.(publicacion.id);
        },
        [onLike, publicacion.id]
    );

    const manejarComentar = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onComentar?.(publicacion.id);
        },
        [onComentar, publicacion.id]
    );

    const manejarRepost = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onRepost?.(publicacion.id);
        },
        [onRepost, publicacion.id]
    );

    const manejarClickAutor = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClickAutor?.(publicacion.autor.username);
        },
        [onClickAutor, publicacion.autor.username]
    );

    const clases = ['tarjetaPublicacion', className].filter(Boolean).join(' ');

    return (
        <article className={clases}>
            {/* Cabecera: avatar + nombre + tiempo */}
            <div className="tarjetaPubCabecera">
                <div
                    className="tarjetaPubAutor"
                    onClick={manejarClickAutor}
                    role="link"
                    tabIndex={0}
                >
                    <Avatar
                        src={publicacion.autor.avatarUrl}
                        nombre={publicacion.autor.nombreVisible}
                        tamano="sm"
                    />
                    <div className="tarjetaPubAutorInfo">
                        <span className="tarjetaPubNombre">
                            {publicacion.autor.nombreVisible}
                            {publicacion.autor.verificado && (
                                <span className="tarjetaPubVerificado" title="Verificado">✓</span>
                            )}
                        </span>
                        <span className="tarjetaPubUsername">@{publicacion.autor.username}</span>
                    </div>
                </div>
                <span className="tarjetaPubTiempo">{formatearTiempo(publicacion.creadoAt)}</span>
            </div>

            {/* Contenido textual */}
            {publicacion.contenido && (
                <p className="tarjetaPubContenido">{publicacion.contenido}</p>
            )}

            {/* Imágenes adjuntas */}
            {publicacion.imagenes.length > 0 && (
                <div className={`tarjetaPubImagenes tarjetaPubImagenes${Math.min(publicacion.imagenes.length, 4)}`}>
                    {publicacion.imagenes.slice(0, 4).map((url, i) => (
                        <div className="tarjetaPubImagenItem" key={url}>
                            <img src={url} alt={`Imagen ${i + 1}`} loading="lazy" />
                        </div>
                    ))}
                </div>
            )}

            {/* Samples adjuntos */}
            {publicacion.samplesAdjuntos.length > 0 && (
                <div className="tarjetaPubSamples">
                    {publicacion.samplesAdjuntos.map((sample) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            activa={sampleActualId === sample.id}
                            reproduciendo={sampleActualId === sample.id && reproduciendo}
                            onPlay={onPlaySample}
                            onPause={onPauseSample}
                        />
                    ))}
                </div>
            )}

            {/* Acciones: like, comentar, repost */}
            <div className="tarjetaPubAcciones">
                <button
                    className={`tarjetaPubAccionBtn ${publicacion.liked ? 'tarjetaPubAccionLiked' : ''}`}
                    onClick={manejarLike}
                    type="button"
                    aria-label={publicacion.liked ? 'Quitar like' : 'Dar like'}
                >
                    <Heart size={16} fill={publicacion.liked ? 'currentColor' : 'none'} />
                    {publicacion.totalLikes > 0 && (
                        <span>{formatearNumero(publicacion.totalLikes)}</span>
                    )}
                </button>

                <button
                    className="tarjetaPubAccionBtn"
                    onClick={manejarComentar}
                    type="button"
                    aria-label="Comentar"
                >
                    <MessageCircle size={16} />
                    {publicacion.totalComentarios > 0 && (
                        <span>{formatearNumero(publicacion.totalComentarios)}</span>
                    )}
                </button>

                <button
                    className={`tarjetaPubAccionBtn ${publicacion.reposteado ? 'tarjetaPubAccionReposteado' : ''}`}
                    onClick={manejarRepost}
                    type="button"
                    aria-label={publicacion.reposteado ? 'Quitar repost' : 'Repostear'}
                >
                    <Repeat2 size={16} />
                    {publicacion.totalReposts > 0 && (
                        <span>{formatearNumero(publicacion.totalReposts)}</span>
                    )}
                </button>
            </div>
        </article>
    );
};

export default TarjetaPublicacion;
