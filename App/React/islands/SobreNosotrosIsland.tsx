/**
 * SobreNosotrosIsland — Página "Sobre Nosotros".
 */

import { useGloryOptions } from '@/hooks';
import { GloryLink } from '@/core/router/GloryLink';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

function IconoHoja(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
    );
}

function IconoMano(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
    );
}

function IconoEstrella(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

const VALORES = [
    {
        Icono: IconoHoja,
        titulo: 'Sostenibilidad',
        desc: 'Cuidamos el entorno. Nuestras furgonetas están preparadas para un turismo responsable y respetuoso.',
    },
    {
        Icono: IconoMano,
        titulo: 'Cercanía',
        desc: 'No somos una gran corporación. Somos personas que te acompañan antes, durante y después de tu viaje.',
    },
    {
        Icono: IconoEstrella,
        titulo: 'Calidad',
        desc: 'Cada furgoneta está revisada, limpia y equipada al detalle para garantizar una experiencia excepcional.',
    },
];

export function SobreNosotrosIsland(): JSX.Element {
    const { get } = useGloryOptions();
    const empresaData = get('empresa', {}) as Record<string, string>;
    const empresa = empresaData.nombre || 'Cresta Campers';

    return (
        <div className="paginaBaseBlanca">
            <Header />

            {/* Hero */}
            <section className="heroInterior">
                <div className="heroInteriorContenido">
                    <h1 className="heroInteriorTitulo">Sobre Nosotros</h1>
                    <p className="heroInteriorSubtitulo">
                        Somos amantes de la libertad, los viajes y la naturaleza.
                        {' '}{empresa} nació para compartir esa pasión contigo.
                    </p>
                </div>
            </section>

            {/* Misión */}
            <section className="sobreSeccion sobreSeccionClara">
                <div className="contenedorEstrecho">
                    <span className="seccionEtiquetaOscura">Nuestra misión</span>
                    <h2 className="sobreTitulo">Viaja a tu ritmo, sin prisas</h2>
                    <p className="sobreTexto">
                        Creemos que las mejores aventuras son las que se viven sin planificaciones rígidas.
                        Por eso alquilamos furgonetas camper totalmente equipadas para que solo tengas que
                        preocuparte de elegir el destino. Queremos que viajar en camper sea accesible,
                        sencillo y, sobre todo, memorable.
                    </p>
                </div>
            </section>

            {/* Valores */}
            <section className="sobreSeccion">
                <div className="contenedorEstrecho">
                    <span className="seccionEtiquetaOscura">Nuestros valores</span>
                    <h2 className="sobreTitulo">Lo que nos define</h2>

                    <div className="valoresGrid">
                        {VALORES.map(({ Icono, titulo, desc }) => (
                            <div key={titulo} className="valorTarjeta">
                                <div className="valorIconoWrap">
                                    <Icono />
                                </div>
                                <h3 className="valorTitulo">{titulo}</h3>
                                <p className="valorDescripcion">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="sobreSeccion sobreSeccionVerde">
                <div className="contenedorEstrecho sobreCta">
                    <h2 className="sobreCtaTitulo">¿Listo para tu primera aventura?</h2>
                    <p className="sobreCtaTexto">Echa un vistazo a nuestra flota y encuentra tu compañera de viaje.</p>
                    <GloryLink href="/flota/" className="botonPrimarioBlanco">
                        Ver nuestra flota
                    </GloryLink>
                </div>
            </section>

            <Footer />
        </div>
    );
}
