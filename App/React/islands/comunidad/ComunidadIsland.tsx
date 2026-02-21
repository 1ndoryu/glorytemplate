/*
 * Isla: ComunidadIsland — Kamples (FASE 6.4)
 * Feed de posts sociales con diseño diferenciado al feed de samples.
 * Tarjetas más grandes, énfasis en texto/imágenes, samples adjuntos reproducibles.
 * Ruta: /comunidad
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Users, TrendingUp, Clock, MoreHorizontal, Link2, Trash2, Flag, User, CheckCircle } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { SeccionPublicar } from '@app/components/social/SeccionPublicar';
import BarraAccionesPost from '@app/components/social/BarraAccionesPost';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { useNavigationStore } from '@/core/router';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useAuthStore } from '@app/stores/authStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useComentarios } from '@app/hooks/useComentarios';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { apiGet, apiDelete } from '@app/services/apiCliente';
import { darLike, quitarLike, actualizarPublicacion } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import type { Publicacion } from '@app/types';
import { toast } from '@app/stores/toastStore';
import '../../styles/componentes/comunidad.css';

type FiltroComunidad = 'todos' | 'siguiendo' | 'populares';

const TABS_COMUNIDAD = [{ id: 'comunidad', etiqueta: 'Comunidad' }];

/* Sección de comentarios por post: encapsula el hook useComentarios */
const SeccionComentariosPost = ({ postId, navegar }: { postId: number; navegar: (ruta: string) => void }): JSX.Element => {
    const {
        comentarios, cargando, enviar, enviarMultimedia, cargarMas, hayMas,
        editar, eliminar, reportar, toggleLike, cargarRespuestas,
        editandoId, setEditandoId, respondendoAId, setRespondendoAId,
    } = useComentarios({
        tipo: 'publicacion',
        targetId: postId,
        cargarAlAbrir: true,
    });

    return (
        <ListaComentarios
            comentarios={comentarios}
            cargando={cargando}
            onEnviar={enviar}
            onEnviarMultimedia={enviarMultimedia}
            onClickAutor={(username) => navegar(`/perfil/${username}/`)}
            maxVisibles={3}
            onCargarMas={cargarMas}
            hayMasPaginas={hayMas}
            onEditar={editar}
            onEliminar={eliminar}
            onReportar={reportar}
            onToggleLike={toggleLike}
            onCargarRespuestas={cargarRespuestas}
            editandoId={editandoId}
            setEditandoId={setEditandoId}
            respondendoAId={respondendoAId}
            setRespondendoAId={setRespondendoAId}
        />
    );
};

const formatearTiempoRelativo = (fecha: string): string => {
    if (!fecha) return '';
    const timestamp = new Date(fecha).getTime();
    if (isNaN(timestamp)) return '';
    const ahora = Date.now();
    const diff = ahora - timestamp;
    const minutos = Math.floor(diff / 60000);
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

const ComunidadBase = (): JSX.Element => {
    const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
    const [filtro, setFiltro] = useState<FiltroComunidad>('todos');
    const [cargando, setCargando] = useState(true);
    const [comentariosAbiertos, setComentariosAbiertos] = useState<Set<number>>(new Set());
    const navegar = useNavigationStore(s => s.navegar);
    const usuario = useAuthStore(s => s.usuario);

    /* C127: Menú contextual de samples adjuntos */
    const menuSample = useMenuContextualSample();

    /* C127: Menú contextual de publicaciones */
    const [menuPost, setMenuPost] = useState<{ abierto: boolean; x: number; y: number; post: Publicacion | null }>({
        abierto: false, x: 0, y: 0, post: null
    });

    const abrirMenuPost = useCallback((e: React.MouseEvent, post: Publicacion) => {
        e.stopPropagation();
        e.preventDefault();
        setMenuPost({ abierto: true, x: e.clientX, y: e.clientY, post });
    }, []);

    const cerrarMenuPost = useCallback(() => {
        setMenuPost(prev => ({ ...prev, abierto: false }));
    }, []);

    const itemsMenuPost = useMemo(() => {
        const post = menuPost.post;
        if (!post) return [];

        const esPropietario = usuario?.id !== undefined && String(post.autor.id) === String(usuario.id);
        const esAdmin = usuario?.rol === 'admin';
        const items: { id: string; etiqueta: string; icono: JSX.Element; onClick: () => void; peligro?: boolean; separadorDespues?: boolean; href?: string }[] = [];

        items.push({
            id: 'ver-perfil',
            etiqueta: `Ir a @${post.autor.username}`,
            icono: <User size={16} />,
            href: `/perfil/${post.autor.username}/`,
            onClick: () => { navegar(`/perfil/${post.autor.username}/`); cerrarMenuPost(); }
        });

        items.push({
            id: 'copiar-enlace',
            etiqueta: 'Copiar enlace',
            icono: <Link2 size={16} />,
            separadorDespues: true,
            onClick: () => {
                copiarAlPortapapeles(`${window.location.origin}/post/${post.id}/`);
                cerrarMenuPost();
            }
        });

        if (esPropietario || esAdmin) {
            /* C173: Admin puede aprobar posts pendientes */
            if (esAdmin && post.moderacionEstado && post.moderacionEstado !== 'aprobado') {
                items.push({
                    id: 'aprobar',
                    etiqueta: 'Aprobar publicación',
                    icono: <CheckCircle size={16} />,
                    onClick: async () => {
                        const resp = await actualizarPublicacion(post.id, { moderacionEstado: 'aprobado' });
                        if (resp.ok) {
                            setPublicaciones(prev => prev.map(p =>
                                p.id === post.id ? { ...p, moderacionEstado: 'aprobado' } : p
                            ));
                            toast.exito('Publicación aprobada');
                        }
                        cerrarMenuPost();
                    }
                });
            }
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar publicación',
                icono: <Trash2 size={16} />,
                peligro: true,
                onClick: () => {
                    toast.confirmar(`¿Eliminar esta publicación?`, async () => {
                        const resp = await apiDelete(`/publicaciones/${post.id}`);
                        if (resp.ok) {
                            setPublicaciones(prev => prev.filter(p => p.id !== post.id));
                            toast.exito('Publicación eliminada');
                        }
                    });
                    cerrarMenuPost();
                }
            });
        }

        items.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            onClick: () => { cerrarMenuPost(); /* TO-DO: sistema de reportes */ }
        });

        return items;
    }, [menuPost.post, usuario, navegar, cerrarMenuPost]);

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('ComunidadIsland', TABS_COMUNIDAD, 'comunidad');

    useEffect(() => {
        let activo = true;
        setCargando(true);

        const cargar = async () => {
            try {
                const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro });
                if (!activo) return;
                const lista = resp.data?.data ?? resp.data ?? [];
                setPublicaciones(Array.isArray(lista) ? lista : []);
            } catch {
                if (activo) setPublicaciones([]);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [filtro]);

    /* Callback para recargar feed tras publicar (SeccionPublicar inline) */
    const recargarFeed = useCallback(async () => {
        try {
            const resp = await apiGet<{ data: Publicacion[] }>('/publicaciones', { filtro });
            const lista = resp.data?.data ?? resp.data ?? [];
            setPublicaciones(Array.isArray(lista) ? lista : []);
        } catch { /* sin-op */ }
    }, [filtro]);

    const manejarLikePost = useCallback(async (postId: number, reaccion?: TipoReaccion) => {
        const post = publicaciones.find((p) => p.id === postId);
        const snapshot = publicaciones;

        try {
            if (reaccion) {
                /* Reaccion especifica desde tooltip */
                const eraPositivo = post?.reaccion === 'like' || post?.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setPublicaciones((prev) =>
                    prev.map((p) =>
                        p.id === postId
                            ? { ...p, liked: esPositivo, reaccion, totalLikes: Math.max(0, p.totalLikes + delta) }
                            : p
                    )
                );
                await darLike('publicacion', postId, reaccion);
            } else if (post?.liked || post?.reaccion) {
                /* Quitar reaccion */
                const eraPositivo = post?.reaccion === 'like' || post?.reaccion === 'encanta';
                setPublicaciones((prev) =>
                    prev.map((p) =>
                        p.id === postId
                            ? { ...p, liked: false, reaccion: null, totalLikes: Math.max(0, p.totalLikes - (eraPositivo ? 1 : 0)) }
                            : p
                    )
                );
                await quitarLike('publicacion', postId);
            } else {
                /* Like simple */
                setPublicaciones((prev) =>
                    prev.map((p) =>
                        p.id === postId
                            ? { ...p, liked: true, reaccion: 'like' as const, totalLikes: p.totalLikes + 1 }
                            : p
                    )
                );
                await darLike('publicacion', postId, 'like');
            }
        } catch {
            setPublicaciones(snapshot);
        }
    }, [publicaciones]);

    const manejarRepost = useCallback((postId: number) => {
        setPublicaciones((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, reposteado: !p.reposteado, totalReposts: p.reposteado ? p.totalReposts - 1 : p.totalReposts + 1 }
                    : p
            )
        );
    }, []);

    const alternarComentarios = useCallback((postId: number) => {
        setComentariosAbiertos((prev) => {
            const siguiente = new Set(prev);
            if (siguiente.has(postId)) {
                siguiente.delete(postId);
            } else {
                siguiente.add(postId);
            }
            return siguiente;
        });
    }, []);

    const filtros: { valor: FiltroComunidad; icono: typeof Users; label: string }[] = [
        { valor: 'todos', icono: Clock, label: 'Todos' },
        { valor: 'siguiendo', icono: Users, label: 'Siguiendo' },
        { valor: 'populares', icono: TrendingUp, label: 'Populares' },
    ];

    return (
        <div className="comunidadIsland" id="comunidadIsland">
            {/* Sección inline para publicar — estilo red social (C89) */}
            <SeccionPublicar
                alPublicar={recargarFeed}
                placeholder="¿Qué estás creando?"
            />

            {/* Barra de filtros */}
            <div className="comunidadBarraSuperior">
                <div className="comunidadFiltros">
                {filtros.map(({ valor, icono: Icono, label }) => (
                    <button
                        key={valor}
                        className={`comunidadFiltroBtn ${filtro === valor ? 'comunidadFiltroBtnActivo' : ''}`}
                        onClick={() => setFiltro(valor)}
                        type="button"
                    >
                        <Icono size={14} />
                        {label}
                    </button>
                ))}
                </div>
            </div>

            {/* Feed de publicaciones */}
            <div className="comunidadFeed">
                {cargando ? (
                    <div className="comunidadCargando">Cargando publicaciones...</div>
                ) : publicaciones.length === 0 ? (
                    <div className="comunidadVacio">No hay publicaciones aún</div>
                ) : (
                    publicaciones.map((post) => (
                        <article key={post.id} className="comunidadPost">
                            {/* Header del post */}
                            <div className="comunidadPostHeader">
                                <EnlaceCreador
                                    username={post.autor.username}
                                    nombreVisible={post.autor.nombreVisible}
                                    avatarUrl={post.autor.avatarUrl}
                                    tamanoAvatar="sm"
                                    mostrarUsername
                                    verificado={post.autor.verificado}
                                    meta={formatearTiempoRelativo(post.creadoAt)}
                                />
                                {/* C173: Icono estado moderación — visible para autor y admin */}
                                {(String(post.autor.id) === String(usuario?.id) || usuario?.rol === 'admin') && post.moderacionEstado && (
                                    <BadgeModeracion moderacionEstado={post.moderacionEstado} />
                                )}
                                {/* C127: Botón menú 3 puntos */}
                                <button
                                    className="comunidadPostMenuBtn"
                                    onClick={(e) => abrirMenuPost(e, post)}
                                    type="button"
                                    aria-label="Más opciones"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>

                            {/* Contenido del post */}
                            <p className="comunidadPostTexto">{post.contenido}</p>

                            {/* Imágenes adjuntas */}
                            {post.imagenes.length > 0 && (
                                <div className={`comunidadPostImagenes comunidadPostImagenes${post.imagenes.length}`}>
                                    {post.imagenes.map((img, i) => (
                                        <img key={i} src={img} alt={`Imagen ${i + 1}`} className="comunidadPostImg" loading="lazy" />
                                    ))}
                                </div>
                            )}

                            {/* Samples adjuntos */}
                            {post.samplesAdjuntos.length > 0 && (
                                <div className="comunidadPostSamples">
                                    {post.samplesAdjuntos.map((sample) => (
                                        <TarjetaSample
                                            key={sample.id}
                                            sample={sample}
                                            onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                                            onMenu={menuSample.abrirMenu}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* C85: Acciones del post (componente centralizado) */}
                            <BarraAccionesPost
                                publicacion={post}
                                onLike={(id, reaccion) => manejarLikePost(id, reaccion)}
                                onQuitarLike={(id) => manejarLikePost(id)}
                                onComentar={(id) => alternarComentarios(id)}
                                onRepost={(id) => manejarRepost(id)}
                                mostrarCeroConteo
                            />

                            {/* Comentarios expandibles */}
                            {comentariosAbiertos.has(post.id) && (
                                <SeccionComentariosPost postId={post.id} navegar={navegar} />
                            )}
                        </article>
                    ))
                )}
            </div>

            {/* C127: Menú contextual de publicaciones */}
            <MenuContextual
                abierto={menuPost.abierto}
                onCerrar={cerrarMenuPost}
                items={itemsMenuPost}
                x={menuPost.x}
                y={menuPost.y}
            />

            {/* C127: Menú contextual de samples adjuntos */}
            <MenuContextual
                abierto={menuSample.estado.abierto}
                onCerrar={menuSample.cerrarMenu}
                items={menuSample.items}
                x={menuSample.estado.x}
                y={menuSample.estado.y}
            />
        </div>
    );
};

export const ComunidadIsland = conAutenticacion(ComunidadBase);
export default ComunidadIsland;
