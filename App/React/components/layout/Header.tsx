/**
 * Componente: Header
 * Cabecera global del sitio.
 * Enlaces centralizados en data/navegacion.ts (DRY).
 * Incluye submenú dropdown para "Soluciones".
 */
import React, {useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Button} from '../ui/Button';
import {ENLACES_HEADER} from '../../data/navegacion';
import {ModalAutenticacion} from './ModalAutenticacion';
import '../../styles/header.css';

export const Header: React.FC = () => {
    const [dropdownAbierto, setDropdownAbierto] = useState<string | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);

    return (
        <>
            <header className="cabeceraPrincipal">
                <div className="logoContenedor">
                    <a href="/" className="logoEnlace">
                        <svg viewBox="0 0 24 24" className="logoSvg">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </a>
                </div>

                <nav className="navegacionPrincipal">
                    {ENLACES_HEADER.map(link => (
                        <div
                            key={link.label}
                            className="enlaceNavegacionWrapper"
                            onMouseEnter={() => link.hasDropdown ? setDropdownAbierto(link.label) : null}
                            onMouseLeave={() => setDropdownAbierto(null)}
                        >
                            <a href={link.href} className="enlaceNavegacion">
                                {link.label}
                                {link.hasDropdown && <ChevronDown size={14} className="iconoDesplegable" />}
                            </a>
                            {link.hasDropdown && link.subEnlaces && dropdownAbierto === link.label && (
                                <div className="subMenuDesplegable">
                                    {link.subEnlaces.map(sub => (
                                        <a key={sub.label} href={sub.href} className="subMenuEnlace">
                                            {sub.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="accionCabecera">
                    <button className="enlaceAcceder" onClick={() => setModalAbierto(true)}>
                        Acceder
                    </button>
                    <Button variante="primario" tamano="pequeno" className="botonHeader" onClick={() => window.location.href = '/contacto/'}>
                        Contacto
                        <ChevronRight size={14} strokeWidth={3} />
                    </Button>
                </div>
            </header>

            <ModalAutenticacion abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
        </>
    );
};
