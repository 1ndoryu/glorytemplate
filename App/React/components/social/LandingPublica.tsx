/*
 * Componente: LandingPublica — Kamples
 * Página de bienvenida para usuarios no autenticados.
 * Secciones: Hero con CTAs, Visual Kamples, Sync, DAW, Catálogo.
 * Lógica extraída a useLandingPublica.
 * [183A-111] i18n: useT + SelectorIdioma integrado en el footer.
 */

import {Download, Search} from 'lucide-react';
import {BotonBase} from '@app/components/ui/BotonBase';
import {Input} from '@app/components/ui/Input';
import {useLandingPublica} from '@app/hooks/useLandingPublica';
import {GloryLink} from '@/core/router';
import { resolverRutaAsset } from '@app/utils/resolverRutaAsset';
import { useState, type KeyboardEvent } from 'react';
import { useNavigationStore } from '@/core/router';
import { useT } from '@app/utils/i18n';
import { SelectorIdioma } from '@app/components/ui/SelectorIdioma';
import '../../styles/componentes/landingPublica.css';

/* Versión de assets SVG para cache-busting (incrementar al modificar los SVGs) */
const SVG_V = '2';
const SVG_BASE = '/wp-content/themes/glorytemplate/App/Assets/svg';

/* Rutas resueltas lazily al renderizar: en Tauri, __KAMPLES_DESKTOP__ se inyecta
 * en runtime DESPUÉS de la evaluación de módulos estáticos (QL46). */
const rutasSvg = () => ({
    kamples: resolverRutaAsset(`${SVG_BASE}/Kamples.svg?v=${SVG_V}`),
    sync: resolverRutaAsset(`${SVG_BASE}/Sync.svg?v=${SVG_V}`),
    miniDaw: resolverRutaAsset(`${SVG_BASE}/MiniDaw.svg?v=${SVG_V}`),
    rolas: resolverRutaAsset(`${SVG_BASE}/Rolas.svg?v=${SVG_V}`),
});

/* Dimensiones nativas de los SVGs para prevenir CLS */
const SVG_W = 1288;
const SVG_H = 717;

export const LandingPublica = (): JSX.Element => {
    const { t } = useT();
    const {abrirAuth} = useLandingPublica();
    const navegar = useNavigationStore(s => s.navegar);
    const svgs = rutasSvg();
    const [busqueda, setBusqueda] = useState('');

    /* [183A-35] Navegación SPA en vez de window.location.href para evitar recarga
     * [183A-65] Corregido: usa ?buscar= para coincidir con useUrlFiltros */
    const irADescubrir = () => {
        const q = busqueda.trim();
        const url = q
            ? `/descubrir/?buscar=${encodeURIComponent(q)}`
            : '/descubrir/';
        navegar(url);
    };

    const manejarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') irADescubrir();
    };

    return (
        <div className="landingPublica" id="landingPublica">
            {/* Nav público ahora se renderiza globalmente en LayoutPrincipal (QQ82) */}

            <section className="landingHero">
                <h1 className="landingHeroTitulo">
                    {t('landing.titulo')}
                    <span className="landingHeroResaltado">{t('landing.tituloResaltado')}</span>
                </h1>
                <p className="landingHeroDescripcion">
                    {t('landing.descripcion')}
                </p>
                {/* [183A-18] Buscador que redirige a /descubrir/?q= */}
                <div className="landingHeroBuscador">
                    <Search size={18} className="landingHeroBuscadorIcono" />
                    <Input
                        type="text"
                        className="landingHeroBuscadorInput"
                        placeholder={t('landing.buscarPlaceholder')}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        onKeyDown={manejarTecla}
                        aria-label={t('landing.buscar')}
                    />
                    <BotonBase variante="primario" tamano="sm" onClick={irADescubrir} type="button">
                        {t('landing.buscar')}
                    </BotonBase>
                </div>
                <div className="landingHeroAcciones">
                    <BotonBase variante="secundario" tamano="md" onClick={() => abrirAuth('registro')}>
                        {t('auth.crearCuentaGratis')}
                    </BotonBase>
                    <GloryLink href="/descargar" className="landingHeroDescargarEnlace">
                        <BotonBase variante="primario" tamano="md">
                            <Download size={16} />
                            {t('landing.descargarApp')}
                        </BotonBase>
                    </GloryLink>
                </div>
            </section>

            <section className="landingHeroVisual">
                <img
                    src={svgs.kamples}
                    alt={t('landing.img.kamples')}
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    fetchPriority="high"
                    decoding="async"
                />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">{t('landing.seccion.sync.titulo')}</h2>
                    <span className="subtitleSeccion">{t('landing.seccion.sync.subtitulo')}</span>
                </div>
                <img
                    src={svgs.sync}
                    alt={t('landing.img.sync')}
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    loading="lazy"
                    decoding="async"
                />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">{t('landing.seccion.daw.titulo')}</h2>
                    <span className="subtitleSeccion">{t('landing.seccion.daw.subtitulo')}</span>
                </div>
                <img
                    src={svgs.miniDaw}
                    alt={t('landing.img.daw')}
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    loading="lazy"
                    decoding="async"
                />
            </section>

            <section className="seccionSync seccionEstandar">
                <div>
                    <h2 className="titleSeccion">{t('landing.seccion.catalogo.titulo')}</h2>
                    <span className="subtitleSeccion">{t('landing.seccion.catalogo.subtitulo')}</span>
                </div>
                <img
                    src={svgs.rolas}
                    alt={t('landing.img.catalogo')}
                    className="landingSeccionSync"
                    width={SVG_W}
                    height={SVG_H}
                    loading="lazy"
                    decoding="async"
                />
            </section>

            {/* [183A-110-D] Blog section removida — blog ahora es link en NavPublico
             * y tab en InicioIsland para usuarios autenticados. */}

            <footer className="landingFooter">
                <p className="landingFooterTexto">
                    {t('landing.footer.producto')}{' '}
                    <GloryLink href="https://nakomi.studio" target="_blank" rel="noopener noreferrer" className="landingFooterEnlace">
                        Nakomi.studio
                    </GloryLink>
                </p>
                <nav className="landingFooterNav">
                    <GloryLink href="/privacy/" className="landingFooterNavEnlace">
                        {t('landing.footer.privacidad')}
                    </GloryLink>
                    <GloryLink href="/terms/" className="landingFooterNavEnlace">
                        {t('landing.footer.terminos')}
                    </GloryLink>
                </nav>
                {/* [183A-111] [193A-52] Selector de idioma pill minimalista en el footer */}
                <SelectorIdioma variante="select" className="landingFooterIdioma" />
            </footer>
        </div>
    );
};

export default LandingPublica;
