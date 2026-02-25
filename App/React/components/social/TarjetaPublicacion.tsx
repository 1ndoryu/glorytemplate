/*
 * Componente: TarjetaPublicacion — Kamples
 * Tarjeta de publicación social en el feed.
 * Muestra autor, contenido, imágenes, samples adjuntos y acciones.
 */

import { useCallback, type MouseEvent } from 'react';
import { Repeat2, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import BarraAccionesPost from '@app/components/social/BarraAccionesPost';
import { useAuthStore } from '@app/stores/authStore';
import { formatearTiempoRelativo } from '@app/utils/tiempo';
import type { Publicacion, SampleResumen, TipoReaccion } from '@app/types';
import '../../styles/componentes/tarjetaPublicacion.css';

interface TarjetaPublicacionProps {
    publicacion: Publicacion;
    onLike?: (pubId: number, reaccion?: TipoReaccion) => void;
    onComentar?: (pubId: number) => void;
    onRepost?: (pubId: number) => void;
    onClickAutor?: (username: string) => void;
    onMenu?: (e: MouseEvent, post: Publicacion) => void;
    onPlaySample?: (sample: SampleResumen) => void;
    onPauseSample?: () => void;
    sampleActualId?: number;
    reproduciendo?: boolean;
    className?: string;
}

export const TarjetaPublicacion = ({
    publicacion,
    onLike,
    onComentar,
    onRepost,
    onClickAutor,
    onMenu,
    onPlaySample,
    onPauseSample,
    sampleActualId,
    reproduciendo = false,
    className = '',
}: TarjetaPublicacionProps): JSX.Element => {
    const manejarClickAutor = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClickAutor?.(publicacion.autor.username);
        },
        [onClickAutor, publicacion.autor.username]
    );

    const clases = ['tarjetaPublicacion', className].filter(Boolean).join(' ');

    /* Moderación: visible solo para el autor o admin */
    const usuario = useAuthStore(s => s.usuario);
    const esAutor = usuario?.id === publicacion.autorId || String(usuario?.id) === String(publicacion.autorId);
    const esAdmin = usuario?.rol === 'admin';
    const mostrarModeracion = (esAutor || esAdmin) && publicacion.moderacionEstado;

    return (
        <article className={clases}>
            {/* Indicador de repost — va encima de la cabecera, igual que en ComunidadIsland */}
            {publicacion.repostOriginal && (
                <div className="tarjetaPubRepostIndicador">
                    <Repeat2 size={12} />
                    <span>{publicacion.autor.nombreVisible} reposteó</span>
                </div>
            )}

            {/* Cabecera: @username · tiempo en la misma línea, igual que en Comunidad */}
            <div className="tarjetaPubCabecera">
                <div className="tarjetaPubAutorBloque">
                    <Avatar
                        src={publicacion.autor.avatarUrl}
                        nombre={publicacion.autor.nombreVisible}
                        tamano="sm"
                    />
                    <BotonBase
                        variante="ghost"
                        className="tarjetaPubAutorTextos"
                        onClick={manejarClickAutor}
                        aria-label={`Ir al perfil de ${publicacion.autor.nombreVisible}`}
                    >
                        <span className="tarjetaPubNombre">
                            {publicacion.autor.nombreVisible}
                            {publicacion.autor.verificado && (
                                <Badge variante="acento" tamano="xs">✓</Badge>
                            )}
                        </span>
                        <span className="tarjetaPubMeta">
                            @{publicacion.autor.username} · {formatearTiempoRelativo(publicacion.creadoAt)}
                        </span>
                    </BotonBase>
                </div>
                <div className="tarjetaPubAccionesHeader">
                    {mostrarModeracion && (
                        <BadgeModeracion moderacionEstado={publicacion.moderacionEstado} />
                    )}
                    {onMenu && (
                        <BotonBase variante="ghost" className="tarjetaPubMenuBtn"
                            onClick={(e) => onMenu(e, publicacion)} type="button" aria-label="Más opciones">
                            <MoreHorizontal size={18} />
                        </BotonBase>
                    )}
                </div>
            </div>

            {/* Contenido propio (no aplica en reposts puros) */}
            {!publicacion.repostOriginal && publicacion.contenido && (
                <p className="tarjetaPubContenido">{publicacion.contenido}</p>
            )}

            {/* Bloque embebido del post original */}
            {publicacion.repostOriginal && (
                <div className="tarjetaPubRepostOriginal">
                    <div className="tarjetaPubRepostOriginalAutor">
                        <Avatar
                            src={publicacion.repostOriginal.autor.avatarUrl}
                            nombre={publicacion.repostOriginal.autor.nombreVisible}
                            tamano="xs"
                        />
                        <span className="tarjetaPubRepostOriginalNombre">{publicacion.repostOriginal.autor.nombreVisible}</span>
                        <span className="tarjetaPubRepostOriginalUsername">@{publicacion.repostOriginal.autor.username}</span>
                    </div>
                    {publicacion.repostOriginal.contenido && (
                        <p className="tarjetaPubContenido">{publicacion.repostOriginal.contenido}</p>
                    )}
                    {publicacion.repostOriginal.imagenes.length > 0 && (
                        <div className={`tarjetaPubImagenes tarjetaPubImagenes${Math.min(publicacion.repostOriginal.imagenes.length, 4)}`}>
                            {publicacion.repostOriginal.imagenes.slice(0, 4).map((url, i) => (
                                <div className="tarjetaPubImagenItem" key={url}>
                                    <img src={url} alt={`Imagen ${i + 1}`} loading="lazy" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Imágenes propias (solo si no es repost) */}
            {!publicacion.repostOriginal && publicacion.imagenes.length > 0 && (
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

            {/* C85: Acciones centralizadas */}
            <BarraAccionesPost
                publicacion={publicacion}
                onLike={onLike ? (id, reaccion) => onLike(id, reaccion) : undefined}
                onQuitarLike={onLike ? (id) => onLike(id) : undefined}
                onComentar={onComentar}
                onRepost={onRepost}
            />
        </article>
    );
};

export default TarjetaPublicacion;
