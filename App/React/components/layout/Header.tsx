/**
 * Componente: Header
 * Cabecera global del sitio.
 * Enlaces centralizados en data/navegacion.ts (DRY).
 * Incluye submenú dropdown para "Soluciones".
 * Detecta sesión activa via GLORY_CONTEXT para adaptar acciones.
 */
import React, {useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
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
    const {logueado} = obtenerEstadoSesion();
    const enPanel = esRutaActual('/panel');

    /* Texto y destino del botón de sesión / panel */
    const textoAccion = logueado ? (enPanel ? 'Volver' : 'Panel') : null;
    const hrefAccion = logueado ? (enPanel ? '/' : '/panel/') : null;

    /* Botón secundario: Chat (logueado) o Contacto */
    const textoCta = logueado ? 'Chat' : 'Contacto';
    const hrefCta = '/contacto/';

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
                        <ChevronRight size={14} strokeWidth={3} />
                    </Button>
                </div>
            </header>

            {!logueado && (
                <ModalAutenticacion abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
            )}
        </>
    );
};
