/*
 * Componente: TarjetaPublicacion — Kamples
 * Tarjeta de publicación social en el feed.
 * Incluye: lightbox propio, imágenes clickeables (doble-click = like), samples adjuntos y acciones.
 */

import { useRef, useState, type MouseEvent } from 'react';
import { Repeat2, MoreHorizontal, X, BadgeCheck } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { EnlaceNavegacion } from '@app/components/ui/EnlaceNavegacion';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { ImgOptimizada } from '@app/components/ui/ImgOptimizada';
import { ComentarioPreview } from '@app/components/social/ComentarioPreview';
import BarraAccionesPost from '@app/components/social/BarraAccionesPost';
import { useAuthStore } from '@app/stores/authStore';
import { useHoverPerfil } from '@app/hooks/useHoverPerfil';
import { useT } from '@app/utils/i18n/useT';
import { formatearTiempoRelativo } from '@app/utils/tiempo';
import type { Publicacion, SampleResumen, TipoReaccion } from '@app/types';
import '../../styles/componentes/tarjetaPublicacion.css';

interface TarjetaPublicacionProps {
    publicacion: Publicacion;
    onLike?: (pubId: number, reaccion?: TipoReaccion) => void;
    onComentar?: (pubId: number) => void;
    onRepost?: (pubId: number) => void;
    onClickAutor?: (username: string) => void;
    onClickFecha?: (pubId: number) => void;
    onMenu?: (e: MouseEvent<HTMLButtonElement>, post: Publicacion) => void;
    onLikeSample?: (id: number) => void;
    onMenuSample?: (e: MouseEvent, sample: SampleResumen) => void;
    onClickCreadorSample?: (username: string) => void;
    onPlaySample?: (sample: SampleResumen) => void;
    onPauseSample?: () => void;
    mostrarCeroConteo?: boolean;
    /* Slot para extras de isla sobre el avatar (ej: botón seguir en ComunidadIsland) */
    avatarExtra?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export const TarjetaPublicacion = ({
    publicacion,
    onLike,
    onComentar,
    onRepost,
    onClickAutor,
    onClickFecha,
    onMenu,
    onLikeSample,
    onMenuSample,
    onClickCreadorSample,
    onPlaySample,
    onPauseSample,
    mostrarCeroConteo,
    avatarExtra,
    children,
    className = '',
}: TarjetaPublicacionProps): JSX.Element => {
    /* Hover card de perfil sobre el nombre del autor */
    const hoverAutor = useHoverPerfil(publicacion.autor.username);
    const { t } = useT();

    /* Lightbox interno — igual que ComunidadIsland */
    const [imagenAbierta, setImagenAbierta] = useState<string | null>(null);
    const timerClickImagen = useRef<ReturnType<typeof setTimeout> | null>(null);

    const manejarClickImagen = (url: string) => {
        if (timerClickImagen.current) return;
        timerClickImagen.current = setTimeout(() => {
            timerClickImagen.current = null;
            setImagenAbierta(url);
        }, 220);
    };

    const manejarDobleClickImagen = (postId: number) => {
        if (timerClickImagen.current) {
            clearTimeout(timerClickImagen.current);
            timerClickImagen.current = null;
        }
        onLike?.(postId);
    };

    const clases = ['tarjetaPublicacion', className].filter(Boolean).join(' ');

    /* Moderación: visible solo para el autor o admin */
    const usuario = useAuthStore(s => s.usuario);
    const esAutor = usuario?.id === publicacion.autorId || String(usuario?.id) === String(publicacion.autorId);
    const esAdmin = usuario?.rol === 'admin';
    const mostrarModeracion = (esAutor || esAdmin) && publicacion.moderacionEstado;

    return (
        <article className={clases}>
            {/* Indicador de repost — encima de la cabecera */}
            {publicacion.repostOriginal && (
                <div className="tarjetaPubRepostIndicador">
                    <Repeat2 size={12} />
                    <span>{t('publicacion.reposteo', { nombre: publicacion.autor.nombreVisible })}</span>
                </div>
            )}

            {/* Cabecera: @username · tiempo en la misma línea */}
            <div className="tarjetaPubCabecera">
                <div className="tarjetaPubAutorBloque">
                    <div className="tarjetaPubAvatarContenedor">
                        <Avatar
                            src={publicacion.autor.avatarUrl}
                            nombre={publicacion.autor.nombreVisible}
                            tamano="sm"
                        />
                        {avatarExtra}
                    </div>
                    {/* Separamos nombre y meta en enlaces independientes para evitar <a> anidado */}
                    <div className="tarjetaPubAutorTextos">
                        <EnlaceNavegacion
                            href={`/perfil/${publicacion.autor.username}/`}
                            className="tarjetaPubNombreEnlace"
                            aria-label={t('publicacion.irAlPerfil', { nombre: publicacion.autor.nombreVisible })}
                            onMouseEnter={hoverAutor.onMouseEnter}
                            onMouseLeave={hoverAutor.onMouseLeave}
                            onClick={() => {
                                onClickAutor?.(publicacion.autor.username);
                            }}
                        >
                            <span className="tarjetaPubNombre">
                                {publicacion.autor.nombreVisible}
                                {publicacion.autor.verificado && (
                                    <BadgeCheck size={14} className="tarjetaVerificado" />
                                )}
                            </span>
                        </EnlaceNavegacion>
                        <span className="tarjetaPubMeta">
                            @{publicacion.autor.username}
                            {' · '}
                            {onClickFecha ? (
                                <EnlaceNavegacion
                                    href={`/publicacion/${publicacion.id}/`}
                                    className="tarjetaPubFechaEnlace"
                                    aria-label={t('publicacion.verPublicacion', { fecha: formatearTiempoRelativo(publicacion.creadoAt) })}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClickFecha?.(publicacion.id);
                                    }}
                                >
                                    {formatearTiempoRelativo(publicacion.creadoAt)}
                                </EnlaceNavegacion>
                            ) : (
                                formatearTiempoRelativo(publicacion.creadoAt)
                            )}
                        </span>
                    </div>
                </div>
                <div className="tarjetaPubAccionesHeader">
                    {mostrarModeracion && (
                        <BadgeModeracion moderacionEstado={publicacion.moderacionEstado} />
                    )}
                    {onMenu && (
                        <BotonBase variante="ghost" className="tarjetaPubMenuBtn"
                            onClick={(e) => onMenu(e, publicacion)} type="button" aria-label={t('comun.masOpciones')}>
                            <MoreHorizontal size={18} />
                        </BotonBase>
                    )}
                </div>
            </div>

            {/* Contenido propio (no aplica en reposts puros) */}
            {!publicacion.repostOriginal && publicacion.contenido && (
                <p className="tarjetaPubContenido">{publicacion.contenido}</p>
            )}

            {/* Imágenes propias clickeables (solo si no es repost) */}
            {!publicacion.repostOriginal && publicacion.imagenes.length > 0 && (
                <div className={`tarjetaPubImagenes tarjetaPubImagenes${Math.min(publicacion.imagenes.length, 4)}`}>
                    {publicacion.imagenes.slice(0, 4).map((url) => (
                        <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="imagenClickable enlaceNavegacion"
                            onClick={(e) => {
                                /* Left-click sin modificadores: lightbox. Middle-click: abre imagen en nueva pestaña */
                                if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                    e.preventDefault();
                                    manejarClickImagen(url);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                manejarDobleClickImagen(publicacion.id);
                            }}
                            aria-label={t('publicacion.verImagen')}
                        >
                            <ImgOptimizada src={url} alt={t('publicacion.imagenAdjunta')} className="tarjetaPubImg" loading="lazy" />
                        </a>
                    ))}
                </div>
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
                            {publicacion.repostOriginal.imagenes.slice(0, 4).map((url) => (
                                <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="imagenClickable enlaceNavegacion"
                                    onClick={(e) => {
                                        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                            e.preventDefault();
                                            manejarClickImagen(url);
                                        }
                                    }}
                                    aria-label="Ver imagen"
                                >
                                    <ImgOptimizada src={url} alt="Imagen adjunta" className="tarjetaPubImg" loading="lazy" />
                                </a>
                            ))}
                        </div>
                    )}
                    {/* Samples del repost original */}
                    {publicacion.repostOriginal.samplesAdjuntos && publicacion.repostOriginal.samplesAdjuntos.length > 0 && (
                        <div className="tarjetaPubSamples">
                            {publicacion.repostOriginal.samplesAdjuntos.map((sample) => (
                                <TarjetaSample
                                    key={sample.id}
                                    sample={sample}
                                    contexto={publicacion.repostOriginal!.samplesAdjuntos}
                                    onPlay={onPlaySample}
                                    onPause={onPauseSample}
                                    onLike={onLikeSample}
                                    onMenu={onMenuSample}
                                    onClickCreador={onClickCreadorSample}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Samples adjuntos */}
            {publicacion.samplesAdjuntos.length > 0 && (
                <div className="tarjetaPubSamples">
                    {publicacion.samplesAdjuntos.map((sample) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            contexto={publicacion.samplesAdjuntos}
                            onPlay={onPlaySample}
                            onPause={onPauseSample}
                            onLike={onLikeSample}
                            onMenu={onMenuSample}
                            onClickCreador={onClickCreadorSample}
                        />
                    ))}
                </div>
            )}

            {/* Acciones */}
            <BarraAccionesPost
                publicacion={publicacion}
                onLike={onLike ? (id, reaccion) => onLike(id, reaccion) : undefined}
                onQuitarLike={onLike ? (id) => onLike(id) : undefined}
                onComentar={onComentar}
                onRepost={onRepost}
                mostrarCeroConteo={mostrarCeroConteo}
                esPropio={esAutor}
            />

            {/* QQ20: Preview del comentario con más likes */}
            {publicacion.comentarioDestacado && !children && (
                <ComentarioPreview
                    comentario={publicacion.comentarioDestacado}
                    onClick={onComentar ? () => onComentar(publicacion.id) : undefined}
                />
            )}

            {/* Slot para comentarios u otros extras por isla */}
            {children}

            {/* Lightbox interno */}
            {imagenAbierta && (
                <div className="imagenLightbox" onClick={() => setImagenAbierta(null)} role="dialog" aria-modal="true" aria-label={t('publicacion.vistaAmpliada')}>
                    <BotonBase variante="ghost" className="imagenLightboxCerrar" onClick={() => setImagenAbierta(null)} aria-label={t('comun.cerrar')}>
                        <X size={24} />
                    </BotonBase>
                    <img
                        src={imagenAbierta}
                        alt={t('publicacion.imagenAmpliada')}
                        className="imagenLightboxImg"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </article>
    );
};

export default TarjetaPublicacion;
