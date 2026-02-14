/*
 * Componente: TarjetaSample
 * Tarjeta compacta de sample para listas y exploradores.
 * Incluye play inline, waveform mini, metadata y acciones rápidas.
 */

import { useCallback, type MouseEvent } from 'react';
import { Play, Pause, Heart, Download, MoreHorizontal } from 'lucide-react';
import type { SampleResumen } from '../../types';
import { WaveformPlayer } from './WaveformPlayer';
import { Badge } from './Badge';
import '../../styles/componentes/tarjetaSample.css';

interface TarjetaSampleProps {
    sample: SampleResumen;
    activa?: boolean;
    reproduciendo?: boolean;
    progreso?: number;
    onPlay?: (sample: SampleResumen) => void;
    onPause?: () => void;
    onSeek?: (posicion: number) => void;
    onLike?: (sampleId: number) => void;
    onDescargar?: (sampleId: number) => void;
    onMenu?: (e: MouseEvent, sample: SampleResumen) => void;
    onClickCreador?: (username: string) => void;
    className?: string;
}

/* Formatear duración de segundos a m:ss */
const formatearDuracion = (segundos: number): string => {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

/* Formatear nota musical con escala */
const formatearKey = (key: string | null, escala: string | null): string => {
    if (!key) return '';
    const esc = escala === 'menor' ? 'm' : '';
    return `${key}${esc}`;
};

export const TarjetaSample = ({
    sample,
    activa = false,
    reproduciendo = false,
    progreso = 0,
    onPlay,
    onPause,
    onSeek,
    onLike,
    onDescargar,
    onMenu,
    onClickCreador,
    className = '',
}: TarjetaSampleProps): JSX.Element => {
    const manejarPlayPause = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            if (activa && reproduciendo) {
                onPause?.();
            } else {
                onPlay?.(sample);
            }
        },
        [activa, reproduciendo, onPlay, onPause, sample]
    );

    const manejarLike = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onLike?.(sample.id);
        },
        [onLike, sample.id]
    );

    const manejarDescargar = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onDescargar?.(sample.id);
        },
        [onDescargar, sample.id]
    );

    const manejarMenu = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            onMenu?.(e, sample);
        },
        [onMenu, sample]
    );

    const manejarClickCreador = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onClickCreador?.(sample.creador.username);
        },
        [onClickCreador, sample.creador.username]
    );

    const clases = [
        'tarjetaSample',
        activa ? 'tarjetaSampleActiva' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={clases} onContextMenu={manejarMenu}>
            {/* Play/Pause */}
            <button
                className={`tarjetaPlayBtn ${activa && reproduciendo ? 'tarjetaPlayBtnActivo' : ''}`}
                onClick={manejarPlayPause}
                type="button"
                aria-label={reproduciendo && activa ? 'Pausar' : 'Reproducir'}
            >
                {activa && reproduciendo ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Contenido central */}
            <div className="tarjetaContenido">
                <div className="tarjetaCabecera">
                    <span className="tarjetaTitulo">{sample.titulo}</span>
                    {sample.esPremium && <span className="tarjetaPremium">PRO</span>}
                </div>

                <div className="tarjetaMeta">
                    <span
                        className="tarjetaCreador"
                        onClick={manejarClickCreador}
                        role="link"
                        tabIndex={0}
                    >
                        {sample.creador.nombreVisible || sample.creador.username}
                    </span>
                    {sample.bpm && (
                        <Badge variante="neutro" estilo="borde">{sample.bpm} BPM</Badge>
                    )}
                    {sample.key && (
                        <Badge variante="neutro" estilo="borde">
                            {formatearKey(sample.key, sample.escala)}
                        </Badge>
                    )}
                    <span className="tarjetaMetaItem">{sample.tipo}</span>
                    <span className="tarjetaDuracion">{formatearDuracion(sample.duracion)}</span>
                </div>

                {/* Waveform mini solo en tarjeta activa */}
                {activa && (
                    <div className="tarjetaWaveform">
                        <WaveformPlayer
                            picos={null}
                            progreso={progreso}
                            duracion={sample.duracion}
                            onSeek={onSeek}
                            tamano="sm"
                        />
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="tarjetaAcciones">
                <div className="tarjetaStats">
                    <span className="tarjetaStatItem">
                        <Heart size={10} /> {sample.totalLikes}
                    </span>
                    <span className="tarjetaStatItem">
                        <Download size={10} /> {sample.totalDescargas}
                    </span>
                </div>

                <button
                    className={`tarjetaAccionBtn ${sample.liked ? 'tarjetaAccionLiked' : ''}`}
                    onClick={manejarLike}
                    type="button"
                    aria-label={sample.liked ? 'Quitar like' : 'Dar like'}
                >
                    <Heart size={14} fill={sample.liked ? 'currentColor' : 'none'} />
                </button>

                <button
                    className="tarjetaAccionBtn"
                    onClick={manejarDescargar}
                    type="button"
                    aria-label="Descargar"
                >
                    <Download size={14} />
                </button>

                <button
                    className="tarjetaAccionBtn"
                    onClick={manejarMenu}
                    type="button"
                    aria-label="Más opciones"
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>
        </div>
    );
};

export default TarjetaSample;
