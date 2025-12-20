/*
 * SeccionAdjuntos
 * Componente para gestionar archivos adjuntos en una tarea
 * Nota: En esta fase sin backend, el almacenamiento es limitado localmente.
 * Soporta: Imagenes, Documentos, Audios
 */

import {useRef, useState, useEffect} from 'react';
import {X, File, Image as ImageIcon, Trash2, AlertTriangle, Music, Play, Pause, Download} from 'lucide-react';
import type {Adjunto} from '../../types/dashboard';
import {SeccionPanel} from '../shared';

interface SeccionAdjuntosProps {
    adjuntos: Adjunto[];
    onChange: (adjuntos: Adjunto[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limite solicitado

export function SeccionAdjuntos({adjuntos, onChange}: SeccionAdjuntosProps): JSX.Element {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRefs = useRef<{[key: number]: HTMLAudioElement}>({});
    const [error, setError] = useState<string | null>(null);

    // Estados para audio
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [progress, setProgress] = useState<{[key: number]: number}>({});

    // Estado para overlay de imagen
    const [previewImage, setPreviewImage] = useState<Adjunto | null>(null);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tamano
        if (file.size > MAX_FILE_SIZE) {
            setError(`El archivo es demasiado grande (Max: ${formatBytes(MAX_FILE_SIZE)}). Fase Beta: limite local.`);

            // Limpiar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setError(null);

        // Leer archivo
        const reader = new FileReader();
        reader.onload = e => {
            const url = e.target?.result as string;
            let tipo: 'imagen' | 'audio' | 'archivo' = 'archivo';

            if (file.type.startsWith('image/')) tipo = 'imagen';
            else if (file.type.startsWith('audio/')) tipo = 'audio';

            const nuevoAdjunto: Adjunto = {
                id: Date.now(),
                tipo,
                url,
                nombre: file.name,
                tamano: file.size,
                fechaSubida: new Date().toISOString()
            };

            onChange([...adjuntos, nuevoAdjunto]);

            // Limpiar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const eliminarAdjunto = (id: number) => {
        // Detener audio si se esta reproduciendo
        if (playingId === id) {
            audioRefs.current[id]?.pause();
            setPlayingId(null);
        }
        onChange(adjuntos.filter(a => a.id !== id));
    };

    // Funciones de Audio
    const toggleAudio = (id: number) => {
        const audio = audioRefs.current[id];
        if (!audio) return;

        if (playingId === id) {
            audio.pause();
            setPlayingId(null);
        } else {
            // Pausar cualquier otro audio sonando
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

    return (
        <SeccionPanel titulo="Adjuntos">
            <div className="adjuntosContenedor">
                {/* Lista de adjuntos */}
                {adjuntos.length > 0 && (
                    <div className="adjuntosLista">
                        {adjuntos.map(adjunto => (
                            <div key={adjunto.id} className="adjuntoItem">
                                {/* Preview / Icono */}
                                <div className={`adjuntoPreview ${adjunto.tipo === 'imagen' ? 'adjuntoPreviewImagen' : ''}`} onClick={() => adjunto.tipo === 'imagen' && setPreviewImage(adjunto)}>
                                    {adjunto.tipo === 'imagen' ? <img src={adjunto.url} alt={adjunto.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : adjunto.tipo === 'audio' ? <Music size={20} className="adjuntoIcono" /> : <File size={20} className="adjuntoIcono" />}
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

                                                {/* Nombre pequeñito o tooltip si se desea, pero el usuario pidio minimalista */}
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

                                    {/* Meta info (solo si no es audio, o si queremos mostrar peso tambien) */}
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
                        ))}
                    </div>
                )}

                {/* Area de carga */}
                <div className="adjuntosAreaCarga" onClick={() => fileInputRef.current?.click()}>
                    <span className="adjuntosSubtextoCarga">Imágenes, Audios o Documentos (Max 5MB)</span>
                </div>

                <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect} accept="image/*,audio/*,.pdf,.doc,.docx,.txt" />

                {/* Mensaje de error */}
                {error && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '10px',
                            color: 'var(--dashboard-estadoAlta)'
                        }}>
                        <AlertTriangle size={12} />
                        {error}
                    </div>
                )}

                {/* Overlay Preview Imagen */}
                {previewImage && (
                    <div className="adjuntoOverlay" onClick={() => setPreviewImage(null)}>
                        <div className="adjuntoOverlayContenido" onClick={e => e.stopPropagation()}>
                            <button className="adjuntoBotonCerrar" onClick={() => setPreviewImage(null)}>
                                <X size={24} />
                            </button>
                            <img src={previewImage.url} alt={previewImage.nombre} className="adjuntoImagenFull" />
                        </div>
                    </div>
                )}
            </div>
        </SeccionPanel>
    );
}
