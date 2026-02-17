/*
 * SampleDetalleIsland — Kamples
 * Página de detalle de un sample individual.
 * Muestra waveform grande, metadata, acciones y samples similares.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    Pause,
    Heart,
    MessageCircle,
    Download,
    AlertCircle,
    Crown,
    Lock,
    MoreHorizontal,
    Sparkles,
} from 'lucide-react';
import {
    Badge,
    Avatar,
    BotonBase,
} from '@app/components/ui';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TooltipReacciones } from '@app/components/ui/TooltipReacciones';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import { obtenerSample, listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { descargarSample } from '@app/services/apiDescargas';
import { registrarReproduccion } from '@app/services/apiReproduciones';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { etiquetaBpm } from '@app/services/bpmUtils';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useComentarios } from '@app/hooks/useComentarios';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { Sample, SampleResumen } from '@app/types';
import '../../styles/componentes/sampleDetalle.css';

/* Props inyectadas desde PHP (pages.php) */
interface SampleDetalleProps {
    slug?: string;
}

export const SampleDetalleIsland = ({ slug: slugProp }: SampleDetalleProps): JSX.Element => {
    const [sample, setSample] = useState<Sample | null>(null);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const [mostrarSimilares, setMostrarSimilares] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [reaccionActual, setReaccionActual] = useState<TipoReaccion | null>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [picosWaveform, setPicosWaveform] = useState<number[] | null>(null);
    const [descargado, setDescargado] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef('');
    const { setTabs } = useTabsTopBarStore();
    const { navegar } = useNavigationStore();
    const { usuario: usuarioAuth } = useAuthStore();
    const rutaActual = useNavigationStore((s) => s.rutaActual);
    const menu = useMenuContextualSample();
    const { abrir: abrirPlanes } = usePlanesModalStore();
    const [comentariosVisibles, setComentariosVisibles] = useState(true);
    const seccionComentarios = useComentarios({
        tipo: 'sample',
        targetId: sample?.id ?? 0,
        cargarAlAbrir: true,
    });

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

    /* Verificar propiedad: comparar con == para evitar mismatch string/number */
    const esPropietario = Boolean(
        usuarioAuth && sample && (
            String(sample.creadorId) === String(usuarioAuth.id) ||
            String(sample.creador?.id) === String(usuarioAuth.id)
        )
    );

    /* Like con llamada a API */
    const { sugerenciasAlDarLike } = usePanelLateralStore();

    const manejarLike = useCallback(async () => {
        if (!sample) return;
        if (liked || reaccionActual) {
            setLiked(false);
            setReaccionActual(null);
            await quitarLike('sample', sample.id);
        } else {
            setLiked(true);
            setReaccionActual('like');
            /* C156: mostrar similares al dar like si preferencia activa */
            if (sugerenciasAlDarLike) setMostrarSimilares(true);
            await darLike('sample', sample.id, 'like');
        }
    }, [liked, reaccionActual, sample, sugerenciasAlDarLike]);

    /* Reaccion especifica desde tooltip */
    const manejarReaccionDetalle = useCallback(async (reaccion: TipoReaccion) => {
        if (!sample) return;
        setLiked(reaccion !== 'dislike');
        setReaccionActual(reaccion);
        /* C156: mostrar similares en reaccion positiva si preferencia activa */
        if (reaccion !== 'dislike' && sugerenciasAlDarLike) setMostrarSimilares(true);
        await darLike('sample', sample.id, reaccion);
    }, [sample, sugerenciasAlDarLike]);

    const manejarQuitarReaccionDetalle = useCallback(async () => {
        if (!sample) return;
        setLiked(false);
        setReaccionActual(null);
        await quitarLike('sample', sample.id);
    }, [sample]);

    /* Like en samples similares (optimistic UI con reacciones) */
    const manejarLikeSimilar = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sim = similares.find((s) => s.id === sampleId);
        if (reaccion) {
            const eraPositivo = sim?.reaccion === 'like' || sim?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSimilares((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                )
            );
            await darLike('sample', sampleId, reaccion);
        } else if (sim?.liked || sim?.reaccion) {
            const eraPositivo = sim?.reaccion === 'like' || sim?.reaccion === 'encanta';
            setSimilares((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            await quitarLike('sample', sampleId);
        } else {
            setSimilares((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            await darLike('sample', sampleId, 'like');
        }
    }, [similares]);

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
                    setLiked(Boolean(respuesta.data.liked));
                    setReaccionActual((respuesta.data as any).reaccion ?? null);

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

    /* Cargar picos de waveform del servidor (C68) */
    useEffect(() => {
        if (!sample?.rutaWaveform) {
            setPicosWaveform(null);
            return;
        }

        let activo = true;
        const cargar = async () => {
            try {
                const resp = await fetch(sample.rutaWaveform);
                if (!resp.ok || !activo) return;
                const json = await resp.json();
                if (!activo) return;
                const datos = Array.isArray(json) ? json : (json.peaks ?? json.picos ?? json.data ?? null);
                if (Array.isArray(datos) && datos.length > 0) {
                    const maximo = Math.max(...datos, 0.001);
                    setPicosWaveform(maximo > 1 ? datos.map((p: number) => Math.max(0.03, p / maximo)) : datos);
                }
            } catch {
                /* Fallo silencioso, WaveformPlayer usará placeholder */
            }
        };
        cargar();
        return () => { activo = false; };
    }, [sample?.rutaWaveform]);

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
            /* C73: Registrar reproducción en backend */
            if (sample) {
                registrarReproduccion(sample.id).catch(() => { /* silencioso */ });
            }
            return;
        }

        audio.pause();
    }, []);

    const tagsHome = useMemo(() => {
        if (!sample) return [] as Array<{ texto: string; clave: string }>;

        const badges: Array<{ texto: string; clave: string }> = [];
        const meta = sample.metadata;

        const instrumentos = meta?.instrumentos ?? meta?.['instrumentos'];
        if (instrumentos) {
            const primerInst = Array.isArray(instrumentos) ? instrumentos[0] : instrumentos;
            if (primerInst) badges.push({ texto: primerInst, clave: 'inst' });
        }

        const genero = meta?.genero ?? meta?.['genero'];
        if (genero) {
            const primerGenero = Array.isArray(genero) ? genero[0] : genero;
            if (primerGenero) badges.push({ texto: primerGenero, clave: 'gen' });
        }

        /* C162: emocion puede venir concatenada sin separador. Splitear por comas/espacios/pipes */
        const emocion = meta?.emocion_es ?? meta?.emocionEs ?? meta?.emocion;
        if (emocion) {
            const emociones = Array.isArray(emocion)
                ? emocion
                : String(emocion).split(/[,|;]\s*|\s+/).filter(Boolean);
            const primeraEmocion = emociones.find(e => e.length <= 30);
            if (primeraEmocion) badges.push({ texto: primeraEmocion, clave: 'emo' });
        }

        if (sample.bpm) {
            badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'vel' });
        }

        const tagsMeta = meta?.tags_es ?? meta?.tagsEs ?? meta?.tags ?? sample.tags;
        if (Array.isArray(tagsMeta) && tagsMeta.length > 0) {
            badges.push({ texto: tagsMeta[0], clave: 'tag' });
        }

        if (badges.length === 0) {
            if (sample.bpm) badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'bpm' });
            if (sample.key) {
                badges.push({ texto: `${sample.key}${sample.escala === 'menor' ? 'm' : ''}`, clave: 'key' });
            }
            badges.push({ texto: sample.tipo, clave: 'tipo' });
        }

        return badges;
    }, [sample]);

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
            <article className="detalleTarjetaUnica">
                {sample.creador && (
                    <div className="detalleCabeceraInterna">
                        <button
                            className="detalleCabeceraPost"
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
                        </button>
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
                                onSeek={(pct) => {
                                    const audio = audioRef.current;
                                    if (audio?.duration) {
                                        audio.currentTime = pct * audio.duration;
                                        setProgreso(pct);
                                    }
                                }}
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

                    <div className="detalleAcciones">
                        <TooltipReacciones
                            reaccionActual={reaccionActual}
                            onReaccionar={manejarReaccionDetalle}
                            onQuitar={manejarQuitarReaccionDetalle}
                        >
                            <button
                                className={`detalleAccionPlano ${liked ? 'detalleAccionPlanoActivo' : ''} ${
                                    reaccionActual === 'encanta' ? 'reaccionPrincipalEncanta' :
                                    reaccionActual === 'dislike' ? 'reaccionPrincipalDislike' : ''
                                }`}
                                onClick={manejarLike}
                                type="button"
                                aria-label={liked ? 'Quitar like' : 'Dar like'}
                            >
                                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                            </button>
                        </TooltipReacciones>
                        <button
                            className="detalleAccionPlano"
                            onClick={() => {
                                setComentariosVisibles(prev => !prev);
                                if (!comentariosVisibles && seccionComentarios.comentarios.length === 0) {
                                    seccionComentarios.cargar(1);
                                }
                            }}
                            type="button"
                            aria-label="Comentarios"
                        >
                            <MessageCircle size={18} />
                        </button>
                        <button
                            className={`detalleAccionPlano ${descargado ? 'detalleAccionPlanoDescargado' : ''}`}
                            onClick={async () => {
                                const resp = await descargarSample(sample.id);
                                if (resp.ok && resp.data?.url) {
                                    setDescargado(true);
                                    const a = document.createElement('a');
                                    a.href = resp.data.url;
                                    a.download = resp.data.nombre || sample.titulo || 'sample';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }
                            }}
                            type="button"
                            aria-label="Descargar sample"
                        >
                            <Download size={18} />
                        </button>

                        {sample.esPremium && usuarioAuth?.plan === 'free' && !esPropietario && (
                            <button
                                className="detalleAccionPlano detalleAccionPlanoActivo"
                                onClick={abrirPlanes}
                                type="button"
                                aria-label="Requiere plan Pro"
                            >
                                <Lock size={18} />
                            </button>
                        )}

                        {/* C127: Menú de 3 puntos para el sample principal */}
                        <button
                            className="detalleAccionPlano"
                            onClick={(e) => menu.abrirMenu(e as React.MouseEvent, sample as unknown as SampleResumen)}
                            type="button"
                            aria-label="Más opciones"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                </div>

                {/* Sección de comentarios — expandidos por defecto (C128) */}
                {comentariosVisibles && (
                    <div className="detalleSeccion detalleComentariosSeccion">
                        <ListaComentarios
                            comentarios={seccionComentarios.comentarios}
                            cargando={seccionComentarios.cargando}
                            onEnviar={seccionComentarios.enviar}
                            onClickAutor={(u) => navegar(`/perfil/${u}/`)}
                            maxVisibles={5}
                            onCargarMas={seccionComentarios.cargarMas}
                            hayMasPaginas={seccionComentarios.hayMas}
                        />
                    </div>
                )}

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
