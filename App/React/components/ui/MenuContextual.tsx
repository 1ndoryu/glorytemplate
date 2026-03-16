/*
 * Componente: MenuContextual
 * Desktop: menú desplegable posicionado en coordenadas absolutas.
 * Móvil (QL25): bottom sheet a pantalla completa, como apps nativas.
 * Se cierra al hacer click fuera, presionar Escape o botón de cierre.
 */

import { type ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
}

export const MenuContextual = ({
    abierto,
    onCerrar,
    items,
    x,
    y,
    alinearDerecha = false,
}: MenuContextualProps): JSX.Element | null => {
    const esMovil = useEsMovil();

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

    /* Contenido de items reutilizado en ambos modos */
    const contenidoItems = items.map((item) => (
        <div key={item.id}>
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
        </div>
    ));

    /* QL25: Bottom sheet en móvil */
    if (esMovil) {
        return createPortal(
            <>
                <div className="menuContextualOverlay" onClick={onCerrar} />
                <div className="menuContextualBottomSheet" role="menu">
                    <div className="menuContextualBottomSheetBarra" />
                    <div className="menuContextualBottomSheetCabecera">
                        <BotonBase variante="ghost" className="menuContextualBottomSheetCerrar"
                            onClick={onCerrar} type="button" aria-label="Cerrar">
                            <X size={20} />
                        </BotonBase>
                    </div>
                    <div className="menuContextualBottomSheetItems">
                        {contenidoItems}
                    </div>
                </div>
            </>,
            document.body
        );
    }

    /* Desktop: posicionamiento absoluto */
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
                {contenidoItems}
            </div>
        </>,
        document.body
    );
};

export default MenuContextual;
