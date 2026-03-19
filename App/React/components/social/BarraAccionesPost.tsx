import { Heart, MessageCircle, Repeat2 } from 'lucide-react';
import TooltipReacciones from '@app/components/ui/TooltipReacciones';
import type { TipoReaccion } from '@app/types';
import '../../styles/componentes/accionesPost.css';
import { BotonBase } from '../ui/BotonBase';

/*
 * BarraAccionesPost — Barra unificada de acciones para publicaciones.
 *
 * Centraliza el patron like/comentar/repost que se repetia en
 * ComunidadIsland, PerfilIsland, y TarjetaPublicacion.
 * Los handlers son opcionales: si no se pasan, los botones son decorativos.
 */

interface DatosAccionPost {
    id: number;
    liked?: boolean;
    reaccion?: TipoReaccion | null;
    totalLikes: number;
    totalComentarios: number;
    reposteado?: boolean;
    totalReposts: number;
}

interface BarraAccionesPostProps {
    publicacion: DatosAccionPost;
    onLike?: (id: number, reaccion?: TipoReaccion) => void;
    onQuitarLike?: (id: number) => void;
    onComentar?: (id: number) => void;
    onRepost?: (id: number) => void;
    /** Formato de conteo: si true, muestra 0 tambien. Default false = solo >0 */
    mostrarCeroConteo?: boolean;
    /** [183A-98] Si true, deshabilita el botón de repost (no puedes repostear tu propio contenido) */
    esPropio?: boolean;
    className?: string;
}

function formatearConteo(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
}

export default function BarraAccionesPost({
    publicacion,
    onLike,
    onQuitarLike,
    onComentar,
    onRepost,
    mostrarCeroConteo = false,
    esPropio = false,
    className = '',
}: BarraAccionesPostProps) {
    const p = publicacion;

    const claseReaccion =
        p.reaccion === 'encanta' ? 'reaccionPrincipalEncanta' :
        p.reaccion === 'dislike' ? 'reaccionPrincipalDislike' :
        p.reaccion === 'like' ? 'reaccionPrincipalLike' : '';

    const claseliked = p.liked ? 'accionesPostLiked' : '';
    const claseRepost = p.reposteado ? 'accionesPostReposteado' : '';

    const manejarLikeDirecto = () => {
        if (!onLike && !onQuitarLike) return;
        if (p.liked && onQuitarLike) {
            onQuitarLike(p.id);
        } else if (onLike) {
            onLike(p.id);
        }
    };

    const botonLike = (
        <BotonBase variante="ghost"
            className={`accionesPostBtn ${claseliked} ${claseReaccion}`}
            onClick={manejarLikeDirecto}
            type="button"
            aria-label={p.liked ? 'Quitar like' : 'Dar like'}
        >
            <Heart size={20} fill={p.liked ? 'currentColor' : 'none'} />
            {(mostrarCeroConteo || p.totalLikes > 0) && (
                <span>{formatearConteo(p.totalLikes)}</span>
            )}
        </BotonBase>
    );

    return (
        <div className={`accionesPostBarra ${className}`}>
            {onLike ? (
                <TooltipReacciones
                    reaccionActual={p.reaccion}
                    onReaccionar={(reaccion) => onLike(p.id, reaccion)}
                    onQuitar={() => onQuitarLike?.(p.id)}
                >
                    {botonLike}
                </TooltipReacciones>
            ) : (
                botonLike
            )}

            <BotonBase variante="ghost"
                className="accionesPostBtn"
                onClick={onComentar ? () => onComentar(p.id) : undefined}
                type="button"
                aria-label="Comentar"
            >
                <MessageCircle size={20} />
                {(mostrarCeroConteo || p.totalComentarios > 0) && (
                    <span>{formatearConteo(p.totalComentarios)}</span>
                )}
            </BotonBase>

            <BotonBase variante="ghost"
                className={`accionesPostBtn ${claseRepost}`}
                onClick={(!esPropio && onRepost) ? () => onRepost(p.id) : undefined}
                disabled={esPropio}
                type="button"
                aria-label={esPropio ? 'No puedes repostear tu propio contenido' : (p.reposteado ? 'Quitar repost' : 'Repostear')}
            >
                <Repeat2 size={20} />
                {(mostrarCeroConteo || p.totalReposts > 0) && (
                    <span>{formatearConteo(p.totalReposts)}</span>
                )}
            </BotonBase>
        </div>
    );
}
