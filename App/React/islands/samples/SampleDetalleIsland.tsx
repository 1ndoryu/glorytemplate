/*
 * SampleDetalleIsland — Kamples
 * Página de detalle de un sample individual.
 * Muestra waveform grande, metadata, acciones y samples similares.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    Play,
    Pause,
    Heart,
    Download,
    Share2,
    Eye,
    AlertCircle,
} from 'lucide-react';
import {
    Badge,
    Avatar,
    BotonBase,
} from '@app/components/ui';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { obtenerSample, listarSamples } from '@app/services/apiSamples';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useNavigationStore } from '@/core/router';
import type { Sample, SampleResumen } from '@app/types';
import '../../styles/componentes/sampleDetalle.css';

/* Props inyectadas desde PHP (pages.php) */
interface SampleDetalleProps {
    slug?: string;
}

export const SampleDetalleIsland = ({ slug: slugProp }: SampleDetalleProps): JSX.Element => {
    const [sample, setSample] = useState<Sample | null>(null);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef('');
    const { setTabs } = useTabsTopBarStore();
    const rutaActual = useNavigationStore((s) => s.rutaActual);

    /*
     * Resolver slug: priorizar la URL actual (SPA) sobre el prop de PHP.
     * En navegación SPA, el prop de PHP queda stale tras el primer render.
     */
    const slug = useMemo(() => {
        /* Intentar extraer slug de la ruta SPA actual */
        const segmentos = rutaActual.replace(/\/$/, '').split('/');
        const idxSample = segmentos.indexOf('sample');
        if (idxSample !== -1 && segmentos[idxSample + 1] && segmentos[idxSample + 1] !== 'sample') {
            return segmentos[idxSample + 1];
        }
        /* Fallback: usar prop de PHP si la ruta no contiene /sample/{slug} */
        return slugProp && slugProp !== 'sample' ? slugProp : null;
    }, [rutaActual, slugProp]);

    /* Registrar tab "Sample" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'sample', etiqueta: 'Sample' }], 'sample');
        return () => { setTabs([]); };
    }, [setTabs]);

    const estaReproduciendo = reproduciendo;

    /* Cargar sample al montar */
    useEffect(() => {
        if (!slug) {
            setError('No se encontró el sample.');
            setCargando(false);
            return;
        }

        const cargar = async () => {
            setCargando(true);
            setError('');
            const respuesta = await obtenerSample(slug);
            if (respuesta.ok && respuesta.data) {
                setSample(respuesta.data);

                /* Cargar samples similares por tags/tipo */
                const resSimilares = await listarSamples({
                    tipo: respuesta.data.metadata.tipo,
                    perPage: 5,
                });
                if (resSimilares.ok && resSimilares.data) {
                    /* Excluir el sample actual de similares */
                    setSimilares(
                        resSimilares.data.data.filter((s) => s.id !== respuesta.data!.id)
                    );
                }
            } else {
                setError(respuesta.error ?? 'Error al cargar el sample.');
            }
            setCargando(false);
        };

        cargar();
    }, [slug]);

    /* Inicializar/actualizar audio local */
    useEffect(() => {
        if (!sample) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(sample.rutaPreview);
            rutaPreviewRef.current = sample.rutaPreview;
        }

        const audio = audioRef.current;
        if (rutaPreviewRef.current !== sample.rutaPreview) {
            rutaPreviewRef.current = sample.rutaPreview;
            audio.src = sample.rutaPreview;
            audio.load();
            setProgreso(0);
            setReproduciendo(false);
        }

        const actualizarProgreso = () => {
            if (!audio.duration) return;
            setProgreso(audio.currentTime / audio.duration);
        };

        const manejarPlay = () => setReproduciendo(true);
        const manejarPause = () => setReproduciendo(false);
        const manejarFin = () => {
            setReproduciendo(false);
            setProgreso(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('timeupdate', actualizarProgreso);
        audio.addEventListener('play', manejarPlay);
        audio.addEventListener('pause', manejarPause);
        audio.addEventListener('ended', manejarFin);

        return () => {
            audio.removeEventListener('timeupdate', actualizarProgreso);
            audio.removeEventListener('play', manejarPlay);
            audio.removeEventListener('pause', manejarPause);
            audio.removeEventListener('ended', manejarFin);
        };
    }, [sample]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    /* Manejar play/pause */
    const manejarPlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play().catch(() => {
                setReproduciendo(false);
            });
            return;
        }

        audio.pause();
    }, []);

    /* Formatear duración en mm:ss */
    const formatearDuracion = (seg: number): string => {
        const m = Math.floor(seg / 60);
        const s = Math.floor(seg % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    /* Formatear tamaño */
    const formatearTamano = (bytes: number): string => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    /* Cargando */
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
            {/* Header con waveform y datos */}
            <div className="detalleHeader">
                <div className="detalleWaveform">
                    <WaveformPlayer
                        picos={null}
                        progreso={progreso}
                        duracion={sample.duracion}
                        tamano="xl"
                        interactivo
                        onSeek={(pct) => {
                            const audio = audioRef.current;
                            if (audio?.duration) {
                                audio.currentTime = pct * audio.duration;
                                setProgreso(pct);
                            }
                        }}
                    />
                </div>

                <div className="detalleInfo">
                    <h1 className="detalleTitulo">{sample.titulo}</h1>

                    {sample.creador && (
                        <div className="detalleCreador">
                            <Avatar
                                src={sample.creador.avatarUrl}
                                nombre={sample.creador.nombreVisible}
                                tamano="sm"
                            />
                            <span className="detalleCreadorNombre">
                                por <strong>{sample.creador.nombreVisible}</strong>
                            </span>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="detalleMeta">
                        {sample.bpm && (
                            <div className="detalleMetaItem">
                                <span className="detalleMetaLabel">BPM</span>
                                <span className="detalleMetaValor">{sample.bpm}</span>
                            </div>
                        )}
                        {sample.key && (
                            <div className="detalleMetaItem">
                                <span className="detalleMetaLabel">Key</span>
                                <span className="detalleMetaValor">
                                    {sample.key}
                                    {sample.escala === 'menor' ? 'm' : ''}
                                </span>
                            </div>
                        )}
                        <div className="detalleMetaItem">
                            <span className="detalleMetaLabel">Duración</span>
                            <span className="detalleMetaValor">
                                {formatearDuracion(sample.duracion)}
                            </span>
                        </div>
                        <div className="detalleMetaItem">
                            <span className="detalleMetaLabel">Formato</span>
                            <span className="detalleMetaValor">
                                {sample.formato.toUpperCase()}
                            </span>
                        </div>
                        <div className="detalleMetaItem">
                            <span className="detalleMetaLabel">Tamaño</span>
                            <span className="detalleMetaValor">
                                {formatearTamano(sample.tamano)}
                            </span>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="detalleAcciones">
                        <BotonBase variante="primario" onClick={manejarPlay}>
                            {estaReproduciendo
                                ? <><Pause size={14} /> Pausar</>
                                : <><Play size={14} /> Reproducir</>
                            }
                        </BotonBase>
                        <BotonBase
                            variante={liked ? 'primario' : 'ghost'}
                            onClick={() => setLiked(!liked)}
                        >
                            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                        </BotonBase>
                        <BotonBase variante="ghost">
                            <Download size={14} /> Descargar
                        </BotonBase>
                        <BotonBase variante="ghost">
                            <Share2 size={14} />
                        </BotonBase>
                    </div>

                    {/* Estadísticas */}
                    <div className="detalleAcciones">
                        <span className="detalleAccionEstadistica">
                            <Eye size={14} /> {sample.totalReproducciones.toLocaleString()}
                        </span>
                        <span className="detalleAccionEstadistica">
                            <Heart size={14} /> {sample.totalLikes.toLocaleString()}
                        </span>
                        <span className="detalleAccionEstadistica">
                            <Download size={14} /> {sample.totalDescargas.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Descripción */}
            {sample.descripcion && (
                <div className="detalleSeccion">
                    <h2 className="detalleSeccionTitulo">Descripción</h2>
                    <p className="detalleDescripcion">{sample.descripcion}</p>
                </div>
            )}

            {/* Tags */}
            {sample.tags.length > 0 && (
                <div className="detalleSeccion">
                    <h2 className="detalleSeccionTitulo">Tags</h2>
                    <div className="detalleTags">
                        {sample.tags.map((tag) => (
                            <Badge key={tag} variante="neutro" estilo="borde">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Samples similares */}
            {similares.length > 0 && (
                <div className="detalleSeccion">
                    <h2 className="detalleSeccionTitulo">Samples similares</h2>
                    <div className="detalleSimilares">
                        {similares.map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SampleDetalleIsland;
