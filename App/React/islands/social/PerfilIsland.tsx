/*
 * Isla: PerfilIsland
 * Vista pública de perfil: avatar, bio, nombre, stats, tabs con samples.
 * Condicional: si es el propio perfil muestra "Editar", si no muestra "Seguir".
 * Tabs: Samples | Publicaciones | Likes con contenido dinámico.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Music, FileText, Heart, Settings } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { BotonBase } from '../../components/ui/BotonBase';
import { TarjetaSample } from '../../components/ui/TarjetaSample';
import { MenuContextual } from '../../components/ui/MenuContextual';
import { BotonFollow } from '../../components/social/BotonFollow';
import { obtenerPerfil } from '../../services/apiAuth';
import { listarSamples } from '../../services/apiSamples';
import { darLike, quitarLike } from '../../services/apiSocial';
import { useAuthStore } from '../../stores/authStore';
import { useTabsTopBarStore } from '../../stores/tabsTopBarStore';
import { useConfiguracionModalStore } from '../../stores/configuracionModalStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '../../hooks/useMenuContextualSample';
import type { Usuario } from '../../types/usuario';
import type { SampleResumen } from '../../types/sample';
import { crearLogger } from '../../services/logger';
import '../../styles/componentes/perfil.css';

const log = crearLogger('PerfilIsland');

const TABS_PERFIL = [
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'publicaciones', etiqueta: 'Publicaciones' },
    { id: 'likes', etiqueta: 'Likes' },
];

interface PerfilIslandProps {
    username?: string;
}

export const PerfilIsland = ({ username: usernameProp }: PerfilIslandProps): JSX.Element => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [siguiendo, setSiguiendo] = useState(false);

    /* Contenido de tabs */
    const [samplesPerfil, setSamplesPerfil] = useState<SampleResumen[]>([]);
    const [likesPerfil, setLikesPerfil] = useState<SampleResumen[]>([]);
    const [cargandoTab, setCargandoTab] = useState(false);

    const { usuario: usuarioAuth, cargando: authCargando } = useAuthStore();
    const { activa: tabActiva, setTabs } = useTabsTopBarStore();
    const { navegar } = useNavigationStore();
    const { abrir: abrirConfiguracion } = useConfiguracionModalStore();
    const menu = useMenuContextualSample();

    /*
     * Fix race condition: si username viene vacío y authStore aún está cargando,
     * esperamos a que termine. Si termina y no hay username → perfil propio.
     */
    const username = useMemo(() => {
        const val = usernameProp?.trim();
        if (!val || val === 'perfil' || val === 'editar') {
            return usuarioAuth?.username ?? null;
        }
        return val;
    }, [usernameProp, usuarioAuth?.username]);

    const esPropietario = usuarioAuth && usuario && usuarioAuth.username === usuario.username;

    /* Registrar tabs en TopBar */
    useEffect(() => {
        setTabs(TABS_PERFIL, 'samples');
        return () => { setTabs([]); };
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
                    plan: (usuarioAuth as unknown as { plan?: string }).plan ?? 'free',
                    verificado: false,
                    totalSamples: 0,
                    totalSeguidores: 0,
                    totalSeguidos: 0,
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
                    /* TO-DO: cuando el backend soporte filtro por creador, añadir busqueda por username */
                    const resp = await listarSamples({ page: 1, perPage: 20 });
                    if (resp.ok && resp.data) {
                        setSamplesPerfil(resp.data.data ?? []);
                    }
                } else if (tabActiva === 'likes') {
                    /* TO-DO: endpoint de likes del usuario, por ahora usa samples genéricos */
                    const resp = await listarSamples({ page: 1, perPage: 10 });
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
            lista.map((s) => {
                if (s.id === sampleId) {
                    estabaLiked = s.liked ?? false;
                    return { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) };
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
    const manejarClickCreador = useCallback((usr: string) => {
        navegar(`/perfil/${usr}/`);
    }, [navegar]);

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
            return <div className="perfilVacio"><p>Cargando...</p></div>;
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
            <div className="perfilListaSamples">
                {lista.map((sample) => (
                    <TarjetaSample
                        key={sample.id}
                        sample={sample}
                        onLike={manejarLike}
                        onMenu={menu.abrirMenu}
                        onClickCreador={manejarClickCreador}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="perfilContenedor">
            <div className="perfilPortada">
                {usuario.portadaUrl && (
                    <img src={usuario.portadaUrl} alt="Portada" />
                )}
                <div className="perfilAvatarWrapper">
                    <Avatar
                        src={usuario.avatarUrl}
                        nombre={usuario.nombreVisible}
                        tamano="2xl"
                    />
                </div>
            </div>

            <div className="perfilInfo">
                <div className="perfilInfoTexto">
                    <h1 className="perfilNombre">
                        {usuario.nombreVisible}
                        {usuario.plan !== 'free' && (
                            <span className="perfilBadgePlan">
                                <Badge variante={usuario.plan === 'premium' ? 'premium' : 'acento'}>
                                    {usuario.plan}
                                </Badge>
                            </span>
                        )}
                    </h1>
                    <p className="perfilUsername">@{usuario.username}</p>
                    {usuario.bio && <p className="perfilBio">{usuario.bio}</p>}

                    <div className="perfilStats">
                        <div className="perfilStat">
                            <span className="perfilStatValor">
                                {usuario.totalSamples ?? 0}
                            </span>
                            <span className="perfilStatLabel">Samples</span>
                        </div>
                        <div className="perfilStat">
                            <span className="perfilStatValor">
                                {usuario.totalSeguidores ?? 0}
                            </span>
                            <span className="perfilStatLabel">Seguidores</span>
                        </div>
                        <div className="perfilStat">
                            <span className="perfilStatValor">
                                {usuario.totalSeguidos ?? 0}
                            </span>
                            <span className="perfilStatLabel">Siguiendo</span>
                        </div>
                    </div>
                </div>

                <div className="perfilAcciones">
                    {esPropietario ? (
                        <BotonBase
                            variante="secundario"
                            onClick={() => abrirConfiguracion()}
                        >
                            <Settings size={14} />
                            Editar perfil
                        </BotonBase>
                    ) : (
                        <>
                            <BotonFollow
                                usuarioId={usuario.id}
                                siguiendo={siguiendo}
                            />
                            <BotonBase
                                variante="secundario"
                                onClick={() => {
                                    /* TO-DO: navegar a mensajes con este usuario */
                                    log.info('Mensaje a', usuario.username);
                                }}
                            >
                                Mensaje
                            </BotonBase>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs se renderizan en el TopBar */}

            <div className="perfilContenidoTab">
                {tabActiva === 'samples' &&
                    renderizarListaSamples(samplesPerfil, 'No ha subido samples aún', <Music size={40} />)}
                {tabActiva === 'publicaciones' && (
                    <div className="perfilVacio">
                        <FileText size={40} />
                        <p>Las publicaciones aparecerán aquí</p>
                    </div>
                )}
                {tabActiva === 'likes' &&
                    renderizarListaSamples(likesPerfil, 'No ha dado likes aún', <Heart size={40} />)}
            </div>

            {/* Menú contextual */}
            <MenuContextual
                abierto={menu.estado.abierto}
                x={menu.estado.x}
                y={menu.estado.y}
                items={menu.items}
                onCerrar={menu.cerrarMenu}
            />
        </div>
    );
};

export default PerfilIsland;
