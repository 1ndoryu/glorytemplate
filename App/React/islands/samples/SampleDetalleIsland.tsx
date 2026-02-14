/*
 * SampleDetalleIsland — Kamples
 * Página de detalle de un sample individual.
 * Muestra waveform grande, metadata, acciones y samples similares.
 */

import { useEffect, useState, useCallback } from 'react';
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
import { useReproductorStore } from '@app/stores/reproductorStore';
import type { Sample, SampleResumen } from '@app/types';
import '../../styles/componentes/sampleDetalle.css';

/* Props inyectadas desde PHP (pages.php) */
interface SampleDetalleProps {
    slug?: string;
}

export const SampleDetalleIsland = ({ slug }: SampleDetalleProps): JSX.Element => {
    const [sample, setSample] = useState<Sample | null>(null);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);

    const {
        sampleActual,
        reproduciendo,
        progreso,
        setSample: reproducir,
        play,
        pause,
        setProgreso,
    } = useReproductorStore();

    const esActivo = sampleActual?.id === sample?.id;
    const estaReproduciendo = esActivo && reproduciendo;

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

    /* Manejar play/pause */
    const manejarPlay = useCallback(() => {
        if (!sample) return;

        if (esActivo) {
            estaReproduciendo ? pause() : play();
        } else {
            /* Crear SampleResumen mínimo para el reproductor */
            const resumen: SampleResumen = {
                id: sample.id,
                titulo: sample.titulo,
                slug: sample.slug,
                bpm: sample.bpm,
                key: sample.key,
                escala: sample.escala,
                duracion: sample.duracion,
                tags: sample.tags,
                tipo: sample.metadata.tipo,
                esPremium: sample.esPremium,
                rutaPreview: sample.rutaPreview,
                rutaWaveform: sample.rutaWaveform,
                imagenUrl: sample.imagenUrl,
                totalDescargas: sample.totalDescargas,
                totalLikes: sample.totalLikes,
                creador: sample.creador ?? {
                    id: sample.creadorId,
                    username: '',
                    nombreVisible: 'Desconocido',
                    avatarUrl: null,
                    verificado: false,
                },
            };
            reproducir(resumen);
        }
    }, [sample, esActivo, estaReproduciendo, pause, play, reproducir]);

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
                        progreso={esActivo ? progreso : 0}
                        duracion={sample.duracion}
                        tamano="xl"
                        interactivo
                        onSeek={(pct) => {
                            if (esActivo) setProgreso(pct);
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
                                activa={sampleActual?.id === s.id}
                                reproduciendo={sampleActual?.id === s.id && reproduciendo}
                                progreso={sampleActual?.id === s.id ? progreso : 0}
                                onPlay={() => reproducir(s)}
                                onPause={pause}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SampleDetalleIsland;
