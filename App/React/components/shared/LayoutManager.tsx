/*
 * LayoutManager
 * Componente que orquesta el layout del dashboard
 * Maneja columnas redimensionables y distribución de paneles
 */

import {useState, useRef, useCallback, useEffect, ReactNode, CSSProperties} from 'react';
import type {ModoColumnas, AnchoColumnas} from '../../hooks/useConfiguracionLayout';
import {ANCHO_MINIMO_COLUMNA, ANCHO_MAXIMO_COLUMNA} from '../../hooks/useConfiguracionLayout';

interface LayoutManagerProps {
    modoColumnas: ModoColumnas;
    anchos: AnchoColumnas;
    onAjustarAnchos?: (anchos: Partial<AnchoColumnas>) => void;
    columna1?: ReactNode;
    columna2?: ReactNode;
    columna3?: ReactNode;
    habilitarResize?: boolean;
}

export function LayoutManager({modoColumnas, anchos, onAjustarAnchos, columna1, columna2, columna3, habilitarResize = true}: LayoutManagerProps): JSX.Element {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [arrastrando, setArrastrando] = useState<'handle1' | 'handle2' | null>(null);

    /* Manejar inicio de arrastre */
    const iniciarArrastre = useCallback(
        (handle: 'handle1' | 'handle2') => (e: React.MouseEvent) => {
            e.preventDefault();
            setArrastrando(handle);
        },
        []
    );

    /* Manejar movimiento durante arrastre */
    const manejarMovimiento = useCallback(
        (e: MouseEvent) => {
            if (!arrastrando || !contenedorRef.current || !onAjustarAnchos) return;

            const rect = contenedorRef.current.getBoundingClientRect();
            const posicionRelativa = ((e.clientX - rect.left) / rect.width) * 100;

            if (modoColumnas === 2 && arrastrando === 'handle1') {
                const nuevoAncho1 = Math.min(Math.max(posicionRelativa, ANCHO_MINIMO_COLUMNA), ANCHO_MAXIMO_COLUMNA);
                const nuevoAncho2 = 100 - nuevoAncho1;

                if (nuevoAncho2 >= ANCHO_MINIMO_COLUMNA) {
                    onAjustarAnchos({
                        columna1: nuevoAncho1,
                        columna2: nuevoAncho2
                    });
                }
            } else if (modoColumnas === 3) {
                if (arrastrando === 'handle1') {
                    const nuevoAncho1 = Math.min(Math.max(posicionRelativa, ANCHO_MINIMO_COLUMNA), ANCHO_MAXIMO_COLUMNA);
                    const espacioRestante = 100 - nuevoAncho1;
                    const proporcion = anchos.columna2 / (anchos.columna2 + anchos.columna3);
                    const nuevoAncho2 = espacioRestante * proporcion;
                    const nuevoAncho3 = espacioRestante - nuevoAncho2;

                    if (nuevoAncho2 >= ANCHO_MINIMO_COLUMNA && nuevoAncho3 >= ANCHO_MINIMO_COLUMNA) {
                        onAjustarAnchos({
                            columna1: nuevoAncho1,
                            columna2: nuevoAncho2,
                            columna3: nuevoAncho3
                        });
                    }
                } else if (arrastrando === 'handle2') {
                    const anchoColumna1 = anchos.columna1;
                    const anchoDisponible = 100 - anchoColumna1;
                    const posicionEnDisponible = posicionRelativa - anchoColumna1;
                    const nuevoAncho2 = Math.min(Math.max(posicionEnDisponible, ANCHO_MINIMO_COLUMNA), anchoDisponible - ANCHO_MINIMO_COLUMNA);
                    const nuevoAncho3 = anchoDisponible - nuevoAncho2;

                    if (nuevoAncho3 >= ANCHO_MINIMO_COLUMNA) {
                        onAjustarAnchos({
                            columna2: nuevoAncho2,
                            columna3: nuevoAncho3
                        });
                    }
                }
            }
        },
        [arrastrando, modoColumnas, anchos, onAjustarAnchos]
    );

    /* Manejar fin de arrastre */
    const finalizarArrastre = useCallback(() => {
        setArrastrando(null);
    }, []);

    /* Efecto para manejar listeners de documento */
    useEffect(() => {
        if (!arrastrando) return;

        document.addEventListener('mousemove', manejarMovimiento);
        document.addEventListener('mouseup', finalizarArrastre);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', manejarMovimiento);
            document.removeEventListener('mouseup', finalizarArrastre);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [arrastrando, manejarMovimiento, finalizarArrastre]);

    /* Calcular estilos dinámicos del grid */
    const calcularEstiloGrid = (): CSSProperties => {
        if (modoColumnas === 1) {
            return {
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--dashboard-espacioXl)'
            };
        }

        const columnas = modoColumnas === 2 ? `${anchos.columna1}% ${anchos.columna2}%` : `${anchos.columna1}% ${anchos.columna2}% ${anchos.columna3}%`;

        return {
            display: 'grid',
            gridTemplateColumns: columnas,
            gap: 'var(--dashboard-espacioXl)'
        };
    };

    /* Renderizar handle de resize */
    const renderizarHandle = (id: 'handle1' | 'handle2') => {
        if (!habilitarResize || !onAjustarAnchos) return null;
        if (modoColumnas === 1) return null;
        if (modoColumnas === 2 && id === 'handle2') return null;

        return (
            <div className={`layoutResizeHandle ${arrastrando === id ? 'activo' : ''}`} onMouseDown={iniciarArrastre(id)} title="Arrastrar para redimensionar">
                <div className="layoutResizeHandleLinea" />
            </div>
        );
    };

    return (
        <div ref={contenedorRef} className={`layoutManager modo${modoColumnas}Columnas ${arrastrando ? 'arrastrando' : ''}`} style={calcularEstiloGrid()}>
            {/* Columna 1 */}
            <div className="layoutColumna layoutColumna1">{columna1}</div>

            {/* Handle 1 (entre columna 1 y 2) */}
            {modoColumnas >= 2 && renderizarHandle('handle1')}

            {/* Columna 2 */}
            {modoColumnas >= 2 && <div className="layoutColumna layoutColumna2">{columna2}</div>}

            {/* Handle 2 (entre columna 2 y 3) */}
            {modoColumnas === 3 && renderizarHandle('handle2')}

            {/* Columna 3 */}
            {modoColumnas === 3 && <div className="layoutColumna layoutColumna3">{columna3}</div>}
        </div>
    );
}
