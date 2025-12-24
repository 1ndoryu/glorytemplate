/*
 * ResizeHandlePanel
 * Componente reutilizable para redimensionar altura de paneles
 * Lógica inteligente: anclaje a 'auto' cuando se alcanza la altura del contenido
 */

import {useState, useRef, useEffect, useCallback} from 'react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';

/* Límite mínimo de altura en píxeles */
const ALTURA_MINIMA = 120;

/* Margen de tolerancia para activar el anclaje a auto (snap) */
const MARGEN_ANCLAJE = 20;

/* Movimiento mínimo para considerar arrastre intencional */
const MOVIMIENTO_MINIMO = 5;

interface ResizeHandlePanelProps {
    panelId: PanelId;
    alturaInicial: string;
    onCambiarAltura: (panelId: PanelId, altura: string) => void;
    children: (props: {altura: string; isResizing: boolean; contenedorRef: React.RefObject<HTMLDivElement>; esAuto: boolean}) => JSX.Element;
}

export function ResizeHandlePanel({panelId, alturaInicial, onCambiarAltura, children}: ResizeHandlePanelProps): JSX.Element {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [alturaLocal, setAlturaLocal] = useState<string>(alturaInicial);

    /* Determinar si está en modo auto */
    const esAuto = alturaLocal === 'auto';

    /* Sincronizar con altura externa cuando no se está redimensionando */
    useEffect(() => {
        if (!isResizing) {
            setAlturaLocal(alturaInicial);
        }
    }, [alturaInicial, isResizing]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);

            const startY = e.clientY;
            const contenedor = contenedorRef.current;

            if (!contenedor) return;

            /*
             * Medir dimensiones iniciales una sola vez al empezar el arrastre
             * startHeight: altura visual actual
             * contenidoTotal: altura real de todo el contenido (scrollHeight)
             */
            const rect = contenedor.getBoundingClientRect();
            const startHeight = rect.height;
            const contenidoTotal = contenedor.scrollHeight;

            let huboMovimiento = false;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaY = moveEvent.clientY - startY;

                if (Math.abs(deltaY) > MOVIMIENTO_MINIMO) {
                    huboMovimiento = true;
                }

                const alturaDeseada = startHeight + deltaY;

                /*
                 * LÓGICA DE ANCLAJE INTELIGENTE:
                 * Si la altura deseada alcanza o supera la altura real del contenido,
                 * anclamos a 'auto'. Esto hace que el panel se ajuste perfectamente
                 * y crezca si se añade contenido futuro.
                 */
                if (alturaDeseada >= contenidoTotal - MARGEN_ANCLAJE) {
                    setAlturaLocal('auto');
                } else {
                    const nuevaAltura = Math.max(ALTURA_MINIMA, alturaDeseada);
                    setAlturaLocal(`${Math.round(nuevaAltura)}px`);
                }
            };

            const handleMouseUp = (upEvent: MouseEvent) => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                setIsResizing(false);

                const deltaY = upEvent.clientY - startY;

                /* Si no hubo movimiento real, no hacemos nada (salvo que fuera un click muy quieto) */
                if (!huboMovimiento && Math.abs(deltaY) <= MOVIMIENTO_MINIMO) {
                    setAlturaLocal(alturaInicial);
                    return;
                }

                const alturaDeseada = startHeight + deltaY;

                /* Persistir la decisión final: auto o px */
                if (alturaDeseada >= contenidoTotal - MARGEN_ANCLAJE) {
                    onCambiarAltura(panelId, 'auto');
                } else {
                    const alturaFinal = Math.max(ALTURA_MINIMA, alturaDeseada);
                    onCambiarAltura(panelId, `${Math.round(alturaFinal)}px`);
                }
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [panelId, onCambiarAltura, alturaInicial]
    );

    /* Doble clic para alternar manualmente */
    const handleDoubleClick = useCallback(() => {
        if (esAuto) {
            /* Fijar a la altura actual visual */
            const alturaActual = contenedorRef.current?.getBoundingClientRect().height || 300;
            onCambiarAltura(panelId, `${Math.round(alturaActual)}px`);
        } else {
            onCambiarAltura(panelId, 'auto');
        }
    }, [esAuto, panelId, onCambiarAltura]);

    return (
        <div className={`panelConResize ${isResizing ? 'panelRedimensionando' : ''} ${esAuto ? 'panelAlturaAuto' : 'panelAlturaFija'}`}>
            {children({
                altura: alturaLocal,
                isResizing,
                contenedorRef,
                esAuto
            })}

            <div className="panelResizeHandle" onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick} title={esAuto ? 'Modo Auto: crece con el contenido. Arrastra arriba para fijar.' : 'Altura fija. Arrastra abajo al límite para modo Auto.'}>
                <div className={`panelResizeLine ${esAuto ? 'panelResizeLineAuto' : ''}`}></div>
            </div>
        </div>
    );
}
