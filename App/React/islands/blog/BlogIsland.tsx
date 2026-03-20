/*
 * BlogIsland.tsx — Kamples (183A-109 + 183A-110-A + 183A-110-B + 183A-110-E + 193A-20)
 * Listado público de artículos del blog.
 * Grid 4 columnas centrado, filtro por categoría con scroll horizontal.
 * [183A-110-B] Categorías arrastrables con mouse y touch (Capacitor).
 * [183A-110-E] Modo "Mis artículos" con filtro por estado de moderación.
 * [193A-20] Menú contextual incluye "Editar" si el usuario es el autor.
 */

import { useState, useCallback } from 'react';
import { BookOpen, User } from 'lucide-react';
import { useBlog } from '@app/hooks/useBlog';
import { TarjetaArticulo, obtenerEtiquetaCategoria } from '@app/components/blog/TarjetaArticulo';
import { BotonBase } from '@app/components/ui/BotonBase';
import { MenuContextual } from '@app/components/ui';
import type { MenuItemDef } from '@app/components/ui';
import { useNavigationStore } from '@/core/router';
import { toast } from '@app/stores/toastStore';
import { useArrastrarScroll } from '@app/hooks/useArrastrarScroll';
import { useAuthStore } from '@app/stores/authStore';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { eliminarArticulo } from '@app/services/apiArticulos';
import type { CategoriaArticulo } from '@app/types';
import { useT } from '@app/utils/i18n/useT';
import '@app/styles/componentes/blog.css';

/* [183A-109] Grupos de categorías para navegación rápida */
const gruposCategorias: { grupo: string; categorias: CategoriaArticulo[] }[] = [
    {
        grupo: 'Tips',
        categorias: [
            'inspiracion', 'mastering', 'mezcla', 'promocion-musical',
            'teoria-musical', 'grabacion', 'sampling', 'diseno-sonoro', 'herramientas',
        ],
    },
    {
        grupo: 'DAWs',
        categorias: [
            'ableton-live', 'bitwig-studio', 'cubase', 'fl-studio',
            'garageband', 'logic-pro', 'pro-tools', 'studio-one',
        ],
    },
    {
        grupo: 'Gratis',
        categorias: [
            'drops-gratis', 'midi-gratis', 'plugins-gratis',
            'presets-gratis', 'proyectos-gratis', 'sonidos-gratis',
        ],
    },
    {
        grupo: 'Historias',
        categorias: ['entrevistas', 'destacados', 'noticias'],
    },
];

/* Etiquetas de estado para la sub-fila de Mis artículos */
const ESTADOS_MIS_ARTICULOS: { claveI18n: string; valor: 'aprobado' | 'pendiente' | 'rechazado' | 'borrador' }[] = [
    { claveI18n: 'blog.publicados', valor: 'aprobado' },
    { claveI18n: 'blog.pendiente', valor: 'pendiente' },
    { claveI18n: 'blog.rechazados', valor: 'rechazado' },
    { claveI18n: 'blog.borradores', valor: 'borrador' },
];

export const BlogIsland: React.FC = () => {
    const { t } = useT();
    const {
        articulos, cargando, hayMas, categoria, cambiarCategoria, cargarMas, darLike,
        quitarArticulo, misArticulosActivo, activarMisArticulos, cambiarEstadoFiltro, borradorLocal,
    } = useBlog();
    const navegar = useNavigationStore(s => s.navegar);
    const autenticado = useAuthStore(s => s.autenticado);
    const usuarioId = useAuthStore(s => s.usuario?.id ?? null);
    const rolUsuario = useAuthStore(s => s.usuario?.rol ?? null);
    const abrirEdicion = useArticuloEditorStore(s => s.abrirEdicion);

    /* [183A-110-E] Estado local para la sub-fila de mis artículos */
    const [estadoMisArticulos, setEstadoMisArticulos] = useState<'aprobado' | 'pendiente' | 'rechazado' | 'borrador'>('aprobado');

    const handleMisArticulos = useCallback(() => {
        activarMisArticulos();
        setEstadoMisArticulos('aprobado');
    }, [activarMisArticulos]);

    const handleCambiarEstado = useCallback((valor: 'aprobado' | 'pendiente' | 'rechazado' | 'borrador') => {
        setEstadoMisArticulos(valor);
        if (valor !== 'borrador') {
            cambiarEstadoFiltro(valor);
        } else {
            /* Borradores son solo locales — cargamos con aprobado para no más items del servidor */
            cambiarEstadoFiltro(undefined);
        }
    }, [cambiarEstadoFiltro]);

    /* [183A-110-B] Drag-to-scroll para categorías (mouse + touch Capacitor) */
    const categoriasRef = useArrastrarScroll<HTMLDivElement>();

    /* [183A-109 Fase 5] Menú contextual de 3 puntos en tarjetas */
    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number; articuloId: number | null }>({
        abierto: false, x: 0, y: 0, articuloId: null,
    });

    const abrirMenu = useCallback((id: number, e: React.MouseEvent) => {
        setMenu({ abierto: true, x: e.clientX, y: e.clientY, articuloId: id });
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, abierto: false, articuloId: null }));
    }, []);

    const articuloMenu = menu.articuloId ? articulos.find(a => a.id === menu.articuloId) : null;

    const itemsMenu: MenuItemDef[] = articuloMenu ? [
        /* [193A-20] Editar — solo si el usuario autenticado es el autor */
        ...(usuarioId && articuloMenu.autor?.id === usuarioId ? [{
            id: 'editar',
            etiqueta: t('comun.editar'),
            onClick: () => {
                abrirEdicion(articuloMenu.id, {
                    titulo: articuloMenu.titulo,
                    contenido: '',  /* El resumen no incluye contenido completo — se abrirá vacío */
                    extracto: articuloMenu.extracto ?? '',
                    categoria: articuloMenu.categoria,
                    portadaUrl: articuloMenu.portadaUrl,
                    adjuntos: [],
                });
                cerrarMenu();
            },
        }] : []),
        {
            id: 'compartir',
            etiqueta: t('comun.copiarEnlace'),
            onClick: () => {
                navigator.clipboard.writeText(`${window.location.origin}/blog/${articuloMenu.slug}/`);
                toast.exito('Enlace copiado');
                cerrarMenu();
            },
        },
        {
            id: 'ver',
            etiqueta: t('menu.verArticulo'),
            onClick: () => {
                navegar(`/blog/${articuloMenu.slug}/`);
                cerrarMenu();
            },
        },
        /* [193A-45] Eliminar — autor o admin */
        ...((usuarioId && articuloMenu.autor?.id === usuarioId) || rolUsuario === 'admin' ? [{
            id: 'eliminar',
            etiqueta: t('comun.eliminar'),
            peligro: true,
            onClick: async () => {
                if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
                const res = await eliminarArticulo(articuloMenu.id);
                if (res.ok) {
                    toast.exito('Artículo eliminado');
                    quitarArticulo(articuloMenu.id);
                } else {
                    toast.error('No se pudo eliminar el artículo');
                }
                cerrarMenu();
            },
        }] : []),
    ] : [];

    return (
        <div className="blogContenedor">
            <div className="blogCabecera">
                {/* [183A-110-E] blogTitulo ocultado por tarea */}

                {/* [183A-110-B] Filtros con drag-to-scroll */}
                <div className="blogCategorias" ref={categoriasRef}>
                    <BotonBase
                        variante={!categoria && !misArticulosActivo ? 'primario' : 'ghost'}
                        tamano="sm"
                        className={`blogCategoriaBtn ${!categoria && !misArticulosActivo ? 'blogCategoriaBtnActivo' : ''}`}
                        onClick={() => cambiarCategoria(undefined)}
                    >
                        {t('comun.todos')}
                    </BotonBase>
                    {gruposCategorias.map(g => (
                        <div key={g.grupo} className="blogCategoriaGrupo">
                            {g.categorias.map(cat => (
                                <BotonBase
                                    key={cat}
                                    variante={categoria === cat ? 'primario' : 'ghost'}
                                    tamano="sm"
                                    className={`blogCategoriaBtn ${categoria === cat ? 'blogCategoriaBtnActivo' : ''}`}
                                    onClick={() => cambiarCategoria(cat)}
                                >
                                    {obtenerEtiquetaCategoria(cat)}
                                </BotonBase>
                            ))}
                        </div>
                    ))}
                    {/* [183A-110-E] Botón "Mis artículos" — solo para usuarios autenticados */}
                    {autenticado && (
                        <BotonBase
                            variante={misArticulosActivo ? 'primario' : 'ghost'}
                            tamano="sm"
                            className={`blogCategoriaBtn blogCategoriaBtnMios ${misArticulosActivo ? 'blogCategoriaBtnActivo' : ''}`}
                            onClick={handleMisArticulos}
                        >
                            <User size={13} />
                            {t('blog.misArticulos')}
                        </BotonBase>
                    )}
                </div>

                {/* [183A-110-E] Sub-fila de estado cuando Mis artículos está activo */}
                {misArticulosActivo && (
                    <div className="blogSubCategorias">
                        {ESTADOS_MIS_ARTICULOS.map(({ claveI18n, valor }) => (
                            <BotonBase
                                key={valor}
                                variante={estadoMisArticulos === valor ? 'primario' : 'ghost'}
                                tamano="sm"
                                className={`blogCategoriaBtn blogSubCategoriaBtn ${estadoMisArticulos === valor ? 'blogCategoriaBtnActivo' : ''}`}
                                onClick={() => handleCambiarEstado(valor)}
                            >
                                {t(claveI18n)}
                            </BotonBase>
                        ))}
                    </div>
                )}
            </div>

            {/* [183A-110-E] Vista de borradores — muestra solo borrador local */}
            {misArticulosActivo && estadoMisArticulos === 'borrador' ? (
                borradorLocal ? (
                    <div className="blogBorradoresContenedor">
                        <div className="blogBorradorCard">
                            <span className="blogBorradorBadge">{t('blog.borradorLocal')}</span>
                            <p className="blogBorradorTitulo">{(borradorLocal as { titulo?: string }).titulo || t('blog.sinTitulo')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="blogVacio">
                        <BookOpen size={48} />
                        <p className="blogVacioTexto">{t('blog.sinBorradores')}</p>
                    </div>
                )
            ) : cargando && articulos.length === 0 ? (
                <div className="blogSkeleton">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="blogSkeletonItem" />
                    ))}
                </div>
            ) : articulos.length === 0 ? (
                <div className="blogVacio">
                    <BookOpen size={48} />
                    <p className="blogVacioTexto">
                        {misArticulosActivo
                            ? 'No tienes artículos en este estado todavía.'
                            : categoria
                                ? `No hay artículos en ${obtenerEtiquetaCategoria(categoria)} todavía.`
                                : 'No hay artículos publicados todavía.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="blogGrid">
                        {articulos.map(articulo => (
                            <TarjetaArticulo
                                key={articulo.id}
                                articulo={articulo}
                                onLike={darLike}
                                onMenu={abrirMenu}
                            />
                        ))}
                    </div>

                    {hayMas && (
                        <div className="blogCargarMas">
                            <BotonBase
                                variante="secundario"
                                onClick={cargarMas}
                                cargando={cargando}
                            >
                                Cargar más
                            </BotonBase>
                        </div>
                    )}
                </>
            )}

            {/* [183A-109 Fase 5] Menú contextual para tarjetas de artículo */}
            <MenuContextual
                abierto={menu.abierto}
                onCerrar={cerrarMenu}
                items={itemsMenu}
                x={menu.x}
                y={menu.y}
                alinearDerecha
            />
        </div>
    );
};
