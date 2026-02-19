/*
 * Componente: LandingPublica — Kamples
 * Página de bienvenida para usuarios no autenticados.
 * Muestra el valor de la plataforma, CTA de registro y samples trending.
 * Nav flotante fijo arriba con backdrop-filter: blur.
 */

import { useEffect, useState } from 'react';
import {
    AudioLines,
    Headphones,
    TrendingUp,
    Users,
    Zap,
    ArrowRight,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { Badge } from '@app/components/ui/Badge';
import { obtenerFeed } from '@app/services/apiSamples';
import { useNavigationStore } from '@/core/router';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useAuthModalStore } from '@app/stores/authModalStore';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/landingPublica.css';

export const LandingPublica = (): JSX.Element => {
    const [trending, setTrending] = useState<SampleResumen[]>([]);
    const { navegar } = useNavigationStore();
    const { setSample, sampleActual, reproduciendo, progreso } =
        useReproductorStore();
    const abrirAuth = useAuthModalStore((s) => s.abrir);

    useEffect(() => {
        const cargar = async () => {
            try {
                const resp = await obtenerFeed('trending');
                if (resp.ok && resp.data) setTrending(resp.data.slice(0, 6));
            } catch {
                /* Error cargando trending para landing — se muestra landing sin samples */
            }
        };
        cargar();
    }, []);

    return (
        <div className="landingPublica" id="landingPublica">
            {/* Nav flotante con blur */}
            <nav className="landingNav">
                <div className="landingNavIzquierda">
                    <AudioLines size={24} />
                    <span className="landingNavLogo">Kamples</span>
                </div>
                <div className="landingNavDerecha">
                    <BotonBase
                        variante="ghost"
                        tamano="sm"
                        onClick={() => abrirAuth('login')}
                    >
                        Iniciar sesión
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        tamano="sm"
                        onClick={() => abrirAuth('registro')}
                    >
                        Crear cuenta
                    </BotonBase>
                </div>
            </nav>
            {/* Hero */}
            <section className="landingHero">
                <div className="landingHeroIcono">
                    <AudioLines size={40} />
                </div>
                <h1 className="landingHeroTitulo">
                    Descubre, comparte y crea
                    <span className="landingHeroResaltado"> con samples</span>
                </h1>
                <p className="landingHeroDescripcion">
                    La plataforma de samples con alma de red social.
                    Algoritmo inteligente, comunidad de productores, todo en un solo lugar.
                </p>
                <div className="landingHeroAcciones">
                    <BotonBase
                        variante="primario"
                        onClick={() => abrirAuth('registro')}
                    >
                        Crear cuenta gratis
                        <ArrowRight size={16} />
                    </BotonBase>
                    <BotonBase
                        variante="ghost"
                        onClick={() => navegar('/explorar/')}
                    >
                        Explorar samples
                    </BotonBase>
                </div>
            </section>

            {/* Features */}
            <section className="landingFeatures">
                <div className="landingFeature">
                    <div className="landingFeatureIcono">
                        <Zap size={22} />
                    </div>
                    <h3>Algoritmo inteligente</h3>
                    <p>6 señales de descubrimiento que superan la búsqueda básica</p>
                </div>
                <div className="landingFeature">
                    <div className="landingFeatureIcono">
                        <Users size={22} />
                    </div>
                    <h3>Red social nativa</h3>
                    <p>Sigue a creadores, publica, comenta y comparte</p>
                </div>
                <div className="landingFeature">
                    <div className="landingFeatureIcono">
                        <Headphones size={22} />
                    </div>
                    <h3>Audio profesional</h3>
                    <p>WAV original, waveforms interactivos, preview instantáneo</p>
                </div>
                <div className="landingFeature">
                    <div className="landingFeatureIcono">
                        <TrendingUp size={22} />
                    </div>
                    <h3>Monetización</h3>
                    <p>Vende tus samples, gana revenue share, analytics avanzados</p>
                </div>
            </section>

            {/* Trending preview */}
            {trending.length > 0 && (
                <section className="landingTrending">
                    <div className="landingTrendingHeader">
                        <h2>Trending ahora</h2>
                        <Badge>En vivo</Badge>
                    </div>
                    <div className="landingTrendingLista">
                        {trending.map((sample) => (
                            <TarjetaSample
                                key={sample.id}
                                sample={sample}
                                onPlay={(s) => setSample(s)}
                                activa={sampleActual?.id === sample.id}
                                reproduciendo={
                                    sampleActual?.id === sample.id && reproduciendo
                                }
                                progreso={
                                    sampleActual?.id === sample.id ? progreso : 0
                                }
                                onClickCreador={(u) =>
                                    navegar(`/perfil/${u}/`)
                                }
                            />
                        ))}
                    </div>
                    <div className="landingTrendingCta">
                        <BotonBase
                            variante="secundario"
                            onClick={() => navegar('/explorar/')}
                        >
                            Ver todos los samples
                        </BotonBase>
                    </div>
                </section>
            )}

            {/* Planes preview */}
            <section className="landingPlanes">
                <h2>Empieza gratis, crece sin límites</h2>
                <div className="landingPlanesGrid">
                    <div className="landingPlan">
                        <h3>Free</h3>
                        <span className="landingPlanPrecio">$0</span>
                        <ul>
                            <li>5 descargas/día</li>
                            <li>Calidad WAV original</li>
                            <li>Explora y descubre</li>
                        </ul>
                        <BotonBase
                            variante="ghost"
                            onClick={() => abrirAuth('registro')}
                        >
                            Empezar
                        </BotonBase>
                    </div>
                    <div className="landingPlan landingPlanDestacado">
                        <Badge>Popular</Badge>
                        <h3>Pro</h3>
                        <span className="landingPlanPrecio">
                            $5<small>/mes</small>
                        </span>
                        <ul>
                            <li>50 descargas/día</li>
                            <li>Calidad WAV original</li>
                            <li>Monetiza tus samples</li>
                            <li>Analytics avanzados</li>
                        </ul>
                        <BotonBase
                            variante="primario"
                            onClick={() => abrirAuth('registro')}
                        >
                            Elegir Pro
                        </BotonBase>
                    </div>
                    <div className="landingPlan">
                        <h3>Premium</h3>
                        <span className="landingPlanPrecio">
                            $19.99<small>/mes</small>
                        </span>
                        <ul>
                            <li>Descargas ilimitadas</li>
                            <li>Todo lo de Pro</li>
                            <li>Revenue share 80/20</li>
                            <li>Soporte dedicado</li>
                        </ul>
                        <BotonBase
                            variante="ghost"
                            onClick={() => abrirAuth('registro')}
                        >
                            Elegir Premium
                        </BotonBase>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="landingFooterCta">
                <h2>Únete a la comunidad de productores</h2>
                <BotonBase
                    variante="primario"
                    onClick={() => abrirAuth('registro')}
                >
                    Crear cuenta gratis
                    <ArrowRight size={16} />
                </BotonBase>
            </section>
        </div>
    );
};

export default LandingPublica;
