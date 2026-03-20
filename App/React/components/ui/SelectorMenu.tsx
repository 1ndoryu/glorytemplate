/*
 * Componente: SelectorMenu
 * Dropdown custom que reemplaza el <select> nativo del navegador.
 * Se abre como menú contextual posicionado debajo del trigger.
 * Cierre con Escape, click fuera o selección de opción.
 */

import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/selectorMenu.css';

export interface OpcionSelector {
    valor: string;
    etiqueta: string;
    icono?: ReactNode;
}

interface SelectorMenuProps {
    opciones: OpcionSelector[];
    valor: string;
    onChange: (valor: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    compacto?: boolean;
    etiqueta?: string;
}

export const SelectorMenu = ({
    opciones,
    valor,
    onChange,
    placeholder,
    className = '',
    disabled = false,
    compacto = false,
    etiqueta,
}: SelectorMenuProps): JSX.Element => {
    const { t } = useT();
    const resolvedPlaceholder = placeholder ?? t('selector.seleccionar');
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    const opcionActual = opciones.find(o => o.valor === valor);
    const textoMostrado = opcionActual?.etiqueta ?? resolvedPlaceholder;

    /* Calcular posición al abrir */
    const abrir = useCallback(() => {
        if (disabled || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const espacioAbajo = window.innerHeight - rect.bottom;
        const altoEstimado = Math.min(opciones.length * 36 + 8, 240);

        /* Si no cabe abajo, abrir arriba */
        const top = espacioAbajo >= altoEstimado
            ? rect.bottom + 4
            : rect.top - altoEstimado - 4;

        setPosicion({
            top,
            left: rect.left,
            width: Math.max(rect.width, 160),
        });
        setAbierto(true);
    }, [disabled, opciones.length]);

    const cerrar = useCallback(() => setAbierto(false), []);

    const seleccionar = useCallback((nuevoValor: string) => {
        onChange(nuevoValor);
        cerrar();
    }, [onChange, cerrar]);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!abierto) return;
        const manejar = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cerrar();
        };
        document.addEventListener('keydown', manejar);
        return () => document.removeEventListener('keydown', manejar);
    }, [abierto, cerrar]);

    const clasesContenedor = [
        'selectorMenuContenedor',
        compacto ? 'selectorMenuCompacto' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={clasesContenedor}>
            {etiqueta && <label className="etiquetaCampoTexto">{etiqueta}</label>}
            <button
                ref={triggerRef}
                type="button"
                className={`selectorMenuTrigger ${abierto ? 'selectorMenuTriggerAbierto' : ''}`}
                onClick={abierto ? cerrar : abrir}
                disabled={disabled}
            >
                <span className={opcionActual ? '' : 'selectorMenuPlaceholder'}>
                    {opcionActual?.icono && (
                        <span className="selectorMenuOpcionIcono">{opcionActual.icono}</span>
                    )}
                    {textoMostrado}
                </span>
                <ChevronDown size={14} className="selectorMenuIconoChevron" />
            </button>

            {abierto && createPortal(
                <>
                    <div className="selectorMenuOverlay" onClick={cerrar} />
                    <div
                        className="selectorMenuDropdown"
                        style={{
                            top: posicion.top,
                            left: posicion.left,
                            minWidth: posicion.width,
                        }}
                        role="listbox"
                    >
                        {opciones.map(op => (
                            <button
                                key={op.valor}
                                type="button"
                                className={`selectorMenuOpcion ${op.valor === valor ? 'selectorMenuOpcionActiva' : ''}`}
                                onClick={() => seleccionar(op.valor)}
                                role="option"
                                aria-selected={op.valor === valor}
                            >
                                {op.icono && (
                                    <span className="selectorMenuOpcionIcono">{op.icono}</span>
                                )}
                                {op.etiqueta}
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default SelectorMenu;
