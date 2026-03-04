/**
 * Header compartido — Navegación principal del sitio.
 */

import { GloryLink } from '@/core/router/GloryLink';
import { useNavigation } from '@/hooks';
import { useState, useCallback } from 'react';

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
    const [menuAbierto, setMenuAbierto] = useState(false);

    const toggleMenu = useCallback(() => setMenuAbierto(a => !a), []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
            transparente ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md shadow-sm'
        }`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <GloryLink href="/" className="flex items-center gap-2 group">
                        <span className={`text-2xl font-bold tracking-tight transition-colors ${
                            transparente ? 'text-white' : 'text-green-700'
                        }`}>
                            Cresta<span className="font-light">Campers</span>
                        </span>
                    </GloryLink>

                    {/* Nav desktop */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map(item => (
                            <GloryLink
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    esRutaActiva(item.href)
                                        ? (transparente ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700')
                                        : (transparente ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
                                }`}
                            >
                                {item.label}
                            </GloryLink>
                        ))}

                        <GloryLink
                            href="/reservar/"
                            className="ml-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                        >
                            Reservar ahora
                        </GloryLink>
                    </div>

                    {/* Hamburger mobile */}
                    <button
                        onClick={toggleMenu}
                        className={`md:hidden p-2 rounded-lg transition-colors ${
                            transparente ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        aria-label="Abrir menú"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuAbierto
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {menuAbierto && (
                    <div className="md:hidden pb-4 border-t border-gray-100 bg-white rounded-b-2xl shadow-lg">
                        <div className="flex flex-col gap-1 pt-3 px-2">
                            {NAV_ITEMS.map(item => (
                                <GloryLink
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMenuAbierto(false)}
                                    className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                                        esRutaActiva(item.href)
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {item.label}
                                </GloryLink>
                            ))}
                            <GloryLink
                                href="/reservar/"
                                onClick={() => setMenuAbierto(false)}
                                className="mt-2 bg-green-600 text-white font-semibold px-4 py-3 rounded-xl text-center"
                            >
                                Reservar ahora
                            </GloryLink>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
