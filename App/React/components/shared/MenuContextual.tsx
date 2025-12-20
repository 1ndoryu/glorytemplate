/*
 * MenuContextual
 * Componente de menu contextual reutilizable para click derecho
 * Responsabilidad unica: mostrar acciones contextuales en posicion del cursor
 */

import {useEffect, useRef, useCallback} from 'react';

interface OpcionMenu {
    id: string;
    etiqueta: string;
    icono?: React.ReactNode;
    peligroso?: boolean;
    deshabilitado?: boolean;
    separadorDespues?: boolean;
}

interface MenuContextualProps {
    opciones: OpcionMenu[];
    posicionX: number;
    posicionY: number;
    onSeleccionar: (opcionId: string) => void;
    onCerrar: () => void;
}

export function MenuContextual({opciones, posicionX, posicionY, onSeleccionar, onCerrar}: MenuContextualProps): JSX.Element {
    const menuRef = useRef<HTMLDivElement>(null);

    /* Ajustar posicion si el menu se sale de la pantalla */
    const calcularPosicion = useCallback(() => {
        if (!menuRef.current) return {x: posicionX, y: posicionY};

        const menu = menuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let ajusteX = posicionX;
        let ajusteY = posicionY;

        /* Ajustar si se sale por la derecha */
        if (posicionX + menuRect.width > viewportWidth - 10) {
            ajusteX = viewportWidth - menuRect.width - 10;
        }

        /* Ajustar si se sale por abajo */
        if (posicionY + menuRect.height > viewportHeight - 10) {
            ajusteY = viewportHeight - menuRect.height - 10;
        }

        return {x: Math.max(10, ajusteX), y: Math.max(10, ajusteY)};
    }, [posicionX, posicionY]);

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        const manejarClickFuera = (evento: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(evento.target as Node)) {
                onCerrar();
            }
        };

        const manejarEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                onCerrar();
            }
        };

        /* Usar timeout para evitar cerrar inmediatamente */
        const timeout = setTimeout(() => {
            document.addEventListener('click', manejarClickFuera);
            document.addEventListener('contextmenu', manejarClickFuera);
        }, 0);

        document.addEventListener('keydown', manejarEscape);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('click', manejarClickFuera);
            document.removeEventListener('contextmenu', manejarClickFuera);
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [onCerrar]);

    /* Posicionar el menu despues de renderizar */
    useEffect(() => {
        if (menuRef.current) {
            const {x, y} = calcularPosicion();
            menuRef.current.style.left = `${x}px`;
            menuRef.current.style.top = `${y}px`;
        }
    }, [calcularPosicion]);

    const manejarClick = useCallback(
        (opcion: OpcionMenu) => {
            if (opcion.deshabilitado) return;
            onSeleccionar(opcion.id);
            onCerrar();
        },
        [onSeleccionar, onCerrar]
    );

    return (
        <div id="menu-contextual" ref={menuRef} className="menuContextual" role="menu" aria-orientation="vertical">
            {opciones.map(opcion => (
                <div key={opcion.id}>
                    <button type="button" className={`menuContextualOpcion ${opcion.peligroso ? 'menuContextualOpcionPeligrosa' : ''} ${opcion.deshabilitado ? 'menuContextualOpcionDeshabilitada' : ''}`} onClick={() => manejarClick(opcion)} disabled={opcion.deshabilitado} role="menuitem">
                        {opcion.icono && <span className="menuContextualIcono">{opcion.icono}</span>}
                        <span className="menuContextualEtiqueta">{opcion.etiqueta}</span>
                    </button>
                    {opcion.separadorDespues && <div className="menuContextualSeparador" />}
                </div>
            ))}
        </div>
    );
}

export type {OpcionMenu, MenuContextualProps};
