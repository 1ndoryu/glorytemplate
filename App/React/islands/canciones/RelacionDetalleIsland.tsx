/*
 * RelacionDetalleIsland - Kamples
 * Vista de detalle de una relacion de sampleo: dos canciones lado a lado
 * con sus videos de YouTube, tipo de relacion, metadata, relaciones
 * adicionales de cada cancion, likes y comentarios.
 * Logica extraida a useRelacionDetalleIsland (SRP).
 * Tarjeta de lado extraida a LadoCancionRelacion (SRP).
 */

import { AlertCircle, MoreVertical, ArrowLeft } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { BotonLike } from '@app/components/social/BotonLike';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { LadoCancionRelacion } from '@app/components/canciones/LadoCancionRelacion';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { ModalVincularSampleExistente } from '@app/components/samples/ModalVincularSampleExistente';
import { Skeleton } from '@app/components/skeletons';
import { useRelacionDetalleIsland } from '@app/hooks/useRelacionDetalleIsland';
import { ETIQUETAS_TIPO_RELACION, ETIQUETAS_TIPO_ELEMENTO } from '@app/types/cancion';
import '../../styles/componentes/relacionDetalle.css';
import '../../styles/componentes/seccionRelaciones.css';

interface RelacionDetalleProps {
    id?: string;
    slug?: string;
}

export const RelacionDetalleIsland = ({ id, slug }: RelacionDetalleProps): JSX.Element => {
    const {
        relacion, cargando, error, irACancion, irAArtista, navegar,
        comentariosVisibles, manejarToggleComentarios, seccionComentarios,
        proveedorSamplesRelacion, relacionId,
        autenticado, menuCtx,
        embedDestino, embedFuente,
    } = useRelacionDetalleIsland(id ?? slug);

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
                    <BotonBase variante="ghost" className="botonVolver" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} /> Volver
                    </BotonBase>
                </div>
            </div>
        );
    }

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
                    {relacion.apareceEnTodo && <Badge variante="neutro" tamano="sm">En toda la cancion</Badge>}
                    {relacion.contribuidorUsername && (
                        <Badge variante="neutro" tamano="sm">Contribuido por {relacion.contribuidorUsername}</Badge>
                    )}
                </div>
                <div className="relacionDetalleCabeceraAcciones">
                    <BotonLike
                        tipo="relacion"
                        targetId={relacion.id}
                        liked={relacion.liked}
                        reaccion={relacion.reaccion as 'like' | 'encanta' | 'dislike' | null}
                        totalLikes={relacion.totalLikes}
                    />
                    {autenticado && (
                        <BotonBase variante="ghost" tamano="ninguno" className="relacionDetalleMenuBtn" onClick={menuCtx.abrirMenu} aria-label="Acciones">
                            <MoreVertical size={20} />
                        </BotonBase>
                    )}
                </div>
            </div>

            {/* Grid: destino (samplea) → fuente (sampleada) */}
            <div className="relacionDetalleGrid">
                <LadoCancionRelacion
                    etiqueta="Samplea" imagen={relacion.destino_imagen}
                    titulo={relacion.destino_titulo} artista={relacion.destino_artista}
                    slug={relacion.destino_slug} artistaSlug={relacion.destino_artistaSlug}
                    anio={relacion.destino_anio} genero={relacion.destino_genero} album={relacion.destino_album}
                    timings={relacion.timingsDestino}
                    embedUrl={embedDestino.url} embedTipo={embedDestino.tipo}
                    onClickCancion={irACancion} onClickArtista={irAArtista}
                />
                <LadoCancionRelacion
                    etiqueta="Sampleada" imagen={relacion.fuente_imagen}
                    titulo={relacion.fuente_titulo} artista={relacion.fuente_artista}
                    slug={relacion.fuente_slug} artistaSlug={relacion.fuente_artistaSlug}
                    anio={relacion.fuente_anio} genero={relacion.fuente_genero} album={relacion.fuente_album}
                    timings={relacion.timingsFuente}
                    embedUrl={embedFuente.url} embedTipo={embedFuente.tipo}
                    onClickCancion={irACancion} onClickArtista={irAArtista}
                />
            </div>

            {/* Samples publicados generados desde esta relacion:
             * Solo se renderiza cuando totalSamples > 0, evitando
             * peticion innecesaria en relaciones sin samples adjuntos. */}
            {relacion.totalSamples > 0 && (
                <FeedSamples
                    proveedor={proveedorSamplesRelacion} claveCache={`relacion-samples-${relacionId}`}
                    mostrarTags={false} infiniteScroll={false} virtualizar={false} mensajeVacio=""
                />
            )}

            {/* Relaciones adicionales de la cancion destino */}
            {(relacion.destinoSamplesDe?.length ?? 0) > 0 && (
                <SeccionRelaciones titulo={`${relacion.destino_titulo ?? 'Cancion'} samplea a`} contador={relacion.destinoSamplesDe!.length}>
                    <TablaRelaciones relaciones={relacion.destinoSamplesDe!} direccion="destino" />
                </SeccionRelaciones>
            )}
            {(relacion.destinoSampleadaEn?.length ?? 0) > 0 && (
                <SeccionRelaciones titulo={`${relacion.destino_titulo ?? 'Cancion'} fue sampleada en`} contador={relacion.destinoSampleadaEn!.length}>
                    <TablaRelaciones relaciones={relacion.destinoSampleadaEn!} direccion="origen" />
                </SeccionRelaciones>
            )}

            {/* Relaciones adicionales de la cancion fuente */}
            {(relacion.fuenteSamplesDe?.length ?? 0) > 0 && (
                <SeccionRelaciones titulo={`${relacion.fuente_titulo ?? 'Cancion'} samplea a`} contador={relacion.fuenteSamplesDe!.length}>
                    <TablaRelaciones relaciones={relacion.fuenteSamplesDe!} direccion="destino" />
                </SeccionRelaciones>
            )}
            {(relacion.fuenteSampleadaEn?.length ?? 0) > 0 && (
                <SeccionRelaciones titulo={`${relacion.fuente_titulo ?? 'Cancion'} fue sampleada en`} contador={relacion.fuenteSampleadaEn!.length}>
                    <TablaRelaciones relaciones={relacion.fuenteSampleadaEn!} direccion="origen" />
                </SeccionRelaciones>
            )}

            {/* Comentarios */}
            <div className="relacionDetalleComentarios">
                <BotonBase variante="ghost" className="relacionDetalleToggleComentarios" onClick={manejarToggleComentarios}>
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

            {/* Menu contextual 3 puntos */}
            <MenuContextual
                abierto={menuCtx.menuAbierto} onCerrar={menuCtx.cerrarMenu}
                items={menuCtx.items} x={menuCtx.menuPos.x} y={menuCtx.menuPos.y} alinearDerecha
            />

            {/* L7.4: Modal vincular sample existente */}
            <ModalVincularSampleExistente
                abierto={menuCtx.vincularAbierto} relacionId={relacion.id}
                ladoFuente={relacion.cancionFuenteId ? { cancionId: relacion.cancionFuenteId, titulo: relacion.fuente_titulo ?? 'Desconocida', artista: relacion.fuente_artista ?? undefined } : undefined}
                ladoDestino={relacion.cancionDestinoId ? { cancionId: relacion.cancionDestinoId, titulo: relacion.destino_titulo ?? 'Desconocida', artista: relacion.destino_artista ?? undefined } : undefined}
                onCerrar={menuCtx.cerrarVincular} onExito={menuCtx.cerrarVincular}
            />
        </div>
    );
};
