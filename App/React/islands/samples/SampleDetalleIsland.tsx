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
    /* [193A-104] Pendiente: Crown eliminado temporalmente (badge PRO desactivado) */
    BadgeCheck,
    ArrowLeft,
} from 'lucide-react';
import {
    Badge,
    BotonBase,
} from '@app/components/ui';
import { Skeleton } from '@app/components/skeletons';
import { SkeletonFeed } from '@app/components/skeletons';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import { SampleDetalleAcciones } from '@app/components/samples/SampleDetalleAcciones';
import { SeccionSampleDiscovery } from '@app/components/samples/SeccionSampleDiscovery';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { ModalInspectorSample } from '@app/components/ui/ModalInspectorSample';
import { ModalCodigoExpirado } from '@app/components/ui/ModalCodigoExpirado';
import { useComentarios } from '@app/hooks/useComentarios';
import { useSampleDetalle } from '@app/hooks/useSampleDetalle';
import { useSampleAudio } from '@app/hooks/useSampleAudio';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { useCodigosGratis } from '@app/hooks/useCodigosGratis';
import type { SampleResumen } from '@app/types';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/sampleDetalle.css';

const TABS_SAMPLE_DETALLE = [{ id: 'sample', etiqueta: 'Sample' }];

interface SampleDetalleProps {
    slug?: string;
}

export const SampleDetalleIsland = ({ slug: slugProp }: SampleDetalleProps): JSX.Element => {
    const { t } = useT();
    const {
        sample, cargando, error, liked, reaccionActual, descargado,
        comentariosVisibles, setComentariosVisibles, esPropietario,
        tagsHome, navegar, usuarioAuth, manejarLike, manejarDescargar,
        manejarReaccionDetalle, manejarQuitarReaccionDetalle,
    } = useSampleDetalle({ slugProp });
    const {
        reproduciendo, progreso, picosWaveform, manejarPlay, buscarPosicion,
    } = useSampleAudio(sample);
    const menu = useMenuContextualSample();
    const abrirPlanes = usePlanesModalStore(s => s.abrir);
    /* [183A-106] Detecta ?codigoGratis= en URL y reclama descarga gratis */
    useCodigosGratis();
    const seccionComentarios = useComentarios({
        tipo: 'sample',
        targetId: sample?.id ?? 0,
        cargarAlAbrir: true,
    });
    const rutaColeccionOriginal = sample?.coleccionOriginal
        ? `/coleccion/${sample.coleccionOriginal.slug ?? sample.coleccionOriginal.id}/`
        : null;

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
                    <BotonBase variante="ghost" className="botonVolver" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} />
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
                            verificado={sample.creador.verificado}
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
                        aria-label={reproduciendo ? t('cancion.pausarSample') : t('cancion.reproducirSample')}
                    >
                        <img
                            src={sample.imagenUrl || obtenerImagenColor(sample.id)}
                            alt={sample.titulo}
                            className="detallePortadaImg"
                        />
                        <span className={`detallePortadaEstado ${reproduciendo ? 'detallePortadaEstadoActivo' : ''}`}>
                            {reproduciendo ? <><Pause size={14} /> {t('sample.detalle.sonando')}</> : t('sample.detalle.clickParaReproducir')}
                        </span>
                    </div>

                    <div className="detallePanelPrincipal">
                        <h1 className="detalleTituloInterno">
                            {sample.titulo}
                            {sample.verificado && (
                                <BadgeCheck size={16} className="detalleVerificado" />
                            )}
                            {/* [193A-104] Pendiente: badge PRO desactivado. Restaurar:
                            {sample.esPremium && (
                                <Badge variante="premium" tamano="xs">
                                    <Crown size={14} /> PRO
                                </Badge>
                            )} */}
                        </h1>

                        {(() => {
                            const meta = sample.metadata;
                            /* QK85: Usar descripcion corta EN (generada por IA). Fallback a ES si no existe EN. */
                            const desc = meta?.descripcion_corta ?? meta?.descripcionCorta
                                ?? meta?.descripcion_corta_es ?? meta?.descripcionCortaEs
                                ?? null;
                            return desc ? <p className="detalleDescripcionInterna">{desc}</p> : null;
                        })()}

                        <div className="detalleWaveformFila">
                            <WaveformPlayer
                                picos={picosWaveform}
                                progreso={progreso}
                                duracion={sample.duracion}
                                tamano="xl"
                                interactivo
                                colorNoReproducido="var(--colorWaveformNoReproducido)"
                                colorReproducido="var(--colorWaveformReproducido)"
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
                            {sample.coleccionOriginal && rutaColeccionOriginal && (
                                <Badge
                                    variante="info"
                                    estilo="borde"
                                    interactivo
                                    onClick={() => navegar(rutaColeccionOriginal)}
                                >
                                    {sample.coleccionOriginal.nombre}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* QQ78: Mostrar artista vibes de la metadata IA */}
                    {(() => {
                        const vibes = sample.metadata?.artista_vibes ?? sample.metadata?.artistaVibes;
                        const arr = Array.isArray(vibes) ? vibes : [];
                        return arr.length > 0 ? (
                            <div className="detalleTagsHome">
                                {arr.map((v) => (
                                    <Badge key={String(v)} variante="acento" tamano="xs">{String(v)}</Badge>
                                ))}
                            </div>
                        ) : null;
                    })()}

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
                        /* [193A-104] Pendiente: esPremiumBloqueado desactivado. Restaurar original */
                        esPremiumBloqueado={false}
                        onAbrirPlanes={abrirPlanes}
                        onAbrirColeccionOriginal={rutaColeccionOriginal ? () => navegar(rutaColeccionOriginal) : undefined}
                        nombreColeccionOriginal={sample.coleccionOriginal?.nombre ?? null}
                        onAbrirMenu={menu.abrirMenu}
                        sample={sample as unknown as SampleResumen}
                        seccionComentarios={seccionComentarios}
                        onClickAutorComentario={(u) => navegar(`/perfil/${u}/`)}
                    />
                </div>

            </article>

            {/* S4.4: Sample Discovery — muestra canción fuente/destino si existe */}
            <SeccionSampleDiscovery sampleId={sample.id} />

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />

            <ModalInspectorSample
                abierto={!!menu.sampleInspeccion}
                onCerrar={menu.cerrarInspeccion}
                sample={menu.sampleInspeccion}
            />
            {/* [183A-110] Modal de compensación por código de descarga expirado */}
            <ModalCodigoExpirado />
        </div>
    );
};

export default SampleDetalleIsland;
