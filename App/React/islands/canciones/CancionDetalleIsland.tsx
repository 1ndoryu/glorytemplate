/*
 * CancionDetalleIsland — Kamples
 * Página de detalle de una canción: metadata, artistas, relaciones de sampling.
 * Lógica extraída a useCancionDetalle (SRP).
 */

import { Music, AlertCircle, MoreVertical, ArrowLeft, Heart } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { Skeleton, SkeletonFeed } from '@app/components/skeletons';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { CadenaSamples } from '@app/components/samples/CadenaSamples';
import { ModalContribucion } from '@app/components/samples/ModalContribucion';
import { ModalEdicionRelacion } from '@app/components/samples/ModalEdicionRelacion';
import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useCancionDetalle } from '@app/hooks/useCancionDetalle';
import { useMenuCancionDetalle } from '@app/hooks/useMenuCancionDetalle';
import { useCallback, useEffect, useState } from 'react';
import { obtenerSamplesDeCancion } from '@app/services/apiSamples';
import type { SampleResumen } from '@app/types';
import { useAuthStore } from '@app/stores/authStore';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { ETIQUETAS_ROL } from '@app/types/cancion';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
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

    const autenticado = useAuthStore((s) => s.autenticado);

    const menuCtx = useMenuCancionDetalle(detalle, autenticado);

    /* Proveedor de samples extraídos de esta canción (cancion_origen_id) */
    const proveedorSamples = useCallback(
        (_pagina: number) =>
            obtenerSamplesDeCancion(slug ?? '')
                .then((r) => ({ ok: r.ok, data: r.ok && r.data ? r.data : [] as SampleResumen[] }))
                .catch(() => ({ ok: false, data: [] as SampleResumen[] })),
        [slug]
    );

    /* [183A-32] Like de canción con rollback optimista */
    const [liked, setLiked] = useState(detalle?.cancion?.liked ?? false);
    const [likeando, setLikeando] = useState(false);

    /* Sincronizar liked cuando cambia la canción cargada */
    useEffect(() => {
        if (detalle?.cancion) setLiked(detalle.cancion.liked ?? false);
    }, [detalle?.cancion?.id]);

    const manejarToggleLike = useCallback(async () => {
        if (!autenticado || likeando || !detalle) return;
        const anterior = liked;
        setLikeando(true);
        setLiked(!anterior);

        const resp = anterior
            ? await quitarLike('cancion', detalle.cancion.id)
            : await darLike('cancion', detalle.cancion.id);

        /* [223A-9] Fix: backend ahora retorna { liked, reaccion } dentro de data.
         * Defensivo: si liked no viene, mantener el estado optimista. */
        if (!resp.ok) setLiked(anterior);
        else if (resp.data && typeof resp.data.liked === 'boolean') setLiked(resp.data.liked);
        setLikeando(false);
    }, [autenticado, likeando, liked, detalle]);

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
                    <BotonBase variante="ghost" className="botonVolver" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} />
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

                    {/* [183A-32] Like + 3 puntos: acciones de cancion */}
                    {autenticado && (
                        <div className="cancionDetalleAcciones">
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                className={`cancionDetalleLikeBtn${liked ? ' cancionDetalleLikeBtnActiva' : ''}`}
                                onClick={manejarToggleLike}
                                aria-label={liked ? 'Quitar like' : 'Dar like'}
                                cargando={likeando}
                            >
                                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                            </BotonBase>
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                className="cancionDetalleMenuBtn"
                                onClick={menuCtx.abrirMenu}
                                aria-label="Acciones"
                            >
                                <MoreVertical size={20} />
                            </BotonBase>
                        </div>
                    )}
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

                {/* Samples de audio extraídos de esta canción vía pipeline:
                 * Solo se intenta la carga cuando totalSampleada > 0,
                 * evitando una petición innecesaria en canciones sin samples. */}
                {slug && cancion.totalSampleada > 0 && (
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
                    <TablaRelaciones
                        relaciones={samplesDe}
                        direccion="destino"
                        onEditar={autenticado ? menuCtx.abrirEdicionRelacion : undefined}
                        onEliminar={autenticado ? menuCtx.abrirEliminacionRelacion : undefined}
                        onVerificar={menuCtx.manejarVerificarRelacion}
                    />
                </SeccionRelaciones>
            )}

            {sampleadaEn.length > 0 && (
                <SeccionRelaciones titulo="Sampleada por" contador={sampleadaEn.length}>
                    <TablaRelaciones
                        relaciones={sampleadaEn}
                        direccion="origen"
                        onEditar={autenticado ? menuCtx.abrirEdicionRelacion : undefined}
                        onEliminar={autenticado ? menuCtx.abrirEliminacionRelacion : undefined}
                        onVerificar={menuCtx.manejarVerificarRelacion}
                    />
                </SeccionRelaciones>
            )}

            {/* Sin relaciones */}
            {samplesDe.length === 0 && sampleadaEn.length === 0 && (
                <EstadoVacio
                    icono={<Music size={32} />}
                    mensaje="Aún no se han identificado relaciones de sampling para esta canción."
                />
            )}

            {/* S4.5: Widget cadena de samples */}
            {slug && (samplesDe.length > 0 || sampleadaEn.length > 0) && (
                <CadenaSamples slug={slug} titulo={cancion.titulo} />
            )}

            {/* Menu contextual 3 puntos */}
            <MenuContextual
                abierto={menuCtx.menuAbierto}
                onCerrar={menuCtx.cerrarMenu}
                items={menuCtx.items}
                x={menuCtx.menuPos.x}
                y={menuCtx.menuPos.y}
                alinearDerecha
            />

            {/* Modal contribucion: proponer nuevo sampleo desde esta cancion */}
            {detalle && (
                <ModalContribucion
                    abierto={menuCtx.contribucionAbierta}
                    cancionBaseId={cancion.id}
                    cancionBaseTitulo={cancion.titulo}
                    onCerrar={menuCtx.cerrarContribucion}
                />
            )}

            {/* Modal edicion/eliminacion de relacion existente */}
            <ModalEdicionRelacion
                relacion={menuCtx.relacionEditando}
                modoEliminacion={menuCtx.modoEliminacion}
                onCerrar={menuCtx.cerrarEdicionRelacion}
            />
        </div>
    );
};
