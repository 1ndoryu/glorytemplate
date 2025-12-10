// Componente Header
// Cabecera con navegacion principal y menu movil

import {useState} from 'react';
import {Menu, X} from 'lucide-react';
import {Button} from '../ui/Button';

interface NavItem {
    label: string;
    href: string;
}

interface HeaderProps {
    logoText: string;
    navItems: NavItem[];
    ctaText: string;
    ctaHref: string;
    loginText?: string;
    loginHref?: string;
}

// Logo SVG como componente interno
function Logo() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#292524]">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
            <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function Header({logoText, navItems, ctaText, ctaHref, loginText = 'Login', loginHref = '#'}: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-[#f8f8f6]/80 backdrop-blur-md">
            <div className="mx-auto w-full max-w-7xl px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <a href="/" className="font-bold text-lg tracking-tighter flex items-center gap-2 text-[#292524]">
                        <Logo />
                        {logoText}
                    </a>
                    <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-[#79716b]">
                        {navItems.map(item => (
                            <a key={item.label} href={item.href} className="hover:text-[#292524] transition-colors">
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <a href={loginHref} className="hidden md:inline-flex text-[13px] font-medium text-[#79716b] hover:text-[#292524]">
                        {loginText}
                    </a>
                    <Button href={ctaHref} className="hidden md:inline-flex bg-[#292524] text-white hover:bg-black border-0">
                        {ctaText}
                    </Button>
                    <button className="md:hidden text-[#57534e]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Menu movil */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-[#e5e5e0] bg-[#f8f8f6] p-4 space-y-4 shadow-lg">
                    {navItems.map(item => (
                        <a key={item.label} href={item.href} className="block text-sm font-medium text-[#57534e]">
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
