/**
 * Componente: Header
 * Cabecera global del sitio.
 * Enlaces centralizados en data/navegacion.ts (DRY).
 * Incluye submenú dropdown para "Soluciones".
 * Detecta sesión activa via GLORY_CONTEXT para adaptar acciones.
 * Accesibilidad: aria-labels, aria-expanded, navegación por teclado.
 */
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {ChevronDown, ChevronRight, Menu, X} from 'lucide-react';
import {Button} from '../ui/Button';
import {ENLACES_HEADER} from '../../data/navegacion';
import {ModalAutenticacion} from './ModalAutenticacion';
import '../../styles/header.css';

/* Detecta si el usuario tiene sesión activa desde el contexto PHP */
function obtenerEstadoSesion() {
    const ctx = typeof window !== 'undefined' ? window.GLORY_CONTEXT : undefined;
    return {
        logueado: !!ctx?.isLoggedIn,
        usuario: ctx?.usuarioActual ?? null,
    };
}

/* Comprueba si la ruta actual coincide con un path dado */
function esRutaActual(path: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.replace(/\/+$/, '') === path.replace(/\/+$/, '');
}

export const Header: React.FC = () => {
    const [dropdownAbierto, setDropdownAbierto] = useState<string | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
    const {logueado} = obtenerEstadoSesion();
    const enPanel = esRutaActual('/panel');
    const dropdownRef = useRef<HTMLDivElement>(null);

    /* Texto y destino del botón de sesión / panel */
    const textoAccion = logueado ? (enPanel ? 'Volver' : 'Panel') : null;
    const hrefAccion = logueado ? (enPanel ? '/' : '/panel/') : null;

    /* Botón secundario: Chat (logueado) o Contacto */
    const textoCta = logueado ? 'Chat' : 'Contacto';
    const hrefCta = '/contacto/';

    /* Cierra dropdown al hacer Escape */
    const handleKeyDownDropdown = useCallback((e: React.KeyboardEvent, label: string) => {
        if (e.key === 'Escape') {
            setDropdownAbierto(null);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDropdownAbierto(prev => prev === label ? null : label);
        } else if (e.key === 'ArrowDown' && dropdownAbierto === label) {
            e.preventDefault();
            const submenu = dropdownRef.current?.querySelector('.subMenuEnlace') as HTMLElement | null;
            submenu?.focus();
        }
    }, [dropdownAbierto]);

    /* Navegación por teclado dentro del submenú */
    const handleKeyDownSubmenu = useCallback((e: React.KeyboardEvent) => {
        const target = e.currentTarget as HTMLElement;
        if (e.key === 'Escape') {
            setDropdownAbierto(null);
            (target.closest('.enlaceNavegacionWrapper')?.querySelector('.enlaceNavegacion') as HTMLElement)?.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            (target.nextElementSibling as HTMLElement)?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            (target.previousElementSibling as HTMLElement)?.focus();
        }
    }, []);

    /* Cerrar menú móvil con Escape */
    useEffect(() => {
        if (!menuMovilAbierto) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuMovilAbierto(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [menuMovilAbierto]);

    return (
        <>
            <header className="cabeceraPrincipal" role="banner">
                <div className="logoContenedor">
                    <a href="/" className="logoEnlace" aria-label="Nakomi - Ir al inicio">
                        <svg viewBox="0 0 24 24" className="logoSvg" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </a>
                </div>

                {/* Botón hamburguesa para móvil */}
                <button
                    className="botonMenuMovil"
                    onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                    aria-expanded={menuMovilAbierto}
                    aria-controls="navegacion-principal"
                    aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
                >
                    {menuMovilAbierto ? <X size={24} /> : <Menu size={24} />}
                </button>

                <nav
                    className={`navegacionPrincipal ${menuMovilAbierto ? 'navegacionAbierta' : ''}`}
                    id="navegacion-principal"
                    aria-label="Navegación principal"
                >
                    {ENLACES_HEADER.map(link => (
                        <div
                            key={link.label}
                            className="enlaceNavegacionWrapper"
                            ref={link.hasDropdown ? dropdownRef : undefined}
                            onMouseEnter={() => link.hasDropdown ? setDropdownAbierto(link.label) : null}
                            onMouseLeave={() => setDropdownAbierto(null)}
                        >
                            <a
                                href={link.href}
                                className="enlaceNavegacion"
                                aria-expanded={link.hasDropdown ? dropdownAbierto === link.label : undefined}
                                aria-haspopup={link.hasDropdown ? 'true' : undefined}
                                onKeyDown={link.hasDropdown ? (e) => handleKeyDownDropdown(e, link.label) : undefined}
                            >
                                {link.label}
                                {link.hasDropdown && <ChevronDown size={14} className="iconoDesplegable" aria-hidden="true" />}
                            </a>
                            {link.hasDropdown && link.subEnlaces && dropdownAbierto === link.label && (
                                <div className="subMenuDesplegable" role="menu" aria-label={`Submenú de ${link.label}`}>
                                    {link.subEnlaces.map(sub => (
                                        <a
                                            key={sub.label}
                                            href={sub.href}
                                            className="subMenuEnlace"
                                            role="menuitem"
                                            tabIndex={0}
                                            onKeyDown={handleKeyDownSubmenu}
                                        >
                                            {sub.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="accionCabecera" role="group" aria-label="Acciones del usuario">
                    {logueado ? (
                        <a className="enlaceAcceder" href={hrefAccion!}>
                            {textoAccion}
                        </a>
                    ) : (
                        <button className="enlaceAcceder" onClick={() => setModalAbierto(true)}>
                            Acceder
                        </button>
                    )}
                    <Button variante="primario" tamano="pequeno" className="botonHeader" onClick={() => window.location.href = hrefCta}>
                        {textoCta}
                        <ChevronRight size={14} strokeWidth={3} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            {!logueado && (
                <ModalAutenticacion abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
            )}
        </>
    );
};
