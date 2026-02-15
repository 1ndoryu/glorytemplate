/*
 * Componente: ModalCrear — Kamples
 * Modal unificado para crear publicaciones y subir samples.
 * Estilo red social: avatar + texto + adjuntos.
 * Soporta # en texto para tags, drag & drop de audio/imagenes.
 * TO-DO: conectar con endpoints reales de subida.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { Music, Image, X, Sliders } from 'lucide-react';
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

export const ModalCrear = (): JSX.Element | null => {
    const { abierto, cerrar } = useCrearModalStore();
    const { usuario, autenticado } = useAuthStore();

    const [contenido, setContenido] = useState('');
    const [metadata, setMetadata] = useState<MetadataAudio>({ bpm: '', key: '', tipo: 'loop' });
    const [mostrarMetadata, setMostrarMetadata] = useState(false);
    const [publicando, setPublicando] = useState(false);

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

    /* Resetear al cerrar */
    const manejarCerrar = useCallback(() => {
        if (publicando) return;
        cerrar();
        setTimeout(() => {
            setContenido('');
            resetearArchivos();
            setMetadata({ bpm: '', key: '', tipo: 'loop' });
            setMostrarMetadata(false);
        }, 200);
    }, [cerrar, publicando, resetearArchivos]);

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
                            onClick={() => { quitarAudio(); setMostrarMetadata(false); }}
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
