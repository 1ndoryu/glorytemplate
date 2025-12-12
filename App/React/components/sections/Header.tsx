// Componente Header
// Cabecera con navegacion principal y menu movil

import {useState} from 'react';
import {Menu, X} from 'lucide-react';
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

export function Header({logoText: propLogoText, navItems, ctaText, ctaHref}: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const images = useSiteImages();
    const identity = useSiteIdentity();

    // Determinar que logo mostrar
    const logoMode = images.logoMode || 'text';
    const logoImageUrl = images.logo;
    const displayLogoText = images.logoText || propLogoText || identity.name;

    return (
        <header className="w-full backdrop-blur-md bg-[var(--color-bg-primary)]/80">
            <div className="mx-auto w-full max-w-7xl px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <a href="/" className="font-bold text-lg tracking-tighter flex items-center gap-2 text-primary">
                        {logoMode === 'image' && logoImageUrl ? <img src={logoImageUrl} alt={displayLogoText} className="h-8 w-auto" /> : displayLogoText ? <span>{displayLogoText}</span> : <DefaultLogo />}
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
                    <button className="md:hidden text-secondary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Menu movil */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 shadow-lg border-primary bg-primary">
                    {navItems.map(item => (
                        <a key={item.label} href={item.href} className="block text-sm font-medium text-secondary">
                            {item.label}
                        </a>
                    ))}
                    <Button href={ctaHref} className="w-full">
                        {ctaText}
                    </Button>
                </div>
            )}
        </header>
    );
}
