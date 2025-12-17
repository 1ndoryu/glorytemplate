import {obtenerPosts, obtenerInfoSitio} from '@/lib/wordpress';
import type {Metadata} from 'next';
import Link from 'next/link';

/*
 * Metadata dinamica para SEO
 */
export async function generateMetadata(): Promise<Metadata> {
    const infoSitio = await obtenerInfoSitio();

    return {
        title: infoSitio?.nombre || 'Glory Builder',
        description: infoSitio?.descripcion || 'Soluciones digitales excepcionales'
    };
}

/*
 * Pagina principal con SSR
 * Obtiene los ultimos posts de WordPress
 */
export default async function PaginaInicio() {
    const posts = await obtenerPosts({porPagina: 6});
    const infoSitio = await obtenerInfoSitio();

    return (
        <>
            <SeccionHero nombreSitio={infoSitio?.nombre || 'Glory Builder'} />
            <SeccionPosts posts={posts} />
        </>
    );
}

/*
 * Seccion Hero
 */
function SeccionHero({nombreSitio}: {nombreSitio: string}) {
    return (
        <section id="seccion-hero" className="seccionHero">
            <div className="contenedor heroContenido">
                <h1 className="heroTitulo">Bienvenido a {nombreSitio}</h1>
                <p className="heroDescripcion">Creamos experiencias digitales excepcionales con tecnologia moderna. Este es un ejemplo de SSR con Next.js y WordPress.</p>
                <div className="heroAcciones">
                    <Link href="/contacto" className="boton botonPrimario">
                        Contactanos
                    </Link>
                    <Link href="/blog" className="boton botonSecundario">
                        Ver Blog
                    </Link>
                </div>
            </div>
        </section>
    );
}

/*
 * Tipos para los posts
 */
interface Post {
    id: number;
    slug: string;
    title: {rendered: string};
    excerpt: {rendered: string};
    date: string;
    _embedded?: {
        'wp:featuredmedia'?: Array<{source_url: string}>;
    };
}

/*
 * Seccion de posts recientes
 */
function SeccionPosts({posts}: {posts: Post[]}) {
    if (!posts || posts.length === 0) {
        return (
            <section id="seccion-posts" className="seccion">
                <div className="contenedor">
                    <div className="seccionTitulo">
                        <p className="seccionSubtitulo">Blog</p>
                        <h2>Ultimas Publicaciones</h2>
                    </div>
                    <div className="estadoVacio">
                        <p>No hay posts disponibles.</p>
                        <p>WordPress esta conectado en: {process.env.WORDPRESS_API_URL}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="seccion-posts" className="seccion">
            <div className="contenedor">
                <div className="seccionTitulo">
                    <p className="seccionSubtitulo">Blog</p>
                    <h2>Ultimas Publicaciones</h2>
                </div>
                <div className="gridPosts">
                    {posts.map(post => (
                        <TarjetaPost key={post.id} post={post} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/*
 * Tarjeta individual de post
 */
function TarjetaPost({post}: {post: Post}) {
    const imagenDestacada = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const fechaFormateada = new Date(post.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <article className="tarjetaPost">
            {imagenDestacada && <img src={imagenDestacada} alt={post.title.rendered} className="tarjetaImagen" />}
            {!imagenDestacada && <div className="tarjetaImagen" />}
            <div className="tarjetaContenido">
                <h3 className="tarjetaTitulo">
                    <Link href={`/blog/${post.slug}`}>{post.title.rendered}</Link>
                </h3>
                <div className="tarjetaExcerpt" dangerouslySetInnerHTML={{__html: post.excerpt.rendered}} />
                <time className="tarjetaFecha">{fechaFormateada}</time>
            </div>
        </article>
    );
}
