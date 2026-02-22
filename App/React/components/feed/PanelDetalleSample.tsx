/*
 * Componente: PanelDetalleSample — Kamples (C95+C151+C152+C154+C158)
 * Vista condensada de un sample para el panel lateral.
 * Logica extraida a usePanelDetalleSample (SRP).
 */

import { Heart, Download, Lock, PanelRightClose, MessageCircle } from 'lucide-react';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useComentarios } from '@app/hooks/useComentarios';
import { usePanelDetalleSample } from '@app/hooks/usePanelDetalleSample';
import type { SampleResumen } from '@app/types';

interface PanelDetalleSampleProps {
    sample: SampleResumen;
}

export const PanelDetalleSample = ({ sample }: PanelDetalleSampleProps): JSX.Element => {
    const {
        detalle, liked, totalLikes, similares,
        comentariosVisibles, setComentariosVisibles, navegar, cerrar,
        picosAudio, progresoAudio,
        manejarClickWaveform, manejarSeek, manejarLike, badges,
    } = usePanelDetalleSample(sample);

    const {
        comentarios, cargando: cargandoComentarios, enviar: enviarComentario,
        enviarMultimedia: enviarComentarioMultimedia,
        cargarMas: cargarMasComentarios, hayMas: hayMasComentarios,
        editar: editarComentario, eliminar: eliminarComentario,
        reportar: reportarComentario, toggleLike: toggleLikeComentario,
        cargarRespuestas: cargarRespuestasComentario,
        editandoId, setEditandoId, respondendoAId, setRespondendoAId,
    } = useComentarios({
        tipo: 'sample',
        targetId: sample.id,
        cargarAlAbrir: comentariosVisibles,
    });

    return (
        <div className="panelDetalle">
            {/* Cabecera con boton cerrar — C158: PanelRightClose en vez de X */}
            <div className="panelDetalleCabecera">
                <EnlaceCreador
                    username={sample.creador.username}
                    nombreVisible={sample.creador.nombreVisible}
                    avatarUrl={sample.creador.avatarUrl}
                    className="panelDetalleAutor"
                />
                <button className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label="Cerrar panel">
                    <PanelRightClose size={16} />
                </button>
            </div>

            {/* Titulo */}
            <h3 className="panelDetalleTitulo">
                {sample.titulo}
                {sample.esPremium && <Badge variante="premium" tamano="xs">PRO</Badge>}
            </h3>

            {/* Descripcion */}
            {detalle?.descripcion && (
                <p className="panelDetalleDescripcion">{detalle.descripcion}</p>
            )}

            {/* C151: Waveform reproducible */}
            <div className="panelDetalleWaveform">
                <WaveformPlayer
                    picos={picosAudio}
                    progreso={progresoAudio}
                    duracion={sample.duracion}
                    onSeek={manejarSeek}
                    onClick={manejarClickWaveform}
                    tamano="md"
                    interactivo
                />
            </div>

            {/* C152: Tags/Badges de metadata con borde */}
            {badges.length > 0 && (
                <div className="panelDetalleTags">
                    {badges.map(b => (
                        <Badge key={b} variante="neutro" estilo="borde" tamano="xs">{b}</Badge>
                    ))}
                </div>
            )}

            {/* C154: Acciones con bordes en vez de ghost */}
            <div className="panelDetalleAcciones">
                <BotonBase
                    variante={liked ? 'primario' : 'secundario'}
                    tamano="sm"
                    onClick={manejarLike}
                >
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    {totalLikes}
                </BotonBase>

                {sample.esPremium ? (
                    <BotonBase variante="secundario" tamano="sm" disabled>
                        <Lock size={14} />
                        PRO
                    </BotonBase>
                ) : (
                    <BotonBase variante="secundario" tamano="sm">
                        <Download size={14} />
                    </BotonBase>
                )}

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setComentariosVisibles(prev => !prev)}
                >
                    <MessageCircle size={14} />
                </BotonBase>

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    onClick={() => navegar(`/sample/${sample.slug}/`)}
                >
                    Ver completo
                </BotonBase>
            </div>

            {/* C154: Comentarios ocultos por defecto, se abren con boton */}
            {comentariosVisibles && (
                <div className="panelDetalleComentarios">
                    <h4 className="panelDetalleSubtitulo">Comentarios</h4>
                    <ListaComentarios
                        comentarios={comentarios}
                        cargando={cargandoComentarios}
                        onEnviar={enviarComentario}
                        onEnviarMultimedia={enviarComentarioMultimedia}
                        onClickAutor={(username) => navegar(`/perfil/${username}/`)}
                        maxVisibles={5}
                        onCargarMas={cargarMasComentarios}
                        hayMasPaginas={hayMasComentarios}
                        onEditar={editarComentario}
                        onEliminar={eliminarComentario}
                        onReportar={reportarComentario}
                        onToggleLike={toggleLikeComentario}
                        onCargarRespuestas={cargarRespuestasComentario}
                        editandoId={editandoId}
                        setEditandoId={setEditandoId}
                        respondendoAId={respondendoAId}
                        setRespondendoAId={setRespondendoAId}
                    />
                </div>
            )}

            {/* Similares */}
            {similares.length > 0 && (
                <div className="panelDetalleSimilares">
                    <h4 className="panelDetalleSubtitulo">También te podría gustar</h4>
                    <div className="panelDetalleSimilaresLista">
                        {similares.map(s => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                                className="panelDetalleTarjetaMini"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelDetalleSample;
