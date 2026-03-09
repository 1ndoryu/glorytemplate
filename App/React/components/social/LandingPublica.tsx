/*
 * Componente: LandingPublica — Kamples
 * Página de bienvenida para usuarios no autenticados.
 * Secciones: Hero con buscador, Grid features SVG, Trending, Tabla comparativa.
 * Lógica extraída a useLandingPublica.
 */

import {Search} from 'lucide-react';
import {BotonBase} from '@app/components/ui/BotonBase';
import {LogoKamples} from '@app/components/ui/LogoKamples';
import {Input} from '@app/components/ui/Input';
import {TarjetaSample} from '@app/components/ui/TarjetaSample';
import {useLandingPublica} from '@app/hooks/useLandingPublica';
import {GloryLink} from '@/core/router';
import '../../styles/componentes/landingPublica.css';

const SVG_KAMPLES = '/wp-content/themes/glorytemplate/App/Assets/svg/Kamples.svg';
const SVG_SYNC = '/wp-content/themes/glorytemplate/App/Assets/svg/Sync.svg';
const MINI_DAW = '/wp-content/themes/glorytemplate/App/Assets/svg/MiniDaw.svg';
const IMAGEN_HERO = '/wp-content/themes/glorytemplate/App/Assets/images/pawel-czerwinski-nM7T4zTP3GQ-unsplash.jpg';

export const LandingPublica = (): JSX.Element => {
    const {trending, navegar, setSample, sampleActual, reproduciendo, progreso, abrirAuth} = useLandingPublica();

    return (
        <div className="landingPublica" id="landingPublica">
            {/* Nav flotante con blur */}
            <nav className="landingNav">
                <div className="landingNavIzquierda">
                    <LogoKamples tamano={22} />
                </div>
                <div className="landingNavDerecha">
                    <BotonBase variante="ghost" tamano="md" onClick={() => abrirAuth('login')}>
                        Iniciar sesión
                    </BotonBase>
                    <BotonBase variante="primario" tamano="md" onClick={() => abrirAuth('registro')}>
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
                <p className="landingHeroDescripcion">Plataforma de samples con alma de red social. Algoritmo inteligente, comunidad de productores, sync automático — todo en un solo lugar.</p>
                <div className="landingHeroBuscador">
                    <Search size={18} className="landingHeroBuscadorIcono" />
                    <Input
                        className="landingHeroBuscadorInput"
                        placeholder="Encuentra cualquier sonido"
                        onKeyDown={e => {
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
                        }}>
                        Buscar
                    </BotonBase>
                </div>
            </section>

            {/* Trending preview */}
            {trending.length > 0 && (
                <section className="seccionEstandar" style={{display: 'none'}}>
                    <div className="">
                        {trending.map(sample => (
                            <TarjetaSample key={sample.id} sample={sample} onPlay={s => setSample(s)} activa={sampleActual?.id === sample.id} reproduciendo={sampleActual?.id === sample.id && reproduciendo} progreso={sampleActual?.id === sample.id ? progreso : 0} onClickCreador={u => navegar(`/perfil/${u}/`)} />
                        ))}
                    </div>
                </section>
            )}

            {/* SVG Kamples superpuesto encima de la imagen de ambiente */}
            <section className="landingHeroVisual">
                <img src={SVG_KAMPLES} alt="Kamples" className="landingSeccionSync" />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">Sincronización de dos vías</h2>
                    <span className="subtitleSeccion">Todos tus samples sincronizados en todos tus dispositivos</span>
                </div>
                <img src={SVG_SYNC} alt="Sync" className="landingSeccionSync" loading="lazy" />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">DAW Web</h2>
                    <span className="subtitleSeccion">Mezcla, prueba y edita tus samples directamente en el navegador antes de descargar</span>
                </div>
                <img src={MINI_DAW} alt="Daw" className="landingSeccionSync" loading="lazy" />
            </section>

            <footer className="landingFooter">
                <p className="landingFooterTexto">
                    Kamples es un producto de{' '}
                    <GloryLink href="https://nakomi.studio" target="_blank" rel="noopener noreferrer" className="landingFooterEnlace">
                        Nakomi.studio
                    </GloryLink>
                </p>
                <nav className="landingFooterNav">
                    <GloryLink href="/privacy/" className="landingFooterNavEnlace">Privacy</GloryLink>
                    <GloryLink href="/terms/" className="landingFooterNavEnlace">Terms</GloryLink>
                </nav>
            </footer>
        </div>
    );
};

export default LandingPublica;
