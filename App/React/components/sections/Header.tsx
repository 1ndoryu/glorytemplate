// Componente Header
// Cabecera con navegacion principal y menu movil

import {useState} from 'react';
import {Menu, X} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {Button} from '../ui/Button';
import {useSiteImages, useSiteIdentity} from '../../hooks/useSiteConfig';

interface NavItem {
    label: string;
    href: string;
}

interface HeaderProps {
    logoText?: string;
    navItems: NavItem[];
    ctaText: string;
    ctaHref: string;
}

// Logo SVG por defecto
function DefaultLogo() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
            <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// Componente Logo reutilizable
function Logo({logoMode, logoImageUrl, displayLogoText}: {logoMode: string; logoImageUrl: string; displayLogoText: string}) {
    if (logoMode === 'image' && logoImageUrl) {
        return <img src={logoImageUrl} alt={displayLogoText} className="h-8 w-auto" />;
    }
    if (displayLogoText) {
        return <span>{displayLogoText}</span>;
    }
    return <DefaultLogo />;
}

export function Header({logoText: propLogoText, navItems, ctaText, ctaHref}: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const images = useSiteImages();
    const identity = useSiteIdentity();

    // Determinar que logo mostrar
    const logoMode = images.logoMode || 'text';
    const logoImageUrl = images.logo;
    const displayLogoText = images.logoText || propLogoText || identity.name;

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <header className="w-full backdrop-blur-xl bg-[var(--color-bg-primary)]/60">
                <div className="mx-auto w-full max-w-7xl px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <a href="/" className="font-bold text-lg tracking-tighter flex items-center gap-2 text-primary">
                            <Logo logoMode={logoMode} logoImageUrl={logoImageUrl} displayLogoText={displayLogoText} />
                        </a>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
                            {navItems.map(item => (
                                <a key={item.label} href={item.href} className="hover:opacity-80 transition-colors">
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button href={ctaHref} className="hidden md:inline-flex">
                            {ctaText}
                        </Button>
                        <button className="md:hidden text-secondary p-2 -mr-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu">
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Menu movil - Pantalla completa con animacion */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div className="md:hidden fixed inset-0 z-[100] backdrop-blur-xl bg-[var(--color-bg-primary)]/60 flex flex-col" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.2}}>
                        {/* Header del menu con boton cerrar */}
                        <motion.div className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-border-primary)]/50 flex-shrink-0" initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.05}}>
                            <a href="/" className="font-bold text-lg tracking-tighter text-primary" onClick={closeMobileMenu}>
                                <Logo logoMode={logoMode} logoImageUrl={logoImageUrl} displayLogoText={displayLogoText} />
                            </a>
                            <button className="text-secondary p-2 -mr-2" onClick={closeMobileMenu} aria-label="Cerrar menu">
                                <X size={24} />
                            </button>
                        </motion.div>

                        {/* Links de navegacion con animacion escalonada */}
                        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                            {navItems.map((item, index) => (
                                <motion.a key={item.label} href={item.href} onClick={closeMobileMenu} className="block text-lg font-medium py-4 px-4 rounded-xl text-primary hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-tertiary)] transition-colors" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.1 + index * 0.05}}>
                                    {item.label}
                                </motion.a>
                            ))}
                        </nav>

                        {/* CTA fijo en la parte inferior */}
                        <motion.div className="p-4 border-t border-[var(--color-border-primary)]/50 flex-shrink-0" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.15 + navItems.length * 0.05}}>
                            <a href={ctaHref} onClick={closeMobileMenu} className="flex items-center justify-center w-full h-12 rounded-lg bg-[var(--color-accent-primary)] text-white font-medium text-base shadow-lg shadow-[var(--color-accent-primary)]/25 active:scale-[0.98] transition-transform">
                                {ctaText}
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
