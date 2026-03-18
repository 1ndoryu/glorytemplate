/*
 * Componente: LandingPublica — Kamples
 * Página de bienvenida para usuarios no autenticados.
 * Secciones: Hero con CTAs, Visual Kamples, Sync, DAW, Catálogo.
 * Lógica extraída a useLandingPublica.
 */

import {Download, Search} from 'lucide-react';
import {BotonBase} from '@app/components/ui/BotonBase';
import {Input} from '@app/components/ui/Input';
import {useLandingPublica} from '@app/hooks/useLandingPublica';
import {GloryLink} from '@/core/router';
import { resolverRutaAsset } from '@app/utils/resolverRutaAsset';
import { useState, type KeyboardEvent } from 'react';
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
    const {abrirAuth} = useLandingPublica();
    const svgs = rutasSvg();
    const [busqueda, setBusqueda] = useState('');

    const irADescubrir = () => {
        const q = busqueda.trim();
        const url = q
            ? `https://kamples.com/descubrir/?q=${encodeURIComponent(q)}`
            : 'https://kamples.com/descubrir/';
        window.location.href = url;
    };

    const manejarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') irADescubrir();
    };

    return (
        <div className="landingPublica" id="landingPublica">
            {/* Nav público ahora se renderiza globalmente en LayoutPrincipal (QQ82) */}

            <section className="landingHero">
                <h1 className="landingHeroTitulo">
                    La mejor biblioteca de samples
                    <span className="landingHeroResaltado"> del planeta</span>
                </h1>
                <p className="landingHeroDescripcion">
                    Descubre, descarga y sincroniza samples. Algoritmo inteligente, comunidad de productores y DAW integrado.
                </p>
                {/* [183A-18] Buscador que redirige a /descubrir/?q= */}
                <div className="landingHeroBuscador">
                    <Search size={18} className="landingHeroBuscadorIcono" />
                    <Input
                        type="text"
                        className="landingHeroBuscadorInput"
                        placeholder="Busca samples, géneros, BPM..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        onKeyDown={manejarTecla}
                        aria-label="Buscar samples"
                    />
                    <BotonBase variante="primario" tamano="sm" onClick={irADescubrir} type="button">
                        Buscar
                    </BotonBase>
                </div>
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
                    src={svgs.kamples}
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
                    src={svgs.sync}
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
                    src={svgs.miniDaw}
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
                    src={svgs.rolas}
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
