/**
 * ContentRenderer - Componente para renderizar contenido de WordPress en React
 *
 * Simula el comportamiento de gloryContentRender pero en React.
 * Soporta renderizado de posts, listas de posts, y contenido HTML.
 *
 * Uso:
 *   <ContentRenderer content={post} layout="card" />
 *   <ContentRenderer content={posts} layout="grid" columns={3} />
 */

import {Calendar, Clock, User, ArrowRight, Tag} from 'lucide-react';

// --- TIPOS ---

// Post formateado desde PHP (ReactContentProvider::formatPost)
export interface WordPressPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    dateFormatted: string;
    author: string;
    featuredImage?: {
        id: number;
        url: string;
        alt: string;
    } | null;
    permalink: string;
    categories: Array<{id: number; name: string; slug: string}>;
    tags: Array<{id: number; name: string; slug: string}>;
    meta: Record<string, unknown>;
    readTime: string;
}

// Props del componente
interface ContentRendererProps {
    // Contenido a renderizar (un post o array de posts)
    content: WordPressPost | WordPressPost[] | null | undefined;
    // Layout de renderizado
    layout?: 'card' | 'grid' | 'list' | 'featured' | 'minimal';
    // Columnas para layout grid
    columns?: 1 | 2 | 3 | 4;
    // Mostrar imagen destacada
    showImage?: boolean;
    // Mostrar extracto
    showExcerpt?: boolean;
    // Mostrar fecha
    showDate?: boolean;
    // Mostrar autor
    showAuthor?: boolean;
    // Mostrar tiempo de lectura
    showReadTime?: boolean;
    // Mostrar categorias
    showCategories?: boolean;
    // Texto del enlace "leer mas"
    readMoreText?: string;
    // Clases CSS adicionales
    className?: string;
    // Callback cuando se hace clic en un post
    onPostClick?: (post: WordPressPost) => void;
    // Componente fallback si no hay contenido
    emptyMessage?: string;
}

// --- COMPONENTE CARD (individual) ---
interface PostCardProps {
    post: WordPressPost;
    layout: 'card' | 'featured' | 'minimal' | 'list';
    showImage: boolean;
    showExcerpt: boolean;
    showDate: boolean;
    showAuthor: boolean;
    showReadTime: boolean;
    showCategories: boolean;
    readMoreText: string;
    onPostClick?: (post: WordPressPost) => void;
}

function PostCard({post, layout, showImage, showExcerpt, showDate, showAuthor, showReadTime, showCategories, readMoreText, onPostClick}: PostCardProps): JSX.Element {
    const handleClick = () => {
        if (onPostClick) {
            onPostClick(post);
        }
    };

    const isFeatured = layout === 'featured';
    const isMinimal = layout === 'minimal';
    const isList = layout === 'list';

    // Clases base segun layout
    const containerClasses = `
        group relative flex bg-surface border border-primary rounded-xl overflow-hidden
        transition-all hover:border-[var(--color-accent-primary)] hover:shadow-lg
        ${isFeatured ? 'flex-col md:flex-row' : ''}
        ${isList ? 'flex-row items-center gap-4 p-4' : 'flex-col'}
        ${isMinimal ? 'border-0 shadow-none hover:shadow-none p-0' : ''}
    `;

    return (
        <article id={`post-${post.id}`} className={containerClasses} onClick={handleClick} role={onPostClick ? 'button' : undefined} tabIndex={onPostClick ? 0 : undefined}>
            {/* Imagen destacada */}
            {showImage && post.featuredImage && !isMinimal && (
                <div
                    className={`
                    relative overflow-hidden bg-secondary
                    ${isFeatured ? 'md:w-2/5' : ''}
                    ${isList ? 'w-24 h-24 flex-shrink-0 rounded-lg' : 'aspect-video'}
                `}>
                    <img src={post.featuredImage.url} alt={post.featuredImage.alt} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                </div>
            )}

            {/* Placeholder si no hay imagen */}
            {showImage && !post.featuredImage && !isMinimal && !isList && (
                <div className="aspect-video bg-secondary flex items-center justify-center">
                    <Tag className="w-8 h-8 text-muted opacity-30" />
                </div>
            )}

            {/* Contenido */}
            <div
                className={`
                flex flex-col flex-1
                ${!isMinimal && !isList ? 'p-5' : ''}
                ${isFeatured ? 'md:p-6' : ''}
            `}>
                {/* Meta: fecha, autor, tiempo de lectura */}
                {(showDate || showAuthor || showReadTime) && (
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted">
                        {showDate && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {post.dateFormatted}
                            </span>
                        )}
                        {showAuthor && (
                            <span className="inline-flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.author}
                            </span>
                        )}
                        {showReadTime && (
                            <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.readTime}
                            </span>
                        )}
                    </div>
                )}

                {/* Categorias */}
                {showCategories && post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {post.categories.map(cat => (
                            <span key={cat.id} className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]">
                                {cat.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Titulo */}
                <h3
                    className={`
                    font-semibold text-primary group-hover:text-[var(--color-accent-primary)] transition-colors
                    ${isFeatured ? 'text-xl md:text-2xl mb-3' : ''}
                    ${isMinimal ? 'text-base mb-1' : 'text-lg mb-2'}
                `}>
                    {post.title}
                </h3>

                {/* Extracto */}
                {showExcerpt && post.excerpt && !isMinimal && <p className="text-muted text-sm leading-relaxed flex-1 line-clamp-3">{post.excerpt.replace(/<[^>]*>/g, '')}</p>}

                {/* Enlace "Leer mas" */}
                {!isMinimal && (
                    <div className="mt-4">
                        <a
                            href={post.permalink}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-primary)] hover:underline group/link"
                            onClick={e => {
                                if (onPostClick) {
                                    e.preventDefault();
                                    onPostClick(post);
                                }
                            }}>
                            {readMoreText}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                        </a>
                    </div>
                )}
            </div>
        </article>
    );
}

// --- COMPONENTE PRINCIPAL ---
export function ContentRenderer({content, layout = 'card', columns = 3, showImage = true, showExcerpt = true, showDate = true, showAuthor = false, showReadTime = true, showCategories = true, readMoreText = 'Leer articulo', className = '', onPostClick, emptyMessage = 'No hay contenido disponible.'}: ContentRendererProps): JSX.Element {
    // Manejar contenido vacio
    if (!content || (Array.isArray(content) && content.length === 0)) {
        return (
            <div className={`text-center py-12 text-muted ${className}`}>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    // Convertir a array si es un solo post
    const posts = Array.isArray(content) ? content : [content];

    // Props comunes para las cards
    const cardProps = {
        layout: layout === 'grid' ? ('card' as const) : layout === 'list' ? ('list' as const) : layout,
        showImage,
        showExcerpt,
        showDate,
        showAuthor,
        showReadTime,
        showCategories,
        readMoreText,
        onPostClick
    };

    // Layout grid
    if (layout === 'grid') {
        const gridCols = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        };

        return (
            <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
                {posts.map(post => (
                    <PostCard key={post.id} post={post} {...cardProps} />
                ))}
            </div>
        );
    }

    // Layout list
    if (layout === 'list') {
        return (
            <div className={`flex flex-col gap-4 ${className}`}>
                {posts.map(post => (
                    <PostCard key={post.id} post={post} {...cardProps} />
                ))}
            </div>
        );
    }

    // Layout featured (primer post grande, resto en grid)
    if (layout === 'featured' && posts.length > 1) {
        const [featured, ...rest] = posts;
        return (
            <div className={`space-y-8 ${className}`}>
                <PostCard post={featured} {...cardProps} layout="featured" />
                {rest.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rest.map(post => (
                            <PostCard key={post.id} post={post} {...cardProps} layout="card" />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Layout card (default) o minimal
    return (
        <div className={`space-y-6 ${className}`}>
            {posts.map(post => (
                <PostCard key={post.id} post={post} {...cardProps} />
            ))}
        </div>
    );
}

// Re-export del tipo de props para uso externo
export type {ContentRendererProps};
