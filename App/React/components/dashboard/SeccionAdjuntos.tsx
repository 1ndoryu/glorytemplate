/*
 * SeccionAdjuntos
 * Componente para gestionar archivos adjuntos en una tarea
 * Soporta subida física al servidor (nuevo) y Base64 legacy
 * Tipos: Imagenes, Documentos, Audios
 */

import {useRef, useState, useCallback} from 'react';
import {X, File, Image as ImageIcon, Trash2, AlertTriangle, Music, Play, Pause, Upload, Loader2, Lock} from 'lucide-react';
import type {Adjunto} from '../../types/dashboard';
import {SeccionPanel} from '../shared';
import {useAdjuntos} from '../../hooks/useAdjuntos';

interface SeccionAdjuntosProps {
    adjuntos: Adjunto[];
    onChange: (adjuntos: Adjunto[]) => void;
    modoLegacy?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function SeccionAdjuntos({adjuntos, onChange, modoLegacy = false}: SeccionAdjuntosProps): JSX.Element {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRefs = useRef<{[key: number]: HTMLAudioElement}>({});
    const [error, setError] = useState<string | null>(null);

    /* Estados para audio */
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [progress, setProgress] = useState<{[key: number]: number}>({});

    /* Estado para overlay de imagen */
    const [previewImage, setPreviewImage] = useState<Adjunto | null>(null);

    /* Estado para tracking de contenido descifrado (lazy loading) */
    const [contenidoDescifrado, setContenidoDescifrado] = useState<{[key: number]: string}>({});
    const [cargandoDescifrado, setCargandoDescifrado] = useState<{[key: number]: boolean}>({});

    /* Hook para subida y eliminación física */
    const {estado: estadoSubida, subirArchivo, eliminarArchivo: eliminarArchivoFisico, limpiarError} = useAdjuntos();

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    /**
     * Determina el tipo de adjunto basado en MIME
     */
    const determinarTipo = (mimeType: string): 'imagen' | 'audio' | 'archivo' => {
        if (mimeType.startsWith('image/')) return 'imagen';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'archivo';
    };

    /**
     * Maneja la selección de archivo - modo físico (nuevo)
     */
    const handleFileSelectFisico = useCallback(
        async (file: File) => {
            /* Validar tamaño */
            if (file.size > MAX_FILE_SIZE) {
                setError(`El archivo es demasiado grande (Max: ${formatBytes(MAX_FILE_SIZE)})`);
                return;
            }

            setError(null);
            limpiarError();

            /* Subir archivo al servidor */
            const nuevoAdjunto = await subirArchivo(file);

            if (nuevoAdjunto) {
                onChange([...adjuntos, nuevoAdjunto]);
            } else if (estadoSubida.error) {
                setError(estadoSubida.error);
            }
        },
        [adjuntos, onChange, subirArchivo, estadoSubida.error, limpiarError]
    );

    /**
     * Maneja la selección de archivo - modo legacy (Base64)
     */
    const handleFileSelectLegacy = useCallback(
        (file: File) => {
            /* Validar tamaño */
            if (file.size > MAX_FILE_SIZE) {
                setError(`El archivo es demasiado grande (Max: ${formatBytes(MAX_FILE_SIZE)})`);
                return;
            }

            setError(null);

            const reader = new FileReader();
            reader.onload = e => {
                const url = e.target?.result as string;
                const tipo = determinarTipo(file.type);

                const nuevoAdjunto: Adjunto = {
                    id: Date.now(),
                    tipo,
                    url,
                    nombre: file.name,
                    tamano: file.size,
                    fechaSubida: new Date().toISOString()
                };

                onChange([...adjuntos, nuevoAdjunto]);
            };
            reader.readAsDataURL(file);
        },
        [adjuntos, onChange]
    );

    /**
     * Handler principal para selección de archivo
     */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (modoLegacy) {
            handleFileSelectLegacy(file);
        } else {
            handleFileSelectFisico(file);
        }

        /* Limpiar input */
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * Determina si una URL es Base64 (legacy) o física
     */
    const esBase64 = (url: string): boolean => {
        return url.startsWith('data:');
    };

    /**
     * Elimina un adjunto (de la lista y del servidor si es físico)
     */
    const eliminarAdjunto = async (id: number) => {
        const adjunto = adjuntos.find(a => a.id === id);
        if (!adjunto) return;

        /* Detener audio si se está reproduciendo */
        if (playingId === id) {
            audioRefs.current[id]?.pause();
            setPlayingId(null);
        }

        /* Si es archivo físico (no Base64), eliminarlo del servidor */
        if (!esBase64(adjunto.url)) {
            await eliminarArchivoFisico(adjunto);
        }

        /* Quitar de la lista local */
        onChange(adjuntos.filter(a => a.id !== id));
    };

    /* Funciones de Audio */
    const toggleAudio = (id: number) => {
        const audio = audioRefs.current[id];
        if (!audio) return;

        if (playingId === id) {
            audio.pause();
            setPlayingId(null);
        } else {
            /* Pausar cualquier otro audio sonando */
            if (playingId) {
                audioRefs.current[playingId]?.pause();
            }
            audio.play().catch(e => console.error('Error reproduciendo audio:', e));
            setPlayingId(id);
        }
    };

    const handleTimeUpdate = (id: number) => {
        const audio = audioRefs.current[id];
        if (audio && audio.duration) {
            const prog = (audio.currentTime / audio.duration) * 100;
            setProgress(prev => ({...prev, [id]: prog}));
        }
    };

    const handleAudioEnded = (id: number) => {
        setPlayingId(null);
        setProgress(prev => ({...prev, [id]: 0}));
    };

    /**
     * Detecta si un adjunto es cifrado basándose en la URL
     * Los archivos cifrados tienen extensión .enc en el nombre
     */
    const esCifrado = (adjunto: Adjunto): boolean => {
        /* Base64 nunca es cifrado (ya es accesible) */
        if (esBase64(adjunto.url)) return false;

        /* Detectar por parámetro file en la URL que termina en .enc */
        try {
            const urlParams = new URL(adjunto.url, window.location.origin);
            const nombreArchivo = urlParams.searchParams.get('file') || '';
            return nombreArchivo.endsWith('.enc');
        } catch {
            return false;
        }
    };

    /**
     * Verifica si un adjunto cifrado ya tiene contenido cargado
     */
    const tieneContenidoCargado = (id: number): boolean => {
        return contenidoDescifrado[id] !== undefined;
    };

    /**
     * Carga el contenido de un archivo cifrado bajo demanda
     * Solo se ejecuta cuando el usuario hace clic
     */
    const cargarContenidoCifrado = useCallback(
        async (adjunto: Adjunto) => {
            if (cargandoDescifrado[adjunto.id]) return;

            setCargandoDescifrado(prev => ({...prev, [adjunto.id]: true}));

            try {
                const response = await fetch(adjunto.url, {
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error('Error descargando archivo');
                }

                const blob = await response.blob();
                const urlObjeto = URL.createObjectURL(blob);

                setContenidoDescifrado(prev => ({...prev, [adjunto.id]: urlObjeto}));

                /* Abrir preview si es imagen */
                if (adjunto.tipo === 'imagen') {
                    setPreviewImage({...adjunto, url: urlObjeto});
                }
            } catch (err) {
                setError('Error al cargar archivo cifrado');
            } finally {
                setCargandoDescifrado(prev => ({...prev, [adjunto.id]: false}));
            }
        },
        [cargandoDescifrado]
    );

    /**
     * Maneja el clic en un adjunto cifrado
     * Carga el contenido si no está cargado aún
     */
    const handleClickAdjuntoCifrado = (adjunto: Adjunto) => {
        if (tieneContenidoCargado(adjunto.id)) {
            /* Ya está cargado, mostrar */
            if (adjunto.tipo === 'imagen') {
                setPreviewImage({...adjunto, url: contenidoDescifrado[adjunto.id]});
            }
        } else {
            /* Cargar bajo demanda */
            cargarContenidoCifrado(adjunto);
        }
    };

    /**
     * Obtiene la URL de preview para imágenes
     * Para archivos cifrados, usa thumbnail si existe (sin cifrar) o placeholder
     */
    const obtenerUrlPreview = (adjunto: Adjunto): string | null => {
        /* Si es Base64, usar directamente */
        if (esBase64(adjunto.url)) {
            return adjunto.url;
        }

        /* Si tenemos contenido descifrado, usarlo */
        if (contenidoDescifrado[adjunto.id]) {
            return contenidoDescifrado[adjunto.id];
        }

        /* Para archivos cifrados: usar thumbnail si existe */
        if (esCifrado(adjunto)) {
            /* El thumbnail está sin cifrar, se puede mostrar directamente */
            return adjunto.thumbnailUrl || null;
        }

        /* Para archivos no cifrados, usar la URL directa */
        return adjunto.url;
    };

    return (
        <SeccionPanel titulo="Adjuntos">
            <div className="adjuntosContenedor">
                {/* Lista de adjuntos */}
                {adjuntos.length > 0 && (
                    <div className="adjuntosLista">
                        {adjuntos.map(adjunto => {
                            const urlPreview = obtenerUrlPreview(adjunto);
                            const estaCifrado = esCifrado(adjunto);
                            const cargando = cargandoDescifrado[adjunto.id];
                            const yaDescifrado = tieneContenidoCargado(adjunto.id);
                            /* Solo necesita descifrar si está cifrado, no tiene contenido y no hay thumbnail */
                            const sinPreview = !urlPreview && !yaDescifrado;

                            return (
                                <div key={adjunto.id} className="adjuntoItem">
                                    {/* Preview / Icono */}
                                    <div
                                        className={`adjuntoPreview ${adjunto.tipo === 'imagen' ? 'adjuntoPreviewImagen' : ''} ${estaCifrado && !yaDescifrado ? 'adjuntoPreviewCifrado' : ''}`}
                                        onClick={() => {
                                            if (cargando) return;
                                            if (estaCifrado && !yaDescifrado) {
                                                handleClickAdjuntoCifrado(adjunto);
                                            } else if (adjunto.tipo === 'imagen') {
                                                setPreviewImage(adjunto);
                                            }
                                        }}
                                        title={estaCifrado && !yaDescifrado ? 'Clic para ver imagen completa (cifrada)' : undefined}>
                                        {cargando ? (
                                            /* Cargando contenido cifrado */
                                            <Loader2 size={20} className="adjuntoIcono iconoGirando" />
                                        ) : adjunto.tipo === 'imagen' && urlPreview ? (
                                            /* Imagen con thumbnail o descifrada */
                                            <>
                                                <img src={urlPreview} alt={adjunto.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                {/* Indicador de cifrado sobre el thumbnail */}
                                                {estaCifrado && !yaDescifrado && (
                                                    <div className="adjuntoIndicadorCifrado">
                                                        <Lock size={10} />
                                                    </div>
                                                )}
                                            </>
                                        ) : sinPreview && estaCifrado ? (
                                            /* Sin thumbnail disponible, mostrar candado */
                                            <Lock size={20} className="adjuntoIcono adjuntoIconoCifrado" />
                                        ) : adjunto.tipo === 'audio' ? (
                                            <Music size={20} className="adjuntoIcono" />
                                        ) : (
                                            <File size={20} className="adjuntoIcono" />
                                        )}
                                    </div>

                                    {/* Info / Player */}
                                    <div className="adjuntoInfo">
                                        {/* Nombre / Enlace descarga */}
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            {/* Si es audio, mostramos el reproductor minimalista */}
                                            {adjunto.tipo === 'audio' ? (
                                                <div className="adjuntoAudioControl">
                                                    <button className="adjuntoBotonPlay" onClick={() => toggleAudio(adjunto.id)} type="button">
                                                        {playingId === adjunto.id ? <Pause size={12} /> : <Play size={12} />}
                                                    </button>

                                                    <div className="adjuntoAudioBarra">
                                                        <div className="adjuntoAudioProgreso" style={{width: `${progress[adjunto.id] || 0}%`}} />
                                                    </div>

                                                    {/* Elemento Audio Oculto */}
                                                    <audio
                                                        ref={el => {
                                                            if (el) audioRefs.current[adjunto.id] = el;
                                                        }}
                                                        src={adjunto.url}
                                                        onTimeUpdate={() => handleTimeUpdate(adjunto.id)}
                                                        onEnded={() => handleAudioEnded(adjunto.id)}
                                                        style={{display: 'none'}}
                                                    />

                                                    <span className="adjuntoMeta" style={{fontSize: '9px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={adjunto.nombre}>
                                                        {adjunto.nombre}
                                                    </span>
                                                </div>
                                            ) : (
                                                <a href={adjunto.url} download={adjunto.nombre} className="adjuntoNombre" title={`Descargar ${adjunto.nombre}`}>
                                                    {adjunto.nombre}
                                                </a>
                                            )}
                                        </div>

                                        {/* Meta info (solo si no es audio) */}
                                        {adjunto.tipo !== 'audio' && (
                                            <span className="adjuntoMeta">
                                                {formatBytes(adjunto.tamano)} • {new Date(adjunto.fechaSubida).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Acciones */}
                                    <button className="adjuntoAccionEliminar" onClick={() => eliminarAdjunto(adjunto.id)} title="Eliminar adjunto">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Area de carga */}
                <div className={`adjuntosAreaCarga ${estadoSubida.subiendo ? 'adjuntosAreaCarga--subiendo' : ''}`} onClick={() => !estadoSubida.subiendo && fileInputRef.current?.click()}>
                    {estadoSubida.subiendo ? (
                        <>
                            <Loader2 size={16} className="adjuntosIconoCarga iconoGirando" />
                            <span className="adjuntosSubtextoCarga">Subiendo archivo...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={16} className="adjuntosIconoCarga" />
                            <span className="adjuntosSubtextoCarga">Imágenes, Audios o Documentos (Max 5MB)</span>
                        </>
                    )}
                </div>

                <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect} accept="image/*,audio/*,.pdf,.doc,.docx,.txt" disabled={estadoSubida.subiendo} />

                {/* Mensaje de error */}
                {(error || estadoSubida.error) && (
                    <div className="adjuntosMensajeError">
                        <AlertTriangle size={12} />
                        {error || estadoSubida.error}
                    </div>
                )}

                {/* Overlay Preview Imagen */}
                {previewImage && (
                    <div className="adjuntoOverlay" onClick={() => setPreviewImage(null)}>
                        <div className="adjuntoOverlayContenido" onClick={e => e.stopPropagation()}>
                            <button className="adjuntoBotonCerrar" onClick={() => setPreviewImage(null)}>
                                <X size={24} />
                            </button>
                            <img src={contenidoDescifrado[previewImage.id] || previewImage.url} alt={previewImage.nombre} className="adjuntoImagenFull" />
                        </div>
                    </div>
                )}
            </div>
        </SeccionPanel>
    );
}
