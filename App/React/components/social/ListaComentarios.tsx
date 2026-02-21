/*
 * Componente: ListaComentarios — Kamples
 * Lista de comentarios con input para escribir nuevos.
 * Lógica extraída a useListaComentarios, audio a ComentarioAudio (SRP).
 */

import { useCallback } from 'react';
import { Send, Image, Mic, X } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { ComentarioItem } from '@app/components/social/ComentarioItem';
import { ComentarioAudio } from '@app/components/social/ComentarioAudio';
import { useListaComentarios } from '@app/hooks/useListaComentarios';
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
    onCargarMas?: () => void;
    hayMasPaginas?: boolean;
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
    const {
        usuario, autenticado, textoNuevo, setTextoNuevo,
        mostrarTodos, setMostrarTodos, archivoAdjunto, previewUrl, tipoAdjunto,
        visibles, hayMasLocales, puedeEnviar,
        inputRef, inputImagenRef, inputAudioRef, sentinelaRef,
        limpiarAdjunto, manejarArchivoSeleccionado, manejarEnviar, manejarKeyDown,
        accionesComentario,
    } = useListaComentarios({
        comentarios, onEnviar, onEnviarMultimedia, maxVisibles, cargando,
        onCargarMas, hayMasPaginas, onEditar, onEliminar, onReportar,
        onToggleLike, onCargarRespuestas, editandoId, setEditandoId,
        respondendoAId, setRespondendoAId,
    });

    /* Renderizar media dentro de ComentarioItem */
    const renderMediaComentario = useCallback((comentario: Comentario) => (
        <>
            {comentario.tipoContenido === 'imagen' && comentario.mediaUrl && (
                <a href={comentario.mediaUrl} target="_blank" rel="noopener noreferrer" className="comentarioImagen">
                    <img src={comentario.mediaUrl} alt="Imagen adjunta" loading="lazy" />
                </a>
            )}
            {comentario.tipoContenido === 'audio' && comentario.mediaUrl && (
                <ComentarioAudio src={comentario.mediaUrl} picos={comentario.mediaMetadata?.picos} />
            )}
        </>
    ), []);

    const clases = ['listaComentarios', className].filter(Boolean).join(' ');

    return (
        <div className={clases}>
            {visibles.length > 0 && (
                <div className="comentariosLista">
                    {visibles.map(comentario => (
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

            {hayMasLocales && (
                <button className="comentariosVerMas" onClick={() => setMostrarTodos(true)} type="button">
                    Ver {comentarios.length - maxVisibles} comentarios más
                </button>
            )}

            {mostrarTodos && hayMasPaginas && (
                <div ref={sentinelaRef} className="comentariosSentinela">
                    {cargando && <span className="comentariosCargando">Cargando…</span>}
                </div>
            )}

            {autenticado && (onEnviar || onEnviarMultimedia) && (
                <div className="comentarioNuevoContenedor">
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
                            <button className="comentarioPreviewCerrar" onClick={limpiarAdjunto} type="button" aria-label="Quitar archivo">
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <div className="comentarioNuevo">
                        <Avatar src={usuario?.avatarUrl ?? null} nombre={usuario?.nombreVisible ?? ''} tamano="xs" />
                        <div className="comentarioNuevoInput">
                            {onEnviarMultimedia && (
                                <>
                                    <button className="comentarioAdjuntarBtn" onClick={() => inputImagenRef.current?.click()} type="button" aria-label="Adjuntar imagen" title="Adjuntar imagen">
                                        <Image size={14} />
                                    </button>
                                    <button className="comentarioAdjuntarBtn" onClick={() => inputAudioRef.current?.click()} type="button" aria-label="Adjuntar audio" title="Adjuntar audio">
                                        <Mic size={14} />
                                    </button>
                                    <input ref={inputImagenRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="comentarioInputOculto"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) manejarArchivoSeleccionado(f, 'imagen'); e.target.value = ''; }} />
                                    <input ref={inputAudioRef} type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm,audio/flac,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac" className="comentarioInputOculto"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) manejarArchivoSeleccionado(f, 'audio'); e.target.value = ''; }} />
                                </>
                            )}
                            <input ref={inputRef} type="text"
                                placeholder={archivoAdjunto ? 'Escribe un caption (opcional)...' : 'Escribe un comentario...'}
                                value={textoNuevo} onChange={e => setTextoNuevo(e.target.value)}
                                onKeyDown={manejarKeyDown} maxLength={300} />
                            <button className="comentarioEnviarBtn" onClick={manejarEnviar} type="button" disabled={!puedeEnviar} aria-label="Enviar comentario">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {visibles.length === 0 && !cargando && (
                <p className="comentariosVacio">Sin comentarios aún</p>
            )}
        </div>
    );
};

export default ListaComentarios;
