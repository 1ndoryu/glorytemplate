/*
 * BlogIsland.tsx — Kamples (183A-109 + 183A-110-A + 183A-110-B)
 * Listado público de artículos del blog.
 * Grid 4 columnas centrado, filtro por categoría con scroll horizontal.
 * [183A-110-B] Categorías arrastrables con mouse y touch (Capacitor).
 */

import { useState, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { useBlog } from '@app/hooks/useBlog';
import { TarjetaArticulo, obtenerEtiquetaCategoria } from '@app/components/blog/TarjetaArticulo';
import { BotonBase } from '@app/components/ui/BotonBase';
import { MenuContextual } from '@app/components/ui';
import type { MenuItemDef } from '@app/components/ui';
import { useNavigationStore } from '@/core/router';
import { toast } from '@app/stores/toastStore';
import { useArrastrarScroll } from '@app/hooks/useArrastrarScroll';
import type { CategoriaArticulo } from '@app/types';
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

export const BlogIsland: React.FC = () => {
    const { articulos, cargando, hayMas, categoria, cambiarCategoria, cargarMas, darLike } = useBlog();
    const navegar = useNavigationStore(s => s.navegar);

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
        {
            id: 'compartir',
            etiqueta: 'Copiar enlace',
            onClick: () => {
                navigator.clipboard.writeText(`${window.location.origin}/blog/${articuloMenu.slug}/`);
                toast.exito('Enlace copiado');
                cerrarMenu();
            },
        },
        {
            id: 'ver',
            etiqueta: 'Ver artículo',
            onClick: () => {
                navegar(`/blog/${articuloMenu.slug}/`);
                cerrarMenu();
            },
        },
    ] : [];

    return (
        <div className="blogContenedor">
            <div className="blogCabecera">
                <h1 className="blogTitulo">Blog</h1>

                {/* [183A-110-B] Filtros con drag-to-scroll */}
                <div className="blogCategorias" ref={categoriasRef}>
                    <BotonBase
                        variante={!categoria ? 'primario' : 'ghost'}
                        tamano="sm"
                        className={`blogCategoriaBtn ${!categoria ? 'blogCategoriaBtnActivo' : ''}`}
                        onClick={() => cambiarCategoria(undefined)}
                    >
                        Todos
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
                </div>
            </div>

            {/* Contenido */}
            {cargando && articulos.length === 0 ? (
                <div className="blogSkeleton">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="blogSkeletonItem" />
                    ))}
                </div>
            ) : articulos.length === 0 ? (
                <div className="blogVacio">
                    <BookOpen size={48} />
                    <p className="blogVacioTexto">
                        {categoria
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
