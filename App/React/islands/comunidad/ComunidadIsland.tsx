/*
 * Isla: ComunidadIsland — Kamples (FASE 6.4)
 * Feed de posts sociales con diseño diferenciado al feed de samples.
 * Tarjetas más grandes, énfasis en texto/imágenes, samples adjuntos reproducibles.
 * Ruta: /comunidad
 */

import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Repeat2, Users, TrendingUp, Clock } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { Publicacion } from '@app/types';
import '../../styles/componentes/comunidad.css';

type FiltroComunidad = 'todos' | 'siguiendo' | 'populares';

/* TO-DO: conectar a GET /kamples/v1/publicaciones cuando exista el endpoint */

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
    const { navegar } = useNavigationStore();
    const { setTabs } = useTabsTopBarStore();

    /* Registrar tab "Comunidad" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'comunidad', etiqueta: 'Comunidad' }], 'comunidad');
        return () => { setTabs([]); };
    }, [setTabs]);

    useEffect(() => {
        /* TO-DO: GET /kamples/v1/publicaciones?filtro=${filtro} cuando el endpoint exista */
        setCargando(true);
        setTimeout(() => {
            setPublicaciones([]);
            setCargando(false);
        }, 300);
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

    const filtros: { valor: FiltroComunidad; icono: typeof Users; label: string }[] = [
        { valor: 'todos', icono: Clock, label: 'Todos' },
        { valor: 'siguiendo', icono: Users, label: 'Siguiendo' },
        { valor: 'populares', icono: TrendingUp, label: 'Populares' },
    ];

    return (
        <div className="comunidadIsland" id="comunidadIsland">
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
                                <button className="comunidadPostAccionBtn" type="button">
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
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};

export const ComunidadIsland = conAutenticacion(ComunidadBase);
export default ComunidadIsland;
