/*
 * Componente: TarjetaSample
 * Tarjeta compacta de sample para listas y exploradores.
 * Incluye play inline, waveform mini, metadata y acciones rápidas.
 * Lógica extraída a useTarjetaSample (SRP).
 */

import { useRef, type MouseEvent } from 'react';
import { Play, Pause, Heart, MessageCircle, Plus, MoreHorizontal, BadgeCheck, Bookmark, DollarSign, Crown, ThumbsDown } from 'lucide-react';
import { useEsMovil } from '@app/hooks/useEsMovil';
import type { SampleResumen, TipoReaccion } from '../../types';
import { WaveformPlayer } from './WaveformPlayer';
import { Tooltip } from './Tooltip';
import { TooltipReacciones } from './TooltipReacciones';
import { useTarjetaSample } from '@app/hooks/useTarjetaSample';
import { useReproducidosStore } from '@app/stores/reproducidosStore';
import { useT } from '@app/utils/i18n';
import { useSeleccionSamplesStore } from '@app/stores/seleccionSamplesStore';
import { BadgeDebugScore } from './BadgeDebugScore';
import { BadgesMetadata } from './BadgesMetadata';
import '../../styles/componentes/tarjetaSample.css';
import { BotonBase } from './BotonBase';
import { ImgOptimizada } from './ImgOptimizada';

interface TarjetaSampleProps {
    sample: SampleResumen;
    contexto?: SampleResumen[];
    onPlay?: (sample: SampleResumen) => void;
    onPause?: () => void;
    onSeek?: (posicion: number) => void;
    onLike?: (sampleId: number, reaccion?: TipoReaccion) => void;
    onDescargar?: (sampleId: number) => void;
    onMenu?: (e: MouseEvent, sample: SampleResumen) => void;
    onClickCreador?: (username: string) => void;
    onComentar?: (sampleId: number) => void;
    onClickTitulo?: (sample: SampleResumen) => void;
    /* C344: Callback al hacer click en un badge de metadata para filtrar */
    onFiltrarMeta?: (texto: string) => void;
    className?: string;
}

export const TarjetaSample = (props: TarjetaSampleProps): JSX.Element => {
    const { sample } = props;
    const {
        picosAudio, descargado, guardado, comentado, estaReproduciendo, progresoActual, clases, imagenPortada,
        manejarPlayPause, manejarLike, manejarReaccion, manejarQuitarReaccion,
        manejarColeccionar, manejarMenu, manejarGuardar, manejarSeek,
        manejarDragStart, navegar, onClickTitulo, manejarComentar, requiereCompra, esSoloPro,
    } = useTarjetaSample(props);

    /* QQ46: Punto rojo para samples no reproducidos */
    const noReproducido = useReproducidosStore(s => s.cargado && !s.ids.has(sample.id));

    /* QL116: Selección múltiple (Ctrl+Click / Shift+Click) */
    const seleccionado = useSeleccionSamplesStore(s => s.seleccionados.has(sample.id));
    const haySeleccion = useSeleccionSamplesStore(s => s.seleccionados.size > 0);
    const toggleSeleccion = useSeleccionSamplesStore(s => s.toggleSeleccion);
    const seleccionarRango = useSeleccionSamplesStore(s => s.seleccionarRango);
    const { t } = useT();

    const manejarClick = (e: MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            toggleSeleccion(sample);
            return;
        }
        if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            seleccionarRango(sample.id);
            return;
        }
        /* Si hay selección activa, click normal tambien togglea */
        if (haySeleccion) {
            e.preventDefault();
            e.stopPropagation();
            toggleSeleccion(sample);
            return;
        }
        manejarPlayPause(e);
    };

    /* QL12: En movil, tags no filtran — click en tarjeta solo reproduce */
    const esMovil = useEsMovil();

    /* Long press en mobile para abrir menú contextual (500ms) */
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchMovido = useRef(false);

    const iniciarLongPress = (e: React.TouchEvent) => {
        touchMovido.current = false;
        const touch = e.touches[0];
        longPressTimer.current = setTimeout(() => {
            if (touchMovido.current) return;
            const fake = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {},
                stopPropagation: () => {},
            } as MouseEvent;
            manejarMenu(fake);
        }, 500);
    };

    const cancelarLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <div
            className={`${clases}${seleccionado ? ' tarjetaSampleSeleccionado' : ''}`}
            onContextMenu={manejarMenu}
            onClick={manejarClick}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={manejarDragStart}
            onTouchStart={iniciarLongPress}
            onTouchEnd={cancelarLongPress}
            onTouchMove={() => { touchMovido.current = true; cancelarLongPress(); }}
        >
            {/* Portada con overlay play/pause */}
            <div className="tarjetaPortada" aria-label={estaReproduciendo ? t('sample.pausar') : t('sample.reproducir')}>
                <ImgOptimizada className="tarjetaPortadaImg" src={imagenPortada} alt={sample.titulo} w={80} quality={75} />
                <div className={`tarjetaPortadaOverlay ${estaReproduciendo ? 'tarjetaPortadaOverlayActivo' : ''}`}>
                    {estaReproduciendo ? <Pause size={16} /> : <Play size={16} />}
                </div>
            </div>

            {/* Contenido central */}
            <div className="tarjetaContenido">
                <div className="tarjetaCabecera">
                    <a
                        href={`/sample/${sample.slug}/`}
                        className="tarjetaTitulo tarjetaTituloClickeable"
                        onClick={(e) => {
                            if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                /* [183A-71] IMPORTANTE: click en nombre abre panel lateral, NO navega a detalles.
                                 * onClickTitulo se pasa desde el island/feed padre con panelLateralStore.abrirDetalle().
                                 * En móvil: reproduce el audio (QL90). En desktop sin panel: navega a URL como fallback.
                                 * NO cambiar este comportamiento sin revisar todos los usos de onClickTitulo en App/React. */
                                if (onClickTitulo) {
                                    onClickTitulo(sample);
                                } else if (esMovil) {
                                    /* QL90: En movil, click en titulo reproduce en vez de abrir detalles */
                                    manejarPlayPause(e as unknown as MouseEvent);
                                } else {
                                    navegar(`/sample/${sample.slug}/`);
                                }
                            }
                        }}
                    >
                        {sample.titulo}
                    </a>
                    {noReproducido && <span className="tarjetaPuntoRojo" aria-label={t('sample.noReproducido')} />}
                    {sample.verificado && <BadgeCheck size={14} className="tarjetaVerificado" />}
                    {/* [193A-104] Pendiente: badge PRO desactivado. Restaurar: {sample.esPremium && <span className="tarjetaPremium">PRO</span>} */}
                    {sample.scoreDebug && <BadgeDebugScore debug={sample.scoreDebug} />}
                </div>

                <div className="tarjetaMeta">
                    <BadgesMetadata sample={sample} onFiltrar={esMovil ? undefined : props.onFiltrarMeta} />
                </div>
            </div>

            {/* Acciones de tarjeta */}
            <div className="tarjetaAcciones">
                <div className="tarjetaWaveform">
                    <WaveformPlayer
                        picos={picosAudio}
                        progreso={progresoActual}
                        duracion={sample.duracion}
                        onSeek={manejarSeek}
                        tamano="sm"
                        colorNoReproducido="var(--colorWaveformNoReproducido)"
                        colorReproducido="var(--colorWaveformReproducido)"
                        anchoBarra={2}
                        espacioBarra={1}
                        simetrico
                    />
                </div>

                <TooltipReacciones
                    reaccionActual={sample.reaccion}
                    onReaccionar={manejarReaccion}
                    onQuitar={manejarQuitarReaccion}
                >
                    <BotonBase variante="ghost"
                        className={`tarjetaAccionBtn ${sample.liked ? 'tarjetaAccionLiked' : ''} ${
                            sample.reaccion === 'encanta' ? 'reaccionPrincipalEncanta' :
                            sample.reaccion === 'dislike' ? 'reaccionPrincipalDislike' :
                            sample.reaccion === 'like' ? 'reaccionPrincipalLike' : ''
                        }`}
                        onClick={manejarLike}
                        type="button"
                        aria-label={sample.liked ? t('sample.quitarLike') : t('sample.darLike')}
                    >
                        <Heart size={18} fill={sample.liked ? 'currentColor' : 'none'} />
                    </BotonBase>
                </TooltipReacciones>

                {/* [2103A-15] Dislike visible al lado del corazón, fuera del tooltip hover */}
                <BotonBase variante="ghost"
                    className={`tarjetaAccionBtn ${sample.reaccion === 'dislike' ? 'reaccionPrincipalDislike' : ''}`}
                    onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (sample.reaccion === 'dislike') {
                            manejarQuitarReaccion();
                        } else {
                            manejarReaccion('dislike');
                        }
                    }}
                    type="button"
                    aria-label={t('reacciones.noMeGusta')}
                >
                    <ThumbsDown size={18} fill={sample.reaccion === 'dislike' ? 'currentColor' : 'none'} />
                </BotonBase>

                <BotonBase variante="ghost" className={`tarjetaAccionBtn tarjetaAccionGuardarBtn ${guardado ? 'tarjetaAccionLiked' : ''}`} onClick={manejarGuardar} type="button" aria-label={t('sample.guardarColeccion')}>
                    <Bookmark size={18} fill={guardado ? 'currentColor' : 'none'} />
                </BotonBase>

                <BotonBase variante="ghost" className={`tarjetaAccionBtn tarjetaAccionComentarBtn ${comentado ? 'tarjetaAccionLiked' : ''}`} onClick={(e) => { e.stopPropagation(); manejarComentar(sample.id); }} type="button" aria-label={t('sample.comentar')}>
                    <MessageCircle size={18} fill={comentado ? 'currentColor' : 'none'} />
                </BotonBase>

                {(() => {
                    /* QQ16: Determinar icono y tooltip según condición del sample */
                    const etiqueta = requiereCompra
                        ? t('sample.comprar', { precio: `$${sample.precio}` })
                        : esSoloPro ? t('sample.soloPro') : t('sample.coleccionar');
                    const icono = requiereCompra
                        ? <DollarSign size={18} />
                        : esSoloPro ? <Crown size={18} /> : <Plus size={18} />;
                    const clase = [
                        'tarjetaAccionBtn',
                        requiereCompra ? 'tarjetaAccionComprar' : '',
                        esSoloPro ? 'tarjetaAccionPro' : '',
                        descargado ? 'tarjetaAccionLiked' : '',
                    ].filter(Boolean).join(' ');

                    return (
                        <Tooltip texto={etiqueta} posicion="top">
                            <BotonBase variante="ghost" className={clase} onClick={manejarColeccionar} type="button" aria-label={etiqueta}>
                                {icono}
                            </BotonBase>
                        </Tooltip>
                    );
                })()}

                <BotonBase variante="ghost" className="tarjetaAccionBtn paddingExtraAccion tarjetaMenuBtn" onClick={manejarMenu} type="button" aria-label={t('sample.masOpciones')}>
                    <MoreHorizontal size={18} />
                </BotonBase>
            </div>
        </div>
    );
};

export default TarjetaSample;
