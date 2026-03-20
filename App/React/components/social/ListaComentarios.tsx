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
import { useVisorImagenStore } from '@app/stores/visorImagenStore';
import { useT } from '@app/utils/i18n/useT';
import type { Comentario } from '@app/types/publicacion';
import '../../styles/componentes/listaComentarios.css';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { Input } from '../ui/Input';

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

    const abrirVisor = useVisorImagenStore(s => s.abrir);
    const { t } = useT();

    /* [183A-100] Renderizar media dentro de ComentarioItem.
     * Imágenes abren en VisorImagen (fullscreen) en vez de nueva pestaña. */
    const renderMediaComentario = useCallback((comentario: Comentario) => (
        <>
            {comentario.tipoContenido === 'imagen' && comentario.mediaUrl && (
                <div className="comentarioImagen" role="button" tabIndex={0}
                    onClick={() => abrirVisor(comentario.mediaUrl!, 'Imagen adjunta')}
                    onKeyDown={e => { if (e.key === 'Enter') abrirVisor(comentario.mediaUrl!, 'Imagen adjunta'); }}>
                    <img src={comentario.mediaUrl} alt="Imagen adjunta" loading="lazy" />
                </div>
            )}
            {comentario.tipoContenido === 'audio' && comentario.mediaUrl && (
                <ComentarioAudio src={comentario.mediaUrl} picos={comentario.mediaMetadata?.picos} />
            )}
        </>
    ), [abrirVisor]);

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
                <BotonBase variante="ghost" className="comentariosVerMas" onClick={() => setMostrarTodos(true)} type="button">
                    Ver {comentarios.length - maxVisibles} comentarios más
                </BotonBase>
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
                            <BotonBase variante="ghost" className="comentarioPreviewCerrar" onClick={limpiarAdjunto} type="button" aria-label={t('comentarios.quitarAdjunto')}>
                                <X size={12} />
                            </BotonBase>
                        </div>
                    )}
                    <div className="comentarioNuevo">
                        <Avatar src={usuario?.avatarUrl ?? null} nombre={usuario?.nombreVisible ?? ''} tamano="xs" />
                        <div className="comentarioNuevoInput">
                            {onEnviarMultimedia && (
                                <>
                                    <BotonBase variante="ghost" className="comentarioAdjuntarBtn" onClick={() => inputImagenRef.current?.click()} type="button" aria-label={t('comentarios.adjuntarImagen')} title={t('comentarios.adjuntarImagen')}>
                                        <Image size={14} />
                                    </BotonBase>
                                    <BotonBase variante="ghost" className="comentarioAdjuntarBtn" onClick={() => inputAudioRef.current?.click()} type="button" aria-label={t('comentarios.adjuntarAudio')} title={t('comentarios.adjuntarAudio')}>
                                        <Mic size={14} />
                                    </BotonBase>
                                    <Input ref={inputImagenRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="comentarioInputOculto"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) manejarArchivoSeleccionado(f, 'imagen'); e.target.value = ''; }} />
                                    <Input ref={inputAudioRef} type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm,audio/flac,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac" className="comentarioInputOculto"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) manejarArchivoSeleccionado(f, 'audio'); e.target.value = ''; }} />
                                </>
                            )}
                            <CampoTexto ref={inputRef} 
                                placeholder={archivoAdjunto ? t('comentarios.captionPlaceholder') : t('comentarios.placeholder')}
                                value={textoNuevo} onChange={e => setTextoNuevo(e.target.value)}
                                onKeyDown={manejarKeyDown} maxLength={300} />
                            <BotonBase variante="ghost" className="comentarioEnviarBtn" onClick={manejarEnviar} type="button" disabled={!puedeEnviar} aria-label={t('comentarios.enviar')}>
                                <Send size={14} />
                            </BotonBase>
                        </div>
                    </div>
                </div>
            )}

            {visibles.length === 0 && !cargando && (
                <p className="comentariosVacio">{t('comentarios.vacio')}</p>
            )}
        </div>
    );
};

export default ListaComentarios;
