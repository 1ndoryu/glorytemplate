/*
 * SampleDetalleIsland — Kamples
 * Pagina de detalle de un sample individual.
 * Muestra waveform grande, metadata, acciones y samples similares.
 * Logica extraida a useSampleDetalle + useSampleAudio (SRP).
 */

import { useCallback } from 'react';
import {
    Pause,
    AlertCircle,
    Crown,
    Sparkles,
    BadgeCheck,
} from 'lucide-react';
import {
    Badge,
    BotonBase,
} from '@app/components/ui';
import { Skeleton } from '@app/components/skeletons';
import { SkeletonFeed } from '@app/components/skeletons';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import { SampleDetalleAcciones } from '@app/components/samples/SampleDetalleAcciones';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useComentarios } from '@app/hooks/useComentarios';
import { useSampleDetalle } from '@app/hooks/useSampleDetalle';
import { useSampleAudio } from '@app/hooks/useSampleAudio';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/sampleDetalle.css';

const TABS_SAMPLE_DETALLE = [{ id: 'sample', etiqueta: 'Sample' }];

interface SampleDetalleProps {
    slug?: string;
}

export const SampleDetalleIsland = ({ slug: slugProp }: SampleDetalleProps): JSX.Element => {
    const {
        sample, similares, mostrarSimilares, setMostrarSimilares,
        cargando, error, liked, reaccionActual, descargado,
        comentariosVisibles, setComentariosVisibles, esPropietario,
        tagsHome, navegar, usuarioAuth, manejarLike, manejarDescargar,
        manejarReaccionDetalle, manejarQuitarReaccionDetalle, manejarLikeSimilar,
    } = useSampleDetalle({ slugProp });
    const {
        reproduciendo, progreso, picosWaveform, manejarPlay, buscarPosicion,
    } = useSampleAudio(sample);
    const menu = useMenuContextualSample();
    const abrirPlanes = usePlanesModalStore(s => s.abrir);
    const seccionComentarios = useComentarios({
        tipo: 'sample',
        targetId: sample?.id ?? 0,
        cargarAlAbrir: true,
    });

    const manejarToggleComentarios = useCallback(() => {
        setComentariosVisibles(prev => !prev);
        if (!comentariosVisibles && seccionComentarios.comentarios.length === 0) {
            seccionComentarios.cargar(1);
        }
    }, [comentariosVisibles, seccionComentarios, setComentariosVisibles]);

    useTabsIsla('SampleDetalleIsland', TABS_SAMPLE_DETALLE, 'sample');

    if (cargando) {
        return (
            <div className="detalleContenedor" id="seccionSampleDetalle">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacioMd)', padding: 'var(--espacioLg)' }}>
                    <Skeleton alto={64} />
                    <Skeleton alto={120} />
                    <div style={{ display: 'flex', gap: 'var(--espacioSm)' }}>
                        <Skeleton alto={32} ancho={80} />
                        <Skeleton alto={32} ancho={80} />
                        <Skeleton alto={32} ancho={80} />
                    </div>
                    <SkeletonFeed cantidad={3} />
                </div>
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

                    <SampleDetalleAcciones
                        liked={liked}
                        reaccionActual={reaccionActual}
                        onLike={manejarLike}
                        onReaccionar={manejarReaccionDetalle}
                        onQuitarReaccion={manejarQuitarReaccionDetalle}
                        comentariosVisibles={comentariosVisibles}
                        onToggleComentarios={manejarToggleComentarios}
                        descargado={descargado}
                        onDescargar={manejarDescargar}
                        esPremiumBloqueado={!!(sample.esPremium && usuarioAuth?.plan === 'free' && !esPropietario)}
                        onAbrirPlanes={abrirPlanes}
                        onAbrirMenu={menu.abrirMenu}
                        sample={sample as unknown as SampleResumen}
                        seccionComentarios={seccionComentarios}
                        onClickAutorComentario={(u) => navegar(`/perfil/${u}/`)}
                    />
                </div>

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
