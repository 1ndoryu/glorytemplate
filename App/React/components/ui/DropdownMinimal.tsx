import React, {useEffect, useRef} from 'react';

/*
 * Dropdown minimalista reutilizable.
 * Maneja la visualización del menú y el estilo del botón activador.
 */

interface DropdownMinimalProps {
    etiqueta: string;
    estaAbierto: boolean;
    onToggle: () => void;
    onCerrar: () => void;
    activo?: boolean; /* Si tiene algún valor seleccionado distinto al default */
    children: React.ReactNode;
    anchoMenu?: string;
}

export const DropdownMinimal: React.FC<DropdownMinimalProps> = ({etiqueta, estaAbierto, onToggle, onCerrar, activo = false, children, anchoMenu = '200px'}) => {
    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
                onCerrar();
            }
        };

        if (estaAbierto) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [estaAbierto, onCerrar]);

    return (
        <div className="contenedorDropdown" ref={contenedorRef}>
            <button className={`botonDropdown ${activo ? 'activo' : ''} ${estaAbierto ? 'abierto' : ''}`} onClick={onToggle}>
                {etiqueta}
                <span className="flechaDropdown">▼</span>
            </button>

            {estaAbierto && (
                <div className="menuDropdown" style={{width: anchoMenu}}>
                    {children}
                </div>
            )}
        </div>
    );
};
