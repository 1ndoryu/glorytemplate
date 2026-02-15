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
import { useReproductorStore } from '@app/stores/reproductorStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import type { Publicacion } from '@app/types';
import '../../styles/componentes/comunidad.css';

type FiltroComunidad = 'todos' | 'siguiendo' | 'populares';

/* Mock data variado: texto, texto+imagen, texto+sample, repost */
const publicacionesMock: Publicacion[] = [
    {
        id: 1,
        autorId: 1,
        tipo: 'social',
        contenido: '¡Acabo de terminar un pack de lo-fi hip hop beats! 🎵 Inspirado en el jazz de los 50s con texturas modernas. Pronto disponible en mi perfil. #lofi #hiphop #jazz',
        imagenes: [],
        samplesAdjuntos: [],
        totalLikes: 42,
        totalComentarios: 8,
        totalReposts: 3,
        liked: false,
        reposteado: false,
        creadoAt: new Date(Date.now() - 3600000).toISOString(),
        autor: { id: 1, username: 'beatmaker99', nombreVisible: 'BeatMaker99', avatarUrl: null, verificado: true },
    },
    {
        id: 2,
        autorId: 2,
        tipo: 'social',
        contenido: 'Nuevo setup listo para producir. Monitores nuevos + panel acústico. El sonido es completamente diferente ahora, se los recomiendo.',
        imagenes: [obtenerImagenColor(100), obtenerImagenColor(101)],
        samplesAdjuntos: [],
        totalLikes: 85,
        totalComentarios: 15,
        totalReposts: 7,
        liked: true,
        reposteado: false,
        creadoAt: new Date(Date.now() - 7200000).toISOString(),
        autor: { id: 2, username: 'studiogirl', nombreVisible: 'Studio Girl', avatarUrl: null, verificado: false },
    },
    {
        id: 3,
        autorId: 3,
        tipo: 'sample',
        contenido: 'Les comparto este loop de guitarra latina que hice ayer. Ideal para trap melódico o reggaeton. #guitar #latin #trap',
        imagenes: [],
        samplesAdjuntos: [{
            id: 301,
            titulo: 'Guitar Latin Vibes',
            slug: 'guitar-latin-vibes',
            bpm: 92,
            key: 'A',
            escala: 'menor',
            duracion: 8.5,
            tags: ['guitar', 'latin', 'trap'],
            tipo: 'loop',
            esPremium: false,
            rutaPreview: '/wp-content/themes/glorytemplate/App/Assets/audio/preview-latin.mp3',
            rutaWaveform: '',
            imagenUrl: null,
            totalDescargas: 15,
            totalLikes: 23,
            creador: { id: 3, username: 'guitarking', nombreVisible: 'Guitar King', avatarUrl: null, verificado: true },
            liked: false,
        }],
        totalLikes: 56,
        totalComentarios: 12,
        totalReposts: 9,
        liked: false,
        reposteado: false,
        creadoAt: new Date(Date.now() - 14400000).toISOString(),
        autor: { id: 3, username: 'guitarking', nombreVisible: 'Guitar King', avatarUrl: null, verificado: true },
    },
    {
        id: 4,
        autorId: 4,
        tipo: 'social',
        contenido: '¿Alguien más siente que mezclar en auriculares abiertos vs cerrados es un mundo de diferencia? Yo cambié hace 6 meses y nunca volvería atrás.',
        imagenes: [],
        samplesAdjuntos: [],
        totalLikes: 28,
        totalComentarios: 22,
        totalReposts: 1,
        liked: false,
        reposteado: false,
        creadoAt: new Date(Date.now() - 28800000).toISOString(),
        autor: { id: 4, username: 'mixengineer', nombreVisible: 'Mix Engineer Pro', avatarUrl: null, verificado: false },
    },
    {
        id: 5,
        autorId: 5,
        tipo: 'social',
        contenido: 'Tutorial rápido: cómo crear risers épicos con un simple sweep de ruido blanco + automatización de filtro. El secreto está en la reverb larga al final.',
        imagenes: [obtenerImagenColor(102)],
        samplesAdjuntos: [],
        totalLikes: 112,
        totalComentarios: 31,
        totalReposts: 18,
        liked: true,
        reposteado: true,
        creadoAt: new Date(Date.now() - 43200000).toISOString(),
        autor: { id: 5, username: 'sounddesigner', nombreVisible: 'Sound Designer', avatarUrl: null, verificado: true },
    },
];

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
    const { setSample, sampleActual, reproduciendo, progreso } = useReproductorStore();

    useEffect(() => {
        /* TO-DO: conectar a API real GET /kamples/v1/publicaciones?filtro= */
        setCargando(true);
        setTimeout(() => {
            setPublicaciones(publicacionesMock);
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
                                            onPlay={(s) => setSample(s)}
                                            activa={sampleActual?.id === sample.id}
                                            reproduciendo={sampleActual?.id === sample.id && reproduciendo}
                                            progreso={sampleActual?.id === sample.id ? progreso : 0}
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
