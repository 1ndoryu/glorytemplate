/**
 * SinglePostIsland - Pagina de Post Individual
 *
 * Renderiza un post de blog completo.
 * Obtiene el post desde window.__GLORY_CONTENT__.blogPosts usando el slug.
 */

import {ArrowLeft, Calendar, Clock, User, Share2, ExternalLink} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {InternalLinks} from '../components/sections';
import {Button} from '../components/ui';
import type {WordPressPost} from '../components/content';
import {useContent} from '../hooks/useContent';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../hooks/useSiteConfig';

// Props del componente
interface SinglePostIslandProps {
    slug: string;
}

// Enlaces internos
const postInternalLinks = [
    {text: 'Ver más artículos', href: '/blog'},
    {text: 'Probar una demo', href: '/demos'},
    {text: 'Ver servicios', href: '/servicios'},
    {text: 'Contactar', href: '/contacto'}
];

// Tipo para fuentes
interface Source {
    title: string;
    url: string;
    description?: string;
}

// --- COMPONENTE PRINCIPAL ---
export function SinglePostIsland({slug}: SinglePostIslandProps): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();

    // Obtener todos los posts y buscar por slug
    const allPosts = useContent<WordPressPost[]>('blogPosts', []);
    const post = allPosts.find(p => p.slug === slug);

    // Si no se encuentra el post
    if (!post) {
        return (
            <PageLayout headerCtaText="Reservar llamada" mainClassName="flex-1 flex flex-col justify-center items-center gap-8 px-6 py-12">
                <div id="post-not-found" className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-primary mb-4">Artículo no encontrado</h1>
                    <p className="text-muted mb-6">El artículo que buscas no existe o ha sido eliminado.</p>
                    <Button href="/blog" variant="primary" icon={ArrowLeft}>
                        Volver al blog
                    </Button>
                </div>
            </PageLayout>
        );
    }

    // Funcion para compartir
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: window.location.href
                });
            } catch {
                // Usuario cancelo o error
            }
        } else {
            // Fallback: copiar URL al portapapeles
            await navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    // Extraer fuentes desde meta
    const sources = (post.meta?.sources as Source[]) || [];

    return (
        <PageLayout headerCtaText="Reservar llamada" mainClassName="flex-1 flex flex-col justify-start gap-12 px-6 py-12 md:py-16">
            {/* HEADER DEL POST */}
            <header id="post-header" className="single-post-container">
                {/* Boton volver */}
                <div className="mb-8">
                    <Button href="/blog" variant="ghost" icon={ArrowLeft}>
                        Volver al blog
                    </Button>
                </div>

                {/* Titulo */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary leading-tight mb-6">{post.title}</h1>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-8">
                    {/* Autor */}
                    <span className="inline-flex items-center gap-2 font-medium text-primary">
                        <User className="w-4 h-4" />
                        {post.author || 'Guillermo Garcia'}
                    </span>

                    {/* Separator */}
                    <span className="hidden md:inline text-muted/30">•</span>

                    {/* Fecha */}
                    {post.dateFormatted && (
                        <span className="inline-flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {post.dateFormatted}
                        </span>
                    )}

                    {/* Lectura */}
                    {post.readTime && (
                        <>
                            <span className="hidden md:inline text-muted/30">•</span>
                            <span className="inline-flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {post.readTime} de lectura
                            </span>
                        </>
                    )}

                    <button onClick={handleShare} className="inline-flex items-center gap-2 text-[var(--color-accent-primary)] hover:underline ml-auto">
                        <Share2 className="w-4 h-4" />
                        Compartir
                    </button>
                </div>

                {/* Imagen destacada - loading='eager' porque es hero del post */}
                {post.featuredImage && (
                    <div className="overflow-hidden mb-8">
                        <img src={post.featuredImage.url} alt={post.featuredImage.alt || post.title} className="single-post-featured-image" loading="eager" />
                    </div>
                )}
            </header>

            {/* CONTENIDO DEL POST */}
            <article id="post-content" className="single-post-container prose prose-lg prose-neutral dark:prose-invert" dangerouslySetInnerHTML={{__html: post.content}} />

            {/* FUENTES CONSULTADAS */}
            {sources.length > 0 && (
                <section id="post-sources" className="single-post-container">
                    <div className="border-t border-primary pt-8">
                        <h2 className="text-xl font-semibold text-primary mb-4">Fuentes consultadas</h2>
                        <ul className="space-y-3">
                            {sources.map((source, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <ExternalLink className="w-4 h-4 text-[var(--color-accent-primary)] mt-1 flex-shrink-0" />
                                    <div>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-primary)] hover:underline font-medium">
                                            {source.title}
                                        </a>
                                        {source.description && <p className="text-sm text-muted mt-1">{source.description}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* CTA */}
            <div id="post-cta" className="single-post-container py-8 border-t border-b border-primary">
                <div className="text-center">
                    <p className="text-lg text-primary mb-4">¿Te interesa implementar algo similar en tu negocio?</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button href={urls.calendly} variant="primary">
                            Reservar llamada gratuita
                        </Button>
                        <Button href="/demos" variant="outline">
                            Ver demos
                        </Button>
                    </div>
                </div>
            </div>

            {/* INTERNAL LINKS - SEO */}
            <InternalLinks title="También te puede interesar" links={postInternalLinks} />
        </PageLayout>
    );
}
