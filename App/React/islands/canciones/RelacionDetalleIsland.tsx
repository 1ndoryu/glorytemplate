/*
 * RelacionDetalleIsland — Kamples
 * Vista de detalle de una relación de sampleo: dos canciones lado a lado
 * con sus videos de YouTube, tipo de relación y metadata.
 * Lógica extraída a useRelacionDetalle (SRP).
 */

import { Music, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Skeleton } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useRelacionDetalle } from '@app/hooks/useRelacionDetalle';
import {
    ETIQUETAS_TIPO_RELACION,
    ETIQUETAS_TIPO_ELEMENTO,
} from '@app/types/cancion';
import '../../styles/componentes/relacionDetalle.css';

const TABS_RELACION = [{ id: 'relacion', etiqueta: 'Sampleo' }];

interface RelacionDetalleProps {
    id?: string;
    /* El SPA router extrae segmentos dinámicos como 'slug' — se acepta como alias de id */
    slug?: string;
}

/* Valida formato YouTube ID y construye URL de embed segura */
const construirEmbedUrl = (youtubeId: string): string | null => {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) return null;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
};

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

export const RelacionDetalleIsland = ({ id, slug }: RelacionDetalleProps): JSX.Element => {
    /* SPA navigation pasa 'slug' para segmentos dinámicos (/sampleo/260 → slug='260') */
    const idEfectivo = id ?? slug;
    const {
        relacion,
        cargando,
        error,
        irACancion,
        irAArtista,
    } = useRelacionDetalle({ id: idEfectivo });

    useTabsIsla('RelacionDetalleIsland', TABS_RELACION, 'relacion');

    if (cargando) {
        return (
            <div className="relacionDetalleContenedor" id="seccionRelacionDetalle">
                <div className="relacionDetalleCabecera">
                    <Skeleton alto={24} ancho={200} />
                </div>
                <div className="relacionDetalleGrid">
                    <div className="relacionDetalleLado">
                        <Skeleton alto={200} />
                        <Skeleton alto={20} />
                        <Skeleton alto={16} ancho={120} />
                    </div>
                    <div className="relacionDetalleLado">
                        <Skeleton alto={200} />
                        <Skeleton alto={20} />
                        <Skeleton alto={16} ancho={120} />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !relacion) {
        return (
            <div className="relacionDetalleContenedor" id="seccionRelacionDetalle">
                <div className="relacionDetalleError">
                    <AlertCircle size={40} />
                    <p>{error || 'Relación no encontrada.'}</p>
                    <BotonBase variante="ghost" onClick={() => window.history.back()}>
                        Volver
                    </BotonBase>
                </div>
            </div>
        );
    }

    const embedDestino = relacion.destino_youtubeId
        ? construirEmbedUrl(relacion.destino_youtubeId)
        : null;
    const embedFuente = relacion.fuente_youtubeId
        ? construirEmbedUrl(relacion.fuente_youtubeId)
        : null;

    return (
        <div className="relacionDetalleContenedor" id="seccionRelacionDetalle">
            {/* Cabecera: tipo de relación + metadata */}
            <div className="relacionDetalleCabecera">
                <h1 className="relacionDetalleTipo">
                    {ETIQUETAS_TIPO_RELACION[relacion.tipoRelacion]}
                </h1>
                <div className="relacionDetalleMeta">
                    {relacion.tipoElemento && (
                        <Badge variante="neutro" tamano="sm">
                            {ETIQUETAS_TIPO_ELEMENTO[relacion.tipoElemento]}
                        </Badge>
                    )}
                    {relacion.verificada && (
                        <Badge variante="exito" tamano="sm">Verificada</Badge>
                    )}
                    {relacion.votosTotal > 0 && (
                        <Badge variante="neutro" tamano="sm">
                            {relacion.votosTotal} votos
                        </Badge>
                    )}
                    {relacion.apareceEnTodo && (
                        <Badge variante="neutro" tamano="sm">
                            En toda la canción
                        </Badge>
                    )}
                </div>
            </div>

            {/* Grid: canción destino (samplea) → canción fuente (sampleada) */}
            <div className="relacionDetalleGrid">
                {/* Lado izquierdo: canción destino (la que samplea) */}
                <div className="relacionDetalleLado">
                    <span className="relacionDetalleLadoEtiqueta">Samplea</span>

                    <div className="relacionDetallePortada">
                        {relacion.destino_imagen ? (
                            <img
                                src={relacion.destino_imagen}
                                alt={relacion.destino_titulo ?? ''}
                                loading="lazy"
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Music size={48} color="var(--textoTerciario)" />
                            </div>
                        )}
                    </div>

                    <div className="relacionDetalleLadoInfo">
                        <BotonBase
                            variante="ghost"
                            tamano="ninguno"
                            className="relacionDetalleLadoTitulo"
                            onClick={() => relacion.destino_slug && irACancion(relacion.destino_slug)}
                        >
                            {relacion.destino_titulo ?? 'Canción desconocida'}
                        </BotonBase>
                        {relacion.destino_artista && (
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                className="relacionDetalleLadoArtista"
                                onClick={() => relacion.destino_artistaSlug && irAArtista(relacion.destino_artistaSlug)}
                            >
                                {relacion.destino_artista}
                            </BotonBase>
                        )}
                        <div className="relacionDetalleLadoMeta">
                            {relacion.destino_anio && (
                                <span className="relacionDetalleLadoAnio">{relacion.destino_anio}</span>
                            )}
                            {relacion.destino_genero && (
                                <Badge variante="neutro" tamano="xs">{relacion.destino_genero}</Badge>
                            )}
                            {relacion.destino_album && (
                                <Badge variante="neutro" tamano="xs">{relacion.destino_album}</Badge>
                            )}
                        </div>
                        {relacion.timingsDestino.length > 0 && (
                            <div className="relacionDetalleTiming">
                                <ArrowRight size={14} />
                                {formatearTimings(relacion.timingsDestino)}
                            </div>
                        )}
                    </div>

                    {embedDestino && (
                        <div className="relacionDetalleYoutube">
                            <iframe
                                src={embedDestino}
                                title={`${relacion.destino_titulo} - YouTube`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                </div>

                {/* Lado derecho: canción fuente (la sampleada) */}
                <div className="relacionDetalleLado">
                    <span className="relacionDetalleLadoEtiqueta">Sampleada</span>

                    <div className="relacionDetallePortada">
                        {relacion.fuente_imagen ? (
                            <img
                                src={relacion.fuente_imagen}
                                alt={relacion.fuente_titulo ?? ''}
                                loading="lazy"
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Music size={48} color="var(--textoTerciario)" />
                            </div>
                        )}
                    </div>

                    <div className="relacionDetalleLadoInfo">
                        <BotonBase
                            variante="ghost"
                            tamano="ninguno"
                            className="relacionDetalleLadoTitulo"
                            onClick={() => relacion.fuente_slug && irACancion(relacion.fuente_slug)}
                        >
                            {relacion.fuente_titulo ?? 'Canción desconocida'}
                        </BotonBase>
                        {relacion.fuente_artista && (
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                className="relacionDetalleLadoArtista"
                                onClick={() => relacion.fuente_artistaSlug && irAArtista(relacion.fuente_artistaSlug)}
                            >
                                {relacion.fuente_artista}
                            </BotonBase>
                        )}
                        <div className="relacionDetalleLadoMeta">
                            {relacion.fuente_anio && (
                                <span className="relacionDetalleLadoAnio">{relacion.fuente_anio}</span>
                            )}
                            {relacion.fuente_genero && (
                                <Badge variante="neutro" tamano="xs">{relacion.fuente_genero}</Badge>
                            )}
                            {relacion.fuente_album && (
                                <Badge variante="neutro" tamano="xs">{relacion.fuente_album}</Badge>
                            )}
                        </div>
                        {relacion.timingsFuente.length > 0 && (
                            <div className="relacionDetalleTiming">
                                <ArrowRight size={14} />
                                {formatearTimings(relacion.timingsFuente)}
                            </div>
                        )}
                    </div>

                    {embedFuente && (
                        <div className="relacionDetalleYoutube">
                            <iframe
                                src={embedFuente}
                                title={`${relacion.fuente_titulo} - YouTube`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
