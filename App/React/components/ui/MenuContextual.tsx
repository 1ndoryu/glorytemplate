/*
 * Componente: MenuContextual
 * Menú desplegable posicionado en coordenadas absolutas.
 * Se cierra al hacer click fuera o presionar Escape.
 */

import { type ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/componentes/menuContextual.css';
import { BotonBase } from './BotonBase';

export interface MenuItemDef {
    id: string;
    etiqueta: string;
    icono?: ReactNode;
    peligro?: boolean;
    separadorDespues?: boolean;
    href?: string;
    onClick: () => void;
}

interface MenuContextualProps {
    abierto: boolean;
    onCerrar: () => void;
    items: MenuItemDef[];
    x: number;
    y: number;
    alinearDerecha?: boolean;
}

export const MenuContextual = ({
    abierto,
    onCerrar,
    items,
    x,
    y,
    alinearDerecha = false,
}: MenuContextualProps): JSX.Element | null => {
    const manejarKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCerrar();
            }
        },
        [onCerrar]
    );

    useEffect(() => {
        if (!abierto) return;
        document.addEventListener('keydown', manejarKeyDown);
        return () => document.removeEventListener('keydown', manejarKeyDown);
    }, [abierto, manejarKeyDown]);

    if (!abierto) return null;

    /* Ajustar posición para que no se salga de pantalla */
    const menuAncho = 160;
    const menuAlto = items.length * 36 + 8;
    const posX = alinearDerecha ? x - menuAncho : x;
    const ajusteX = posX + menuAncho > window.innerWidth
        ? window.innerWidth - menuAncho - 8
        : Math.max(8, posX);
    const ajusteY = y + menuAlto > window.innerHeight ? window.innerHeight - menuAlto - 8 : y;

    return createPortal(
        <>
            <div className="menuContextualOverlay" onClick={onCerrar} />
            <div
                className="menuContextual"
                style={{ left: ajusteX, top: ajusteY }}
                role="menu"
            >
                {items.map((item) => (
                    <div key={item.id}>
                        {item.href ? (
                            /* Usar <a> para items con href: permite middle-click en nueva pestaña */
                            <a
                                className={`menuContextualItem ${item.peligro ? 'itemPeligro' : ''}`}
                                href={item.href}
                                onClick={(e) => {
                                    /* Solo interceptar click izquierdo sin modificadores para SPA */
                                    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                        e.preventDefault();
                                        item.onClick();
                                        onCerrar();
                                    }
                                }}
                                onAuxClick={() => onCerrar()}
                                role="menuitem"
                            >
                                {item.icono && (
                                    <span className="menuContextualItemIcono">{item.icono}</span>
                                )}
                                {item.etiqueta}
                            </a>
                        ) : (
                            <BotonBase variante="ghost"
                                className={`menuContextualItem ${item.peligro ? 'itemPeligro' : ''}`}
                                onClick={() => {
                                    item.onClick();
                                    onCerrar();
                                }}
                                role="menuitem"
                                type="button"
                            >
                                {item.icono && (
                                    <span className="menuContextualItemIcono">{item.icono}</span>
                                )}
                                {item.etiqueta}
                            </BotonBase>
                        )}
                        {/* Separador eliminado por C102 */}
                    </div>
                ))}
            </div>
        </>,
        document.body
    );
};

export default MenuContextual;
