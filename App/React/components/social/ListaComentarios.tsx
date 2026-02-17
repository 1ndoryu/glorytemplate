/*
 * Componente: ListaComentarios — Kamples
 * Lista de comentarios con input para escribir nuevos.
 * C129: Paginación infinita con IntersectionObserver + límite de renderizado.
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { useAuthStore } from '@app/stores/authStore';
import type { Comentario } from '@app/types/publicacion';
import '../../styles/componentes/listaComentarios.css';

interface ListaComentariosProps {
    comentarios: Comentario[];
    onEnviar?: (contenido: string) => void;
    cargando?: boolean;
    onClickAutor?: (username: string) => void;
    maxVisibles?: number;
    className?: string;
    /* C129: Paginación infinita */
    onCargarMas?: () => void;
    hayMasPaginas?: boolean;
}

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

export const ListaComentarios = ({
    comentarios,
    onEnviar,
    cargando = false,
    onClickAutor,
    maxVisibles = 5,
    className = '',
    onCargarMas,
    hayMasPaginas = false,
}: ListaComentariosProps): JSX.Element => {
    const { usuario, autenticado } = useAuthStore();
    const [textoNuevo, setTextoNuevo] = useState('');
    const [mostrarTodos, setMostrarTodos] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const sentinelaRef = useRef<HTMLDivElement>(null);

    const manejarEnviar = useCallback(() => {
        const texto = textoNuevo.trim();
        if (!texto || !onEnviar) return;
        onEnviar(texto);
        setTextoNuevo('');
        inputRef.current?.focus();
    }, [textoNuevo, onEnviar]);

    const manejarKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                manejarEnviar();
            }
        },
        [manejarEnviar]
    );

    const visibles = mostrarTodos ? comentarios : comentarios.slice(0, maxVisibles);
    const hayMasLocales = comentarios.length > maxVisibles && !mostrarTodos;
    const clases = ['listaComentarios', className].filter(Boolean).join(' ');

    /* C129: IntersectionObserver para cargar más al llegar al fondo */
    useEffect(() => {
        if (!mostrarTodos || !hayMasPaginas || !onCargarMas || cargando) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) onCargarMas();
            },
            { rootMargin: '100px' }
        );
        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [mostrarTodos, hayMasPaginas, onCargarMas, cargando]);

    return (
        <div className={clases}>
            {/* Lista de comentarios */}
            {visibles.length > 0 && (
                <div className="comentariosLista">
                    {visibles.map((comentario) => (
                        <div className="comentarioItem" key={comentario.id}>
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
                                </div>
                                <p className="comentarioTexto">{comentario.contenido}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ver más locales (ya cargados pero ocultos) */}
            {hayMasLocales && (
                <button
                    className="comentariosVerMas"
                    onClick={() => setMostrarTodos(true)}
                    type="button"
                >
                    Ver {comentarios.length - maxVisibles} comentarios más
                </button>
            )}

            {/* C129: Sentinela para infinite scroll — carga más del backend */}
            {mostrarTodos && hayMasPaginas && (
                <div ref={sentinelaRef} className="comentariosSentinela">
                    {cargando && <span className="comentariosCargando">Cargando…</span>}
                </div>
            )}

            {/* Input para nuevo comentario */}
            {autenticado && onEnviar && (
                <div className="comentarioNuevo">
                    <Avatar
                        src={usuario?.avatarUrl ?? null}
                        nombre={usuario?.nombreVisible ?? ''}
                        tamano="xs"
                    />
                    <div className="comentarioNuevoInput">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Escribe un comentario..."
                            value={textoNuevo}
                            onChange={(e) => setTextoNuevo(e.target.value)}
                            onKeyDown={manejarKeyDown}
                            maxLength={300}
                        />
                        <button
                            className="comentarioEnviarBtn"
                            onClick={manejarEnviar}
                            type="button"
                            disabled={!textoNuevo.trim()}
                            aria-label="Enviar comentario"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mensaje si no hay comentarios */}
            {visibles.length === 0 && !cargando && (
                <p className="comentariosVacio">Sin comentarios aún</p>
            )}
        </div>
    );
};

export default ListaComentarios;
