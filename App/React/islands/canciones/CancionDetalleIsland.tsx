/*
 * CancionDetalleIsland — Kamples
 * Página de detalle de una canción: metadata, artistas, relaciones de sampling.
 * Lógica extraída a useCancionDetalle (SRP).
 */

import { Music, AlertCircle } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Skeleton, SkeletonFeed } from '@app/components/skeletons';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { CadenaSamples } from '@app/components/samples/CadenaSamples';
import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useCancionDetalle } from '@app/hooks/useCancionDetalle';
import { useCallback } from 'react';
import { obtenerSamplesDeCancion } from '@app/services/apiSamples';
import { ETIQUETAS_ROL } from '@app/types/cancion';
import '../../styles/componentes/cancionDetalle.css';
import '../../styles/componentes/seccionRelaciones.css';

const TABS_CANCION = [{ id: 'cancion', etiqueta: 'Canción' }];

interface CancionDetalleProps {
    slug?: string;
}

/* Extrae el ID de YouTube para embed seguro (whitelist de formatos válidos) */
const construirEmbedUrl = (youtubeId: string): string | null => {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) return null;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
};

/* Filtra tags de metadata omitiendo "WhoSampled #N" */
const PATRON_WHOSAMPLED_NUM = /^whosampled\s*#\d+$/i;

const extraerTags = (metadata: Record<string, unknown>): string[] => {
    const tags = metadata?.tags;
    if (!Array.isArray(tags)) return [];
    return tags.filter(
        (t): t is string => typeof t === 'string' && !PATRON_WHOSAMPLED_NUM.test(t)
    );
};

export const CancionDetalleIsland = ({ slug }: CancionDetalleProps): JSX.Element => {
    const {
        detalle,
        cargando,
        error,
        irAArtista,
    } = useCancionDetalle({ slug });

    /* Proveedor de samples extraídos de esta canción (cancion_origen_id) */
    const proveedorSamples = useCallback(
        (_pagina: number) =>
            obtenerSamplesDeCancion(slug ?? '').then((r) => (r.ok && r.data ? r.data : [])),
        [slug]
    );

    useTabsIsla('CancionDetalleIsland', TABS_CANCION, 'cancion');

    if (cargando) {
        return (
            <div className="cancionDetalleContenedor" id="seccionCancionDetalle">
                <div className="cancionDetalleTarjeta">
                    <div className="cancionDetalleCabecera">
                        <Skeleton alto={160} ancho={160} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--espacioSm)' }}>
                            <Skeleton alto={28} />
                            <Skeleton alto={20} ancho={200} />
                            <Skeleton alto={16} ancho={120} />
                        </div>
                    </div>
                    <SkeletonFeed cantidad={3} />
                </div>
            </div>
        );
    }

    if (error || !detalle) {
        return (
            <div className="cancionDetalleContenedor" id="seccionCancionDetalle">
                <div className="cancionDetalleError">
                    <AlertCircle size={40} />
                    <p>{error || 'Canción no encontrada.'}</p>
                    <BotonBase variante="ghost" onClick={() => window.history.back()}>
                        Volver
                    </BotonBase>
                </div>
            </div>
        );
    }

    const { cancion, artistas, samplesDe, sampleadaEn } = detalle;
    const embedUrl = cancion.youtubeId ? construirEmbedUrl(cancion.youtubeId) : null;
    const tags = extraerTags(cancion.metadata);

    return (
        <div className="cancionDetalleContenedor" id="seccionCancionDetalle">
            <div className="cancionDetalleTarjeta">
                {/* Cabecera: portada + info */}
                <div className="cancionDetalleCabecera">
                    <div className="cancionDetallePortada">
                        {cancion.imagenUrl ? (
                            <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Music size={48} color="var(--textoTerciario)" />
                            </div>
                        )}
                    </div>

                    <div className="cancionDetalleInfo">
                        <h1 className="cancionDetalleTitulo">{cancion.titulo}</h1>

                        <div className="cancionDetalleArtistas">
                            {artistas.map((a) => (
                                <BotonBase
                                    key={`${a.artistaId}-${a.rol}`}
                                    variante="ghost"
                                    tamano="ninguno"
                                    className="cancionDetalleArtista"
                                    onClick={() => irAArtista(a.slug)}
                                >
                                    {a.nombre}
                                    {a.rol !== 'principal' && (
                                        <> ({ETIQUETAS_ROL[a.rol]})</>
                                    )}
                                </BotonBase>
                            ))}
                        </div>

                        {cancion.anio && (
                            <span className="cancionDetalleAnio">{cancion.anio}</span>
                        )}

                        <div className="cancionDetalleMeta">
                            {cancion.genero && (
                                <Badge variante="neutro" tamano="sm">{cancion.genero}</Badge>
                            )}
                            {cancion.bpm && (
                                <Badge variante="neutro" tamano="sm">{cancion.bpm} BPM</Badge>
                            )}
                            {cancion.tonalidad && (
                                <Badge variante="neutro" tamano="sm">{cancion.tonalidad}</Badge>
                            )}
                            {cancion.album && (
                                <Badge variante="neutro" tamano="sm">{cancion.album}</Badge>
                            )}
                            {cancion.sello && (
                                <Badge variante="neutro" tamano="sm">{cancion.sello}</Badge>
                            )}
                            {tags.map((tag) => (
                                <Badge key={tag} variante="neutro" tamano="sm">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* YouTube embed */}
                {embedUrl && (
                    <div className="cancionDetalleYoutube">
                        <iframe
                            src={embedUrl}
                            title={`${cancion.titulo} - YouTube`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}

                {/* Samples publicados extraídos de esta canción (pipeline) */}
                {slug && (
                    <FeedSamples
                        proveedor={proveedorSamples}
                        claveCache={`cancion-samples-${slug}`}
                        mostrarTags={false}
                        infiniteScroll={false}
                        virtualizar={false}
                        mensajeVacio=""
                    />
                )}
            </div>

            {samplesDe.length > 0 && (
                <SeccionRelaciones titulo="Samplea a" contador={samplesDe.length}>
                    <TablaRelaciones relaciones={samplesDe} direccion="destino" />
                </SeccionRelaciones>
            )}

            {sampleadaEn.length > 0 && (
                <SeccionRelaciones titulo="Sampleada por" contador={sampleadaEn.length}>
                    <TablaRelaciones relaciones={sampleadaEn} direccion="origen" />
                </SeccionRelaciones>
            )}

            {/* Sin relaciones */}
            {samplesDe.length === 0 && sampleadaEn.length === 0 && (
                <div className="cancionDetalleVacio">
                    <Music size={32} />
                    <p>Aún no se han identificado relaciones de sampling para esta canción.</p>
                </div>
            )}

            {/* S4.5: Widget cadena de samples */}
            {slug && (samplesDe.length > 0 || sampleadaEn.length > 0) && (
                <CadenaSamples slug={slug} titulo={cancion.titulo} />
            )}
        </div>
    );
};
