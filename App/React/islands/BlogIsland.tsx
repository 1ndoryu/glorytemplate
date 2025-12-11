/**
 * BlogIsland - Pagina de Blog
 *
 * CONTENIDO:
 * Los posts se obtienen de WordPress via useContent hook.
 * Se definen en App/Content/defaultContent.php y se sincronizan automaticamente.
 * ReactContentProvider los inyecta en window.__GLORY_CONTENT__
 */

import {PageLayout} from '../components/layout';
import {HeroSection, InternalLinks} from '../components/sections';
import {ContentRenderer} from '../components/content';
import type {WordPressPost} from '../components/content';
import {useContent} from '../hooks/useContent';
import {siteUrls} from '../config';

// Enlaces internos para el blog
const blogInternalLinks = [
    {text: 'Probar una demo similar', href: '/demos'},
    {text: 'Ver servicios (WhatsApp, IG, web, voz)', href: '/servicios'},
    {text: 'Precio? Mira planes', href: '/planes'},
    {text: 'Contactar para consulta', href: '/contacto'}
];

// --- CONTENIDO ---
const blogContent = {
    hero: {
        title: (
            <>
                Mejores chatbots para WhatsApp Business: <span className="text-subtle">casos y noticias</span>
            </>
        ),
        subtitle: 'Articulos practicos, casos reales y novedades sobre chatbots, automatizacion y atencion al cliente. Sin jerga tecnica, todo explicado para que lo apliques en tu negocio.',
        primaryCta: {text: 'Reservar llamada gratuita', href: siteUrls.calendly},
        secondaryCta: {text: 'Ver demos', href: siteUrls.demos}
    }
};

// --- COMPONENTE PRINCIPAL ---
export function BlogIsland(): JSX.Element {
    // Obtener posts de WordPress (inyectados desde ReactContentProvider)
    const posts = useContent<WordPressPost[]>('blogPosts', []);

    return (
        <PageLayout headerCtaText="Reservar llamada" mainClassName="flex-1 flex flex-col justify-start gap-16 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION */}
            <div id="blog-hero">
                <HeroSection title={blogContent.hero.title} subtitle={blogContent.hero.subtitle} primaryCta={blogContent.hero.primaryCta} secondaryCta={blogContent.hero.secondaryCta} />
            </div>

            {/* 2. ARTICULOS */}
            <section id="blog-posts-section" className="mx-auto w-full max-w-7xl">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] mb-4">Blog</span>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Articulos recientes</h2>
                    <p className="text-muted mt-2 max-w-2xl">Casos de exito, tutoriales y novedades sobre chatbots y automatizacion.</p>
                </div>

                <ContentRenderer content={posts} layout="grid" columns={3} showImage={true} showExcerpt={true} showDate={true} showReadTime={true} showCategories={false} readMoreText="Leer articulo" emptyMessage="No hay articulos publicados todavia." />
            </section>

            {/* 3. INTERNAL LINKS - SEO */}
            <InternalLinks title="Enlaces utiles" links={blogInternalLinks} />
        </PageLayout>
    );
}
