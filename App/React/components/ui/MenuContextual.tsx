/*
 * Componente: MenuContextual
 * Desktop: menú desplegable posicionado en coordenadas absolutas.
 * Móvil (QL25): bottom sheet a pantalla completa, como apps nativas.
 * Se cierra al hacer click fuera, presionar Escape o botón de cierre.
 */

import { type ReactNode, useEffect, useCallback, Fragment, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/componentes/menuContextual.css';
import { BotonBase } from './BotonBase';
import { useEsMovil } from '@app/hooks/useEsMovil';

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
    /** QL59: Forzar modo dropdown (desktop) aunque el viewport sea estrecho */
    forzarDropdown?: boolean;
}

export const MenuContextual = ({
    abierto,
    onCerrar,
    items,
    x,
    y,
    alinearDerecha = false,
    forzarDropdown = false,
}: MenuContextualProps): JSX.Element | null => {
    const esMovil = useEsMovil() && !forzarDropdown;
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [posicionAjustada, setPosicionAjustada] = useState({ left: x, top: y });

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

    /* [183A-44] useLayoutEffect ANTES de returns condicionales para cumplir reglas de hooks.
     * Antes estaba después de `if (!abierto) return null` y `if (esMovil) return ...`,
     * causando error React #310 "Rendered more hooks than previous render" al abrir el menú. */
    useLayoutEffect(() => {
        if (!abierto || esMovil) return;

        const ajustar = () => {
            const nodo = menuRef.current;
            const margen = 8;
            const anchoReal = nodo?.offsetWidth ?? 160;
            const altoReal = nodo?.offsetHeight ?? (items.length * 36 + 8);
            const posX = alinearDerecha ? x - anchoReal : x;
            const left = Math.max(margen, Math.min(posX, window.innerWidth - anchoReal - margen));
            const top = Math.max(margen, Math.min(y, window.innerHeight - altoReal - margen));
            setPosicionAjustada({ left, top });
        };

        ajustar();
        window.addEventListener('resize', ajustar);
        return () => window.removeEventListener('resize', ajustar);
    }, [abierto, esMovil, items.length, x, y, alinearDerecha]);

    if (!abierto) return null;

    /* Contenido de items reutilizado en ambos modos */
    const contenidoItems = items.map((item) => (
        <Fragment key={item.id}>
            {item.href ? (
                <a
                    className={`menuContextualItem ${item.peligro ? 'itemPeligro' : ''}`}
                    href={item.href}
                    onClick={(e) => {
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
            {item.separadorDespues && <div className="menuContextualSeparador" />}
        </Fragment>
    ));

    /* QL25: Bottom sheet en móvil */
    if (esMovil) {
        return createPortal(
            <>
                <div className="menuContextualOverlay" onClick={onCerrar} />
                <div className="menuContextualBottomSheet" role="menu">
                    <div className="menuContextualBottomSheetBarra" />
                    <div className="menuContextualBottomSheetItems">
                        {contenidoItems}
                    </div>
                </div>
            </>,
            document.body
        );
    }

    return createPortal(
        <>
            <div className="menuContextualOverlay" onClick={onCerrar} />
            <div
                className="menuContextual"
                ref={menuRef}
                style={{ left: posicionAjustada.left, top: posicionAjustada.top }}
                role="menu"
            >
                {contenidoItems}
            </div>
        </>,
        document.body
    );
};

export default MenuContextual;
