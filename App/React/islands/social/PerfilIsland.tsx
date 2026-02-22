/*
 * Isla: PerfilIsland
 * Vista pública de perfil: avatar, bio, nombre, stats, tabs con samples.
 * Logica extraida a usePerfilIsland (SRP).
 */

import { Music, Heart, Settings, MapPin, Calendar, Link as LinkIcon, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import BarraAccionesPost from '@app/components/social/BarraAccionesPost';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { SeccionPublicar } from '@app/components/social/SeccionPublicar';
import { iniciarConversacion } from '@app/services/apiMensajes';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { usePerfilIsland } from '@app/hooks/usePerfilIsland';
import { crearLogger } from '@app/services/logger';
import type { SampleResumen } from '@app/types/sample';
import '../../styles/componentes/perfil.css';

const log = crearLogger('PerfilIsland');

interface PerfilIslandProps {
    username?: string;
}

export const PerfilIsland = ({ username: usernameProp }: PerfilIslandProps): JSX.Element => {
    const {
        usuario, cargando, samplesPerfil, likesPerfil, publicacionesPerfil,
        cargandoTab, authCargando, tabActiva,
        abrirConfiguracion, abrirChat, menu, menuPublicacion, username, esPropietario,
        recargarPublicaciones, manejarLike, manejarClickCreador,
    } = usePerfilIsland({ usernameProp });

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
                                <BotonFollow usuarioId={usuario.id} siguiendo={usuario.siguiendo ?? false} />
                                <BotonBase
                                    variante="secundario"
                                    onClick={async () => {
                                        /* Iniciar o reabrir conversación con este usuario */
                                        const resp = await iniciarConversacion(usuario.id);
                                        if (resp.ok && resp.data) {
                                            abrirChat({
                                                conversacionId: resp.data.id,
                                                participanteId: usuario.id,
                                                participanteUsername: usuario.username,
                                                nombreParticipante: usuario.nombreVisible || usuario.username,
                                                avatarUrl: usuario.avatarUrl ?? null,
                                            });
                                        } else {
                                            log.error('Error al iniciar conversación', resp.error);
                                        }
                                    }}>
                                    Mensaje
                                </BotonBase>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* SeccionPublicar siempre visible debajo del header para propietario (C232) */}
            {esPropietario && (
                <div className="perfilSeccionPublicar">
                    <SeccionPublicar
                        alPublicar={recargarPublicaciones}
                        placeholder="Comparte algo con tu comunidad..."
                    />
                </div>
            )}
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
                                            <EnlaceCreador
                                                username={post.autor?.username ?? ''}
                                                nombreVisible={post.autor?.nombreVisible}
                                                avatarUrl={post.autor?.avatarUrl}
                                                tamanoAvatar="sm"
                                                mostrarUsername
                                                meta={post.creadoAt}
                                            />
                                            <button
                                                className="comunidadPostMenuBtn"
                                                onClick={(e) => menuPublicacion.abrirMenu(e, post)}
                                                type="button"
                                                aria-label="Más opciones"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                        <p className="comunidadPostTexto">{post.contenido}</p>
                                        {post.imagenes?.length > 0 && (
                                            <div className={`comunidadPostImagenes comunidadPostImagenes${post.imagenes.length}`}>
                                                {post.imagenes.map((img) => (
                                                    <img key={img} src={img} alt="Imagen adjunta" className="comunidadPostImg" loading="lazy" />
                                                ))}
                                            </div>
                                        )}
                                        <BarraAccionesPost publicacion={post} mostrarCeroConteo />
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {tabActiva === 'likes' && renderizarListaSamples(likesPerfil, 'No ha dado likes aún', <Heart size={40} />)}
            </div>

            {/* Menú contextual samples */}
            <MenuContextual abierto={menu.estado.abierto} x={menu.estado.x} y={menu.estado.y} items={menu.items} onCerrar={menu.cerrarMenu} />
            {/* Menú contextual publicaciones (C322) */}
            <MenuContextual abierto={menuPublicacion.estado.abierto} x={menuPublicacion.estado.x} y={menuPublicacion.estado.y}
                items={menuPublicacion.items} onCerrar={menuPublicacion.cerrarMenu} />
        </div>
    );
};

export default PerfilIsland;
