/**
 * BlogIsland - Pagina de Blog
 *
 * CONTENIDO:
 * Los posts se obtienen de WordPress via useContent hook.
 * Se definen en App/Content/reactContent.php y se sincronizan automaticamente.
 * ReactContentProvider los inyecta en window.__GLORY_CONTENT__
 *
 * ESTRUCTURA (segun project-extends.md):
 * 1. Hero con H1 y CTAs
 * 2. Casos destacados (3 posts featured con chips fecha/canal)
 * 3. Lo ultimo (6 posts en grid)
 * 4. Enlaces utiles (interlinking)
 */

import {PageLayout} from '../components/layout';
import {HeroSection, InternalLinks} from '../components/sections';
import {ContentRenderer} from '../components/content';
import type {WordPressPost} from '../components/content';
import {useContent} from '../hooks/useContent';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../hooks/useSiteConfig';

// Enlaces internos para el blog
const blogInternalLinks = [
    {text: 'Probar una demo similar', href: '/demos'},
    {text: 'Ver servicios (WhatsApp, IG, web, voz)', href: '/servicios'},
    {text: 'Precio? Mira planes', href: '/planes'},
    {text: 'Contactar para consulta', href: '/contacto'}
];

// --- FUNCION PARA CREAR CONTENIDO CON URLS DINAMICAS ---
const createBlogContent = (urls: ReturnType<typeof useSiteUrls>) => ({
    hero: {
        title: (
            <>
                Mejores chatbots para WhatsApp Business: <span className="text-info">casos y noticias</span>
            </>
        ),
        subtitle: 'Artículos prácticos, casos reales y novedades sobre chatbots, automatización y atención al cliente. Sin jerga técnica, todo explicado para que lo apliques en tu negocio.',
        primaryCta: {text: 'Reservar llamada gratuita', href: urls.calendly},
        secondaryCta: {text: 'Ver demos', href: urls.demos}
    }
});

// --- COMPONENTE PRINCIPAL ---
export function BlogIsland(): JSX.Element {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();
    // Crear contenido con URLs dinamicas
    const blogContent = createBlogContent(urls);

    // Obtener posts de WordPress (inyectados desde ReactContentProvider)
    const allPosts = useContent<WordPressPost[]>('blogPosts', []);
    const featuredPosts = useContent<WordPressPost[]>('blogFeatured', []);
    const recentPosts = useContent<WordPressPost[]>('blogRecent', []);

    // Si no hay posts destacados separados, usar los primeros 3 del listado general
    const featured = featuredPosts.length > 0 ? featuredPosts : allPosts.slice(0, 3);
    // Si no hay posts recientes separados, usar los siguientes 6 del listado general
    const recent = recentPosts.length > 0 ? recentPosts : allPosts.slice(3, 9);

    return (
        <PageLayout headerCtaText="Reservar llamada" mainClassName="flex-1 flex flex-col justify-start gap-16 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION */}
            <div id="blog-hero">
                <HeroSection title={blogContent.hero.title} subtitle={blogContent.hero.subtitle} primaryCta={blogContent.hero.primaryCta} secondaryCta={blogContent.hero.secondaryCta} />
            </div>

            {/* 2. CASOS DESTACADOS - 3 posts con layout featured y chips de categoria */}
            {featured.length > 0 && (
                <section id="casos-destacados" className="mx-auto w-full max-w-7xl">
                    <div className="mb-8">
                        <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] mb-4">Destacados</span>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Casos destacados</h2>
                        <p className="text-muted mt-2 max-w-2xl">Proyectos reales con resultados medibles. Cada caso incluye el canal usado y los resultados obtenidos.</p>
                    </div>
                    <ContentRenderer content={featured} layout="featured" columns={3} showImage={true} showExcerpt={true} showDate={true} showReadTime={true} showCategories={true} readMoreText="Ver caso completo" emptyMessage="No hay casos destacados todavia." />
                </section>
            )}

            {/* 3. LO ULTIMO - 6 posts en grid con chips */}
            {recent.length > 0 && (
                <section id="blog-recientes" className="mx-auto w-full max-w-7xl">
                    <div className="mb-8">
                        <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] mb-4">Blog</span>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Lo ultimo</h2>
                        <p className="text-muted mt-2 max-w-2xl">Artículos recientes sobre chatbots, automatización y novedades del sector.</p>
                    </div>
                    <ContentRenderer content={recent} layout="grid" columns={3} showImage={true} showExcerpt={true} showDate={true} showReadTime={true} showCategories={true} readMoreText="Leer artículo" emptyMessage="No hay artículos recientes." />
                </section>
            )}

            {/* 4. INTERNAL LINKS - SEO */}
            <InternalLinks title="Enlaces utiles" links={blogInternalLinks} />
        </PageLayout>
    );
}
