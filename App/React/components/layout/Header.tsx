/**
 * Componente: Header
 * Cabecera global del sitio.
 * Enlaces centralizados en data/navegacion.ts (DRY).
 */
import React from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Button} from '../ui/Button';
import {ENLACES_HEADER} from '../../data/navegacion';
import '../../styles/header.css';

export const Header: React.FC = () => {
    return (
        <header className="cabeceraPrincipal">
            <div className="logoContenedor">
                <svg viewBox="0 0 24 24" className="logoSvg">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            </div>

            <nav className="navegacionPrincipal">
                {ENLACES_HEADER.map(link => (
                    <a key={link.label} href={link.href} className="enlaceNavegacion">
                        {link.label}
                        {link.hasDropdown && <ChevronDown size={14} className="iconoDesplegable" />}
                    </a>
                ))}
            </nav>

            <div className="accionCabecera">
                <Button variante="primario" tamano="pequeno" className="botonHeader">
                    Try Nakomi
                    <ChevronRight size={14} strokeWidth={3} />
                </Button>
            </div>
        </header>
    );
};
