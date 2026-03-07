/*
 * Componente: LandingPublica — Kamples
 * Página de bienvenida para usuarios no autenticados.
 * Secciones: Hero con buscador, Grid features SVG, Trending, Tabla comparativa.
 * Lógica extraída a useLandingPublica.
 */

import { Search } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { LogoKamples } from '@app/components/ui/LogoKamples';
import { Input } from '@app/components/ui/Input';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { Badge } from '@app/components/ui/Badge';
import { useLandingPublica } from '@app/hooks/useLandingPublica';
import { SeccionCaracteristicas } from './landing/SeccionCaracteristicas';
import { TablaComparativa } from './landing/TablaComparativa';
import '../../styles/componentes/landingPublica.css';

export const LandingPublica = (): JSX.Element => {
    const {
        trending,
        navegar,
        setSample,
        sampleActual,
        reproduciendo,
        progreso,
        abrirAuth,
    } = useLandingPublica();

    return (
        <div className="landingPublica" id="landingPublica">
            {/* Nav flotante con blur */}
            <nav className="landingNav">
                <div className="landingNavIzquierda">
                    <LogoKamples tamano={22} />
                    <span className="landingNavLogo">Kamples</span>
                </div>
                <div className="landingNavDerecha">
                    <BotonBase variante="ghost" tamano="sm" onClick={() => abrirAuth('login')}>
                        Iniciar sesión
                    </BotonBase>
                    <BotonBase variante="primario" tamano="sm" onClick={() => abrirAuth('registro')}>
                        Crear cuenta
                    </BotonBase>
                </div>
            </nav>

            {/* Hero con buscador */}
            <section className="landingHero">
                <h1 className="landingHeroTitulo">
                    La mejor biblioteca de samples
                    <span className="landingHeroResaltado"> del planeta</span>
                </h1>
                <p className="landingHeroDescripcion">
                    Plataforma de samples con alma de red social. Algoritmo inteligente,
                    comunidad de productores, sync automático — todo en un solo lugar.
                </p>
                <div className="landingHeroBuscador">
                    <Search size={18} className="landingHeroBuscadorIcono" />
                    <Input
                        className="landingHeroBuscadorInput"
                        placeholder="Encuentra cualquier sonido"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const valor = (e.target as HTMLInputElement).value.trim();
                                if (valor) navegar(`/explorar/?q=${encodeURIComponent(valor)}`);
                            }
                        }}
                    />
                    <BotonBase
                        variante="primario"
                        tamano="sm"
                        onClick={() => {
                            const input = document.querySelector<HTMLInputElement>('.landingHeroBuscadorInput');
                            const valor = input?.value.trim();
                            if (valor) navegar(`/explorar/?q=${encodeURIComponent(valor)}`);
                        }}
                    >
                        Buscar
                    </BotonBase>
                </div>
                <div className="landingHeroAcciones">
                    <BotonBase variante="primario" onClick={() => abrirAuth('registro')}>
                        Crear cuenta gratis
                    </BotonBase>
                    <BotonBase variante="ghost" onClick={() => navegar('/explorar/')}>
                        Explorar samples
                    </BotonBase>
                </div>
            </section>

            <SeccionCaracteristicas />

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
                                reproduciendo={sampleActual?.id === sample.id && reproduciendo}
                                progreso={sampleActual?.id === sample.id ? progreso : 0}
                                onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                            />
                        ))}
                    </div>
                    <div className="landingTrendingCta">
                        <BotonBase variante="secundario" onClick={() => navegar('/explorar/')}>
                            Ver todos los samples
                        </BotonBase>
                    </div>
                </section>
            )}

            <TablaComparativa />
        </div>
    );
};

export default LandingPublica;
