/*
 * Componente: TarjetaSample
 * Tarjeta compacta de sample para listas y exploradores.
 * Incluye play inline, waveform mini, metadata y acciones rápidas.
 * Lógica extraída a useTarjetaSample (SRP).
 */

import { useRef, type MouseEvent } from 'react';
import { Play, Pause, Heart, MessageCircle, Plus, MoreHorizontal, BadgeCheck, Bookmark, DollarSign, Crown } from 'lucide-react';
import type { SampleResumen, TipoReaccion } from '../../types';
import { WaveformPlayer } from './WaveformPlayer';
import { Badge } from './Badge';
import { Tooltip } from './Tooltip';
import { etiquetaBpm } from '../../services/bpmUtils';
import { TooltipReacciones } from './TooltipReacciones';
import { useTarjetaSample, formatearKey } from '@app/hooks/useTarjetaSample';
import { useReproducidosStore } from '@app/stores/reproducidosStore';
import '../../styles/componentes/tarjetaSample.css';
import { BotonBase } from './BotonBase';

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
            className={clases}
            onContextMenu={manejarMenu}
            onClick={manejarPlayPause}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={manejarDragStart}
            onTouchStart={iniciarLongPress}
            onTouchEnd={cancelarLongPress}
            onTouchMove={() => { touchMovido.current = true; cancelarLongPress(); }}
        >
            {/* Portada con overlay play/pause */}
            <div className="tarjetaPortada" aria-label={estaReproduciendo ? 'Pausar' : 'Reproducir'}>
                <img className="tarjetaPortadaImg" src={imagenPortada} alt={sample.titulo} loading="lazy" />
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
                                if (onClickTitulo) {
                                    onClickTitulo(sample);
                                } else {
                                    navegar(`/sample/${sample.slug}/`);
                                }
                            }
                        }}
                    >
                        {sample.titulo}
                    </a>
                    {noReproducido && <span className="tarjetaPuntoRojo" aria-label="No reproducido" />}
                    {sample.verificado && <BadgeCheck size={14} className="tarjetaVerificado" />}
                    {sample.esPremium && <span className="tarjetaPremium">PRO</span>}
                </div>

                <div className="tarjetaMeta">
                    <BadgesMetadata sample={sample} onFiltrar={props.onFiltrarMeta} />
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
                        colorNoReproducido="#d2c8a7"
                        colorReproducido="#4a665b"
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
                        aria-label={sample.liked ? 'Quitar like' : 'Dar like'}
                    >
                        <Heart size={18} fill={sample.liked ? 'currentColor' : 'none'} />
                    </BotonBase>
                </TooltipReacciones>

                <BotonBase variante="ghost" className={`tarjetaAccionBtn tarjetaAccionGuardarBtn ${guardado ? 'tarjetaAccionLiked' : ''}`} onClick={manejarGuardar} type="button" aria-label="Guardar en colección">
                    <Bookmark size={18} fill={guardado ? 'currentColor' : 'none'} />
                </BotonBase>

                <BotonBase variante="ghost" className={`tarjetaAccionBtn tarjetaAccionComentarBtn ${comentado ? 'tarjetaAccionLiked' : ''}`} onClick={(e) => { e.stopPropagation(); manejarComentar(sample.id); }} type="button" aria-label="Comentar">
                    <MessageCircle size={18} fill={comentado ? 'currentColor' : 'none'} />
                </BotonBase>

                {(() => {
                    /* QQ16: Determinar icono y tooltip según condición del sample */
                    const etiqueta = requiereCompra
                        ? `Comprar $${sample.precio}`
                        : esSoloPro ? 'Solo Pro' : 'Coleccionar';
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

                <BotonBase variante="ghost" className="tarjetaAccionBtn paddingExtraAccion tarjetaMenuBtn" onClick={manejarMenu} type="button" aria-label="Más opciones">
                    <MoreHorizontal size={18} />
                </BotonBase>
            </div>
        </div>
    );
};

/*
 * Subcomponente: BadgesMetadata
 * Renderiza badges de metadata inteligente del sample (instrumento, género, emoción, BPM, tags).
 * C344: Si onFiltrar está presente, los badges son clickables para filtrar la vista.
 */
interface BadgesMetadataProps {
    sample: SampleResumen;
    onFiltrar?: (texto: string) => void;
}

const BadgesMetadata = ({ sample, onFiltrar }: BadgesMetadataProps): JSX.Element => {
    const meta = sample.metadata;
    const badges: { texto: string; clave: string }[] = [];
    const usados = new Set<string>();

    const agregarBadge = (valores: unknown, clave: string) => {
        const arr = Array.isArray(valores) ? valores : valores ? [valores] : [];
        for (const v of arr) {
            if (typeof v === 'string' && v.trim()) {
                const normalizado = v.toLowerCase().trim();
                if (!usados.has(normalizado)) {
                    usados.add(normalizado);
                    badges.push({ texto: v, clave });
                    return;
                }
            }
        }
    };

    agregarBadge(meta?.instrumentos ?? meta?.['instrumentos'], 'inst');
    agregarBadge(meta?.genero ?? meta?.['genero'], 'gen');
    /* QQ21b: Preferir tags en inglés en el front; español se preserva para búsqueda */
    agregarBadge(meta?.emocion ?? meta?.emocion_es ?? meta?.emocionEs, 'emo');

    if (sample.bpm) {
        badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'vel' });
    }

    agregarBadge(meta?.tags ?? meta?.tags_es ?? meta?.tagsEs ?? sample.tags, 'tag');

    /* Fallback si no hay metadata IA */
    if (badges.length === 0) {
        if (sample.bpm) badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'bpm' });
        if (sample.key) badges.push({ texto: formatearKey(sample.key, sample.escala), clave: 'key' });
        badges.push({ texto: sample.tipo, clave: 'tipo' });
    }

    return (
        <>
            {badges.map(({ texto, clave }) => (
                <Badge
                    key={clave}
                    variante="neutro"
                    className={onFiltrar ? 'tarjetaMetaBadgeClickable' : undefined}
                    onClick={onFiltrar ? (e: React.MouseEvent) => {
                        e.stopPropagation();
                        onFiltrar(texto);
                    } : undefined}
                >
                    {texto}
                </Badge>
            ))}
        </>
    );
};

export default TarjetaSample;
