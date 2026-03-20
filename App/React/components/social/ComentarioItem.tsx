/*
 * Componente: ComentarioItem — Kamples
 * Renderiza un comentario individual con acciones: like, responder, menú contextual.
 * Lógica extraída a useComentarioItem (SRP).
 */

import {Heart, MessageCircle, MoreHorizontal, Send, BadgeCheck} from 'lucide-react';
import {Avatar} from '@app/components/ui/Avatar';
import {MenuContextual} from '@app/components/ui/MenuContextual';
import {useComentarioItem} from '@app/hooks/useComentarioItem';
import type {Comentario} from '@app/types/publicacion';
import '../../styles/componentes/listaComentarios.css';
import {BotonBase} from '../ui/BotonBase';
import {CampoTexto} from '../ui/CampoTexto';

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
    return new Date(fecha).toLocaleDateString('es', {day: 'numeric', month: 'short'});
};

export interface ComentarioAcciones {
    onEditar?: (id: number, contenido: string) => Promise<boolean>;
    onEliminar?: (id: number) => Promise<boolean>;
    onReportar?: (id: number, razon: string) => Promise<boolean>;
    onToggleLike?: (id: number, liked: boolean) => Promise<void>;
    onCargarRespuestas?: (id: number) => Promise<void>;
    onResponder?: (contenido: string, parentId: number) => Promise<boolean>;
    editandoId?: number | null;
    setEditandoId?: (id: number | null) => void;
    respondendoAId?: number | null;
    setRespondendoAId?: (id: number | null) => void;
}

interface ComentarioItemProps {
    comentario: Comentario;
    acciones?: ComentarioAcciones;
    onClickAutor?: (username: string) => void;
    renderMediaComentario?: (comentario: Comentario) => JSX.Element | null;
    nivel?: number;
}

/* [183A-100] Nivel visual máximo de indentación. Respuestas a nivel >= 2 se
 * muestran planas (misma indentación) pero aún con botón Responder. */
const MAX_NIVEL_VISUAL = 2;

export const ComentarioItem = ({comentario, acciones, onClickAutor, renderMediaComentario, nivel = 0}: ComentarioItemProps): JSX.Element => {
    const {menuPos, menuItems, abrirMenu, cerrarMenu, textoEdicion, setTextoEdicion, textoRespuesta, setTextoRespuesta, respuestasVisibles, enviandoRespuesta, inputRespuestaRef, inputEdicionRef, editando, respondiendo, tieneRespuestas, iniciarRespuesta, enviarRespuesta, confirmarEdicion, toggleRespuestas, manejarKeyEdicion, manejarKeyRespuesta} = useComentarioItem({comentario, acciones, nivel});

    const nivelVisual = Math.min(nivel, MAX_NIVEL_VISUAL);

    return (
        <div className={`comentarioItem ${nivelVisual > 0 ? 'comentarioRespuesta' : ''}`}>
            <div className="comentarioAutor" onClick={() => onClickAutor?.(comentario.autor.username)} role="link" tabIndex={0}>
                <Avatar src={comentario.autor.avatarUrl} nombre={comentario.autor.nombreVisible} tamano="xs" />
            </div>
            <div className="comentarioCuerpo">
                <div className="comentarioCabeceraLinea">
                    <span className="comentarioNombre" onClick={() => onClickAutor?.(comentario.autor.username)} role="link" tabIndex={0}>
                        {comentario.autor.nombreVisible}
                        {/* [193A-55] BadgeCheck unificado con TarjetaPublicacion */}
                        {comentario.autor.verificado && <BadgeCheck size={14} className="comentarioVerificado" />}
                    </span>
                    <span className="comentarioTiempo">{formatearTiempoComentario(comentario.creadoAt)}</span>
                    {comentario.editadoAt && (
                        <span className="comentarioEditado" title={`Editado ${formatearTiempoComentario(comentario.editadoAt)}`}>
                            (editado)
                        </span>
                    )}
                    {menuItems.length > 0 && (
                        <BotonBase variante="ghost" tamano="ninguno" className="comentarioMenuBtn" onClick={abrirMenu} type="button" aria-label="Más opciones">
                            <MoreHorizontal size={14} />
                        </BotonBase>
                    )}
                </div>

                {renderMediaComentario?.(comentario)}

                {editando ? (
                    <div className="comentarioEdicion">
                        <CampoTexto ref={inputEdicionRef} value={textoEdicion} onChange={e => setTextoEdicion(e.target.value)} onKeyDown={manejarKeyEdicion} maxLength={300} autoFocus />
                        <div className="comentarioEdicionBotones">
                            <BotonBase variante="ghost" type="button" onClick={() => acciones?.setEditandoId?.(null)}>
                                Cancelar
                            </BotonBase>
                            <BotonBase variante="ghost" type="button" onClick={confirmarEdicion} className="comentarioEdicionGuardar">
                                Guardar
                            </BotonBase>
                        </div>
                    </div>
                ) : (
                    comentario.contenido && <p className="comentarioTexto">{comentario.contenido}</p>
                )}

                {acciones && (
                    <div className="comentarioAcciones">
                        {acciones.onToggleLike && (
                            <BotonBase variante="ghost" tamano="ninguno" className={`comentarioAccionBtn ${comentario.liked ? 'comentarioLiked' : ''}`} onClick={() => acciones.onToggleLike!(comentario.id, !!comentario.liked)} type="button" aria-label={comentario.liked ? 'Quitar like' : 'Dar like'}>
                                <Heart size={16} fill={comentario.liked ? 'currentColor' : 'none'} />
                                {(comentario.totalLikes ?? 0) > 0 && <span className="comentarioAccionConteo">{comentario.totalLikes}</span>}
                            </BotonBase>
                        )}
                        {acciones.onResponder && (
                            <BotonBase variante="ghost" className="comentarioAccionBtn" tamano="ninguno" onClick={iniciarRespuesta} type="button" aria-label="Responder">
                                <MessageCircle size={16} />
                                <span>Responder</span>
                            </BotonBase>
                        )}
                    </div>
                )}

                {respondiendo && (
                    <div className="comentarioRespuestaInput">
                        <CampoTexto ref={inputRespuestaRef} placeholder={`Responder a ${comentario.autor.nombreVisible}...`} value={textoRespuesta} onChange={e => setTextoRespuesta(e.target.value)} onKeyDown={manejarKeyRespuesta} maxLength={300} disabled={enviandoRespuesta} />
                        <BotonBase variante="ghost" className="comentarioEnviarBtn" onClick={enviarRespuesta} type="button" disabled={!textoRespuesta.trim() || enviandoRespuesta} aria-label="Enviar respuesta">
                            <Send size={13} />
                        </BotonBase>
                    </div>
                )}

                {tieneRespuestas && (
                    <BotonBase variante="ghost" className="comentarioVerRespuestas" onClick={toggleRespuestas} type="button">
                        {respuestasVisibles ? 'Ocultar respuestas' : `Ver ${comentario.totalRespuestas} respuesta${(comentario.totalRespuestas ?? 0) > 1 ? 's' : ''}`}
                    </BotonBase>
                )}

                {respuestasVisibles && comentario.respuestas && comentario.respuestas.length > 0 && (
                    <div className="comentarioRespuestasLista">
                        {comentario.respuestas.map(resp => (
                            <ComentarioItem key={resp.id} comentario={resp} acciones={acciones} onClickAutor={onClickAutor} renderMediaComentario={renderMediaComentario} nivel={nivel + 1} />
                        ))}
                    </div>
                )}
            </div>

            <MenuContextual abierto={menuPos.abierto} onCerrar={cerrarMenu} items={menuItems} x={menuPos.x} y={menuPos.y} alinearDerecha />
        </div>
    );
};

export default ComentarioItem;
