/*
 * Componente: TarjetaSample
 * Tarjeta compacta de sample para listas y exploradores.
 * Incluye play inline, waveform mini, metadata y acciones rápidas.
 */

import {useCallback, useEffect, useRef, useState, type MouseEvent} from 'react';
import {Play, Pause, Heart, MessageCircle, Download, MoreHorizontal} from 'lucide-react';
import type {SampleResumen, TipoReaccion} from '../../types';
import {WaveformPlayer} from './WaveformPlayer';
import {Badge} from './Badge';
import {obtenerImagenColor} from '../../services/imagenesColor';
import {etiquetaBpm} from '../../services/bpmUtils';
import {descargarSample} from '../../services/apiDescargas';
import {registrarReproduccion} from '../../services/apiReproduciones';
import {TooltipReacciones} from './TooltipReacciones';
import {useNavigationStore} from '@/core/router';
import '../../styles/componentes/tarjetaSample.css';

interface TarjetaSampleProps {
    sample: SampleResumen;
    activa?: boolean;
    reproduciendo?: boolean;
    progreso?: number;
    onPlay?: (sample: SampleResumen) => void;
    onPause?: () => void;
    onSeek?: (posicion: number) => void;
    onLike?: (sampleId: number, reaccion?: TipoReaccion) => void;
    onDescargar?: (sampleId: number) => void;
    onMenu?: (e: MouseEvent, sample: SampleResumen) => void;
    onClickCreador?: (username: string) => void;
    onComentar?: (sampleId: number) => void;
    onClickTitulo?: (sample: SampleResumen) => void;
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

export const TarjetaSample = ({sample, activa = false, reproduciendo = false, progreso = 0, onPlay, onPause, onSeek, onLike, onDescargar, onMenu, onClickCreador: _onClickCreador, onComentar, onClickTitulo, className = ''}: TarjetaSampleProps): JSX.Element => {
    const [reproduciendoLocal, setReproduciendoLocal] = useState(false);
    const [progresoLocal, setProgresoLocal] = useState(0);
    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef(sample.rutaPreview);
    const { navegar } = useNavigationStore();

    useEffect(() => {
        let activo = true;

        const cargarWaveform = async () => {
            /*
             * C68: Priorizar picos guardados en rutaWaveform (JSON del servidor).
             * Si no existe o falla, generar client-side con AudioContext como fallback.
             */

            /* Intentar cargar picos del servidor primero */
            if (sample.rutaWaveform) {
                try {
                    const respWf = await fetch(sample.rutaWaveform);
                    if (respWf.ok) {
                        const json = await respWf.json();
                        if (!activo) return;
                        /* El JSON puede ser un array directo o tener propiedad 'picos' / 'data' */
                        const picosServidor = Array.isArray(json)
                            ? json
                            : (json.peaks ?? json.picos ?? json.data ?? null);
                        if (Array.isArray(picosServidor) && picosServidor.length > 0) {
                            /* Normalizar a rango 0-1 si no lo están */
                            const maximo = Math.max(...picosServidor, 0.001);
                            const normalizados = maximo > 1
                                ? picosServidor.map((p: number) => Math.max(0.03, p / maximo))
                                : picosServidor;
                            setPicosAudio(normalizados);
                            return;
                        }
                    }
                } catch {
                    /* Fallo silencioso, se usa fallback AudioContext */
                }
            }

            /* Fallback: generar picos client-side desde el preview MP3 */
            if (!sample.rutaPreview) {
                if (activo) setPicosAudio(null);
                return;
            }

            if (typeof window === 'undefined' || !window.AudioContext) {
                if (activo) setPicosAudio(null);
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

        cargarWaveform();

        return () => {
            activo = false;
        };
    }, [sample.rutaWaveform, sample.rutaPreview]);

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

            /* C73: Registrar reproducción en backend para tracking y algoritmo */
            registrarReproduccion(sample.id).catch(() => { /* silencioso */ });
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

    const manejarReaccion = useCallback(
        (reaccion: TipoReaccion) => {
            onLike?.(sample.id, reaccion);
        },
        [onLike, sample.id]
    );

    const manejarQuitarReaccion = useCallback(
        () => {
            onLike?.(sample.id);
        },
        [onLike, sample.id]
    );

    const manejarDescargar = useCallback(
        async (e: MouseEvent) => {
            e.stopPropagation();
            if (onDescargar) {
                onDescargar(sample.id);
                return;
            }
            /* Fallback: llamar API directamente y disparar descarga en navegador */
            const resp = await descargarSample(sample.id);
            if (resp.ok && resp.data?.url) {
                const a = document.createElement('a');
                a.href = resp.data.url;
                a.download = resp.data.nombre || sample.titulo || 'sample';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        },
        [onDescargar, sample.id, sample.titulo]
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

    /* Imagen de portada: usa imagenUrl del sample o fallback a colors/ */
    const imagenPortada = sample.imagenUrl || obtenerImagenColor(sample.id);

    return (
        <div className={clases} onContextMenu={manejarMenu} onClick={manejarPlayPause} role="button" tabIndex={0}>
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
                            /* Solo interceptar click izquierdo sin modificadores para SPA */
                            if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                /* Si hay handler de titulo (panel lateral), usarlo en vez de navegar */
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
                    {sample.esPremium && <span className="tarjetaPremium">PRO</span>}
                </div>

                <div className="tarjetaMeta">
                    {(() => {
                        /*
                         * C76: Mostrar metadata enriquecida del sample.
                         * Orden: instrumento, género, emoción, velocidad, tag.
                         * Usa metadata de la IA cuando está disponible.
                         */
                        const meta = sample.metadata;
                        const badges: { texto: string; clave: string }[] = [];

                        /* Primer instrumento */
                        const instrumentos = meta?.instrumentos ?? meta?.['instrumentos'];
                        if (instrumentos) {
                            const primerInst = Array.isArray(instrumentos) ? instrumentos[0] : instrumentos;
                            if (primerInst) badges.push({ texto: primerInst, clave: 'inst' });
                        }

                        /* Primer género */
                        const genero = meta?.genero ?? meta?.['genero'];
                        if (genero) {
                            const primerGen = Array.isArray(genero) ? genero[0] : genero;
                            if (primerGen) badges.push({ texto: primerGen, clave: 'gen' });
                        }

                        /* Primera emoción (con fallback a español) */
                        const emocion = meta?.emocion_es ?? meta?.emocionEs ?? meta?.emocion;
                        if (emocion) {
                            const primeraEmo = Array.isArray(emocion) ? emocion[0] : emocion;
                            if (primeraEmo) badges.push({ texto: primeraEmo, clave: 'emo' });
                        }

                        /* Velocidad normalizada (del BPM) */
                        if (sample.bpm) {
                            badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'vel' });
                        }

                        /* Primera tag */
                        const tagsMeta = meta?.tags_es ?? meta?.tagsEs ?? meta?.tags ?? sample.tags;
                        if (tagsMeta && Array.isArray(tagsMeta) && tagsMeta.length > 0) {
                            badges.push({ texto: tagsMeta[0], clave: 'tag' });
                        }

                        /* Si no hay metadata IA, mostrar badges clásicos */
                        if (badges.length === 0) {
                            if (sample.bpm) badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'bpm' });
                            if (sample.key) badges.push({ texto: formatearKey(sample.key, sample.escala), clave: 'key' });
                            badges.push({ texto: sample.tipo, clave: 'tipo' });
                        }

                        return badges.map(({ texto, clave }) => (
                            <Badge key={clave} variante="neutro">{texto}</Badge>
                        ));
                    })()}
                </div>
            </div>

            {/* Acciones de tarjeta */}
            <div className="tarjetaAcciones">
                {/* Waveform mini solo en tarjeta activa */}
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
                    <button
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
                    </button>
                </TooltipReacciones>

                <button className="tarjetaAccionBtn" onClick={() => onComentar?.(sample.id)} type="button" aria-label="Comentar">
                    <MessageCircle size={18} />
                </button>

                <button className="tarjetaAccionBtn" onClick={manejarDescargar} type="button" aria-label="Descargar">
                    <Download size={18} />
                </button>

                <button className="tarjetaAccionBtn paddingExtraAccion" onClick={manejarMenu} type="button" aria-label="Más opciones">
                    <MoreHorizontal size={18} />
                </button>
            </div>
        </div>
    );
};

export default TarjetaSample;
