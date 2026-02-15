/*
 * Componente: TarjetaSample
 * Tarjeta compacta de sample para listas y exploradores.
 * Incluye play inline, waveform mini, metadata y acciones rápidas.
 */

import {useCallback, useEffect, useRef, useState, type MouseEvent} from 'react';
import {Play, Pause, Heart, Download, MoreHorizontal} from 'lucide-react';
import type {SampleResumen} from '../../types';
import {WaveformPlayer} from './WaveformPlayer';
import {Badge} from './Badge';
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

const EVENTO_REPRODUCCION_SAMPLE = 'kamples:reproduccion-sample';

const extraerPicosAudio = (buffer: AudioBuffer, totalBarras = 96): number[] => {
    const datos = buffer.getChannelData(0);
    const tamanoBloque = Math.max(1, Math.floor(datos.length / totalBarras));
    const picos: number[] = [];

    for (let i = 0; i < totalBarras; i++) {
        const inicio = i * tamanoBloque;
        const fin = Math.min(datos.length, inicio + tamanoBloque);
        let maximo = 0;
        let energia = 0;
        let muestras = 0;

        for (let indice = inicio; indice < fin; indice++) {
            const valor = Math.abs(datos[indice]);
            if (valor > maximo) maximo = valor;
            energia += valor * valor;
            muestras++;
        }

        const rms = muestras > 0 ? Math.sqrt(energia / muestras) : 0;
        picos.push((maximo * 0.65) + (rms * 0.35));
    }

    const suavizados = picos.map((_, indice) => {
        const anterior = picos[indice - 1] ?? picos[indice];
        const actual = picos[indice];
        const siguiente = picos[indice + 1] ?? picos[indice];
        return (anterior * 0.25) + (actual * 0.5) + (siguiente * 0.25);
    });

    const picoGlobal = Math.max(...suavizados, 0.001);
    return suavizados.map((pico) => Math.max(0.03, Math.min(1, pico / picoGlobal)));
};

/* Formatear nota musical con escala */
const formatearKey = (key: string | null, escala: string | null): string => {
    if (!key) return '';
    const esc = escala === 'menor' ? 'm' : '';
    return `${key}${esc}`;
};

const formatearContador = (valor: number): string => {
    if (valor >= 1000) {
        return `${Math.floor(valor / 1000)}k`;
    }
    return `${valor}`;
};

export const TarjetaSample = ({sample, activa = false, reproduciendo = false, progreso = 0, onPlay, onPause, onSeek, onLike, onDescargar, onMenu, onClickCreador, className = ''}: TarjetaSampleProps): JSX.Element => {
    const [reproduciendoLocal, setReproduciendoLocal] = useState(false);
    const [progresoLocal, setProgresoLocal] = useState(0);
    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef(sample.rutaPreview);

    useEffect(() => {
        let activo = true;

        const generarWaveform = async () => {
            if (!sample.rutaPreview) {
                setPicosAudio(null);
                return;
            }

            if (typeof window === 'undefined' || !window.AudioContext) {
                setPicosAudio(null);
                return;
            }

            const contexto = new window.AudioContext();

            try {
                const respuesta = await fetch(sample.rutaPreview);
                if (!respuesta.ok) {
                    throw new Error('No se pudo cargar el audio de preview');
                }

                const bufferAudio = await respuesta.arrayBuffer();
                const audioDecodificado = await contexto.decodeAudioData(bufferAudio.slice(0));

                if (!activo) return;
                setPicosAudio(extraerPicosAudio(audioDecodificado));
            } catch {
                if (activo) setPicosAudio(null);
            } finally {
                contexto.close().catch(() => undefined);
            }
        };

        generarWaveform();

        return () => {
            activo = false;
        };
    }, [sample.rutaPreview]);

    const inicializarAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;

        const audio = new Audio(sample.rutaPreview);
        audio.preload = 'metadata';

        const actualizarProgreso = () => {
            if (!audio.duration) return;
            setProgresoLocal(audio.currentTime / audio.duration);
        };

        const manejarPlay = () => {
            setReproduciendoLocal(true);
        };

        const manejarPause = () => {
            setReproduciendoLocal(false);
        };

        const manejarFin = () => {
            setReproduciendoLocal(false);
            setProgresoLocal(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('timeupdate', actualizarProgreso);
        audio.addEventListener('play', manejarPlay);
        audio.addEventListener('pause', manejarPause);
        audio.addEventListener('ended', manejarFin);

        audioRef.current = audio;
        return audio;
    }, [sample.rutaPreview]);

    useEffect(() => {
        if (rutaPreviewRef.current === sample.rutaPreview) return;

        rutaPreviewRef.current = sample.rutaPreview;
        if (!audioRef.current) return;

        audioRef.current.pause();
        audioRef.current.src = sample.rutaPreview;
        audioRef.current.load();
        setProgresoLocal(0);
        setReproduciendoLocal(false);
    }, [sample.rutaPreview]);

    useEffect(() => {
        const pausarSiEsOtro = (event: Event) => {
            const detalle = (event as CustomEvent<{sampleId?: number}>).detail;
            if (detalle?.sampleId === sample.id) return;

            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        };

        window.addEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);

        return () => {
            window.removeEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sample.id]);

    const manejarPlayPause = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();

            const audio = inicializarAudio();
            if (!audio.paused) {
                audio.pause();
                onPause?.();
                return;
            }

            window.dispatchEvent(
                new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, {
                    detail: {sampleId: sample.id},
                })
            );

            audio.play().catch(() => {
                setReproduciendoLocal(false);
            });
            onPlay?.(sample);
        },
        [inicializarAudio, onPlay, onPause, sample]
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

    const manejarSeek = useCallback(
        (posicion: number) => {
            const audio = inicializarAudio();

            const aplicarSeekYReproducir = () => {
                if (!audio.duration) return;

                audio.currentTime = posicion * audio.duration;
                setProgresoLocal(posicion);
                window.dispatchEvent(
                    new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, {
                        detail: {sampleId: sample.id},
                    })
                );
                audio.play().catch(() => {
                    setReproduciendoLocal(false);
                });
            };

            if (audio.duration && Number.isFinite(audio.duration)) {
                aplicarSeekYReproducir();
            } else {
                const manejarMetadata = () => {
                    aplicarSeekYReproducir();
                    audio.removeEventListener('loadedmetadata', manejarMetadata);
                };
                audio.addEventListener('loadedmetadata', manejarMetadata);
                audio.load();
            }

            onSeek?.(posicion);
        },
        [inicializarAudio, onSeek, sample.id]
    );

    const estaActiva = activa || reproduciendoLocal;
    const estaReproduciendo = reproduciendoLocal || (activa && reproduciendo);
    const progresoActual = estaActiva
        ? reproduciendoLocal
            ? progresoLocal
            : progreso
        : 0;

    const clases = ['tarjetaSample', estaActiva ? 'tarjetaSampleActiva' : '', className].filter(Boolean).join(' ');

    return (
        <div className={clases} onContextMenu={manejarMenu}>
            {/* Play/Pause */}
            <button className={`tarjetaPlayBtn ${estaReproduciendo ? 'tarjetaPlayBtnActivo' : ''}`} onClick={manejarPlayPause} type="button" aria-label={estaReproduciendo ? 'Pausar' : 'Reproducir'}>
                {estaReproduciendo ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Contenido central */}
            <div className="tarjetaContenido">
                <div className="tarjetaCabecera">
                    <span className="tarjetaTitulo">{sample.titulo}</span>
                    {sample.esPremium && <span className="tarjetaPremium">PRO</span>}
                </div>

                <div className="tarjetaMeta">
                    {sample.bpm && (
                        <Badge variante="neutro">
                            {sample.bpm} BPM
                        </Badge>
                    )}
                    {sample.key && (
                        <Badge variante="neutro">
                            {formatearKey(sample.key, sample.escala)}
                        </Badge>
                    )}
                    <Badge variante="neutro">{sample.tipo}</Badge>
                </div>
            </div>

            {/* Acciones — contadores junto a cada botón */}
            <div className="tarjetaAcciones">
                {/* Waveform mini solo en tarjeta activa */}
                <div className="tarjetaWaveform">
                    <WaveformPlayer
                        picos={picosAudio}
                        progreso={progresoActual}
                        duracion={sample.duracion}
                        onSeek={manejarSeek}
                        tamano="sm"
                        colorNoReproducido="#848484"
                        colorReproducido="#d43333"
                        anchoBarra={2}
                        espacioBarra={1}
                        simetrico
                    />
                </div>

                <button className={`tarjetaAccionBtn ${sample.liked ? 'tarjetaAccionLiked' : ''}`} onClick={manejarLike} type="button" aria-label={sample.liked ? 'Quitar like' : 'Dar like'}>
                    <span className="tarjetaAccionContador">{formatearContador(sample.totalLikes)}</span>
                    <Heart size={18} fill={sample.liked ? 'currentColor' : 'none'} />
                </button>

                <button className="tarjetaAccionBtn" onClick={manejarDescargar} type="button" aria-label="Descargar">
                    <span className="tarjetaAccionContador">{formatearContador(sample.totalDescargas)}</span>
                    <Download size={18} />
                </button>

                <button className="tarjetaAccionBtn" onClick={manejarMenu} type="button" aria-label="Más opciones">
                    <MoreHorizontal size={18} />
                </button>
            </div>
        </div>
    );
};

export default TarjetaSample;
