/*
 * Isla: PerfilIsland
 * Vista pública de perfil: avatar, bio, nombre, stats, tabs con samples.
 * Condicional: si es el propio perfil muestra "Editar", si no muestra "Seguir".
 * Tabs: Samples | Publicaciones | Likes con contenido dinámico.
 */

import {useState, useEffect, useCallback, useMemo} from 'react';
import {Music, Heart, Settings, MapPin, Calendar, Link as LinkIcon, MessageCircle, Repeat2} from 'lucide-react';
import {Avatar} from '../../components/ui/Avatar';
import {Badge} from '../../components/ui/Badge';
import {BotonBase} from '../../components/ui/BotonBase';
import {TarjetaSample} from '../../components/ui/TarjetaSample';
import {MenuContextual} from '../../components/ui/MenuContextual';
import {BotonFollow} from '../../components/social/BotonFollow';
import {obtenerPerfil} from '../../services/apiAuth';
import {listarSamples} from '../../services/apiSamples';
import {darLike, quitarLike, listarPublicacionesUsuario} from '../../services/apiSocial';
import {useAuthStore} from '../../stores/authStore';
import {useTabsTopBarStore} from '../../stores/tabsTopBarStore';
import {useConfiguracionModalStore} from '../../stores/configuracionModalStore';
import {useNavigationStore} from '@/core/router';
import {useMenuContextualSample, EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO} from '../../hooks/useMenuContextualSample';
import {obtenerImagenColor} from '../../services/imagenesColor';
import type {Usuario} from '../../types/usuario';
import type {SampleResumen} from '../../types/sample';
import type {Publicacion} from '../../types/publicacion';
import {crearLogger} from '../../services/logger';
import '../../styles/componentes/perfil.css';

const log = crearLogger('PerfilIsland');

const TABS_PERFIL = [
    {id: 'samples', etiqueta: 'Samples'},
    {id: 'publicaciones', etiqueta: 'Publicaciones'},
    {id: 'likes', etiqueta: 'Likes'}
];

interface PerfilIslandProps {
    username?: string;
}

export const PerfilIsland = ({username: usernameProp}: PerfilIslandProps): JSX.Element => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [siguiendo] = useState(false);

    /* Contenido de tabs */
    const [samplesPerfil, setSamplesPerfil] = useState<SampleResumen[]>([]);
    const [likesPerfil, setLikesPerfil] = useState<SampleResumen[]>([]);
    const [publicacionesPerfil, setPublicacionesPerfil] = useState<Publicacion[]>([]);
    const [cargandoTab, setCargandoTab] = useState(false);

    /* Listener para eliminación optimista de samples */
    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{sampleId?: number}>).detail;
            if (detalle?.sampleId) {
                setSamplesPerfil(prev => prev.filter(s => s.id !== detalle.sampleId));
                setLikesPerfil(prev => prev.filter(s => s.id !== detalle.sampleId));
            }
        };
        const manejarRestauracion = (event: Event) => {
            const detalle = (event as CustomEvent<{sample?: SampleResumen}>).detail;
            if (detalle?.sample) {
                setSamplesPerfil(prev => {
                    if (prev.some(s => s.id === detalle.sample!.id)) return prev;
                    return [detalle.sample!, ...prev];
                });
            }
        };
        window.addEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
        window.addEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        return () => {
            window.removeEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
            window.removeEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        };
    }, []);

    const {usuario: usuarioAuth, cargando: authCargando} = useAuthStore();
    const {activa: tabActiva, setTabs} = useTabsTopBarStore();
    const {navegar} = useNavigationStore();
    const rutaActual = useNavigationStore(s => s.rutaActual);
    const {abrir: abrirConfiguracion} = useConfiguracionModalStore();
    const menu = useMenuContextualSample();

    /*
     * Extraer username de la URL SPA (rutaActual) o del prop.
     * SPA: /perfil/john/ → john
     * Fallback a authStore si no hay username (perfil propio).
     */
    const username = useMemo(() => {
        /* Primero intentar de la ruta SPA */
        const segmentos = (rutaActual ?? '').replace(/\/$/, '').split('/');
        const idxPerfil = segmentos.indexOf('perfil');
        if (idxPerfil !== -1 && segmentos[idxPerfil + 1] && segmentos[idxPerfil + 1] !== 'perfil' && segmentos[idxPerfil + 1] !== 'editar') {
            return segmentos[idxPerfil + 1];
        }

        /* Luego intentar del prop */
        const val = usernameProp?.trim();
        if (val && val !== 'perfil' && val !== 'editar') {
            return val;
        }

        return usuarioAuth?.username ?? null;
    }, [rutaActual, usernameProp, usuarioAuth?.username]);

    const esPropietario = usuarioAuth && usuario && usuarioAuth.username === usuario.username;

    /* Registrar tabs en TopBar */
    useEffect(() => {
        setTabs(TABS_PERFIL, 'samples');
        return () => {
            setTabs([]);
        };
    }, [setTabs]);

    useEffect(() => {
        /* Si authStore sigue cargando y no tenemos username explícito, esperar */
        if (!username && authCargando) return;
        if (!username) return;

        const cargar = async () => {
            setCargando(true);
            try {
                const respuesta = await obtenerPerfil(username);
                if (respuesta.ok && respuesta.data) {
                    setUsuario(respuesta.data as unknown as Usuario);
                    setCargando(false);
                    return;
                }
            } catch (err) {
                log.debug('API perfil no disponible, intentando fallback', err);
            }

            /*
             * Fallback: si la API falla (ej. usuario sin registro PG aún)
             * y es perfil propio, usar datos del authStore como fuente.
             */
            if (usuarioAuth && (username === usuarioAuth.username || username === '')) {
                setUsuario({
                    id: usuarioAuth.id,
                    username: usuarioAuth.username,
                    nombreVisible: usuarioAuth.nombreVisible ?? usuarioAuth.username,
                    avatarUrl: usuarioAuth.avatarUrl ?? null,
                    bio: '',
                    portadaUrl: null,
                    plan: (usuarioAuth as unknown as {plan?: string}).plan ?? 'free',
                    verificado: false,
                    totalSamples: 0,
                    totalSeguidores: 0,
                    totalSeguidos: 0
                } as Usuario);
            }
            setCargando(false);
        };

        cargar();
    }, [username, authCargando, usuarioAuth]);

    /* Cargar contenido de tabs */
    useEffect(() => {
        if (!usuario) return;

        const cargarTab = async () => {
            setCargandoTab(true);
            try {
                if (tabActiva === 'samples') {
                    const resp = await listarSamples({page: 1, perPage: 20, creador: usuario.username});
                    if (resp.ok && resp.data) {
                        setSamplesPerfil(resp.data.data ?? []);
                    }
                } else if (tabActiva === 'publicaciones') {
                    const resp = await listarPublicacionesUsuario(usuario.username, 1);
                    if (resp.ok && resp.data) {
                        const lista = resp.data.data ?? resp.data ?? [];
                        setPublicacionesPerfil(Array.isArray(lista) ? lista : []);
                    }
                } else if (tabActiva === 'likes') {
                    /* TO-DO: endpoint GET /usuarios/{id}/likes para obtener samples likeados */
                    const resp = await listarSamples({page: 1, perPage: 10});
                    if (resp.ok && resp.data) {
                        setLikesPerfil(resp.data.data ?? []);
                    }
                }
            } catch (err) {
                log.error('Error cargando tab', err);
            } finally {
                setCargandoTab(false);
            }
        };

        cargarTab();
    }, [usuario, tabActiva]);

    /* Like con optimistic UI — usa callback de setState para evitar stale closure */
    const manejarLike = useCallback(async (sampleId: number) => {
        let estabaLiked = false;

        const actualizar = (lista: SampleResumen[]) =>
            lista.map(s => {
                if (s.id === sampleId) {
                    estabaLiked = s.liked ?? false;
                    return {...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1)};
                }
                return s;
            });
        setSamplesPerfil(actualizar);
        setLikesPerfil(actualizar);

        if (estabaLiked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
        }
    }, []);

    /* Navegación al creador */
    const manejarClickCreador = useCallback(
        (usr: string) => {
            navegar(`/perfil/${usr}/`);
        },
        [navegar]
    );

    if (cargando || (authCargando && !username)) {
        return (
            <div className="perfilContenedor">
                <div className="perfilVacio">Cargando perfil...</div>
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="perfilContenedor">
                <div className="perfilVacio">
                    <Music size={48} />
                    <p>Usuario no encontrado</p>
                </div>
            </div>
        );
    }

    /* Renderizar lista de samples para la tab activa */
    const renderizarListaSamples = (lista: SampleResumen[], mensajeVacio: string, iconoVacio: JSX.Element) => {
        if (cargandoTab) {
            return (
                <div className="perfilVacio">
                    <p>Cargando...</p>
                </div>
            );
        }
        if (lista.length === 0) {
            return (
                <div className="perfilVacio">
                    {iconoVacio}
                    <p>{mensajeVacio}</p>
                </div>
            );
        }
        return (
            <div className="listaDeSamples">
                {lista.map(sample => (
                    <TarjetaSample key={sample.id} sample={sample} onLike={manejarLike} onMenu={menu.abrirMenu} onClickCreador={manejarClickCreador} />
                ))}
            </div>
        );
    };

    return (
        <div className="perfilContenedor">
            <div className="perfilContenedorInterno">
                <div className="perfilPortada">
                    {/* Portada: usa portadaUrl o fallback a imagen de colors/ */}
                    <img src={usuario.portadaUrl || obtenerImagenColor(usuario.id + 100)} alt="Portada" className="perfilPortadaImg" />
                    <div className="perfilAvatarWrapper">
                        <Avatar src={usuario.avatarUrl} nombre={usuario.nombreVisible} tamano="2xl" />
                    </div>
                </div>

                <div className="perfilInfo">
                    <div className="perfilInfoTexto">
                        <h1 className="perfilNombre">
                            {usuario.nombreVisible}
                            {usuario.plan !== 'free' && <Badge variante={usuario.plan === 'premium' ? 'premium' : 'acento'}>{usuario.plan}</Badge>}
                        </h1>
                        <p className="perfilUsername">@{usuario.username}</p>
                        {usuario.bio && <p className="perfilBio">{usuario.bio}</p>}

                        {/* Metadata dinámica del perfil — datos reales del backend */}
                        <div className="perfilMetadata">
                            {usuario.ubicacion && (
                                <span className="perfilMetaItem">
                                    <MapPin size={14} />
                                    {usuario.ubicacion}
                                </span>
                            )}
                            {usuario.creadoAt && (
                                <span className="perfilMetaItem">
                                    <Calendar size={14} />
                                    Se unió en {new Date(usuario.creadoAt).getFullYear()}
                                </span>
                            )}
                            {usuario.sitioWeb && (
                                <a className="perfilMetaItem perfilMetaLink" href={usuario.sitioWeb} target="_blank" rel="noopener">
                                    <LinkIcon size={14} />
                                    {usuario.sitioWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            )}
                        </div>

                        <div className="perfilStats">
                            <div className="perfilStat">
                                <span className="perfilStatValor">{usuario.totalSamples ?? 0}</span>
                                <span className="perfilStatLabel">Samples</span>
                            </div>
                            <div className="perfilStat">
                                <span className="perfilStatValor">{usuario.totalSeguidores ?? 0}</span>
                                <span className="perfilStatLabel">Seguidores</span>
                            </div>
                            <div className="perfilStat">
                                <span className="perfilStatValor">{usuario.totalSeguidos ?? 0}</span>
                                <span className="perfilStatLabel">Siguiendo</span>
                            </div>
                        </div>
                    </div>

                    <div className="perfilAcciones">
                        {esPropietario ? (
                            <BotonBase variante="secundario" onClick={() => abrirConfiguracion()}>
                                <Settings size={14} />
                                Editar perfil
                            </BotonBase>
                        ) : (
                            <>
                                <BotonFollow usuarioId={usuario.id} siguiendo={siguiendo} />
                                <BotonBase
                                    variante="secundario"
                                    onClick={() => {
                                        log.info('Mensaje a', usuario.username);
                                    }}>
                                    Mensaje
                                </BotonBase>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* Tabs se renderizan en el TopBar */}

            <div className="perfilContenidoTab">
                {tabActiva === 'samples' && renderizarListaSamples(samplesPerfil, 'No ha subido samples aún', <Music size={40} />)}
                {tabActiva === 'publicaciones' && (
                    <div className="perfilPublicaciones">
                        {cargandoTab ? (
                            <div className="perfilVacio">
                                <p>Cargando...</p>
                            </div>
                        ) : publicacionesPerfil.length === 0 ? (
                            <div className="perfilVacio">
                                <p>No hay publicaciones aún</p>
                            </div>
                        ) : (
                            <div className="comunidadFeed">
                                {publicacionesPerfil.map(post => (
                                    <article key={post.id} className="comunidadPost">
                                        <div className="comunidadPostHeader">
                                            <div className="comunidadPostAutorInfo">
                                                <span className="comunidadPostNombre">{post.autor?.nombreVisible}</span>
                                                <span className="comunidadPostTiempo">
                                                    @{post.autor?.username} · {post.creadoAt}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="comunidadPostTexto">{post.contenido}</p>
                                        {post.imagenes?.length > 0 && (
                                            <div className={`comunidadPostImagenes comunidadPostImagenes${post.imagenes.length}`}>
                                                {post.imagenes.map((img, i) => (
                                                    <img key={i} src={img} alt={`Imagen ${i + 1}`} className="comunidadPostImg" loading="lazy" />
                                                ))}
                                            </div>
                                        )}
                                        <div className="comunidadPostAcciones">
                                            <button className={`comunidadPostAccionBtn ${post.liked ? 'comunidadPostAccionActiva' : ''}`} type="button">
                                                <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                                                <span>{post.totalLikes}</span>
                                            </button>
                                            <button className="comunidadPostAccionBtn" type="button">
                                                <MessageCircle size={16} />
                                                <span>{post.totalComentarios}</span>
                                            </button>
                                            <button className="comunidadPostAccionBtn" type="button">
                                                <Repeat2 size={16} />
                                                <span>{post.totalReposts}</span>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {tabActiva === 'likes' && renderizarListaSamples(likesPerfil, 'No ha dado likes aún', <Heart size={40} />)}
            </div>

            {/* Menú contextual */}
            <MenuContextual abierto={menu.estado.abierto} x={menu.estado.x} y={menu.estado.y} items={menu.items} onCerrar={menu.cerrarMenu} />
        </div>
    );
};

export default PerfilIsland;
