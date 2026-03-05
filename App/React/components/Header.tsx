/**
 * Header compartido — Navegación principal del sitio.
 * Detección de scroll para fondo sólido al hacer sticky.
 * Estilos en header.css — sin clases Tailwind ni estilos inline.
 */

import { GloryLink } from '@/core/router/GloryLink';
import { useNavigation, useGloryContext } from '@/hooks';
import { useState, useCallback, useEffect } from 'react';
import { Boton } from '@app/components/ui';

const NAV_ITEMS = [
    { label: 'Inicio', href: '/' },
    { label: 'Nuestra Flota', href: '/flota/' },
    { label: 'Reservar', href: '/reservar/' },
    { label: 'Sobre Nosotros', href: '/sobre-nosotros/' },
    { label: 'Contacto', href: '/contacto/' },
];

interface HeaderProps {
    transparente?: boolean;
}

export function Header({ transparente = false }: HeaderProps): JSX.Element {
    const { esRutaActiva } = useNavigation();
    const { isAdmin } = useGloryContext();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = (): void => {
            setScrolled(window.scrollY > 50);
        };

        /* Estado inicial por si la página ya está scrolleada */
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = useCallback(() => setMenuAbierto(a => !a), []);

    /* Clase base + variante de fondo */
    const fondoClase = transparente
        ? (scrolled ? 'cabeceraScrolled' : 'cabeceraTransparente')
        : 'cabeceraConFondo';

    /* Variante de enlace según fondo */
    const esOscuro = transparente && !scrolled;

    return (
        <header className={`cabeceraFija ${fondoClase}`}>
            <nav className="cabeceraNav">
                <div className="cabeceraContenido">
                    {/* Logo */}
                    <GloryLink href="/" className="cabeceraLogo">
                        <span className={`cabeceraLogoTexto ${esOscuro ? 'cabeceraLogoClaro' : 'cabeceraLogoOscuro'}`}>
                            Cresta<span className="cabeceraLogoLight">Campers</span>
                        </span>
                    </GloryLink>

                    {/* Nav desktop */}
                    <div className="cabeceraNavDesktop">
                        {NAV_ITEMS.map(item => {
                            const activa = esRutaActiva(item.href);
                            let claseEnlace = 'cabeceraNavEnlace';
                            if (activa) {
                                claseEnlace += esOscuro ? ' cabeceraNavEnlaceActivoClaro' : ' cabeceraNavEnlaceActivo';
                            } else {
                                claseEnlace += esOscuro ? ' cabeceraNavEnlaceClaro' : '';
                            }
                            return (
                                <GloryLink key={item.href} href={item.href} className={claseEnlace}>
                                    {item.label}
                                </GloryLink>
                            );
                        })}

                        <GloryLink href={isAdmin ? '/panel/' : '/reservar/'} className="cabeceraCtaBoton">
                            {isAdmin ? 'Ir al panel' : 'Reservar ahora'}
                        </GloryLink>
                    </div>

                    {/* Hamburger mobile */}
                    <Boton
                        variante="icono"
                        onClick={toggleMenu}
                        className={`cabeceraHamburguesa ${esOscuro ? 'cabeceraHamburguesaClaro' : ''}`}
                        aria-label="Abrir menú"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuAbierto
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </Boton>
                </div>

                {/* Mobile menu */}
                {menuAbierto && (
                    <div className="cabeceraMenuMovil menuAbierto">
                        <div className="menuMovilLista">
                            {NAV_ITEMS.map(item => (
                                <GloryLink
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMenuAbierto(false)}
                                    className={`menuMovilEnlace ${esRutaActiva(item.href) ? 'menuMovilEnlaceActivo' : ''}`}
                                >
                                    {item.label}
                                </GloryLink>
                            ))}
                            <GloryLink
                                href={isAdmin ? '/panel/' : '/reservar/'}
                                onClick={() => setMenuAbierto(false)}
                                className="menuMovilCta"
                            >
                                {isAdmin ? 'Ir al panel' : 'Reservar ahora'}
                            </GloryLink>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
