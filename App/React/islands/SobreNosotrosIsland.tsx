/**
 * SobreNosotrosIsland — Página "Sobre Nosotros".
 */

import { useGloryOptions } from '@/hooks';
import { GloryLink } from '@/core/router/GloryLink';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

export function SobreNosotrosIsland(): JSX.Element {
    const { get } = useGloryOptions();
    const empresaData = get('empresa', {}) as Record<string, string>;
    const empresa = empresaData.nombre || 'Cresta Campers';

    return (
        <div className="paginaBaseBlanca">
            <Header />

            {/* Hero */}
            <section className="heroInterior">
                <div className="heroInteriorContenido confirmacionExito">
                    <h1 className="heroInteriorTitulo">Sobre Nosotros</h1>
                    <p className="heroInteriorSubtitulo">
                        Somos amantes de la libertad, los viajes y la naturaleza. {empresa} nació para compartir esa pasión contigo.
                    </p>
                </div>
            </section>

            {/* Contenido */}
            <section className="reservarLayout">
                <div className="contenedorEstrecho">
                    {/* Misión */}
                    <div>
                        <h2 className="panelTitulo">Nuestra misión</h2>
                        <p className="legalHtml">
                            Creemos que las mejores aventuras son las que se viven sin prisas. Por eso alquilamos
                            furgonetas camper totalmente equipadas para que solo tengas que preocuparte de elegir
                            el destino. Queremos que viajar en camper sea accesible, sencillo y memorable.
                        </p>
                    </div>

                    {/* Valores */}
                    <div>
                        <h2 className="panelTitulo">Nuestros valores</h2>
                        <div className="valoresGrid">
                            {[
                                { icon: '🌿', titulo: 'Sostenibilidad', desc: 'Cuidamos el entorno. Nuestras furgonetas están preparadas para un turismo responsable y respetuoso.' },
                                { icon: '🤝', titulo: 'Cercanía', desc: 'No somos una gran corporación. Somos personas que te acompañan antes, durante y después de tu viaje.' },
                                { icon: '✨', titulo: 'Calidad', desc: 'Cada furgoneta está revisada, limpia y equipada al detalle para garantizar una experiencia excepcional.' },
                            ].map(v => (
                                <div key={v.titulo} className="valorTarjeta">
                                    <div className="valorIcono">{v.icon}</div>
                                    <h3 className="valorTitulo">{v.titulo}</h3>
                                    <p className="valorDescripcion">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="ctaBox">
                        <h2 className="ctaBoxTitulo">¿Listo para tu primera aventura?</h2>
                        <p className="ctaBoxTexto">Echa un vistazo a nuestra flota y encuentra tu compañera de viaje.</p>
                        <GloryLink
                            href="/flota/"
                            className="botonPrimario"
                        >
                            Ver nuestra flota
                        </GloryLink>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
