/*
 * Isla: ComunidadIsland — Kamples
 * Feed de posts sociales. Lógica extraída a useComunidadIsland (SRP).
 */

import { Users, TrendingUp, Clock, MoreHorizontal } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { BadgeModeracion } from '@app/components/ui/BadgeModeracion';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { SeccionPublicar } from '@app/components/social/SeccionPublicar';
import BarraAccionesPost from '@app/components/social/BarraAccionesPost';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useComentarios } from '@app/hooks/useComentarios';
import { useComunidadIsland, type FiltroComunidad } from '@app/hooks/useComunidadIsland';
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

const formatearTiempoRelativo = (fecha: string): string => {
    if (!fecha) return '';
    const timestamp = new Date(fecha).getTime();
    if (isNaN(timestamp)) return '';
    const diff = Date.now() - timestamp;
    const minutos = Math.floor(diff / 60000);
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

const filtros: { valor: FiltroComunidad; icono: typeof Users; label: string }[] = [
    { valor: 'todos', icono: Clock, label: 'Todos' },
    { valor: 'siguiendo', icono: Users, label: 'Siguiendo' },
    { valor: 'populares', icono: TrendingUp, label: 'Populares' },
];

const ComunidadBase = (): JSX.Element => {
    const {
        publicaciones, filtro, setFiltro, cargando,
        comentariosAbiertos, navegar, usuario,
        menuSample, menuPost, abrirMenuPost, cerrarMenuPost, itemsMenuPost,
        recargarFeed, manejarLikePost, manejarRepost, alternarComentarios,
    } = useComunidadIsland();

    useTabsIsla('ComunidadIsland', TABS_COMUNIDAD, 'comunidad');

    return (
        <div className="comunidadIsland" id="comunidadIsland">
            <SeccionPublicar alPublicar={recargarFeed} placeholder="¿Qué estás creando?" />

            <div className="comunidadBarraSuperior">
                <div className="comunidadFiltros">
                    {filtros.map(({ valor, icono: Icono, label }) => (
                        <button key={valor} className={`comunidadFiltroBtn ${filtro === valor ? 'comunidadFiltroBtnActivo' : ''}`}
                            onClick={() => setFiltro(valor)} type="button">
                            <Icono size={14} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="comunidadFeed">
                {cargando ? (
                    <div className="comunidadCargando">Cargando publicaciones...</div>
                ) : publicaciones.length === 0 ? (
                    <div className="comunidadVacio">No hay publicaciones aún</div>
                ) : (
                    publicaciones.map((post) => (
                        <article key={post.id} className="comunidadPost">
                            <div className="comunidadPostHeader">
                                <EnlaceCreador username={post.autor.username} nombreVisible={post.autor.nombreVisible}
                                    avatarUrl={post.autor.avatarUrl} tamanoAvatar="sm" mostrarUsername
                                    verificado={post.autor.verificado} meta={formatearTiempoRelativo(post.creadoAt)} />
                                {(String(post.autor.id) === String(usuario?.id) || usuario?.rol === 'admin') && post.moderacionEstado && (
                                    <BadgeModeracion moderacionEstado={post.moderacionEstado} />
                                )}
                                <button className="comunidadPostMenuBtn" onClick={(e) => abrirMenuPost(e, post)} type="button" aria-label="Más opciones">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>

                            <p className="comunidadPostTexto">{post.contenido}</p>

                            {post.imagenes.length > 0 && (
                                <div className={`comunidadPostImagenes comunidadPostImagenes${post.imagenes.length}`}>
                                    {post.imagenes.map((img, i) => (
                                        <img key={i} src={img} alt={`Imagen ${i + 1}`} className="comunidadPostImg" loading="lazy" />
                                    ))}
                                </div>
                            )}

                            {post.samplesAdjuntos.length > 0 && (
                                <div className="comunidadPostSamples">
                                    {post.samplesAdjuntos.map((sample) => (
                                        <TarjetaSample key={sample.id} sample={sample}
                                            onClickCreador={(u) => navegar(`/perfil/${u}/`)} onMenu={menuSample.abrirMenu} />
                                    ))}
                                </div>
                            )}

                            <BarraAccionesPost publicacion={post}
                                onLike={(id, reaccion) => manejarLikePost(id, reaccion)}
                                onQuitarLike={(id) => manejarLikePost(id)}
                                onComentar={(id) => alternarComentarios(id)}
                                onRepost={(id) => manejarRepost(id)} mostrarCeroConteo />

                            {comentariosAbiertos.has(post.id) && (
                                <SeccionComentariosPost postId={post.id} navegar={navegar} />
                            )}
                        </article>
                    ))
                )}
            </div>

            <MenuContextual abierto={menuPost.abierto} onCerrar={cerrarMenuPost} items={itemsMenuPost} x={menuPost.x} y={menuPost.y} />
            <MenuContextual abierto={menuSample.estado.abierto} onCerrar={menuSample.cerrarMenu} items={menuSample.items}
                x={menuSample.estado.x} y={menuSample.estado.y} />
        </div>
    );
};

export const ComunidadIsland = conAutenticacion(ComunidadBase);
export default ComunidadIsland;
