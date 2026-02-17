/*
 * Componente: PanelDetalleSample — Kamples (C95+C151+C152+C154+C158)
 * Vista condensada de un sample para el panel lateral.
 * Muestra: creador, título, waveform reproducible, tags con borde, acciones.
 * Reutiliza datos de SampleResumen + carga detalle completo via API.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, Download, Lock, PanelRightClose, MessageCircle } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useComentarios } from '@app/hooks/useComentarios';
import { obtenerSample } from '@app/services/apiSamples';
import { obtenerSimilares } from '@app/services/apiReproduciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { Sample, SampleResumen } from '@app/types';

/* Evento para pausar otros audios locales */
const EVENTO_PANEL_PLAY = 'kamples:panel-audio-play';

interface PanelDetalleSampleProps {
    sample: SampleResumen;
}

export const PanelDetalleSample = ({ sample }: PanelDetalleSampleProps): JSX.Element => {
    const [detalle, setDetalle] = useState<Sample | null>(null);
    const [liked, setLiked] = useState(sample.liked ?? false);
    const [reaccion, setReaccion] = useState<TipoReaccion | null>(sample.reaccion ?? null);
    const [totalLikes, setTotalLikes] = useState(sample.totalLikes);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const [comentariosVisibles, setComentariosVisibles] = useState(false);
    const { navegar } = useNavigationStore();
    const { cerrar } = usePanelLateralStore();

    /* C151: Audio local para reproduccion en panel lateral */
    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progresoAudio, setProgresoAudio] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const {
        comentarios, cargando: cargandoComentarios, enviar: enviarComentario,
        cargarMas: cargarMasComentarios, hayMas: hayMasComentarios,
    } = useComentarios({
        tipo: 'sample',
        targetId: sample.id,
        cargarAlAbrir: comentariosVisibles,
    });

    /* Cargar detalle completo y similares */
    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            const [respDetalle, respSimilares] = await Promise.all([
                obtenerSample(sample.slug),
                obtenerSimilares(sample.id, 4),
            ]);
            if (!activo) return;
            if (respDetalle.ok && respDetalle.data) {
                setDetalle(respDetalle.data);
            }
            if (respSimilares.ok && respSimilares.data) {
                setSimilares(respSimilares.data);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [sample.id, sample.slug]);

    /* C151: Cargar picos del waveform (servidor o fallback AudioContext) */
    useEffect(() => {
        let activo = true;

        const cargarPicos = async () => {
            if (sample.rutaWaveform) {
                try {
                    const resp = await fetch(sample.rutaWaveform);
                    if (resp.ok) {
                        const json = await resp.json();
                        if (!activo) return;
                        const datos = Array.isArray(json)
                            ? json
                            : (json.peaks ?? json.picos ?? json.data ?? null);
                        if (Array.isArray(datos) && datos.length > 0) {
                            const maximo = Math.max(...datos, 0.001);
                            setPicosAudio(maximo > 1
                                ? datos.map((p: number) => Math.max(0.03, p / maximo))
                                : datos
                            );
                            return;
                        }
                    }
                } catch { /* Fallback silencioso */ }
            }

            /* Fallback: generar desde preview con AudioContext */
            if (!sample.rutaPreview || typeof window === 'undefined' || !window.AudioContext) {
                if (activo) setPicosAudio(null);
                return;
            }
            const ctx = new AudioContext();
            try {
                const resp = await fetch(sample.rutaPreview);
                if (!resp.ok) throw new Error();
                const buf = await resp.arrayBuffer();
                const decoded = await ctx.decodeAudioData(buf.slice(0));
                if (!activo) return;
                const raw = decoded.getChannelData(0);
                const barras = 96;
                const grupo = Math.floor(raw.length / barras);
                const picos: number[] = [];
                for (let i = 0; i < barras; i++) {
                    let max = 0;
                    for (let j = 0; j < grupo; j++) {
                        const abs = Math.abs(raw[i * grupo + j] || 0);
                        if (abs > max) max = abs;
                    }
                    picos.push(max);
                }
                const picoMax = Math.max(...picos, 0.001);
                setPicosAudio(picos.map(p => Math.max(0.03, p / picoMax)));
            } catch {
                if (activo) setPicosAudio(null);
            } finally {
                ctx.close().catch(() => undefined);
            }
        };

        cargarPicos();
        return () => { activo = false; };
    }, [sample.rutaWaveform, sample.rutaPreview]);

    /* C151: Inicializar elemento de audio */
    const inicializarAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio(sample.rutaPreview);
        audio.preload = 'metadata';

        audio.addEventListener('timeupdate', () => {
            if (audio.duration) setProgresoAudio(audio.currentTime / audio.duration);
        });
        audio.addEventListener('ended', () => {
            setReproduciendo(false);
            setProgresoAudio(0);
        });
        audio.addEventListener('pause', () => setReproduciendo(false));
        audio.addEventListener('play', () => setReproduciendo(true));

        audioRef.current = audio;
        return audio;
    }, [sample.rutaPreview]);

    /* Limpiar audio al desmontar */
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, []);

    /* C151: Play/pause al hacer click en waveform */
    const manejarClickWaveform = useCallback(() => {
        const audio = inicializarAudio();
        if (reproduciendo) {
            audio.pause();
        } else {
            window.dispatchEvent(new CustomEvent(EVENTO_PANEL_PLAY));
            audio.play().catch(() => setReproduciendo(false));
        }
    }, [inicializarAudio, reproduciendo]);

    /* C151: Seek al hacer click en posicion de waveform */
    const manejarSeek = useCallback((posicion: number) => {
        const audio = inicializarAudio();
        const aplicar = () => {
            if (!audio.duration) return;
            audio.currentTime = posicion * audio.duration;
            setProgresoAudio(posicion);
            window.dispatchEvent(new CustomEvent(EVENTO_PANEL_PLAY));
            audio.play().catch(() => setReproduciendo(false));
        };
        if (audio.duration && Number.isFinite(audio.duration)) {
            aplicar();
        } else {
            const h = () => { aplicar(); audio.removeEventListener('loadedmetadata', h); };
            audio.addEventListener('loadedmetadata', h);
            audio.load();
        }
    }, [inicializarAudio]);

    const manejarLike = useCallback(async () => {
        if (liked || reaccion) {
            const eraPositivo = reaccion === 'like' || reaccion === 'encanta';
            setLiked(false);
            setReaccion(null);
            setTotalLikes(prev => Math.max(0, prev - (eraPositivo ? 1 : 0)));
            await quitarLike('sample', sample.id);
        } else {
            setLiked(true);
            setReaccion('like');
            setTotalLikes(prev => prev + 1);
            await darLike('sample', sample.id, 'like');
        }
    }, [liked, reaccion, sample.id]);

    const meta = sample.metadata;
    const badges: string[] = [];
    if (meta?.instrumentos) {
        const inst = Array.isArray(meta.instrumentos) ? meta.instrumentos : [meta.instrumentos];
        inst.forEach(i => { if (i) badges.push(i); });
    }
    if (meta?.genero) {
        const gen = Array.isArray(meta.genero) ? meta.genero : [meta.genero];
        gen.forEach(g => { if (g) badges.push(g); });
    }
    /* C162: emocion puede venir como string concatenado sin separador (ej: "dreamyetherealmelancholic").
     * Intentar separar por comas, espacios o pipes. Si sigue siendo 1 string largo (>25 chars),
     * lo truncamos para no romper visualmente el badge. */
    if (meta?.emocion) {
        const emociones = Array.isArray(meta.emocion)
            ? meta.emocion
            : String(meta.emocion).split(/[,|;]\s*|\s+/).filter(Boolean);
        emociones.forEach(e => { if (e && e.length <= 30) badges.push(e); });
    }
    if (sample.bpm) badges.push(`${sample.bpm} BPM`);
    if (sample.key) badges.push(sample.key);

    return (
        <div className="panelDetalle">
            {/* Cabecera con boton cerrar — C158: PanelRightClose en vez de X */}
            <div className="panelDetalleCabecera">
                <button
                    className="panelDetalleAutor"
                    onClick={() => navegar(`/perfil/${sample.creador.username}/`)}
                    type="button"
                >
                    <Avatar
                        src={sample.creador.avatarUrl}
                        nombre={sample.creador.nombreVisible}
                        tamano="sm"
                    />
                    <span>{sample.creador.nombreVisible}</span>
                </button>
                <button className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label="Cerrar panel">
                    <PanelRightClose size={16} />
                </button>
            </div>

            {/* Titulo */}
            <h3 className="panelDetalleTitulo">
                {sample.titulo}
                {sample.esPremium && <Badge variante="premium" tamano="xs">PRO</Badge>}
            </h3>

            {/* Descripcion */}
            {detalle?.descripcion && (
                <p className="panelDetalleDescripcion">{detalle.descripcion}</p>
            )}

            {/* C151: Waveform reproducible */}
            <div className="panelDetalleWaveform">
                <WaveformPlayer
                    picos={picosAudio}
                    progreso={progresoAudio}
                    duracion={sample.duracion}
                    onSeek={manejarSeek}
                    onClick={manejarClickWaveform}
                    tamano="md"
                    interactivo
                />
            </div>

            {/* C152: Tags/Badges de metadata con borde */}
            {badges.length > 0 && (
                <div className="panelDetalleTags">
                    {badges.map(b => (
                        <Badge key={b} variante="neutro" estilo="borde" tamano="xs">{b}</Badge>
                    ))}
                </div>
            )}

            {/* C154: Acciones con bordes en vez de ghost */}
            <div className="panelDetalleAcciones">
                <BotonBase
                    variante={liked ? 'primario' : 'secundario'}
                    tamano="sm"
                    onClick={manejarLike}
                >
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    {totalLikes}
                </BotonBase>

                {sample.esPremium ? (
                    <BotonBase variante="secundario" tamano="sm" disabled>
                        <Lock size={14} />
                        PRO
                    </BotonBase>
                ) : (
                    <BotonBase variante="secundario" tamano="sm">
                        <Download size={14} />
                    </BotonBase>
                )}

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setComentariosVisibles(prev => !prev)}
                >
                    <MessageCircle size={14} />
                </BotonBase>

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    onClick={() => navegar(`/sample/${sample.slug}/`)}
                >
                    Ver completo
                </BotonBase>
            </div>

            {/* C154: Comentarios ocultos por defecto, se abren con boton */}
            {comentariosVisibles && (
                <div className="panelDetalleComentarios">
                    <h4 className="panelDetalleSubtitulo">Comentarios</h4>
                    <ListaComentarios
                        comentarios={comentarios}
                        cargando={cargandoComentarios}
                        onEnviar={enviarComentario}
                        onClickAutor={(username) => navegar(`/perfil/${username}/`)}
                        maxVisibles={5}
                        onCargarMas={cargarMasComentarios}
                        hayMasPaginas={hayMasComentarios}
                    />
                </div>
            )}

            {/* Similares */}
            {similares.length > 0 && (
                <div className="panelDetalleSimilares">
                    <h4 className="panelDetalleSubtitulo">También te podría gustar</h4>
                    <div className="panelDetalleSimilaresLista">
                        {similares.map(s => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                                className="panelDetalleTarjetaMini"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelDetalleSample;
