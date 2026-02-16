/*
 * Isla: ComunidadIsland — Kamples (FASE 6.4)
 * Feed de posts sociales con diseño diferenciado al feed de samples.
 * Tarjetas más grandes, énfasis en texto/imágenes, samples adjuntos reproducibles.
 * Ruta: /comunidad
 */

import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Repeat2, Users, TrendingUp, Clock, PenSquare } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { usePublicarModalStore } from '@app/stores/publicarModalStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useComentarios } from '@app/hooks/useComentarios';
import { apiGet } from '@app/services/apiCliente';
import type { Publicacion } from '@app/types';
import '../../styles/componentes/comunidad.css';

type FiltroComunidad = 'todos' | 'siguiendo' | 'populares';

/* Sección de comentarios por post: encapsula el hook useComentarios */
const SeccionComentariosPost = ({ postId, navegar }: { postId: number; navegar: (ruta: string) => void }): JSX.Element => {
    const { comentarios, cargando, enviar } = useComentarios({
        tipo: 'publicacion',
        targetId: postId,
        cargarAlAbrir: true,
    });

    return (
        <ListaComentarios
            comentarios={comentarios}
            cargando={cargando}
            onEnviar={enviar}
            onClickAutor={(username) => navegar(`/perfil/${username}/`)}
            maxVisibles={3}
        />
    );
};

const formatearTiempoRelativo = (fecha: string): string => {
    const ahora = Date.now();
    const diff = ahora - new Date(fecha).getTime();
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
    const { navegar } = useNavigationStore();
    const { setTabs } = useTabsTopBarStore();
    const { abrir: abrirPublicar } = usePublicarModalStore();

    /* Registrar tab "Comunidad" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'comunidad', etiqueta: 'Comunidad' }], 'comunidad');
        return () => { setTabs([]); };
    }, [setTabs]);

    useEffect(() => {
        let activo = true;
        setCargando(true);

        const cargarPublicaciones = async () => {
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

        cargarPublicaciones();
        return () => { activo = false; };
    }, [filtro]);

    const manejarLikePost = useCallback((postId: number) => {
        setPublicaciones((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, liked: !p.liked, totalLikes: p.liked ? p.totalLikes - 1 : p.totalLikes + 1 }
                    : p
            )
        );
    }, []);

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
            {/* Botón publicar + filtros */}
            <div className="comunidadBarraSuperior">
                <BotonBase
                    variante="primario"
                    tamano="sm"
                    onClick={() => abrirPublicar('social')}
                >
                    <PenSquare size={14} />
                    Publicar
                </BotonBase>

                {/* Barra de filtros */}
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
                                <button
                                    className="comunidadPostAutor"
                                    onClick={() => navegar(`/perfil/${post.autor.username}/`)}
                                    type="button"
                                >
                                    <Avatar
                                        nombre={post.autor.nombreVisible}
                                        src={post.autor.avatarUrl ?? undefined}
                                        tamano="sm"
                                    />
                                    <div className="comunidadPostAutorInfo">
                                        <span className="comunidadPostNombre">
                                            {post.autor.nombreVisible}
                                            {post.autor.verificado && <Badge variante="acento" tamano="xs">✓</Badge>}
                                        </span>
                                        <span className="comunidadPostTiempo">
                                            @{post.autor.username} · {formatearTiempoRelativo(post.creadoAt)}
                                        </span>
                                    </div>
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
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Acciones del post */}
                            <div className="comunidadPostAcciones">
                                <button
                                    className={`comunidadPostAccionBtn ${post.liked ? 'comunidadPostAccionActiva' : ''}`}
                                    onClick={() => manejarLikePost(post.id)}
                                    type="button"
                                >
                                    <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                                    <span>{post.totalLikes}</span>
                                </button>
                                <button className="comunidadPostAccionBtn" type="button" onClick={() => alternarComentarios(post.id)}>
                                    <MessageCircle size={16} />
                                    <span>{post.totalComentarios}</span>
                                </button>
                                <button
                                    className={`comunidadPostAccionBtn ${post.reposteado ? 'comunidadPostAccionActiva' : ''}`}
                                    onClick={() => manejarRepost(post.id)}
                                    type="button"
                                >
                                    <Repeat2 size={16} />
                                    <span>{post.totalReposts}</span>
                                </button>
                            </div>

                            {/* Comentarios expandibles */}
                            {comentariosAbiertos.has(post.id) && (
                                <SeccionComentariosPost postId={post.id} navegar={navegar} />
                            )}
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};

export const ComunidadIsland = conAutenticacion(ComunidadBase);
export default ComunidadIsland;
