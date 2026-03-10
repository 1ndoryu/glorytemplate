/*
 * RelacionDetalleIsland — Kamples
 * Vista de detalle de una relación de sampleo: dos canciones lado a lado
 * con sus videos de YouTube, tipo de relación, metadata, relaciones
 * adicionales de cada canción, likes y comentarios.
 * Lógica extraída a useRelacionDetalle (SRP).
 * Tarjeta de lado extraída a LadoCancionRelacion (SRP).
 */

import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { BotonLike } from '@app/components/social/BotonLike';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { LadoCancionRelacion } from '@app/components/canciones/LadoCancionRelacion';
import { Skeleton } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useRelacionDetalle } from '@app/hooks/useRelacionDetalle';
import { useComentarios } from '@app/hooks/useComentarios';
import { useNavigationStore } from '@/core/router';
import {
    ETIQUETAS_TIPO_RELACION,
    ETIQUETAS_TIPO_ELEMENTO,
} from '@app/types/cancion';
import '../../styles/componentes/relacionDetalle.css';

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

export const RelacionDetalleIsland = ({ id, slug }: RelacionDetalleProps): JSX.Element => {
    const idEfectivo = id ?? slug;
    const { relacion, cargando, error, irACancion, irAArtista } = useRelacionDetalle({ id: idEfectivo });
    const navegar = useNavigationStore((s) => s.navegar);

    const relacionId = relacion?.id ?? 0;
    const [comentariosVisibles, setComentariosVisibles] = useState(false);
    const seccionComentarios = useComentarios({ tipo: 'relacion', targetId: relacionId });

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

    const embedDestino = relacion.destino_youtubeId ? construirEmbedUrl(relacion.destino_youtubeId) : null;
    const embedFuente = relacion.fuente_youtubeId ? construirEmbedUrl(relacion.fuente_youtubeId) : null;
    const tieneRelacionesDestino = (relacion.destinoSamplesDe?.length ?? 0) > 0 || (relacion.destinoSampleadaEn?.length ?? 0) > 0;
    const tieneRelacionesFuente = (relacion.fuenteSamplesDe?.length ?? 0) > 0 || (relacion.fuenteSampleadaEn?.length ?? 0) > 0;

    return (
        <div className="relacionDetalleContenedor" id="seccionRelacionDetalle">
            {/* Cabecera */}
            <div className="relacionDetalleCabecera">
                <h1 className="relacionDetalleTipo">{ETIQUETAS_TIPO_RELACION[relacion.tipoRelacion]}</h1>
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
                    onClickCancion={irACancion}
                    onClickArtista={irAArtista}
                />
            </div>

            {/* Relaciones adicionales de la canción destino */}
            {tieneRelacionesDestino && (
                <div className="relacionDetalleSeccion">
                    <h2 className="relacionDetalleSeccionTitulo">
                        Más sobre {relacion.destino_titulo ?? 'esta canción'}
                    </h2>
                    {(relacion.destinoSamplesDe?.length ?? 0) > 0 && (
                        <div className="relacionDetalleSubseccion">
                            <h3 className="relacionDetalleSubtitulo">Samples que usa</h3>
                            <TablaRelaciones relaciones={relacion.destinoSamplesDe!} direccion="destino" />
                        </div>
                    )}
                    {(relacion.destinoSampleadaEn?.length ?? 0) > 0 && (
                        <div className="relacionDetalleSubseccion">
                            <h3 className="relacionDetalleSubtitulo">Fue sampleada en</h3>
                            <TablaRelaciones relaciones={relacion.destinoSampleadaEn!} direccion="origen" />
                        </div>
                    )}
                </div>
            )}

            {/* Relaciones adicionales de la canción fuente */}
            {tieneRelacionesFuente && (
                <div className="relacionDetalleSeccion">
                    <h2 className="relacionDetalleSeccionTitulo">
                        Más sobre {relacion.fuente_titulo ?? 'esta canción'}
                    </h2>
                    {(relacion.fuenteSamplesDe?.length ?? 0) > 0 && (
                        <div className="relacionDetalleSubseccion">
                            <h3 className="relacionDetalleSubtitulo">Samples que usa</h3>
                            <TablaRelaciones relaciones={relacion.fuenteSamplesDe!} direccion="destino" />
                        </div>
                    )}
                    {(relacion.fuenteSampleadaEn?.length ?? 0) > 0 && (
                        <div className="relacionDetalleSubseccion">
                            <h3 className="relacionDetalleSubtitulo">Fue sampleada en</h3>
                            <TablaRelaciones relaciones={relacion.fuenteSampleadaEn!} direccion="origen" />
                        </div>
                    )}
                </div>
            )}

            {/* Comentarios */}
            <div className="relacionDetalleSeccion">
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
