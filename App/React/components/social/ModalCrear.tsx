/*
 * Componente: ModalCrear — Kamples
 * Modal unificado para crear publicaciones y subir samples.
 * Estilo red social: avatar + texto + adjuntos.
 * Soporta # en texto para tags, drag & drop de audio/imagenes.
 * TO-DO: conectar con endpoints reales de subida.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { Music, Image, X, Send, Sliders } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';
import '../../styles/componentes/modalCrear.css';

const log = crearLogger('ModalCrear');
const MAX_CARACTERES = 2000;
const FORMATOS_AUDIO = ['.wav', '.mp3', '.flac', '.aiff', '.aif'];
const MAX_IMAGENES = 4;
const MAX_MB = 100;

interface ArchivoAudio {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

interface ImagenPreview {
    archivo: File;
    url: string;
}

interface MetadataAudio {
    bpm: string;
    key: string;
    tipo: string;
}

/* Extraer hashtags del texto */
const extraerTags = (texto: string): string[] => {
    const regex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = regex.exec(texto)) !== null) {
        tags.push(match[1].toLowerCase());
    }
    return [...new Set(tags)];
};

const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ModalCrear = (): JSX.Element | null => {
    const { abierto, cerrar } = useCrearModalStore();
    const { usuario, autenticado } = useAuthStore();

    const [contenido, setContenido] = useState('');
    const [audioAdjunto, setAudioAdjunto] = useState<ArchivoAudio | null>(null);
    const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
    const [metadata, setMetadata] = useState<MetadataAudio>({ bpm: '', key: '', tipo: 'loop' });
    const [mostrarMetadata, setMostrarMetadata] = useState(false);
    const [arrastrando, setArrastrando] = useState(false);
    const [publicando, setPublicando] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputAudioRef = useRef<HTMLInputElement>(null);
    const inputImagenRef = useRef<HTMLInputElement>(null);
    const contadorDrag = useRef(0);

    /* Resetear al cerrar */
    const manejarCerrar = useCallback(() => {
        if (publicando) return;
        cerrar();
        setTimeout(() => {
            setContenido('');
            setAudioAdjunto(null);
            setImagenes([]);
            setMetadata({ bpm: '', key: '', tipo: 'loop' });
            setMostrarMetadata(false);
        }, 200);
    }, [cerrar, publicando]);

    /* Auto-resize textarea (2 a 6 líneas, ~20px por línea) */
    const ajustarAltura = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const alturaLinea = 20;
        const min = alturaLinea * 2;
        const max = alturaLinea * 6;
        const nueva = Math.min(Math.max(el.scrollHeight, min), max);
        el.style.height = `${nueva}px`;
    }, []);

    const manejarCambioTexto = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_CARACTERES) {
            setContenido(e.target.value);
        }
        ajustarAltura();
    }, [ajustarAltura]);

    /* Ctrl+Enter para publicar */
    const manejarKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    }, []);

    /* Adjuntar audio */
    const manejarAudio = useCallback((archivos: File[]) => {
        const audio = archivos.find((f) => {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            return FORMATOS_AUDIO.includes(ext) && f.size <= MAX_MB * 1024 * 1024;
        });
        if (audio) {
            setAudioAdjunto({
                archivo: audio,
                nombre: audio.name,
                tamano: formatearTamano(audio.size),
                formato: audio.name.split('.').pop()?.toUpperCase() ?? '',
            });
        }
    }, []);

    const manejarInputAudio = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) manejarAudio(Array.from(e.target.files));
        e.target.value = '';
    }, [manejarAudio]);

    /* Adjuntar imágenes */
    const manejarInputImagen = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivos = Array.from(e.target.files ?? []);
        const disponibles = MAX_IMAGENES - imagenes.length;
        const nuevas = archivos.slice(0, disponibles).map((f) => ({
            archivo: f,
            url: URL.createObjectURL(f),
        }));
        setImagenes((prev) => [...prev, ...nuevas]);
        if (inputImagenRef.current) inputImagenRef.current.value = '';
    }, [imagenes.length]);

    const quitarImagen = useCallback((i: number) => {
        setImagenes((prev) => {
            const copia = [...prev];
            URL.revokeObjectURL(copia[i].url);
            copia.splice(i, 1);
            return copia;
        });
    }, []);

    /* Drag & drop en el modal */
    const manejarDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        contadorDrag.current++;
        setArrastrando(true);
    }, []);

    const manejarDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        contadorDrag.current--;
        if (contadorDrag.current === 0) setArrastrando(false);
    }, []);

    const manejarDragOver = useCallback((e: DragEvent) => { e.preventDefault(); }, []);

    const manejarDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        contadorDrag.current = 0;
        setArrastrando(false);
        const archivos = Array.from(e.dataTransfer.files);
        const audios = archivos.filter((f) => {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            return FORMATOS_AUDIO.includes(ext);
        });
        const imgs = archivos.filter((f) => f.type.startsWith('image/'));
        if (audios.length > 0) manejarAudio(audios);
        if (imgs.length > 0) {
            const disponibles = MAX_IMAGENES - imagenes.length;
            const nuevas = imgs.slice(0, disponibles).map((f) => ({
                archivo: f,
                url: URL.createObjectURL(f),
            }));
            setImagenes((prev) => [...prev, ...nuevas]);
        }
    }, [manejarAudio, imagenes.length]);

    /* Publicar */
    const manejarPublicar = useCallback(async () => {
        if (publicando) return;
        const tieneContenido = contenido.trim().length > 0 || audioAdjunto || imagenes.length > 0;
        if (!tieneContenido) return;

        setPublicando(true);
        const tags = extraerTags(contenido);
        log.info('Publicando', { tags, tieneAudio: !!audioAdjunto, imagenes: imagenes.length });

        /* TO-DO: llamar a API real de subida */
        await new Promise((r) => setTimeout(r, 1000));

        setPublicando(false);
        manejarCerrar();
    }, [contenido, audioAdjunto, imagenes, publicando, manejarCerrar]);

    useEffect(() => {
        if (abierto) ajustarAltura();
    }, [abierto, ajustarAltura]);

    if (!abierto || !autenticado) return null;

    const tags = extraerTags(contenido);
    const caracteresPendientes = MAX_CARACTERES - contenido.length;
    const puedePublicar = (contenido.trim().length > 0 || !!audioAdjunto || imagenes.length > 0) && !publicando;

    return (
        <Modal abierto={abierto} onCerrar={manejarCerrar}>
            <div
                className="crearContenido"
                onDragEnter={manejarDragEnter}
                onDragLeave={manejarDragLeave}
                onDragOver={manejarDragOver}
                onDrop={manejarDrop}
            >
                {/* Avatar + nombre */}
                <div className="crearCabecera">
                    <Avatar
                        src={usuario?.avatarUrl ?? null}
                        nombre={usuario?.nombreVisible ?? ''}
                        tamano="sm"
                    />
                    <span className="crearUsuario">
                        {usuario?.nombreVisible ?? usuario?.username}
                    </span>
                </div>

                {/* Textarea con soporte de # tags */}
                <textarea
                    ref={textareaRef}
                    className="crearTextarea"
                    placeholder="¿Qué estás creando? Usa # para agregar tags"
                    value={contenido}
                    onChange={manejarCambioTexto}
                    onKeyDown={manejarKeyDown}
                    rows={1}
                    autoFocus
                />

                {/* Tags extraídos del texto */}
                {tags.length > 0 && (
                    <div className="crearTags">
                        {tags.map((tag) => (
                            <Badge key={tag} variante="acento" estilo="borde">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Audio adjunto */}
                {audioAdjunto && (
                    <div className="crearAdjunto">
                        <div className="crearAdjuntoIcono"><Music size={18} /></div>
                        <div className="crearAdjuntoInfo">
                            <span className="crearAdjuntoNombre">{audioAdjunto.nombre}</span>
                            <span className="crearAdjuntoMeta">
                                {audioAdjunto.formato} — {audioAdjunto.tamano}
                            </span>
                        </div>
                        <button
                            className="crearAdjuntoBtn"
                            onClick={() => setMostrarMetadata(!mostrarMetadata)}
                            type="button"
                            aria-label="Configurar metadata"
                        >
                            <Sliders size={14} />
                        </button>
                        <button
                            className="crearAdjuntoBtn crearAdjuntoBtnQuitar"
                            onClick={() => { setAudioAdjunto(null); setMostrarMetadata(false); }}
                            type="button"
                            aria-label="Quitar audio"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Metadata de audio (expandible) */}
                {audioAdjunto && mostrarMetadata && (
                    <div className="crearMetadata">
                        <div className="crearMetadataGrupo">
                            <label>BPM</label>
                            <input
                                type="number"
                                placeholder="120"
                                value={metadata.bpm}
                                onChange={(e) => setMetadata((p) => ({ ...p, bpm: e.target.value }))}
                            />
                        </div>
                        <div className="crearMetadataGrupo">
                            <label>Key</label>
                            <select
                                value={metadata.key}
                                onChange={(e) => setMetadata((p) => ({ ...p, key: e.target.value }))}
                            >
                                <option value="">Auto</option>
                                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="crearMetadataGrupo">
                            <label>Tipo</label>
                            <select
                                value={metadata.tipo}
                                onChange={(e) => setMetadata((p) => ({ ...p, tipo: e.target.value }))}
                            >
                                {['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'].map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Preview de imágenes */}
                {imagenes.length > 0 && (
                    <div className={`crearImagenes crearImagenes${imagenes.length}`}>
                        {imagenes.map((img, i) => (
                            <div className="crearImagenItem" key={img.url}>
                                <img src={img.url} alt={`Imagen ${i + 1}`} />
                                <button
                                    className="crearImagenQuitar"
                                    onClick={() => quitarImagen(i)}
                                    type="button"
                                    aria-label="Quitar imagen"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Overlay drag & drop (solo visible al arrastrar) */}
                {arrastrando && (
                    <div className="crearDropOverlay">
                        <Music size={32} />
                        <span>Suelta archivos aquí</span>
                    </div>
                )}

                {/* Barra de acciones */}
                <div className="crearAcciones">
                    <div className="crearAccionesIzquierda">
                        <button
                            className="crearAccionBtn"
                            onClick={() => inputAudioRef.current?.click()}
                            type="button"
                            aria-label="Adjuntar audio"
                            disabled={!!audioAdjunto}
                        >
                            <Music size={18} />
                        </button>
                        <button
                            className="crearAccionBtn"
                            onClick={() => inputImagenRef.current?.click()}
                            type="button"
                            aria-label="Adjuntar imagen"
                            disabled={imagenes.length >= MAX_IMAGENES}
                        >
                            <Image size={18} />
                        </button>
                    </div>

                    <div className="crearAccionesDerecha">
                        <span className={`crearContador ${caracteresPendientes < 100 ? 'crearContadorAlerta' : ''}`}>
                            {caracteresPendientes}
                        </span>
                        <BotonBase
                            variante="primario"
                            tamano="sm"
                            onClick={manejarPublicar}
                            disabled={!puedePublicar}
                        >
                            {publicando ? 'Publicando...' : 'Publicar'}
                        </BotonBase>
                    </div>
                </div>

                {/* Inputs ocultos */}
                <input ref={inputAudioRef} type="file" accept={FORMATOS_AUDIO.join(',')} hidden onChange={manejarInputAudio} />
                <input ref={inputImagenRef} type="file" accept="image/*" multiple hidden onChange={manejarInputImagen} />
            </div>
        </Modal>
    );
};

export default ModalCrear;
