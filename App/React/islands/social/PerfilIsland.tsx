/*
 * Isla: PerfilIsland
 * Vista pública de perfil: avatar, bio, nombre, stats, tabs con samples.
 * Logica extraida a usePerfilIsland (SRP).
 */

import { useCallback } from 'react';
import { Music, Settings, MapPin, Link as LinkIcon, MoreHorizontal, BadgeCheck, MessageCircle } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonFollow } from '@app/components/social/BotonFollow';
import { TarjetaPublicacion } from '@app/components/social/TarjetaPublicacion';
import { SeccionPublicar } from '@app/components/social/SeccionPublicar';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { ModalPapelera } from '@app/components/social/ModalPapelera';
import { TabGanancias } from '@app/components/social/TabGanancias';
import { SkeletonPerfil, SkeletonFeed } from '@app/components/skeletons';
import { iniciarConversacion } from '@app/services/apiMensajes';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { usePerfilIsland } from '@app/hooks/usePerfilIsland';
import { useComentarios } from '@app/hooks/useComentarios';
import { useSeguidoresModalStore } from '@app/stores/seguidoresModalStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { crearLogger } from '@app/services/logger';
import type { SampleResumen } from '@app/types/sample';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import '../../styles/componentes/perfil.css';

const log = crearLogger('PerfilIsland');

/* QQ18: Sección de comentarios para publicaciones del perfil (replica de ComunidadIsland) */
const SeccionComentariosPost = ({ postId, navegar }: { postId: number; navegar: (ruta: string) => void }): JSX.Element => {
    const {
        comentarios, cargando, enviar, enviarMultimedia, cargarMas, hayMas,
        editar, eliminar, reportar, toggleLike, cargarRespuestas,
        editandoId, setEditandoId, respondendoAId, setRespondendoAId,
    } = useComentarios({ tipo: 'publicacion', targetId: postId, cargarAlAbrir: true });

    return (
        <ListaComentarios
            comentarios={comentarios} cargando={cargando} onEnviar={enviar} onEnviarMultimedia={enviarMultimedia}
            onClickAutor={(u) => navegar(`/perfil/${u}/`)} maxVisibles={3}
            onCargarMas={cargarMas} hayMasPaginas={hayMas}
            onEditar={editar} onEliminar={eliminar} onReportar={reportar} onToggleLike={toggleLike}
            onCargarRespuestas={cargarRespuestas} editandoId={editandoId} setEditandoId={setEditandoId}
            respondendoAId={respondendoAId} setRespondendoAId={setRespondendoAId}
        />
    );
};

interface PerfilIslandProps {
    username?: string;
}

export const PerfilIsland = ({ username: usernameProp }: PerfilIslandProps): JSX.Element => {
    const {
        usuario, cargando, samplesPerfil, publicacionesPerfil,
        cargandoTab, authCargando, tabActiva, navegar,
        abrirConfiguracion, abrirChat, menu, menuPublicacion, menuPerfil, username, esPropietario,
        recargarPublicaciones, manejarLike, manejarLikePost, alternarComentarios,
        comentariosAbiertos, manejarClickCreador, manejarRepost,
    } = usePerfilIsland({ usernameProp });

    /* [193A-30] Búsqueda por tag en perfil — fuera de early returns para cumplir reglas de hooks */
    const manejarBuscarTag = useCallback((tag: string) => {
        useFiltrosStore.getState().setBusqueda(tag);
    }, []);

    if (cargando || (authCargando && !username)) {
        return (
            <div className="perfilContenedor">
                <SkeletonPerfil />
                <SkeletonFeed cantidad={4} />
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="perfilContenedor">
                <EstadoVacio icono={<Music size={48} />} mensaje="Usuario no encontrado" />
            </div>
        );
    }

    /* Renderizar lista de samples para la tab activa */
    const renderizarListaSamples = (lista: SampleResumen[], mensajeVacio: string, iconoVacio: JSX.Element) => {
        if (cargandoTab) {
            return <SkeletonFeed cantidad={3} />;
        }
        if (lista.length === 0) {
            return (
                <EstadoVacio icono={iconoVacio} mensaje={mensajeVacio} />
            );
        }
        return (
            <div className="listaDeSamples">
                {lista.map(sample => (
                    <TarjetaSample key={sample.id} sample={sample} contexto={lista} onLike={manejarLike} onMenu={menu.abrirMenu} onClickCreador={manejarClickCreador} onFiltrarMeta={manejarBuscarTag} />
                ))}
            </div>
        );
    };

    return (
        <div className="perfilContenedor">
            {/* [183A-104] Ocultar header y publicar en tab ganancias */}
            {tabActiva !== 'ganancias' && (<>
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
                            {/* [193A-55] BadgeCheck unificado con TarjetaPublicacion */}
                            {usuario.verificado && <BadgeCheck size={16} className="perfilVerificado" />}
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
                            {usuario.sitioWeb && (
                                <a className="perfilMetaItem perfilMetaLink" href={usuario.sitioWeb} target="_blank" rel="noopener">
                                    <LinkIcon size={14} />
                                    {usuario.sitioWeb.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)}
                                </a>
                            )}
                        </div>

                        <div className="perfilStats">
                            <div className="perfilStat">
                                <span className="perfilStatValor">{usuario.totalSamples ?? 0}</span>
                                <span className="perfilStatLabel">Samples</span>
                            </div>
                            <div
                                className="perfilStat perfilStatClickable"
                                onClick={() => useSeguidoresModalStore.getState().abrir(usuario.username)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') useSeguidoresModalStore.getState().abrir(usuario.username); }}
                            >
                                <span className="perfilStatValor">{usuario.totalSeguidores ?? 0}</span>
                                <span className="perfilStatLabel">Seguidores</span>
                            </div>
                        </div>
                    </div>

                    <div className="perfilAcciones">
                        {esPropietario ? (
                            <BotonBase variante="secundario" className="perfilBtnEditar" onClick={() => abrirConfiguracion()}>
                                <Settings size={14} />
                                Editar perfil
                            </BotonBase>
                        ) : (
                            <>
                                {/* [193A-78] Botones solo icono — seguir y mensaje */}
                                {/* [2003A-32] className perfilAccionIcono compartida para igualar tamaño */}
                                <BotonFollow usuarioId={usuario.id} siguiendo={usuario.siguiendo ?? false} soloIcono className="perfilAccionIcono" />
                                <BotonBase
                                    variante="ghost"
                                    className="perfilAccionIcono"
                                    aria-label="Enviar mensaje"
                                    onClick={async () => {
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
                                    <MessageCircle size={14} />
                                </BotonBase>
                            </>
                        )}
                        {/* QQ23+QQ57: Menu de 3 puntos — owner (config+papelera) o visitante (reportar/bloquear) */}
                        <BotonBase variante="ghost" onClick={menuPerfil.abrirMenu} aria-label="Opciones de usuario">
                            <MoreHorizontal size={18} />
                        </BotonBase>
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
            </>)}
            {/* Tabs se renderizan en el TopBar */}

            <div className="perfilContenidoTab">
                {tabActiva === 'samples' && renderizarListaSamples(samplesPerfil, 'No ha subido samples aún', <Music size={40} />)}
                {/* [183A-96] Tab de ganancias — solo visible para propietario */}
                {tabActiva === 'ganancias' && esPropietario && <TabGanancias />}
                {tabActiva === 'publicaciones' && (
                    <div className="perfilPublicaciones">
                        {cargandoTab ? (
                            <SkeletonFeed cantidad={3} />
                        ) : publicacionesPerfil.length === 0 ? (
                            <EstadoVacio mensaje="No hay publicaciones aún" />
                        ) : (
                            <div className="comunidadFeed">
                                {publicacionesPerfil.map(post => (
                                    <TarjetaPublicacion
                                        key={post.id}
                                        publicacion={post}
                                        onClickAutor={manejarClickCreador}
                                        onClickFecha={(pubId) => navegar(`/publicacion/${pubId}/`)}
                                        onLike={(id, reaccion) => manejarLikePost(id, reaccion)}
                                        onComentar={(id) => alternarComentarios(id)}
                                        onRepost={manejarRepost}
                                        onMenu={(e) => menuPublicacion.abrirMenu(e, post)}
                                    >
                                        {comentariosAbiertos.has(post.id) && (
                                            <SeccionComentariosPost postId={post.id} navegar={navegar} />
                                        )}
                                    </TarjetaPublicacion>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Menú contextual samples */}
            <MenuContextual abierto={menu.estado.abierto} x={menu.estado.x} y={menu.estado.y} items={menu.items} onCerrar={menu.cerrarMenu} />
            {/* Menú contextual publicaciones (C322) */}
            <MenuContextual abierto={menuPublicacion.estado.abierto} x={menuPublicacion.estado.x} y={menuPublicacion.estado.y}
                items={menuPublicacion.items} onCerrar={menuPublicacion.cerrarMenu} />
            {/* QQ23+QQ57: Menú contextual perfil — owner (config+papelera) o visitante (reportar/bloquear) */}
            <MenuContextual abierto={menuPerfil.estado.abierto} x={menuPerfil.estado.x} y={menuPerfil.estado.y}
                items={menuPerfil.items} onCerrar={menuPerfil.cerrarMenu} alinearDerecha />
            {/* QQ57: Modal de papelera */}
            <ModalPapelera />
        </div>
    );
};

export default PerfilIsland;
