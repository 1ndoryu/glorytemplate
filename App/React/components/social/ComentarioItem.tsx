/*
 * Componente: ComentarioItem — Kamples
 * Renderiza un comentario individual con acciones: like, responder, menú contextual.
 * C264: Editar, eliminar, reportar. C265: Likes, respuestas anidadas.
 * Extraído de ListaComentarios para cumplir SRP y límite de líneas.
 */

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Edit3, Trash2, Flag, Send } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { MenuContextual, type MenuItemDef } from '@app/components/ui/MenuContextual';
import { useAuthStore } from '@app/stores/authStore';
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

export const ComentarioItem = ({
    comentario,
    acciones,
    onClickAutor,
    renderMediaComentario,
    nivel = 0,
}: ComentarioItemProps): JSX.Element => {
    const { usuario } = useAuthStore();
    const [menuPos, setMenuPos] = useState({ abierto: false, x: 0, y: 0 });
    const [textoEdicion, setTextoEdicion] = useState('');
    const [textoRespuesta, setTextoRespuesta] = useState('');
    const [respuestasVisibles, setRespuestasVisibles] = useState(false);
    const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
    const inputRespuestaRef = useRef<HTMLInputElement>(null);
    const inputEdicionRef = useRef<HTMLInputElement>(null);

    const esAutor = usuario?.id === comentario.autor?.id;
    const esAdmin = usuario?.rol === 'admin';
    const editando = acciones?.editandoId === comentario.id;
    const respondiendo = acciones?.respondendoAId === comentario.id;
    const tieneRespuestas = (comentario.totalRespuestas ?? 0) > 0;
    const maxNivel = 2;

    /* Abrir menú contextual */
    const abrirMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenuPos(prev => ({ ...prev, abierto: false }));
    }, []);

    /* Items del menú según permisos */
    const menuItems: MenuItemDef[] = [];
    if (esAutor && acciones?.onEditar) {
        menuItems.push({
            id: 'editar',
            etiqueta: 'Editar',
            icono: <Edit3 size={14} />,
            onClick: () => {
                setTextoEdicion(comentario.contenido ?? '');
                acciones.setEditandoId?.(comentario.id);
            },
        });
    }
    if ((esAutor || esAdmin) && acciones?.onEliminar) {
        menuItems.push({
            id: 'eliminar',
            etiqueta: 'Eliminar',
            icono: <Trash2 size={14} />,
            peligro: true,
            onClick: () => { acciones.onEliminar!(comentario.id); },
        });
    }
    if (!esAutor && acciones?.onReportar) {
        menuItems.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={14} />,
            peligro: true,
            onClick: () => { acciones.onReportar!(comentario.id, 'contenido inapropiado'); },
        });
    }

    /* Iniciar respuesta */
    const iniciarRespuesta = useCallback(() => {
        acciones?.setRespondendoAId?.(comentario.id);
        setTextoRespuesta('');
        setTimeout(() => inputRespuestaRef.current?.focus(), 50);
    }, [acciones, comentario.id]);

    /* Enviar respuesta */
    const enviarRespuesta = useCallback(async () => {
        const texto = textoRespuesta.trim();
        if (!texto || !acciones?.onResponder) return;
        setEnviandoRespuesta(true);
        const ok = await acciones.onResponder(texto, comentario.id);
        setEnviandoRespuesta(false);
        if (ok) {
            setTextoRespuesta('');
            setRespuestasVisibles(true);
        }
    }, [textoRespuesta, acciones, comentario.id]);

    /* Confirmar edición */
    const confirmarEdicion = useCallback(async () => {
        const texto = textoEdicion.trim();
        if (!texto || !acciones?.onEditar) return;
        await acciones.onEditar(comentario.id, texto);
    }, [textoEdicion, acciones, comentario.id]);

    /* Toggle respuestas visibles */
    const toggleRespuestas = useCallback(() => {
        if (!respuestasVisibles && (!comentario.respuestas || comentario.respuestas.length === 0)) {
            acciones?.onCargarRespuestas?.(comentario.id);
        }
        setRespuestasVisibles(prev => !prev);
    }, [respuestasVisibles, comentario, acciones]);

    const manejarKeyEdicion = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmarEdicion(); }
        if (e.key === 'Escape') { acciones?.setEditandoId?.(null); }
    }, [confirmarEdicion, acciones]);

    const manejarKeyRespuesta = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarRespuesta(); }
        if (e.key === 'Escape') { acciones?.setRespondendoAId?.(null); }
    }, [enviarRespuesta, acciones]);

    return (
        <div className={`comentarioItem ${nivel > 0 ? 'comentarioRespuesta' : ''}`}>
            <div
                className="comentarioAutor"
                onClick={() => onClickAutor?.(comentario.autor.username)}
                role="link"
                tabIndex={0}
            >
                <Avatar
                    src={comentario.autor.avatarUrl}
                    nombre={comentario.autor.nombreVisible}
                    tamano="xs"
                />
            </div>
            <div className="comentarioCuerpo">
                <div className="comentarioCabeceraLinea">
                    <span
                        className="comentarioNombre"
                        onClick={() => onClickAutor?.(comentario.autor.username)}
                        role="link"
                        tabIndex={0}
                    >
                        {comentario.autor.nombreVisible}
                    </span>
                    <span className="comentarioTiempo">
                        {formatearTiempoComentario(comentario.creadoAt)}
                    </span>
                    {comentario.editadoAt && (
                        <span className="comentarioEditado" title={`Editado ${formatearTiempoComentario(comentario.editadoAt)}`}>
                            (editado)
                        </span>
                    )}
                    {/* Botón menú 3 puntos — solo si hay acciones disponibles */}
                    {menuItems.length > 0 && (
                        <button
                            className="comentarioMenuBtn"
                            onClick={abrirMenu}
                            type="button"
                            aria-label="Más opciones"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    )}
                </div>

                {/* Media (imagen/audio) renderizado externamente */}
                {renderMediaComentario?.(comentario)}

                {/* Contenido texto o modo edición */}
                {editando ? (
                    <div className="comentarioEdicion">
                        <input
                            ref={inputEdicionRef}
                            type="text"
                            value={textoEdicion}
                            onChange={(e) => setTextoEdicion(e.target.value)}
                            onKeyDown={manejarKeyEdicion}
                            maxLength={300}
                            autoFocus
                        />
                        <div className="comentarioEdicionBotones">
                            <button type="button" onClick={() => acciones?.setEditandoId?.(null)}>
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmarEdicion} className="comentarioEdicionGuardar">
                                Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    comentario.contenido && (
                        <p className="comentarioTexto">{comentario.contenido}</p>
                    )
                )}

                {/* Barra de acciones: like, responder */}
                {acciones && (
                    <div className="comentarioAcciones">
                        {acciones.onToggleLike && (
                            <button
                                className={`comentarioAccionBtn ${comentario.liked ? 'comentarioLiked' : ''}`}
                                onClick={() => acciones.onToggleLike!(comentario.id, !!comentario.liked)}
                                type="button"
                                aria-label={comentario.liked ? 'Quitar like' : 'Dar like'}
                            >
                                <Heart size={13} fill={comentario.liked ? 'currentColor' : 'none'} />
                                {(comentario.totalLikes ?? 0) > 0 && (
                                    <span className="comentarioAccionConteo">{comentario.totalLikes}</span>
                                )}
                            </button>
                        )}
                        {acciones.onResponder && nivel < maxNivel && (
                            <button
                                className="comentarioAccionBtn"
                                onClick={iniciarRespuesta}
                                type="button"
                                aria-label="Responder"
                            >
                                <MessageCircle size={13} />
                                <span>Responder</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Input de respuesta */}
                {respondiendo && (
                    <div className="comentarioRespuestaInput">
                        <input
                            ref={inputRespuestaRef}
                            type="text"
                            placeholder={`Responder a ${comentario.autor.nombreVisible}...`}
                            value={textoRespuesta}
                            onChange={(e) => setTextoRespuesta(e.target.value)}
                            onKeyDown={manejarKeyRespuesta}
                            maxLength={300}
                            disabled={enviandoRespuesta}
                        />
                        <button
                            className="comentarioEnviarBtn"
                            onClick={enviarRespuesta}
                            type="button"
                            disabled={!textoRespuesta.trim() || enviandoRespuesta}
                            aria-label="Enviar respuesta"
                        >
                            <Send size={13} />
                        </button>
                    </div>
                )}

                {/* Toggle respuestas */}
                {tieneRespuestas && (
                    <button
                        className="comentarioVerRespuestas"
                        onClick={toggleRespuestas}
                        type="button"
                    >
                        {respuestasVisibles
                            ? 'Ocultar respuestas'
                            : `Ver ${comentario.totalRespuestas} respuesta${(comentario.totalRespuestas ?? 0) > 1 ? 's' : ''}`
                        }
                    </button>
                )}

                {/* Respuestas anidadas */}
                {respuestasVisibles && comentario.respuestas && comentario.respuestas.length > 0 && (
                    <div className="comentarioRespuestasLista">
                        {comentario.respuestas.map(resp => (
                            <ComentarioItem
                                key={resp.id}
                                comentario={resp}
                                acciones={acciones}
                                onClickAutor={onClickAutor}
                                renderMediaComentario={renderMediaComentario}
                                nivel={nivel + 1}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Menú contextual */}
            <MenuContextual
                abierto={menuPos.abierto}
                onCerrar={cerrarMenu}
                items={menuItems}
                x={menuPos.x}
                y={menuPos.y}
                alinearDerecha
            />
        </div>
    );
};

export default ComentarioItem;
