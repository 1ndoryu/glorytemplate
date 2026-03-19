/*
 * Componente: NavPublico — Kamples (QQ82 + 183A-110-D)
 * Nav visible en todas las páginas para usuarios no autenticados.
 * Contiene: logo, enlaces públicos (Explorar, Colecciones, Música, Blog), botones de auth.
 */

import { BotonBase } from '@app/components/ui/BotonBase';
import { LogoKamples } from '@app/components/ui/LogoKamples';
import { GloryLink } from '@/core/router';
import { useAuthModalStore } from '@app/stores/authModalStore';
import '../../styles/componentes/navPublico.css';

export const NavPublico = (): JSX.Element => {
    const abrirAuth = useAuthModalStore(s => s.abrir);

    return (
        <nav className="navPublico">
            <div className="navPublicoIzquierda">
                <GloryLink href="/" className="navPublicoLogo">
                    <LogoKamples tamano={22} />
                </GloryLink>
                <div className="navPublicoEnlaces">
                    <GloryLink href="/descubrir/" className="navPublicoEnlace">Explorar</GloryLink>
                    <GloryLink href="/colecciones/" className="navPublicoEnlace">Colecciones</GloryLink>
                    <GloryLink href="/musica/" className="navPublicoEnlace">Música</GloryLink>
                    <GloryLink href="/blog/" className="navPublicoEnlace">Blog</GloryLink>
                </div>
            </div>
            <div className="navPublicoDerecha">
                <BotonBase variante="ghost" tamano="md" onClick={() => abrirAuth('login')}>
                    Iniciar sesión
                </BotonBase>
                <BotonBase variante="primario" tamano="md" onClick={() => abrirAuth('registro')}>
                    Crear cuenta
                </BotonBase>
            </div>
        </nav>
    );
};
