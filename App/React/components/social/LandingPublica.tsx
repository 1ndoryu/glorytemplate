/*
 * Componente: LandingPublica — Kamples
 * Página de bienvenida para usuarios no autenticados.
 * Secciones: Hero con CTAs, Visual Kamples, Sync, DAW, Catálogo.
 * Lógica extraída a useLandingPublica.
 */

import {Download} from 'lucide-react';
import {BotonBase} from '@app/components/ui/BotonBase';
import {LogoKamples} from '@app/components/ui/LogoKamples';
import {useLandingPublica} from '@app/hooks/useLandingPublica';
import {GloryLink} from '@/core/router';
import '../../styles/componentes/landingPublica.css';

const SVG_KAMPLES = '/wp-content/themes/glorytemplate/App/Assets/svg/Kamples.svg';
const SVG_SYNC = '/wp-content/themes/glorytemplate/App/Assets/svg/Sync.svg';
const MINI_DAW = '/wp-content/themes/glorytemplate/App/Assets/svg/MiniDaw.svg';
const ROLAS = '/wp-content/themes/glorytemplate/App/Assets/svg/Rolas.svg';

/* Dimensiones nativas de los SVGs para prevenir CLS */
const SVG_W = 1288;
const SVG_H = 717;

export const LandingPublica = (): JSX.Element => {
    const {abrirAuth} = useLandingPublica();

    return (
        <div className="landingPublica" id="landingPublica">
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

            <section className="landingHero">
                <h1 className="landingHeroTitulo">
                    La mejor biblioteca de samples
                    <span className="landingHeroResaltado"> del planeta</span>
                </h1>
                <p className="landingHeroDescripcion">
                    Descubre, descarga y sincroniza samples. Algoritmo inteligente, comunidad de productores y DAW integrado.
                </p>
                <div className="landingHeroAcciones">
                    <BotonBase variante="secundario" tamano="md" onClick={() => abrirAuth('registro')}>
                        Crear cuenta gratis
                    </BotonBase>
                    <GloryLink href="/descargar" className="landingHeroDescargarEnlace">
                        <BotonBase variante="primario" tamano="md">
                            <Download size={16} />
                            Descargar app
                        </BotonBase>
                    </GloryLink>
                </div>
            </section>

            <section className="landingHeroVisual">
                <img
                    src={SVG_KAMPLES}
                    alt="Interfaz de Kamples mostrando la biblioteca de samples con reproductor integrado"
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    fetchPriority="high"
                    decoding="async"
                />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">Sync en todos tus dispositivos</h2>
                    <span className="subtitleSeccion">Sincronización bidireccional automática entre web y escritorio</span>
                </div>
                <img
                    src={SVG_SYNC}
                    alt="Sincronización bidireccional de samples entre plataformas web y escritorio"
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    loading="lazy"
                    decoding="async"
                />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">Mezcla en el navegador</h2>
                    <span className="subtitleSeccion">Prueba y combina samples en el DAW integrado antes de descargar</span>
                </div>
                <img
                    src={MINI_DAW}
                    alt="DAW integrado en el navegador para mezclar y editar samples"
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    loading="lazy"
                    decoding="async"
                />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">Miles de samples por descubrir</h2>
                    <span className="subtitleSeccion">Catálogo curado con algoritmo de recomendación personalizado</span>
                </div>
                <img
                    src={ROLAS}
                    alt="Catálogo de samples con portadas de canciones y algoritmo de descubrimiento"
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    loading="lazy"
                    decoding="async"
                />
            </section>

            <footer className="landingFooter">
                <p className="landingFooterTexto">
                    Kamples es un producto de{' '}
                    <GloryLink href="https://nakomi.studio" target="_blank" rel="noopener noreferrer" className="landingFooterEnlace">
                        Nakomi.studio
                    </GloryLink>
                </p>
                <nav className="landingFooterNav">
                    <GloryLink href="/privacy/" className="landingFooterNavEnlace">
                        Privacidad
                    </GloryLink>
                    <GloryLink href="/terms/" className="landingFooterNavEnlace">
                        Términos
                    </GloryLink>
                </nav>
            </footer>
        </div>
    );
};

export default LandingPublica;
