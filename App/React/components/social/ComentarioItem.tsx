/*
 * Componente: ComentarioItem — Kamples
 * Renderiza un comentario individual con acciones: like, responder, menú contextual.
 * Lógica extraída a useComentarioItem (SRP).
 */

import { Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useComentarioItem } from '@app/hooks/useComentarioItem';
import type { Comentario } from '@app/types/publicacion';
import '../../styles/componentes/listaComentarios.css';

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

const MAX_NIVEL = 2;

export const ComentarioItem = ({
    comentario,
    acciones,
    onClickAutor,
    renderMediaComentario,
    nivel = 0,
}: ComentarioItemProps): JSX.Element => {
    const {
        menuPos, menuItems, abrirMenu, cerrarMenu,
        textoEdicion, setTextoEdicion, textoRespuesta, setTextoRespuesta,
        respuestasVisibles, enviandoRespuesta,
        inputRespuestaRef, inputEdicionRef,
        editando, respondiendo, tieneRespuestas,
        iniciarRespuesta, enviarRespuesta, confirmarEdicion,
        toggleRespuestas, manejarKeyEdicion, manejarKeyRespuesta,
    } = useComentarioItem({ comentario, acciones });

    return (
        <div className={`comentarioItem ${nivel > 0 ? 'comentarioRespuesta' : ''}`}>
            <div className="comentarioAutor" onClick={() => onClickAutor?.(comentario.autor.username)}
                role="link" tabIndex={0}>
                <Avatar src={comentario.autor.avatarUrl} nombre={comentario.autor.nombreVisible} tamano="xs" />
            </div>
            <div className="comentarioCuerpo">
                <div className="comentarioCabeceraLinea">
                    <span className="comentarioNombre" onClick={() => onClickAutor?.(comentario.autor.username)}
                        role="link" tabIndex={0}>
                        {comentario.autor.nombreVisible}
                    </span>
                    <span className="comentarioTiempo">{formatearTiempoComentario(comentario.creadoAt)}</span>
                    {comentario.editadoAt && (
                        <span className="comentarioEditado" title={`Editado ${formatearTiempoComentario(comentario.editadoAt)}`}>
                            (editado)
                        </span>
                    )}
                    {menuItems.length > 0 && (
                        <button className="comentarioMenuBtn" onClick={abrirMenu} type="button" aria-label="Más opciones">
                            <MoreHorizontal size={14} />
                        </button>
                    )}
                </div>

                {renderMediaComentario?.(comentario)}

                {editando ? (
                    <div className="comentarioEdicion">
                        <input ref={inputEdicionRef} type="text" value={textoEdicion}
                            onChange={e => setTextoEdicion(e.target.value)} onKeyDown={manejarKeyEdicion}
                            maxLength={300} autoFocus />
                        <div className="comentarioEdicionBotones">
                            <button type="button" onClick={() => acciones?.setEditandoId?.(null)}>Cancelar</button>
                            <button type="button" onClick={confirmarEdicion} className="comentarioEdicionGuardar">Guardar</button>
                        </div>
                    </div>
                ) : (
                    comentario.contenido && <p className="comentarioTexto">{comentario.contenido}</p>
                )}

                {acciones && (
                    <div className="comentarioAcciones">
                        {acciones.onToggleLike && (
                            <button className={`comentarioAccionBtn ${comentario.liked ? 'comentarioLiked' : ''}`}
                                onClick={() => acciones.onToggleLike!(comentario.id, !!comentario.liked)}
                                type="button" aria-label={comentario.liked ? 'Quitar like' : 'Dar like'}>
                                <Heart size={13} fill={comentario.liked ? 'currentColor' : 'none'} />
                                {(comentario.totalLikes ?? 0) > 0 && (
                                    <span className="comentarioAccionConteo">{comentario.totalLikes}</span>
                                )}
                            </button>
                        )}
                        {acciones.onResponder && nivel < MAX_NIVEL && (
                            <button className="comentarioAccionBtn" onClick={iniciarRespuesta}
                                type="button" aria-label="Responder">
                                <MessageCircle size={13} /><span>Responder</span>
                            </button>
                        )}
                    </div>
                )}

                {respondiendo && (
                    <div className="comentarioRespuestaInput">
                        <input ref={inputRespuestaRef} type="text"
                            placeholder={`Responder a ${comentario.autor.nombreVisible}...`}
                            value={textoRespuesta} onChange={e => setTextoRespuesta(e.target.value)}
                            onKeyDown={manejarKeyRespuesta} maxLength={300} disabled={enviandoRespuesta} />
                        <button className="comentarioEnviarBtn" onClick={enviarRespuesta} type="button"
                            disabled={!textoRespuesta.trim() || enviandoRespuesta} aria-label="Enviar respuesta">
                            <Send size={13} />
                        </button>
                    </div>
                )}

                {tieneRespuestas && (
                    <button className="comentarioVerRespuestas" onClick={toggleRespuestas} type="button">
                        {respuestasVisibles
                            ? 'Ocultar respuestas'
                            : `Ver ${comentario.totalRespuestas} respuesta${(comentario.totalRespuestas ?? 0) > 1 ? 's' : ''}`}
                    </button>
                )}

                {respuestasVisibles && comentario.respuestas && comentario.respuestas.length > 0 && (
                    <div className="comentarioRespuestasLista">
                        {comentario.respuestas.map(resp => (
                            <ComentarioItem key={resp.id} comentario={resp} acciones={acciones}
                                onClickAutor={onClickAutor} renderMediaComentario={renderMediaComentario}
                                nivel={nivel + 1} />
                        ))}
                    </div>
                )}
            </div>

            <MenuContextual abierto={menuPos.abierto} onCerrar={cerrarMenu} items={menuItems}
                x={menuPos.x} y={menuPos.y} alinearDerecha />
        </div>
    );
};

export default ComentarioItem;
