/*
 * Componente: ListaComentarios — Kamples
 * Lista de comentarios con input para escribir nuevos.
 * C129: Paginación infinita con IntersectionObserver.
 * C264+C265: Delegación de acciones a ComentarioItem.
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Image, Mic, X, Play, Pause } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { ComentarioItem, type ComentarioAcciones } from '@app/components/social/ComentarioItem';
import { useAuthStore } from '@app/stores/authStore';
import type { Comentario } from '@app/types/publicacion';
import '../../styles/componentes/listaComentarios.css';

interface ListaComentariosProps {
    comentarios: Comentario[];
    onEnviar?: (contenido: string, parentId?: number) => void;
    onEnviarMultimedia?: (tipo: 'imagen' | 'audio', archivo: File, contenido?: string, parentId?: number) => void;
    cargando?: boolean;
    onClickAutor?: (username: string) => void;
    maxVisibles?: number;
    className?: string;
    /* C129: Paginacion infinita */
    onCargarMas?: () => void;
    hayMasPaginas?: boolean;
    /* C264+C265: Acciones de comentario delegadas a ComentarioItem */
    onEditar?: (id: number, contenido: string) => Promise<boolean>;
    onEliminar?: (id: number) => Promise<boolean>;
    onReportar?: (id: number, razon: string) => Promise<boolean>;
    onToggleLike?: (id: number, liked: boolean) => Promise<void>;
    onCargarRespuestas?: (id: number) => Promise<void>;
    editandoId?: number | null;
    setEditandoId?: (id: number | null) => void;
    respondendoAId?: number | null;
    setRespondendoAId?: (id: number | null) => void;
}

/* Formatear fecha relativa */
const formatearTiempoComentario = (fecha: string): string => {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    const dias = Math.floor(hrs / 24);
    if (dias < 30) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

/* C130+C201: Reproductor de audio con waveform para comentarios */
const ComentarioAudio = ({ src, picos }: { src: string; picos?: number[] }): JSX.Element => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [duracion, setDuracion] = useState(0);
    const [picosGenerados, setPicosGenerados] = useState<number[] | null>(picos ?? null);

    /* Generar picos del audio si no vienen del backend */
    useEffect(() => {
        if (picos && picos.length > 0) {
            setPicosGenerados(picos);
            return;
        }
        if (!src || typeof window === 'undefined' || !window.AudioContext) return;
        let activo = true;
        const ctx = new window.AudioContext();
        (async () => {
            try {
                const resp = await fetch(src);
                if (!resp.ok) return;
                const buf = await resp.arrayBuffer();
                const decoded = await ctx.decodeAudioData(buf.slice(0));
                if (!activo) return;
                const data = decoded.getChannelData(0);
                const barras = 60;
                const porBarra = Math.max(1, Math.floor(data.length / barras));
                const peaks: number[] = [];
                for (let i = 0; i < barras; i++) {
                    let max = 0;
                    for (let j = 0; j < porBarra; j++) {
                        const val = Math.abs(data[i * porBarra + j] || 0);
                        if (val > max) max = val;
                    }
                    peaks.push(max);
                }
                const maximo = Math.max(...peaks, 0.001);
                setPicosGenerados(peaks.map(p => Math.max(0.03, p / maximo)));
            } catch { /* silencio */ }
            finally { ctx.close().catch(() => {}); }
        })();
        return () => { activo = false; };
    }, [src, picos]);

    const alternarPlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (reproduciendo) {
            audio.pause();
        } else {
            audio.play();
        }
        setReproduciendo(!reproduciendo);
    }, [reproduciendo]);

    const manejarProgreso = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        setProgreso(audio.currentTime / audio.duration);
    }, []);

    const manejarSeek = useCallback((pos: number) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        audio.currentTime = pos * audio.duration;
        setProgreso(pos);
        if (!reproduciendo) {
            audio.play();
            setReproduciendo(true);
        }
    }, [reproduciendo]);

    return (
        <div className="comentarioAudio">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={manejarProgreso}
                onLoadedMetadata={() => {
                    if (audioRef.current) setDuracion(audioRef.current.duration);
                }}
                onEnded={() => { setReproduciendo(false); setProgreso(0); }}
                preload="metadata"
            />
            <button
                className="comentarioAudioBtn"
                onClick={alternarPlay}
                type="button"
                aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
            >
                {reproduciendo ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="comentarioAudioWaveform">
                <WaveformPlayer
                    picos={picosGenerados}
                    progreso={progreso}
                    duracion={duracion}
                    onSeek={manejarSeek}
                    tamano="sm"
                    colorNoReproducido="#888"
                    colorReproducido="var(--acento)"
                    anchoBarra={2}
                    espacioBarra={1}
                    simetrico={false}
                />
            </div>
        </div>
    );
};

export const ListaComentarios = ({
    comentarios,
    onEnviar,
    onEnviarMultimedia,
    cargando = false,
    onClickAutor,
    maxVisibles = 5,
    className = '',
    onCargarMas,
    hayMasPaginas = false,
    onEditar,
    onEliminar,
    onReportar,
    onToggleLike,
    onCargarRespuestas,
    editandoId,
    setEditandoId,
    respondendoAId,
    setRespondendoAId,
}: ListaComentariosProps): JSX.Element => {
    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const [textoNuevo, setTextoNuevo] = useState('');
    const [mostrarTodos, setMostrarTodos] = useState(false);
    const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [tipoAdjunto, setTipoAdjunto] = useState<'imagen' | 'audio' | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputImagenRef = useRef<HTMLInputElement>(null);
    const inputAudioRef = useRef<HTMLInputElement>(null);
    const sentinelaRef = useRef<HTMLDivElement>(null);

    /* C130: Limpiar preview URL al desmontar o cambiar archivo */
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const limpiarAdjunto = useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setArchivoAdjunto(null);
        setPreviewUrl(null);
        setTipoAdjunto(null);
    }, [previewUrl]);

    const manejarArchivoSeleccionado = useCallback((archivo: File, tipo: 'imagen' | 'audio') => {
        limpiarAdjunto();
        setArchivoAdjunto(archivo);
        setTipoAdjunto(tipo);
        if (tipo === 'imagen') {
            setPreviewUrl(URL.createObjectURL(archivo));
        }
    }, [limpiarAdjunto]);

    const manejarEnviar = useCallback(() => {
        /* Enviar multimedia si hay archivo adjunto */
        if (archivoAdjunto && tipoAdjunto && onEnviarMultimedia) {
            const texto = textoNuevo.trim() || undefined;
            onEnviarMultimedia(tipoAdjunto, archivoAdjunto, texto);
            setTextoNuevo('');
            limpiarAdjunto();
            inputRef.current?.focus();
            return;
        }

        /* Enviar texto plano */
        const texto = textoNuevo.trim();
        if (!texto || !onEnviar) return;
        onEnviar(texto);
        setTextoNuevo('');
        inputRef.current?.focus();
    }, [textoNuevo, onEnviar, onEnviarMultimedia, archivoAdjunto, tipoAdjunto, limpiarAdjunto]);

    const manejarKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                manejarEnviar();
            }
        },
        [manejarEnviar]
    );

    const visibles = mostrarTodos ? comentarios : comentarios.slice(0, maxVisibles);
    const hayMasLocales = comentarios.length > maxVisibles && !mostrarTodos;
    const clases = ['listaComentarios', className].filter(Boolean).join(' ');
    const puedeEnviar = (textoNuevo.trim().length > 0) || (archivoAdjunto !== null);

    /* C129: IntersectionObserver para cargar más al llegar al fondo */
    useEffect(() => {
        if (!mostrarTodos || !hayMasPaginas || !onCargarMas || cargando) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) onCargarMas();
            },
            { rootMargin: '100px' }
        );
        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [mostrarTodos, hayMasPaginas, onCargarMas, cargando]);

    /* C264+C265: Construir acciones para ComentarioItem */
    const accionesComentario: ComentarioAcciones | undefined = (onEditar || onEliminar || onReportar || onToggleLike || onCargarRespuestas || onEnviar)
        ? {
            onEditar,
            onEliminar,
            onReportar,
            onToggleLike,
            onCargarRespuestas,
            onResponder: onEnviar
                ? async (contenido: string, parentId: number) => {
                    onEnviar(contenido, parentId);
                    return true;
                }
                : undefined,
            editandoId: editandoId ?? null,
            setEditandoId: setEditandoId ?? (() => {}),
            respondendoAId: respondendoAId ?? null,
            setRespondendoAId: setRespondendoAId ?? (() => {}),
        }
        : undefined;

    /* Renderizar media dentro de ComentarioItem */
    const renderMediaComentario = useCallback((comentario: Comentario) => {
        return (
            <>
                {comentario.tipoContenido === 'imagen' && comentario.mediaUrl && (
                    <a
                        href={comentario.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comentarioImagen"
                    >
                        <img src={comentario.mediaUrl} alt="Imagen adjunta" loading="lazy" />
                    </a>
                )}
                {comentario.tipoContenido === 'audio' && comentario.mediaUrl && (
                    <ComentarioAudio
                        src={comentario.mediaUrl}
                        picos={comentario.mediaMetadata?.picos}
                    />
                )}
            </>
        );
    }, []);

    return (
        <div className={clases}>
            {/* Lista de comentarios */}
            {visibles.length > 0 && (
                <div className="comentariosLista">
                    {visibles.map((comentario) => (
                        <ComentarioItem
                            key={comentario.id}
                            comentario={comentario}
                            acciones={accionesComentario}
                            onClickAutor={onClickAutor}
                            renderMediaComentario={renderMediaComentario}
                        />
                    ))}
                </div>
            )}

            {/* Ver más locales (ya cargados pero ocultos) */}
            {hayMasLocales && (
                <button
                    className="comentariosVerMas"
                    onClick={() => setMostrarTodos(true)}
                    type="button"
                >
                    Ver {comentarios.length - maxVisibles} comentarios más
                </button>
            )}

            {/* C129: Sentinela para infinite scroll — carga más del backend */}
            {mostrarTodos && hayMasPaginas && (
                <div ref={sentinelaRef} className="comentariosSentinela">
                    {cargando && <span className="comentariosCargando">Cargando…</span>}
                </div>
            )}

            {/* Input para nuevo comentario */}
            {autenticado && (onEnviar || onEnviarMultimedia) && (
                <div className="comentarioNuevoContenedor">
                    {/* C130: Preview de archivo adjunto */}
                    {archivoAdjunto && (
                        <div className="comentarioPreview">
                            {tipoAdjunto === 'imagen' && previewUrl && (
                                <img src={previewUrl} alt="Preview" className="comentarioPreviewImagen" />
                            )}
                            {tipoAdjunto === 'audio' && (
                                <span className="comentarioPreviewAudio">
                                    <Mic size={12} /> {archivoAdjunto.name}
                                </span>
                            )}
                            <button
                                className="comentarioPreviewCerrar"
                                onClick={limpiarAdjunto}
                                type="button"
                                aria-label="Quitar archivo"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <div className="comentarioNuevo">
                        <Avatar
                            src={usuario?.avatarUrl ?? null}
                            nombre={usuario?.nombreVisible ?? ''}
                            tamano="xs"
                        />
                        <div className="comentarioNuevoInput">
                            {/* C130: Botones adjuntar imagen/audio */}
                            {onEnviarMultimedia && (
                                <>
                                    <button
                                        className="comentarioAdjuntarBtn"
                                        onClick={() => inputImagenRef.current?.click()}
                                        type="button"
                                        aria-label="Adjuntar imagen"
                                        title="Adjuntar imagen"
                                    >
                                        <Image size={14} />
                                    </button>
                                    <button
                                        className="comentarioAdjuntarBtn"
                                        onClick={() => inputAudioRef.current?.click()}
                                        type="button"
                                        aria-label="Adjuntar audio"
                                        title="Adjuntar audio"
                                    >
                                        <Mic size={14} />
                                    </button>
                                    <input
                                        ref={inputImagenRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="comentarioInputOculto"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) manejarArchivoSeleccionado(f, 'imagen');
                                            e.target.value = '';
                                        }}
                                    />
                                    <input
                                        ref={inputAudioRef}
                                        type="file"
                                        accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm,audio/flac,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac"
                                        className="comentarioInputOculto"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) manejarArchivoSeleccionado(f, 'audio');
                                            e.target.value = '';
                                        }}
                                    />
                                </>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={archivoAdjunto ? 'Escribe un caption (opcional)...' : 'Escribe un comentario...'}
                                value={textoNuevo}
                                onChange={(e) => setTextoNuevo(e.target.value)}
                                onKeyDown={manejarKeyDown}
                                maxLength={300}
                            />
                            <button
                                className="comentarioEnviarBtn"
                                onClick={manejarEnviar}
                                type="button"
                                disabled={!puedeEnviar}
                                aria-label="Enviar comentario"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mensaje si no hay comentarios */}
            {visibles.length === 0 && !cargando && (
                <p className="comentariosVacio">Sin comentarios aún</p>
            )}
        </div>
    );
};

export default ListaComentarios;
