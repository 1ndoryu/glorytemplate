/*
 * Isla: ComunidadIsland — Kamples
 * Feed de posts sociales. Lógica extraída a useComunidadIsland (SRP).
 * Los posts se renderizan con TarjetaPublicacion — mismo componente que PerfilIsland.
 * Extras de isla: botón seguir (+) sobre el avatar, CardPerfil, sección comentarios.
 */

import { useState } from 'react';
import { Users, TrendingUp, Clock, Plus } from 'lucide-react';
import { TarjetaPublicacion } from '@app/components/social/TarjetaPublicacion';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { SeccionPublicar } from '@app/components/social/SeccionPublicar';
import { CardPerfil } from '@app/components/social/CardPerfil';
import { BotonBase } from '@app/components/ui/BotonBase';
import { SkeletonTarjetaPublicacion } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useComentarios } from '@app/hooks/useComentarios';
import { useComunidadIsland, type FiltroComunidad } from '@app/hooks/useComunidadIsland';
import type { UsuarioResumen } from '@app/types/usuario';
import '../../styles/componentes/comunidad.css';

const TABS_COMUNIDAD = [{ id: 'comunidad', etiqueta: 'Comunidad' }];

/* Sub-componente: comentarios por post */
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

const filtros: { valor: FiltroComunidad; icono: typeof Users; label: string }[] = [
    { valor: 'todos', icono: Clock, label: 'Todos' },
    { valor: 'siguiendo', icono: Users, label: 'Siguiendo' },
    { valor: 'populares', icono: TrendingUp, label: 'Populares' },
];

const ComunidadBase = (): JSX.Element => {
    const {
        publicaciones, filtro, setFiltro, cargando, cargandoMas, hayMas,
        comentariosAbiertos, navegar, usuario,
        menuSample, menuPublicacion, sentinelRef,
        recargarFeed, manejarLikePost, manejarLikeSample, manejarRepost, alternarComentarios,
    } = useComunidadIsland();

    useTabsIsla('ComunidadIsland', TABS_COMUNIDAD, 'comunidad');

    /* Card de perfil estilo Threads — específica de ComunidadIsland */
    const [cardPerfilUsername, setCardPerfilUsername] = useState<string | null>(null);

    const abrirCardPerfil = (e: React.MouseEvent, autor: UsuarioResumen) => {
        e.stopPropagation();
        setCardPerfilUsername(autor.username);
    };

    return (
        <div className="comunidadIsland" id="comunidadIsland">
            <SeccionPublicar alPublicar={recargarFeed} placeholder="¿Qué estás creando?" />

            <div className="comunidadBarraSuperior">
                <div className="comunidadFiltros">
                    {filtros.map(({ valor, icono: Icono, label }) => (
                        <BotonBase
                            variante="ghost"
                            key={valor}
                            className={`comunidadFiltroBtn ${filtro === valor ? 'comunidadFiltroBtnActivo' : ''}`}
                            onClick={() => setFiltro(valor)}
                            type="button"
                        >
                            <Icono size={14} /> {label}
                        </BotonBase>
                    ))}
                </div>
            </div>

            <div className="comunidadFeed">
                {cargando ? (
                    <>
                        <SkeletonTarjetaPublicacion />
                        <SkeletonTarjetaPublicacion />
                        <SkeletonTarjetaPublicacion />
                    </>
                ) : publicaciones.length === 0 ? (
                    <div className="comunidadVacio">No hay publicaciones aún</div>
                ) : (
                    publicaciones.map((post) => (
                        <TarjetaPublicacion
                            key={post.id}
                            publicacion={post}
                            onLike={(id, reaccion) => manejarLikePost(id, reaccion)}
                            onComentar={(id) => alternarComentarios(id)}
                            onRepost={(id) => manejarRepost(id)}
                            onClickAutor={(username) => navegar(`/perfil/${username}/`)}
                            onClickFecha={(pubId) => navegar(`/publicacion/${pubId}/`)}
                            onMenu={(e, pub) => menuPublicacion.abrirMenu(e, pub)}
                            onLikeSample={manejarLikeSample}
                            onMenuSample={menuSample.abrirMenu}
                            onClickCreadorSample={(u) => navegar(`/perfil/${u}/`)}
                            mostrarCeroConteo
                            avatarExtra={
                                String(post.autor.id) !== String(usuario?.id) ? (
                                    <BotonBase
                                        variante="ghost"
                                        className="comunidadBtnSeguirIcono"
                                        onClick={(e) => abrirCardPerfil(e, post.autor)}
                                        aria-label="Ver perfil y seguir"
                                    >
                                        <Plus size={11} strokeWidth={2.5} />
                                    </BotonBase>
                                ) : undefined
                            }
                        >
                            {comentariosAbiertos.has(post.id) && (
                                <SeccionComentariosPost postId={post.id} navegar={navegar} />
                            )}
                        </TarjetaPublicacion>
                    ))
                )}

                {/* Sentinel para IntersectionObserver — scroll infinito */}
                {!cargando && hayMas && (
                    <div ref={sentinelRef} className="comunidadSentinel" aria-hidden="true" />
                )}
                {cargandoMas && (
                    <>
                        <SkeletonTarjetaPublicacion />
                        <SkeletonTarjetaPublicacion />
                    </>
                )}
            </div>

            <MenuContextual
                abierto={menuPublicacion.estado.abierto}
                onCerrar={menuPublicacion.cerrarMenu}
                items={menuPublicacion.items}
                x={menuPublicacion.estado.x}
                y={menuPublicacion.estado.y}
            />
            <MenuContextual
                abierto={menuSample.estado.abierto}
                onCerrar={menuSample.cerrarMenu}
                items={menuSample.items}
                x={menuSample.estado.x}
                y={menuSample.estado.y}
            />

            {/* Card de perfil estilo Threads */}
            {cardPerfilUsername && (
                <CardPerfil
                    username={cardPerfilUsername}
                    onCerrar={() => setCardPerfilUsername(null)}
                    onNavegar={navegar}
                />
            )}
        </div>
    );
};

export const ComunidadIsland = conAutenticacion(ComunidadBase);
export default ComunidadIsland;
