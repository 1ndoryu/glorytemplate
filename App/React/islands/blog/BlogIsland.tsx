/*
 * BlogIsland.tsx — Kamples (183A-109 + 183A-110-A)
 * Listado público de artículos del blog.
 * Grid 4 columnas centrado, filtro por categoría con scroll horizontal.
 */

import { BookOpen } from 'lucide-react';
import { useBlog } from '@app/hooks/useBlog';
import { TarjetaArticulo, obtenerEtiquetaCategoria } from '@app/components/blog/TarjetaArticulo';
import { BotonBase } from '@app/components/ui/BotonBase';
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

    return (
        <div className="blogContenedor">
            <div className="blogCabecera">
                <h1 className="blogTitulo">Blog</h1>

                {/* Filtros de categoría */}
                <div className="blogCategorias">
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
        </div>
    );
};
