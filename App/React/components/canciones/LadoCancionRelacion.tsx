/*
 * LadoCancionRelacion — Kamples
 * Tarjeta de un lado (destino o fuente) en la vista de detalle de relación.
 * Muestra portada, título, artista, metadata, timing y embed de YouTube o Spotify.
 * Extraído de RelacionDetalleIsland para cumplir limite de líneas (SRP).
 */

import { Music, ArrowRight } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';

interface LadoCancionRelacionProps {
    etiqueta: string;
    imagen: string | null;
    titulo: string | null;
    artista: string | null;
    slug: string | null;
    artistaSlug: string | null;
    anio: number | null;
    genero: string | null;
    album: string | null;
    timings: number[];
    embedUrl: string | null;
    embedTipo: 'youtube' | 'spotify' | null;
    onClickCancion: (slug: string) => void;
    onClickArtista: (slug: string) => void;
}

const formatearTimings = (timings: number[]): string => {
    if (!timings || timings.length === 0) return '';
    return timings
        .map((t) => {
            const min = Math.floor(t / 60);
            const seg = t % 60;
            return `${min}:${String(seg).padStart(2, '0')}`;
        })
        .join(', ');
};

export const LadoCancionRelacion = ({
    etiqueta,
    imagen,
    titulo,
    artista,
    slug,
    artistaSlug,
    anio,
    genero,
    album,
    timings,
    embedUrl,
    embedTipo,
    onClickCancion,
    onClickArtista,
}: LadoCancionRelacionProps): JSX.Element => (
    <div className="relacionDetalleLado">
        <span className="relacionDetalleLadoEtiqueta">{etiqueta}</span>

        <div className="relacionDetallePortada">
            {imagen ? (
                <img src={imagen} alt={titulo ?? ''} loading="lazy" />
            ) : (
                <div className="relacionDetallePortadaVacia">
                    <Music size={48} color="var(--textoTerciario)" />
                </div>
            )}
        </div>

        <div className="relacionDetalleLadoInfo">
            <BotonBase
                variante="ghost"
                tamano="ninguno"
                className="relacionDetalleLadoTitulo"
                onClick={() => slug && onClickCancion(slug)}
            >
                {titulo ?? 'Canción desconocida'}
            </BotonBase>
            {artista && (
                <BotonBase
                    variante="ghost"
                    tamano="ninguno"
                    className="relacionDetalleLadoArtista"
                    onClick={() => artistaSlug && onClickArtista(artistaSlug)}
                >
                    {artista}
                </BotonBase>
            )}
            <div className="relacionDetalleLadoExtra">
                <div className="relacionDetalleLadoMeta">
                    {anio && <span className="relacionDetalleLadoAnio">{anio}</span>}
                    {genero && <Badge variante="neutro" tamano="xs">{genero}</Badge>}
                    {album && <Badge variante="neutro" tamano="xs">{album}</Badge>}
                </div>
                {timings.length > 0 && (
                    <div className="relacionDetalleTiming">
                        <ArrowRight size={14} />
                        {formatearTimings(timings)}
                    </div>
                )}
            </div>
        </div>

        {embedUrl && (
            <div className="relacionDetalleYoutube">
                <iframe
                    src={embedUrl}
                    title={`${titulo} - ${embedTipo === 'spotify' ? 'Spotify' : 'YouTube'}`}
                    allow={
                        embedTipo === 'spotify'
                            ? 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
                            : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    }
                    allowFullScreen
                />
            </div>
        )}
    </div>
);
