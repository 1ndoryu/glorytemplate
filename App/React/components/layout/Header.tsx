import React from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Button} from '../ui/Button';
import '../../styles/header.css';

interface HeaderLink {
    label: string;
    href: string;
    hasDropdown?: boolean;
}

const headerLinks: HeaderLink[] = [
    {label: 'Research', href: '#research'},
    {label: 'Economic Futures', href: '#economics'},
    {label: 'Commitments', href: '#commitments', hasDropdown: true},
    {label: 'Learn', href: '#learn', hasDropdown: true},
    {label: 'News', href: '#news'}
];

export const Header: React.FC = () => {
    return (
        <header className="cabeceraPrincipal">
            <div className="logoContenedor">
                {/* SVG Cercle Rempli Simple como solicitado */}
                <svg viewBox="0 0 24 24" className="logoSvg">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            </div>

            <nav className="navegacionPrincipal">
                {headerLinks.map(link => (
                    <a key={link.label} href={link.href} className="enlaceNavegacion">
                        {link.label}
                        {link.hasDropdown && <ChevronDown size={14} className="iconoDesplegable" />}
                    </a>
                ))}
            </nav>

            <div className="accionCabecera">
                <Button variante="primario" tamano="pequeno" className="botonHeader">
                    Try Glory
                    <ChevronRight size={14} strokeWidth={3} />
                </Button>
            </div>
        </header>
    );
};
