/*
 * Componente: PanelDetalleSample — Kamples (C95+C151+C152+C154+C158)
 * Vista condensada de un sample para el panel lateral.
 * Logica extraida a usePanelDetalleSample (SRP).
 */

import { Heart, Download, PanelRightClose, MessageCircle } from 'lucide-react';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TarjetaCancionMini } from '@app/components/canciones/TarjetaCancionMini';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useComentarios } from '@app/hooks/useComentarios';
import { usePanelDetalleSample } from '@app/hooks/usePanelDetalleSample';
import { useRelacionDiscovery } from '@app/hooks/useRelacionDiscovery';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { ImgOptimizada } from '@app/components/ui/ImgOptimizada';
import type { SampleResumen } from '@app/types';
import { useT } from '@app/utils/i18n';
/* [183A-111] PanelDetalleSample migrado a i18n: headings, labels y etiquetas via t() */

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

    const { t } = useT();
    const { relacion: relacionDiscovery } = useRelacionDiscovery(sample.id);

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
                    verificado={sample.creador.verificado}
                    className="panelDetalleAutor"
                />
                <BotonBase variante="ghost" className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label={t('sample.panelCerrar')}>
                    <PanelRightClose size={16} />
                </BotonBase>
            </div>

            {/* Titulo */}
            <h3 className="panelDetalleTitulo">
                {sample.titulo}
                {/* [193A-104] Pendiente: badge PRO desactivado. Restaurar: {sample.esPremium && <Badge variante="premium" tamano="xs">PRO</Badge>} */}
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

                {/* [193A-104] Pendiente: botón PRO/Lock desactivado. Restaurar lógica sample.esPremium ternaria */}
                <BotonBase variante="secundario" tamano="sm">
                    <Download size={14} />
                </BotonBase>

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setComentariosVisibles(prev => !prev)}
                >
                    <MessageCircle size={14} />
                </BotonBase>

                <a
                    href={`/sample/${sample.slug}/`}
                    className="botonBase varianteSecundario tamanoSm"
                    onClick={(e) => {
                        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                            e.preventDefault();
                            navegar(`/sample/${sample.slug}/`);
                        }
                    }}
                >
                    {t('sample.verCompleto')}
                </a>
            </div>

            {/* Discovery: canción de origen si el sample fue extraído del pipeline */}
            {relacionDiscovery && (relacionDiscovery.fuente_slug || relacionDiscovery.destino_slug) && (
                <div className="panelDetalleDiscovery">
                    <h4 className="panelDetalleSubtitulo">{t('sample.origenDelSample')}</h4>
                    <div className="panelDetalleDiscoveryTarjetas">
                        {relacionDiscovery.fuente_slug && (
                            <TarjetaCancionMini
                                titulo={relacionDiscovery.fuente_titulo}
                                artista={relacionDiscovery.fuente_artista}
                                slug={relacionDiscovery.fuente_slug}
                                imagen={relacionDiscovery.fuente_imagen}
                                anio={relacionDiscovery.fuente_anio}
                                etiqueta={t('sample.etiqueta.origen')}
                                esOrigen={relacionDiscovery.ladoExtraccion === 'fuente'}
                            />
                        )}
                        {relacionDiscovery.destino_slug && (
                            <TarjetaCancionMini
                                titulo={relacionDiscovery.destino_titulo}
                                artista={relacionDiscovery.destino_artista}
                                slug={relacionDiscovery.destino_slug}
                                imagen={relacionDiscovery.destino_imagen}
                                anio={relacionDiscovery.destino_anio}
                                etiqueta={t('sample.etiqueta.sampleo')}
                                esOrigen={relacionDiscovery.ladoExtraccion === 'destino'}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* C154: Comentarios ocultos por defecto, se abren con boton */}
            {comentariosVisibles && (
                <div className="panelDetalleComentarios">
                    <h4 className="panelDetalleSubtitulo">{t('sample.comentariosSeccion')}</h4>
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

            {/* [183A-72] Portada de colección origen — fallback de color si no hay imagen.
              * [183A-79] Usa detalle?.coleccionOriginal primero: el sample del prop puede no
              * traer coleccionOriginal si viene del feed (campo opcional). El detalle completo
              * siempre lo incluye cuando el sample pertenece a una colección. */}
            {(() => {
                const coleccion = detalle?.coleccionOriginal ?? sample.coleccionOriginal ?? null;
                if (!coleccion) return null;
                const imgSrc = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);
                const slug = coleccion.slug ?? String(coleccion.id);
                return (
                    <div
                        className="panelColeccionPortada"
                        role="button"
                        tabIndex={0}
                        onClick={() => navegar(`/coleccion/${slug}/`)}
                        onKeyDown={e => e.key === 'Enter' && navegar(`/coleccion/${slug}/`)}
                    >
                        <ImgOptimizada
                            className="panelColeccionPortadaImg"
                            src={imgSrc}
                            alt={coleccion.nombre}
                            w={320}
                            quality={80}
                        />
                        <div className="panelColeccionPortadaInfo">
                            <span className="panelColeccionPortadaNombre">{coleccion.nombre}</span>
                            {sample.creador?.username && (
                                <span className="panelColeccionPortadaAutor">por @{sample.creador.username}</span>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Similares */}
            {similares.length > 0 && (
                <div className="panelDetalleSimilares">
                    <h4 className="panelDetalleSubtitulo">{t('sample.tambienTePodria')}</h4>
                    <div className="panelDetalleSimilaresLista">
                        {similares.map(s => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                contexto={similares}
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
