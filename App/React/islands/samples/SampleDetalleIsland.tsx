/*
 * SampleDetalleIsland — Kamples
 * Pagina de detalle de un sample individual.
 * Muestra waveform grande, metadata, acciones y samples similares.
 * Logica extraida a useSampleDetalle + useSampleAudio (SRP).
 */

import {
    Pause,
    Heart,
    MessageCircle,
    Download,
    AlertCircle,
    Crown,
    Lock,
    MoreHorizontal,
    Sparkles,
    BadgeCheck,
} from 'lucide-react';
import {
    Badge,
    BotonBase,
} from '@app/components/ui';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TooltipReacciones } from '@app/components/ui/TooltipReacciones';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { descargarSample } from '@app/services/apiDescargas';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useComentarios } from '@app/hooks/useComentarios';
import { useSampleDetalle } from '@app/hooks/useSampleDetalle';
import { useSampleAudio } from '@app/hooks/useSampleAudio';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { toast } from '@app/stores/toastStore';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/sampleDetalle.css';

const TABS_SAMPLE_DETALLE = [{ id: 'sample', etiqueta: 'Sample' }];

interface SampleDetalleProps {
    slug?: string;
}

export const SampleDetalleIsland = ({ slug: slugProp }: SampleDetalleProps): JSX.Element => {
    const {
        sample, similares, mostrarSimilares, setMostrarSimilares,
        cargando, error, liked, reaccionActual, descargado, setDescargado,
        comentariosVisibles, setComentariosVisibles, esPropietario,
        tagsHome, navegar, usuarioAuth, manejarLike,
        manejarReaccionDetalle, manejarQuitarReaccionDetalle, manejarLikeSimilar,
    } = useSampleDetalle({ slugProp });
    const {
        reproduciendo, progreso, picosWaveform, manejarPlay, buscarPosicion, audioRef,
    } = useSampleAudio(sample);
    const menu = useMenuContextualSample();
    const abrirPlanes = usePlanesModalStore(s => s.abrir);
    const seccionComentarios = useComentarios({
        tipo: 'sample',
        targetId: sample?.id ?? 0,
        cargarAlAbrir: true,
    });

    useTabsIsla('SampleDetalleIsland', TABS_SAMPLE_DETALLE, 'sample');

    if (cargando) {
        return (
            <div className="detalleContenedor" id="seccionSampleDetalle">
                <div className="detalleCargando">Cargando sample…</div>
            </div>
        );
    }

    /* Error */
    if (error || !sample) {
        return (
            <div className="detalleContenedor" id="seccionSampleDetalle">
                <div className="detalleError">
                    <AlertCircle size={40} />
                    <p>{error || 'Sample no encontrado.'}</p>
                    <BotonBase variante="ghost" onClick={() => window.history.back()}>
                        Volver
                    </BotonBase>
                </div>
            </div>
        );
    }

    return (
        <div className="detalleContenedor" id="seccionSampleDetalle">
            <article className="detalleTarjetaUnica">
                {sample.creador && (
                    <div className="detalleCabeceraInterna">
                        <EnlaceCreador
                            username={sample.creador.username}
                            nombreVisible={sample.creador.nombreVisible}
                            avatarUrl={sample.creador.avatarUrl}
                            tamanoAvatar="md"
                            mostrarUsername
                            className="detalleCabeceraPost"
                        />
                        {!esPropietario && sample.creador && (
                            <BotonFollow
                                usuarioId={sample.creador.id}
                                siguiendo={false}
                            />
                        )}
                        {/* Estado moderación: solo visible para dueño o admin */}
                        {(esPropietario || usuarioAuth?.rol === 'admin') && sample.estado !== 'activo' && (
                            <BadgeModeracion estadoSample={sample.estado} />
                        )}
                    </div>
                )}

                <div className="detalleTarjetaSuperior">
                    <div
                        className="detallePortadaLateral"
                        onClick={manejarPlay}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                manejarPlay();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={reproduciendo ? 'Pausar sample' : 'Reproducir sample'}
                    >
                        <img
                            src={sample.imagenUrl || obtenerImagenColor(sample.id)}
                            alt={sample.titulo}
                            className="detallePortadaImg"
                        />
                        <span className={`detallePortadaEstado ${reproduciendo ? 'detallePortadaEstadoActivo' : ''}`}>
                            {reproduciendo ? <><Pause size={14} /> Sonando</> : 'Click para reproducir'}
                        </span>
                    </div>

                    <div className="detallePanelPrincipal">
                        <h1 className="detalleTituloInterno">
                            {sample.titulo}
                            {sample.verificado && (
                                <BadgeCheck size={16} className="detalleVerificado" />
                            )}
                            {sample.esPremium && (
                                <Badge variante="premium" tamano="xs">
                                    <Crown size={14} /> PRO
                                </Badge>
                            )}
                        </h1>

                        {sample.descripcion && (
                            <p className="detalleDescripcionInterna">{sample.descripcion}</p>
                        )}

                        <div className="detalleWaveformFila">
                            <WaveformPlayer
                                picos={picosWaveform}
                                progreso={progreso}
                                duracion={sample.duracion}
                                tamano="xl"
                                interactivo
                                colorNoReproducido="#d2c8a7"
                                colorReproducido="#4a665b"
                                anchoBarra={2}
                                espacioBarra={1}
                                simetrico
                                onSeek={buscarPosicion}
                                onClick={manejarPlay}
                            />
                        </div>
                    </div>
                </div>

                <div className="detallePieFlex">
                    {tagsHome.length > 0 && (
                        <div className="detalleTagsHome">
                            {tagsHome.map((tag) => (
                                <Badge key={`${tag.clave}-${tag.texto}`} variante="neutro" estilo="borde">
                                    {tag.texto}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="detalleAcciones">
                        <TooltipReacciones
                            reaccionActual={reaccionActual}
                            onReaccionar={manejarReaccionDetalle}
                            onQuitar={manejarQuitarReaccionDetalle}
                        >
                            <button
                                className={`detalleAccionPlano ${liked ? 'detalleAccionPlanoActivo' : ''} ${
                                    reaccionActual === 'encanta' ? 'reaccionPrincipalEncanta' :
                                    reaccionActual === 'dislike' ? 'reaccionPrincipalDislike' : ''
                                }`}
                                onClick={manejarLike}
                                type="button"
                                aria-label={liked ? 'Quitar like' : 'Dar like'}
                            >
                                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                            </button>
                        </TooltipReacciones>
                        <button
                            className="detalleAccionPlano"
                            onClick={() => {
                                setComentariosVisibles(prev => !prev);
                                if (!comentariosVisibles && seccionComentarios.comentarios.length === 0) {
                                    seccionComentarios.cargar(1);
                                }
                            }}
                            type="button"
                            aria-label="Comentarios"
                        >
                            <MessageCircle size={18} />
                        </button>
                        <button
                            className={`detalleAccionPlano ${descargado ? 'detalleAccionPlanoDescargado' : ''}`}
                            onClick={async () => {
                                const resp = await descargarSample(sample.id);
                                if (resp.ok && resp.data?.url) {
                                    setDescargado(true);
                                    const a = document.createElement('a');
                                    a.href = resp.data.url;
                                    a.download = resp.data.nombre || sample.titulo || 'sample';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                } else if (resp.status === 429) {
                                    /* C199: Sin créditos — abrir modal de suscripción */
                                    toast.error(resp.error ?? 'Has alcanzado el límite de descargas diarias');
                                    abrirPlanes();
                                } else if (resp.status === 403) {
                                    toast.error(resp.error ?? 'Se requiere plan Pro o Premium');
                                    abrirPlanes();
                                } else if (!resp.ok) {
                                    toast.error(resp.error ?? 'Error al descargar');
                                }
                            }}
                            type="button"
                            aria-label="Descargar sample"
                        >
                            <Download size={18} />
                        </button>

                        {sample.esPremium && usuarioAuth?.plan === 'free' && !esPropietario && (
                            <button
                                className="detalleAccionPlano detalleAccionPlanoActivo"
                                onClick={abrirPlanes}
                                type="button"
                                aria-label="Requiere plan Pro"
                            >
                                <Lock size={18} />
                            </button>
                        )}

                        {/* C127: Menú de 3 puntos para el sample principal */}
                        <button
                            className="detalleAccionPlano"
                            onClick={(e) => menu.abrirMenu(e as React.MouseEvent, sample as unknown as SampleResumen)}
                            type="button"
                            aria-label="Más opciones"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                </div>

                {/* Sección de comentarios — expandidos por defecto (C128) */}
                {comentariosVisibles && (
                    <div className="detalleSeccion detalleComentariosSeccion">
                        <ListaComentarios
                            comentarios={seccionComentarios.comentarios}
                            cargando={seccionComentarios.cargando}
                            onEnviar={seccionComentarios.enviar}
                            onEnviarMultimedia={seccionComentarios.enviarMultimedia}
                            onClickAutor={(u) => navegar(`/perfil/${u}/`)}
                            maxVisibles={5}
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
                    </div>
                )}

            </article>

            {/* C156: Samples similares ocultos por defecto, toggled via menu 3 puntos */}
            {mostrarSimilares && similares.length > 0 && (
                <div className="detalleSeccion detalleSimilaresSeccion">
                    <h2 className="detalleSeccionTitulo">También te podría gustar</h2>
                    <div className="detalleSimilares">
                        {similares.map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                onLike={manejarLikeSimilar}
                                onMenu={menu.abrirMenu}
                                onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={[
                    ...menu.items,
                    /* C156: Item para mostrar/ocultar similares */
                    ...(similares.length > 0 ? [{
                        id: 'similares',
                        etiqueta: mostrarSimilares ? 'Ocultar recomendaciones' : 'También te podría gustar',
                        icono: <Sparkles size={16} />,
                        onClick: () => setMostrarSimilares(prev => !prev),
                    }] : []),
                ]}
                x={menu.estado.x}
                y={menu.estado.y}
            />
        </div>
    );
};

export default SampleDetalleIsland;
