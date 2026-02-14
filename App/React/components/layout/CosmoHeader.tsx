import React, { useState, useCallback } from 'react';
import { useScrollHeader } from '@app/hooks/useScrollHeader';
import { GloryLink } from '@/core/router';
import '@app/styles/header.css';

/*
 * Header fijo de Cosmo Revenue.
 * Usa clases de header.css original de App1:
 * cosmoHeader, scrolled, cosmoHeaderLogo, cosmoHeaderLogoSvg, burger, nav-links
 */
export function CosmoHeader(): React.JSX.Element {
    const scrolled = useScrollHeader(50);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const logoPrincipal = '/wp-content/themes/glorytemplate/App/Assets/images/logocuadradoblanco.png';

    const toggleMenu = useCallback(() => {
        setMenuAbierto((prev) => !prev);
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenuAbierto(false);
    }, []);

    const items = [
        { titulo: 'Inicio', url: '/' },
        { titulo: 'Servicios', url: '/servicios/' },
        { titulo: 'Casos', url: '/casos/' },
        { titulo: 'Nosotros', url: '/about/' },
        { titulo: 'Contacto', url: '/contacto/', esCta: true },
    ];

    return (
        <header className={`cosmoHeader ${scrolled ? 'scrolled' : ''} ${menuAbierto ? 'open' : ''}`} id="headerCosmo">
            <div className="cosmoHeaderLogo">
                <GloryLink href="/" className="cosmoHeaderLogoSvg" aria-label="Inicio">
                    <img src={logoPrincipal} alt="Cosmo Revenue" className="cosmoHeaderLogoImagen" />
                </GloryLink>
            </div>

            <button
                className="burger"
                onClick={toggleMenu}
                aria-label="Abrir menu"
                aria-expanded={menuAbierto}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            <div className={`background ${menuAbierto ? 'active' : ''}`} />

            <nav className={`nav-links cosmoHeaderMenu ${menuAbierto ? 'open' : ''}`}>
                <ul>
                    {items.map((item, i) => (
                        <li key={item.url}>
                            <GloryLink href={item.url} onClick={cerrarMenu}>
                                {item.titulo}
                            </GloryLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
