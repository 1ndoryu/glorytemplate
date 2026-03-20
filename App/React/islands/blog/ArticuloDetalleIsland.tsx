/*
 * ArticuloDetalleIsland.tsx — Kamples (183A-109 + 193A-20 + 193A-36)
 * Vista de lectura de un artículo individual del blog.
 * Recibe slug como prop desde pages.php (ruta dinámica).
 * [193A-20] Botón de 3 puntos para autor — permite editar el artículo.
 * [193A-36] "Volver al blog" redirige a /?tab=blog para autenticados.
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useArticuloDetalle } from '@app/hooks/useArticuloDetalle';
import { useComentarios } from '@app/hooks/useComentarios';
import { obtenerEtiquetaCategoria } from '@app/components/blog/TarjetaArticulo';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { EnlaceNavegacion } from '@app/components/ui/EnlaceNavegacion';
import { ImgOptimizada } from '@app/components/ui/ImgOptimizada';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Avatar } from '@app/components/ui/Avatar';
import { MenuContextual } from '@app/components/ui';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { eliminarArticulo } from '@app/services/apiArticulos';
import { toast } from '@app/stores/toastStore';
import { useT } from '@app/utils/i18n/useT';
import '@app/styles/componentes/articuloDetalle.css';

interface ArticuloDetalleIslandProps {
    slug?: string;
}

export const ArticuloDetalleIsland: React.FC<ArticuloDetalleIslandProps> = ({ slug: slugProp }) => {
    /* Extraer slug de la URL si no viene como prop */
    const slugDeUrl = typeof window !== 'undefined'
        ? window.location.pathname.split('/').filter(Boolean).pop() ?? ''
        : '';
    const slug = slugProp || slugDeUrl;

    const { articulo, cargando, error, darLike } = useArticuloDetalle(slug);
    const navegar = useNavigationStore(s => s.navegar);
    const autenticado = useAuthStore(s => s.autenticado);
    const usuarioId = useAuthStore(s => s.usuario?.id ?? null);
    const rolUsuario = useAuthStore(s => s.usuario?.rol ?? null);
    const abrirEdicion = useArticuloEditorStore(s => s.abrirEdicion);
    const { t } = useT();

    /* [193A-36] Autenticados vuelven a /?tab=blog (blog es tab del inicio) */
    const hrefBlog = autenticado ? '/?tab=blog' : '/blog';

    /* [193A-20] Menú contextual para el autor */
    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number }>({ abierto: false, x: 0, y: 0 });
    const abrirMenuDetalle = useCallback((e: React.MouseEvent) => {
        setMenu({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);
    const cerrarMenuDetalle = useCallback(() => {
        setMenu(prev => ({ ...prev, abierto: false }));
    }, []);

    /* [183A-109 Fase 5] Comentarios en artículos */
    const [comentariosVisibles, setComentariosVisibles] = useState(false);
    const seccionComentarios = useComentarios({
        tipo: 'articulo',
        targetId: articulo?.id ?? 0,
        cargarAlAbrir: true,
    });

    const manejarToggleComentarios = useCallback(() => {
        setComentariosVisibles(prev => {
            const siguiente = !prev;
            if (siguiente && seccionComentarios.comentarios.length === 0) {
                seccionComentarios.cargar(1);
            }
            return siguiente;
        });
    }, [seccionComentarios]);

    if (cargando) {
        return (
            <div className="articuloDetalleContenedor">
                <div className="articuloDetalleSkeleton">
                    <div className="articuloDetalleSkeletonTitulo" />
                    <div className="articuloDetalleSkeletonMeta" />
                    <div className="articuloDetalleSkeletonPortada" />
                    <div className="articuloDetalleSkeletonContenido">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="articuloDetalleSkeletonLinea" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !articulo) {
        return (
            <div className="articuloDetalleContenedor">
                <EnlaceNavegacion href={hrefBlog} className="articuloDetalleVolver">
                    <ArrowLeft size={16} />
                    {t('blog.volverAlBlog')}
                </EnlaceNavegacion>
                <div className="blogVacio">
                    <p className="blogVacioTexto">{error ?? t('blog.articuloNoEncontrado')}</p>
                </div>
            </div>
        );
    }

    const fechaFormateada = articulo.publicadoEn
        ? new Date(articulo.publicadoEn).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="articuloDetalleContenedor">
            {/* Volver */}
            <EnlaceNavegacion href={hrefBlog} className="articuloDetalleVolver">
                <ArrowLeft size={16} />
                {t('blog.volverAlBlog')}
            </EnlaceNavegacion>

            {/* Cabecera */}
            <div className="articuloDetalleCabecera">
                <span className="articuloDetalleCategoria">
                    {obtenerEtiquetaCategoria(articulo.categoria)}
                </span>
                <h1 className="articuloDetalleTitulo">{articulo.titulo}</h1>
                <div className="articuloDetalleMeta">
                    <div className="articuloDetalleAutor">
                        <Avatar
                            src={articulo.autor?.avatarUrl ?? null}
                            nombre={articulo.autor?.nombreVisible ?? ''}
                            tamano="xs"
                        />
                        <EnlaceNavegacion
                            href={`/perfil/${articulo.autor?.username ?? ''}`}
                            className="articuloDetalleAutorNombre"
                        >
                            {articulo.autor?.nombreVisible ?? articulo.autor?.username ?? ''}
                        </EnlaceNavegacion>
                    </div>
                    {fechaFormateada && (
                        <>
                            <span>·</span>
                            <span>{fechaFormateada}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Portada */}
            {articulo.portadaUrl && (
                <div className="articuloDetallePortada">
                    <ImgOptimizada
                        src={articulo.portadaUrl}
                        alt={articulo.titulo}
                        w={720}
                        h={405}
                    />
                </div>
            )}

            {/* Contenido HTML */}
            <div
                className="articuloDetalleContenido"
                dangerouslySetInnerHTML={{ __html: articulo.contenido }}
            />

            {/* Acciones */}
            <div className="articuloDetalleAcciones">
                <BotonBase
                    variante="ghost"
                    tamano="ninguno"
                    soloIcono
                    className={`tarjetaArticuloAccionBtn ${articulo.liked ? 'tarjetaArticuloAccionLiked' : ''}`}
                    onClick={darLike}
                    aria-label="Me gusta"
                >
                    <Heart size={18} fill={articulo.liked ? 'currentColor' : 'none'} />
                    {articulo.totalLikes > 0 && <span>{articulo.totalLikes}</span>}
                </BotonBase>

                <BotonBase
                    variante="ghost"
                    tamano="ninguno"
                    soloIcono
                    className="tarjetaArticuloAccionBtn"
                    aria-label="Comentarios"
                    onClick={manejarToggleComentarios}
                >
                    <MessageCircle size={18} />
                    {articulo.totalComentarios > 0 && <span>{articulo.totalComentarios}</span>}
                </BotonBase>

                {/* [193A-20+193A-45] Botón de más opciones para autor o admin */}
                {((usuarioId && articulo.autorId === usuarioId) || rolUsuario === 'admin') && (
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        soloIcono
                        className="tarjetaArticuloAccionBtn"
                        aria-label="Más opciones"
                        onClick={abrirMenuDetalle}
                    >
                        <MoreHorizontal size={18} />
                    </BotonBase>
                )}
            </div>

            {/* [193A-20+193A-45] Menú contextual del autor/admin */}
            {((usuarioId && articulo.autorId === usuarioId) || rolUsuario === 'admin') && (
                <MenuContextual
                    abierto={menu.abierto}
                    onCerrar={cerrarMenuDetalle}
                    x={menu.x}
                    y={menu.y}
                    items={[
                        {
                            id: 'editar',
                            etiqueta: t('comun.editar'),
                            onClick: () => {
                                abrirEdicion(articulo.id, {
                                    titulo: articulo.titulo,
                                    contenido: articulo.contenido,
                                    extracto: articulo.extracto ?? '',
                                    categoria: articulo.categoria,
                                    portadaUrl: articulo.portadaUrl ?? '',
                                    adjuntos: [],
                                });
                                cerrarMenuDetalle();
                            },
                        },
                        {
                            id: 'copiar',
                            etiqueta: t('comun.copiarEnlace'),
                            onClick: () => {
                                navigator.clipboard.writeText(`${window.location.origin}/blog/${articulo.slug}/`);
                                cerrarMenuDetalle();
                            },
                        },
                        /* [193A-45] Eliminar — autor o admin */
                        {
                            id: 'eliminar',
                            etiqueta: t('comun.eliminar'),
                            peligro: true,
                            onClick: async () => {
                                if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
                                const res = await eliminarArticulo(articulo.id);
                                if (res.ok) {
                                    toast.exito('Artículo eliminado');
                                    navegar(autenticado ? '/?tab=blog' : '/blog');
                                } else {
                                    toast.error('No se pudo eliminar el artículo');
                                }
                                cerrarMenuDetalle();
                            },
                        },
                    ]}
                />
            )}

            {/* [183A-109 Fase 5] Sección de comentarios */}
            {comentariosVisibles && (
                <ListaComentarios
                    comentarios={seccionComentarios.comentarios}
                    cargando={seccionComentarios.cargando}
                    onEnviar={seccionComentarios.enviar}
                    onEnviarMultimedia={seccionComentarios.enviarMultimedia}
                    onClickAutor={(u) => navegar(`/perfil/${u}/`)}
                    onCargarMas={seccionComentarios.cargarMas}
                    hayMasPaginas={seccionComentarios.hayMas}
                    onEditar={seccionComentarios.editar}
                    onEliminar={seccionComentarios.eliminar}
                    onReportar={seccionComentarios.reportar}
                    onToggleLike={seccionComentarios.toggleLike}
                    onCargarRespuestas={seccionComentarios.cargarRespuestas}
                    editandoId={seccionComentarios.editandoId}
                    setEditandoId={seccionComentarios.setEditandoId}
                    respondendoAId={seccionComentarios.respondendoAId}
                    setRespondendoAId={seccionComentarios.setRespondendoAId}
                />
            )}
        </div>
    );
};
