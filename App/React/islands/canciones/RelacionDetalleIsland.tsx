/*
 * RelacionDetalleIsland — Kamples
 * Vista de detalle de una relación de sampleo: dos canciones lado a lado
 * con sus videos de YouTube, tipo de relación, metadata, relaciones
 * adicionales de cada canción, likes y comentarios.
 * Lógica extraída a useRelacionDetalle (SRP).
 * Tarjeta de lado extraída a LadoCancionRelacion (SRP).
 */

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Scissors, Upload } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { BotonLike } from '@app/components/social/BotonLike';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { LadoCancionRelacion } from '@app/components/canciones/LadoCancionRelacion';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { Skeleton } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useRelacionDetalle } from '@app/hooks/useRelacionDetalle';
import { useComentarios } from '@app/hooks/useComentarios';
import { useNavigationStore } from '@/core/router';
import { useDevAccionesRelacion } from '@app/hooks/useDevAccionesRelacion';
import { useAuthStore } from '@app/stores/authStore';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { obtenerSamplesDeRelacion } from '@app/services/apiSamples';
import {
    ETIQUETAS_TIPO_RELACION,
    ETIQUETAS_TIPO_ELEMENTO,
} from '@app/types/cancion';
import '../../styles/componentes/relacionDetalle.css';
import '../../styles/componentes/seccionRelaciones.css';

const TABS_RELACION = [{ id: 'relacion', etiqueta: 'Sampleo' }];

interface RelacionDetalleProps {
    id?: string;
    slug?: string;
}

/* Valida formato YouTube ID y construye URL de embed segura */
const construirEmbedUrl = (youtubeId: string): string | null => {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) return null;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
};

/* Valida formato Spotify Track ID y construye URL de embed segura */
const construirSpotifyEmbedUrl = (spotifyId: string): string | null => {
    if (!/^[A-Za-z0-9]{10,30}$/.test(spotifyId)) return null;
    return `https://open.spotify.com/embed/track/${spotifyId}`;
};

export const RelacionDetalleIsland = ({ id, slug }: RelacionDetalleProps): JSX.Element => {
    const idEfectivo = id ?? slug;
    const { relacion, cargando, error, irACancion, irAArtista } = useRelacionDetalle({ id: idEfectivo });
    const navegar = useNavigationStore((s) => s.navegar);

    const relacionId = relacion?.id ?? 0;
    const [comentariosVisibles, setComentariosVisibles] = useState(false);
    const seccionComentarios = useComentarios({ tipo: 'relacion', targetId: relacionId });

    /* Proveedor de samples vinculados a esta relación (sample_fuente_id / sample_destino_id) */
    const proveedorSamplesRelacion = useCallback(
        (_pagina: number) =>
            obtenerSamplesDeRelacion(relacionId).then((r) => (r.ok && r.data ? r.data : [])),
        [relacionId]
    );

    const esAdmin = useAuthStore((s) => s.usuario?.rol === 'admin');
    const autenticado = useAuthStore((s) => s.autenticado);
    const devAcciones = useDevAccionesRelacion(relacionId);

    const manejarSubirSample = useCallback(() => {
        useCrearModalStore.getState().abrir(undefined, false, relacionId > 0 ? relacionId : null);
    }, [relacionId]);

    const manejarToggleComentarios = useCallback(() => {
        setComentariosVisibles(prev => {
            const siguiente = !prev;
            if (siguiente && seccionComentarios.comentarios.length === 0) {
                seccionComentarios.cargar(1);
            }
            return siguiente;
        });
    }, [seccionComentarios]);

    useTabsIsla('RelacionDetalleIsland', TABS_RELACION, 'relacion');

    /* Título SEO descriptivo para el document.title */
    const tituloSeo = relacion
        ? `${relacion.destino_artista ?? ''} - ${relacion.destino_titulo ?? ''} samplea a ${relacion.fuente_artista ?? ''} - ${relacion.fuente_titulo ?? ''}`
            .replace(/\s{2,}/g, ' ').trim()
        : '';

    useEffect(() => {
        if (tituloSeo) {
            document.title = `${tituloSeo} | Kamples`;
        }
    }, [tituloSeo]);

    if (cargando) {
        return (
            <div className="relacionDetalleContenedor" id="seccionRelacionDetalle">
                <div className="relacionDetalleCabecera"><Skeleton alto={24} ancho={200} /></div>
                <div className="relacionDetalleGrid">
                    <div className="relacionDetalleLado">
                        <Skeleton alto={200} /><Skeleton alto={20} /><Skeleton alto={16} ancho={120} />
                    </div>
                    <div className="relacionDetalleLado">
                        <Skeleton alto={200} /><Skeleton alto={20} /><Skeleton alto={16} ancho={120} />
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
                    <BotonBase variante="ghost" onClick={() => window.history.back()}>Volver</BotonBase>
                </div>
            </div>
        );
    }

    const embedDestino = relacion.destino_youtubeId
        ? construirEmbedUrl(relacion.destino_youtubeId)
        : relacion.destino_spotifyId
            ? construirSpotifyEmbedUrl(relacion.destino_spotifyId)
            : null;
    const embedDestinoTipo: 'youtube' | 'spotify' | null = relacion.destino_youtubeId
        ? 'youtube'
        : relacion.destino_spotifyId
            ? 'spotify'
            : null;

    const embedFuente = relacion.fuente_youtubeId
        ? construirEmbedUrl(relacion.fuente_youtubeId)
        : relacion.fuente_spotifyId
            ? construirSpotifyEmbedUrl(relacion.fuente_spotifyId)
            : null;
    const embedFuenteTipo: 'youtube' | 'spotify' | null = relacion.fuente_youtubeId
        ? 'youtube'
        : relacion.fuente_spotifyId
            ? 'spotify'
            : null;


    return (
        <div className="relacionDetalleContenedor" id="seccionRelacionDetalle">
            {/* Cabecera */}
            <div className="relacionDetalleCabecera">
                <h1 className="relacionDetalleTipo">
                    {relacion.destino_titulo && relacion.fuente_titulo
                        ? `${relacion.destino_titulo} samplea a ${relacion.fuente_titulo}`
                        : ETIQUETAS_TIPO_RELACION[relacion.tipoRelacion]}
                </h1>
                <div className="relacionDetalleMeta">
                    {relacion.tipoElemento && (
                        <Badge variante="neutro" tamano="sm">{ETIQUETAS_TIPO_ELEMENTO[relacion.tipoElemento]}</Badge>
                    )}
                    {relacion.verificada && <Badge variante="exito" tamano="sm">Verificada</Badge>}
                    {relacion.apareceEnTodo && <Badge variante="neutro" tamano="sm">En toda la canción</Badge>}
                </div>
                <BotonLike
                    tipo="relacion"
                    targetId={relacion.id}
                    liked={relacion.liked}
                    reaccion={relacion.reaccion as 'like' | 'encanta' | 'dislike' | null}
                    totalLikes={relacion.totalLikes}
                />
                {esAdmin && (
                    <div className="relacionDetalleDevAcciones">
                        <BotonBase
                            variante="ghost"
                            tamano="sm"
                            onClick={devAcciones.manejarGenerarRecorte}
                            disabled={devAcciones.recorteCargando}
                        >
                            <Scissors size={14} />
                            {devAcciones.recorteCargando ? 'Generando...' : 'Generar recorte'}
                        </BotonBase>
                        {devAcciones.recorteMensaje && <span className="relacionDetalleDevMsg">{devAcciones.recorteMensaje}</span>}
                    </div>
                )}
            </div>

            {/* Grid: destino (samplea) → fuente (sampleada) */}
            <div className="relacionDetalleGrid">
                <LadoCancionRelacion
                    etiqueta="Samplea"
                    imagen={relacion.destino_imagen}
                    titulo={relacion.destino_titulo}
                    artista={relacion.destino_artista}
                    slug={relacion.destino_slug}
                    artistaSlug={relacion.destino_artistaSlug}
                    anio={relacion.destino_anio}
                    genero={relacion.destino_genero}
                    album={relacion.destino_album}
                    timings={relacion.timingsDestino}
                    embedUrl={embedDestino}
                    embedTipo={embedDestinoTipo}
                    onClickCancion={irACancion}
                    onClickArtista={irAArtista}
                />
                <LadoCancionRelacion
                    etiqueta="Sampleada"
                    imagen={relacion.fuente_imagen}
                    titulo={relacion.fuente_titulo}
                    artista={relacion.fuente_artista}
                    slug={relacion.fuente_slug}
                    artistaSlug={relacion.fuente_artistaSlug}
                    anio={relacion.fuente_anio}
                    genero={relacion.fuente_genero}
                    album={relacion.fuente_album}
                    timings={relacion.timingsFuente}
                    embedUrl={embedFuente}
                    embedTipo={embedFuenteTipo}
                    onClickCancion={irACancion}
                    onClickArtista={irAArtista}
                />
            </div>

            {/* Samples publicados generados desde esta relación */}
            {autenticado && (
                <div className="relacionDetalleSamplesAccion">
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        onClick={manejarSubirSample}
                    >
                        <Upload size={14} />
                        Subir sample de este sampleo
                    </BotonBase>
                </div>
            )}
            <FeedSamples
                proveedor={proveedorSamplesRelacion}
                claveCache={`relacion-samples-${relacionId}`}
                mostrarTags={false}
                infiniteScroll={false}
                virtualizar={false}
                mensajeVacio=""
            />

            {/* Relaciones adicionales de la canción destino */}
            {(relacion.destinoSamplesDe?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.destino_titulo ?? 'Canción'} samplea a`}
                    contador={relacion.destinoSamplesDe!.length}
                >
                    <TablaRelaciones relaciones={relacion.destinoSamplesDe!} direccion="destino" />
                </SeccionRelaciones>
            )}
            {(relacion.destinoSampleadaEn?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.destino_titulo ?? 'Canción'} fue sampleada en`}
                    contador={relacion.destinoSampleadaEn!.length}
                >
                    <TablaRelaciones relaciones={relacion.destinoSampleadaEn!} direccion="origen" />
                </SeccionRelaciones>
            )}

            {/* Relaciones adicionales de la canción fuente */}
            {(relacion.fuenteSamplesDe?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.fuente_titulo ?? 'Canción'} samplea a`}
                    contador={relacion.fuenteSamplesDe!.length}
                >
                    <TablaRelaciones relaciones={relacion.fuenteSamplesDe!} direccion="destino" />
                </SeccionRelaciones>
            )}
            {(relacion.fuenteSampleadaEn?.length ?? 0) > 0 && (
                <SeccionRelaciones
                    titulo={`${relacion.fuente_titulo ?? 'Canción'} fue sampleada en`}
                    contador={relacion.fuenteSampleadaEn!.length}
                >
                    <TablaRelaciones relaciones={relacion.fuenteSampleadaEn!} direccion="origen" />
                </SeccionRelaciones>
            )}

            {/* Comentarios */}
            <div className="relacionDetalleComentarios">
                <BotonBase
                    variante="ghost"
                    className="relacionDetalleToggleComentarios"
                    onClick={manejarToggleComentarios}
                >
                    {comentariosVisibles ? 'Ocultar comentarios' : `Comentarios (${relacion.totalComentarios})`}
                </BotonBase>
                {comentariosVisibles && (
                    <ListaComentarios
                        comentarios={seccionComentarios.comentarios}
                        cargando={seccionComentarios.cargando}
                        onEnviar={seccionComentarios.enviar}
                        onEnviarMultimedia={seccionComentarios.enviarMultimedia}
                        onClickAutor={(u) => navegar(`/perfil/${u}`)}
                        onCargarMas={seccionComentarios.cargarMas}
                        hayMasPaginas={seccionComentarios.hayMas}
                        onEditar={seccionComentarios.editar}
                        onEliminar={seccionComentarios.eliminar}
                        onReportar={seccionComentarios.reportar}
                        onToggleLike={seccionComentarios.toggleLike}
                        onCargarRespuestas={seccionComentarios.cargarRespuestas}
                        editandoId={seccionComentarios.editandoId}
                        setEditandoId={seccionComentarios.setEditandoId}
                        respondendoAId={seccionComentarios.respondendoAId}
                        setRespondendoAId={seccionComentarios.setRespondendoAId}
                    />
                )}
            </div>
        </div>
    );
};
