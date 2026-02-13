import React, { useState, useCallback } from 'react';
import { useScrollHeader } from '@app/hooks/useScrollHeader';
import '@app/styles/header.css';

/*
 * Header fijo de Cosmo Revenue.
 * Añade clase 'scrolled' al hacer scroll para cambiar apariencia.
 * Incluye burger menu para mobile.
 */
export function CosmoHeader(): React.JSX.Element {
    const scrolled = useScrollHeader(50);
    const [menuAbierto, setMenuAbierto] = useState(false);

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
        <header className={`cosmoHeader ${scrolled ? 'scrolled' : ''}`} id="headerCosmo">
            <div className="cosmoHeaderInner">
                <a href="/" className="cosmoLogo" aria-label="Inicio">
                    COSMO
                </a>

                <button
                    className={`burgerBtn ${menuAbierto ? 'activo' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Abrir menu"
                    aria-expanded={menuAbierto}
                >
                    <span /><span /><span />
                </button>

                <nav className={`cosmoNav ${menuAbierto ? 'abierto' : ''}`}>
                    {items.map((item) => (
                        <a
                            key={item.url}
                            href={item.url}
                            className={`cosmoNavLink ${item.esCta ? 'menu-btn-cta' : ''}`}
                            onClick={cerrarMenu}
                        >
                            {item.titulo}
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    );
}
