/*
 * MenuContextual: Componente de menú desplegable con icono de tres puntos/líneas.
 * Reutilizable para acciones contextuales en tarjetas de productos/servicios.
 */

import React, {useState, useRef, useEffect} from 'react';
import {MoreVertical} from 'lucide-react';

export interface AccionMenu {
    id: string;
    label: string;
    icono?: React.ReactNode;
    onClick: () => void;
    peligroso?: boolean;
}

interface MenuContextualProps {
    acciones: AccionMenu[];
    ariaLabel?: string;
}

export const MenuContextual: React.FC<MenuContextualProps> = ({acciones, ariaLabel = 'Menú de acciones'}) => {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cierra el menú al hacer clic fuera */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
                setAbierto(false);
            }
        };

        if (abierto) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [abierto]);

    const handleAccionClick = (accion: AccionMenu) => {
        accion.onClick();
        setAbierto(false);
    };

    return (
        <div className="menuContextualContenedor" ref={contenedorRef}>
            <button className={`menuContextualBoton ${abierto ? 'activo' : ''}`} onClick={() => setAbierto(!abierto)} aria-label={ariaLabel} aria-expanded={abierto} aria-haspopup="true">
                <MoreVertical size={16} />
            </button>

            {abierto && (
                <div className="menuContextualLista" role="menu">
                    {acciones.map(accion => (
                        <button key={accion.id} className={`menuContextualItem ${accion.peligroso ? 'peligroso' : ''}`} onClick={() => handleAccionClick(accion)} role="menuitem">
                            {accion.icono && <span className="menuContextualIcono">{accion.icono}</span>}
                            <span>{accion.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
