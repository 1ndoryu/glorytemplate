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
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero */}
            <section className="bg-green-800 pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Sobre Nosotros</h1>
                    <p className="text-green-100/70 text-lg max-w-2xl mx-auto">
                        Somos amantes de la libertad, los viajes y la naturaleza. {empresa} nació para compartir esa pasión contigo.
                    </p>
                </div>
            </section>

            {/* Contenido */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    {/* Misión */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra misión</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Creemos que las mejores aventuras son las que se viven sin prisas. Por eso alquilamos
                            furgonetas camper totalmente equipadas para que solo tengas que preocuparte de elegir
                            el destino. Queremos que viajar en camper sea accesible, sencillo y memorable.
                        </p>
                    </div>

                    {/* Valores */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Nuestros valores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: '🌿', titulo: 'Sostenibilidad', desc: 'Cuidamos el entorno. Nuestras furgonetas están preparadas para un turismo responsable y respetuoso.' },
                                { icon: '🤝', titulo: 'Cercanía', desc: 'No somos una gran corporación. Somos personas que te acompañan antes, durante y después de tu viaje.' },
                                { icon: '✨', titulo: 'Calidad', desc: 'Cada furgoneta está revisada, limpia y equipada al detalle para garantizar una experiencia excepcional.' },
                            ].map(v => (
                                <div key={v.titulo} className="text-center">
                                    <div className="text-4xl mb-3">{v.icon}</div>
                                    <h3 className="font-bold text-gray-900 mb-2">{v.titulo}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-green-50 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Listo para tu primera aventura?</h2>
                        <p className="text-gray-500 mb-6">Echa un vistazo a nuestra flota y encuentra tu compañera de viaje.</p>
                        <GloryLink
                            href="/flota/"
                            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition"
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
