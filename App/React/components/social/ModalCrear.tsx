/*
 * Componente: ModalCrear — Kamples
 * Modal unificado para crear publicaciones y subir samples.
 * Estilo red social: avatar + texto + adjuntos.
 * Soporta # en texto para tags, drag & drop de audio/imagenes.
 * Sin campos manuales de BPM/Key/Tipo: la IA los genera automáticamente.
 * Incluye waveform preview del audio adjunto y toggles de condiciones.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { Music, Image, X, Download, ShieldCheck } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useArchivosDragDrop } from '@app/hooks/useArchivosDragDrop';
import { crearLogger } from '@app/services/logger';
import '../../styles/componentes/modalCrear.css';

const log = crearLogger('ModalCrear');
const MAX_CARACTERES = 2000;

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

/*
 * Genera peaks simplificados de un archivo de audio para waveform preview.
 * Usa Web Audio API para decodificar y reducir a N barras.
 */
const generarPeaks = async (archivo: File, barras = 60): Promise<number[]> => {
    try {
        const buffer = await archivo.arrayBuffer();
        const contexto = new AudioContext();
        const audioBuffer = await contexto.decodeAudioData(buffer);
        const datos = audioBuffer.getChannelData(0);
        const pasoTamano = Math.floor(datos.length / barras);
        const peaks: number[] = [];

        for (let i = 0; i < barras; i++) {
            let max = 0;
            for (let j = 0; j < pasoTamano; j++) {
                const abs = Math.abs(datos[i * pasoTamano + j] || 0);
                if (abs > max) max = abs;
            }
            peaks.push(max);
        }

        await contexto.close();
        return peaks;
    } catch {
        return Array(barras).fill(0.3);
    }
};

export const ModalCrear = (): JSX.Element | null => {
    const { abierto, cerrar } = useCrearModalStore();
    const { usuario, autenticado } = useAuthStore();

    const [contenido, setContenido] = useState('');
    const [publicando, setPublicando] = useState(false);
    const [permitirDescarga, setPermitirDescarga] = useState(true);
    const [licenciaLibre, setLicenciaLibre] = useState(false);
    const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [reproduciendoPreview, setReproduciendoPreview] = useState(false);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    const {
        audioAdjunto,
        imagenes,
        arrastrando,
        inputAudioRef,
        inputImagenRef,
        manejarInputAudio,
        manejarInputImagen,
        quitarImagen,
        quitarAudio,
        manejarDragEnter,
        manejarDragLeave,
        manejarDragOver,
        manejarDrop,
        resetear: resetearArchivos,
        formatosAudio,
        maxImagenes,
    } = useArchivosDragDrop();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /* Generar waveform al adjuntar audio */
    useEffect(() => {
        if (audioAdjunto?.archivo) {
            generarPeaks(audioAdjunto.archivo).then(setWaveformPeaks);
            const url = URL.createObjectURL(audioAdjunto.archivo);
            setAudioUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setWaveformPeaks([]);
        setAudioUrl(null);
        setReproduciendoPreview(false);
    }, [audioAdjunto]);

    /* Toggle play/pause del preview */
    const togglePreview = useCallback(() => {
        const audio = audioPreviewRef.current;
        if (!audio || !audioUrl) return;
        if (reproduciendoPreview) {
            audio.pause();
            setReproduciendoPreview(false);
        } else {
            audio.play();
            setReproduciendoPreview(true);
        }
    }, [audioUrl, reproduciendoPreview]);

    /* Resetear al cerrar */
    const manejarCerrar = useCallback(() => {
        if (publicando) return;
        cerrar();
        setTimeout(() => {
            setContenido('');
            resetearArchivos();
            setPermitirDescarga(true);
            setLicenciaLibre(false);
            setWaveformPeaks([]);
            setAudioUrl(null);
            setReproduciendoPreview(false);
        }, 200);
    }, [cerrar, publicando, resetearArchivos]);

    /* Auto-resize textarea */
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

    /* Publicar */
    const manejarPublicar = useCallback(async () => {
        if (publicando) return;
        const tieneContenido = contenido.trim().length > 0 || audioAdjunto || imagenes.length > 0;
        if (!tieneContenido) return;

        setPublicando(true);
        const tags = extraerTags(contenido);
        log.info('Publicando', {
            tags,
            tieneAudio: !!audioAdjunto,
            imagenes: imagenes.length,
            permitirDescarga,
            licenciaLibre,
        });

        /* TO-DO: enviar a POST /kamples/v1/samples con FormData */
        await new Promise((r) => setTimeout(r, 1000));

        setPublicando(false);
        manejarCerrar();
    }, [contenido, audioAdjunto, imagenes, publicando, manejarCerrar, permitirDescarga, licenciaLibre]);

    /* Ctrl+Enter para publicar */
    const manejarKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            manejarPublicar();
        }
    }, [manejarPublicar]);

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

                {/* Audio adjunto con waveform preview */}
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
                            className="crearAdjuntoBtn crearAdjuntoBtnQuitar"
                            onClick={() => { quitarAudio(); }}
                            type="button"
                            aria-label="Quitar audio"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Waveform preview del audio */}
                {audioAdjunto && waveformPeaks.length > 0 && (
                    <div className="crearWaveform" onClick={togglePreview} role="button" tabIndex={0}>
                        <div className="crearWaveformBarras">
                            {waveformPeaks.map((peak, i) => (
                                <div
                                    key={i}
                                    className="crearWaveformBarra"
                                    style={{ height: `${Math.max(peak * 100, 4)}%` }}
                                />
                            ))}
                        </div>
                        <span className="crearWaveformLabel">
                            {reproduciendoPreview ? 'Reproduciendo...' : 'Click para previsualizar'}
                        </span>
                        {audioUrl && (
                            <audio
                                ref={audioPreviewRef}
                                src={audioUrl}
                                onEnded={() => setReproduciendoPreview(false)}
                            />
                        )}
                    </div>
                )}

                {/* Nota: la IA generará BPM, Key y Tipo automáticamente */}
                {audioAdjunto && (
                    <div className="crearIaInfo">
                        <span>BPM, tonalidad y tipo se detectarán automáticamente con IA</span>
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

                {/* Overlay drag & drop */}
                {arrastrando && (
                    <div className="crearDropOverlay">
                        <Music size={32} />
                        <span>Suelta archivos aquí</span>
                    </div>
                )}

                {/* Condiciones del sample (iconos sobre botón crear) */}
                {audioAdjunto && (
                    <div className="crearCondiciones">
                        <button
                            className={`crearCondicionBtn ${permitirDescarga ? 'crearCondicionActiva' : ''}`}
                            onClick={() => setPermitirDescarga(!permitirDescarga)}
                            type="button"
                            title={permitirDescarga ? 'Descarga permitida' : 'Descarga no permitida'}
                        >
                            <Download size={14} />
                            <span>{permitirDescarga ? 'Descarga sí' : 'Descarga no'}</span>
                        </button>
                        <button
                            className={`crearCondicionBtn ${licenciaLibre ? 'crearCondicionActiva' : ''}`}
                            onClick={() => setLicenciaLibre(!licenciaLibre)}
                            type="button"
                            title={licenciaLibre ? 'Licencia libre' : 'Licencia estándar'}
                        >
                            <ShieldCheck size={14} />
                            <span>{licenciaLibre ? 'Libre' : 'Estándar'}</span>
                        </button>
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
                            disabled={imagenes.length >= maxImagenes}
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
                <input ref={inputAudioRef} type="file" accept={formatosAudio.join(',')} hidden onChange={manejarInputAudio} />
                <input ref={inputImagenRef} type="file" accept="image/*" multiple hidden onChange={manejarInputImagen} />
            </div>
        </Modal>
    );
};

export default ModalCrear;
