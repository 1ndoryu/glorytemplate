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
    Crown,
    Lock,
} from 'lucide-react';
import {
    Badge,
    Avatar,
    BotonBase,
} from '@app/components/ui';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import { obtenerSample, listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { descargarSample } from '@app/services/apiDescargas';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
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
    const { navegar } = useNavigationStore();
    const { usuario: usuarioAuth } = useAuthStore();
    const rutaActual = useNavigationStore((s) => s.rutaActual);
    const menu = useMenuContextualSample();

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

    const esPropietario = usuarioAuth && sample?.creadorId === usuarioAuth.id;

    /* Like con llamada a API */
    const manejarLike = useCallback(async () => {
        if (!sample) return;
        const nuevoLiked = !liked;
        setLiked(nuevoLiked);
        if (nuevoLiked) {
            await darLike('sample', sample.id);
        } else {
            await quitarLike('sample', sample.id);
        }
    }, [liked, sample]);

    /* Like en samples similares (optimistic UI) */
    const manejarLikeSimilar = useCallback(async (sampleId: number) => {
        let estabaLiked = false;
        setSimilares((prev) =>
            prev.map((s) => {
                if (s.id === sampleId) {
                    estabaLiked = s.liked ?? false;
                    return { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) };
                }
                return s;
            })
        );
        if (estabaLiked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
        }
    }, []);

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
            try {
                const respuesta = await obtenerSample(slug);
                if (respuesta.ok && respuesta.data) {
                    setSample(respuesta.data);

                    /* Cargar samples similares por tags/tipo */
                    const tipoSample = respuesta.data.metadata?.tipo;
                    if (tipoSample) {
                        const resSimilares = await listarSamples({
                            tipo: tipoSample,
                            perPage: 5,
                        });
                        if (resSimilares.ok && resSimilares.data) {
                            /* data puede ser {data: [...]} o un array directo */
                            const listaSimilares = Array.isArray(resSimilares.data)
                                ? resSimilares.data
                                : (resSimilares.data.data ?? []);
                            setSimilares(
                                listaSimilares.filter((s) => s.id !== respuesta.data!.id)
                            );
                        }
                    }
                } else {
                    setError(respuesta.error ?? 'Error al cargar el sample.');
                }
            } catch (err) {
                setError('Error al cargar el sample.');
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
            {/* Hero con imagen de fondo + waveform overlay */}
            <div className="detalleHero">
                <img
                    src={sample.imagenUrl || obtenerImagenColor(sample.id)}
                    alt={sample.titulo}
                    className="detalleHeroImg"
                />
                <div className="detalleHeroOverlay">
                    <div className="detalleHeroWaveform">
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
                    <button
                        className={`detalleHeroPlayBtn ${reproduciendo ? 'detalleHeroPlayBtnActivo' : ''}`}
                        onClick={manejarPlay}
                        type="button"
                        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
                    >
                        {reproduciendo ? <Pause size={28} /> : <Play size={28} />}
                    </button>
                </div>
            </div>

            {/* Info principal */}
            <div className="detalleInfo">
                <div className="detalleInfoPrincipal">
                    <h1 className="detalleTitulo">
                        {sample.titulo}
                        {sample.esPremium && (
                            <span className="detallePremiumBadge">
                                <Crown size={14} /> PRO
                            </span>
                        )}
                    </h1>
                    {sample.esPremium && sample.precio != null && sample.precio > 0 && (
                        <span className="detallePrecio">${sample.precio.toFixed(2)}</span>
                    )}

                    {sample.creador && (
                        <button
                            className="detalleCreador"
                            onClick={() => navegar(`/perfil/${sample.creador?.username}/`)}
                            type="button"
                        >
                            <Avatar
                                src={sample.creador.avatarUrl}
                                nombre={sample.creador.nombreVisible}
                                tamano="md"
                            />
                            <div className="detalleCreadorTexto">
                                <strong>{sample.creador.nombreVisible}</strong>
                                <span>@{sample.creador.username}</span>
                            </div>
                            {!esPropietario && sample.creador && (
                                <BotonFollow
                                    usuarioId={sample.creador.id}
                                    siguiendo={false}
                                />
                            )}
                        </button>
                    )}
                </div>

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
                    {sample.tipo && (
                        <div className="detalleMetaItem">
                            <span className="detalleMetaLabel">Tipo</span>
                            <span className="detalleMetaValor">{sample.tipo}</span>
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
                        {reproduciendo
                            ? <><Pause size={14} /> Pausar</>
                            : <><Play size={14} /> Reproducir</>
                        }
                    </BotonBase>
                    <BotonBase
                        variante={liked ? 'primario' : 'ghost'}
                        onClick={manejarLike}
                    >
                        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                        {sample.totalLikes > 0 && ` ${sample.totalLikes}`}
                    </BotonBase>
                    <BotonBase variante="ghost" onClick={async () => {
                        const resp = await descargarSample(sample.id);
                        if (resp.ok && resp.data?.url) {
                            const a = document.createElement('a');
                            a.href = resp.data.url;
                            a.download = resp.data.nombre || sample.titulo || 'sample';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }
                    }}>
                        <Download size={14} /> Descargar
                    </BotonBase>
                    <BotonBase variante="ghost">
                        <Share2 size={14} />
                    </BotonBase>

                    {/* Indicador premium bloqueado para free */}
                    {sample.esPremium && usuarioAuth?.plan === 'free' && !esPropietario && (
                        <BotonBase
                            variante="secundario"
                            onClick={() => navegar('/planes/')}
                        >
                            <Lock size={14} /> Requiere Pro
                        </BotonBase>
                    )}
                </div>

                {/* Estadísticas */}
                <div className="detalleEstadisticas">
                    <span className="detalleAccionEstadistica">
                        <Eye size={14} /> {sample.totalReproducciones.toLocaleString()} reproducciones
                    </span>
                    <span className="detalleAccionEstadistica">
                        <Heart size={14} /> {sample.totalLikes.toLocaleString()} likes
                    </span>
                    <span className="detalleAccionEstadistica">
                        <Download size={14} /> {sample.totalDescargas.toLocaleString()} descargas
                    </span>
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

            {/* Samples similares — navegables */}
            {similares.length > 0 && (
                <div className="detalleSeccion">
                    <h2 className="detalleSeccionTitulo">Samples similares</h2>
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

            {/* Menú contextual para samples similares */}
            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />
        </div>
    );
};

export default SampleDetalleIsland;
