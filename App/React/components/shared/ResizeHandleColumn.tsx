/*
 * ResizeHandleColumn
 * Componente para redimensionar ancho de columnas del dashboard
 * Incluye handles internos (entre columnas) y handle externo (ancho total)
 */

import {useState, useCallback, useEffect} from 'react';
import type {ModoColumnas, AnchoColumnas} from '../../hooks/useConfiguracionLayout';

/* Constantes de límites */
const ANCHO_MINIMO_COLUMNA = 25;
const ANCHO_MAXIMO_COLUMNA = 70;
const ANCHO_TOTAL_MINIMO = 60;
const ANCHO_TOTAL_MAXIMO = 100;

interface ResizeHandleColumnProps {
    tipo: 'interno' | 'externo';
    posicion?: 1 | 2;
    modoColumnas: ModoColumnas;
    anchos: AnchoColumnas;
    anchoTotal: number;
    onCambiarAnchos: (anchos: Partial<AnchoColumnas>) => void;
    onCambiarAnchoTotal: (ancho: number) => void;
}

export function ResizeHandleColumn({tipo, posicion = 1, modoColumnas, anchos, anchoTotal, onCambiarAnchos, onCambiarAnchoTotal}: ResizeHandleColumnProps): JSX.Element | null {
    const [arrastrando, setArrastrando] = useState(false);

    /* No mostrar handle interno si solo hay 1 columna */
    if (tipo === 'interno' && modoColumnas === 1) return null;

    /* No mostrar segundo handle interno si solo hay 2 columnas */
    if (tipo === 'interno' && posicion === 2 && modoColumnas < 3) return null;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setArrastrando(true);

            const startX = e.clientX;
            const gridElement = (e.target as HTMLElement).closest('.dashboardGridContenedor');
            if (!gridElement) return;

            const rect = gridElement.getBoundingClientRect();
            const anchoGrid = rect.width;

            /* Capturar valores iniciales */
            const anchosIniciales = {...anchos};
            const anchoTotalInicial = anchoTotal;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaPorcentaje = (deltaX / anchoGrid) * 100;

                if (tipo === 'externo') {
                    /* Handle externo: cambiar ancho total */
                    const nuevoAnchoTotal = Math.min(ANCHO_TOTAL_MAXIMO, Math.max(ANCHO_TOTAL_MINIMO, anchoTotalInicial + deltaPorcentaje));
                    onCambiarAnchoTotal(nuevoAnchoTotal);
                } else {
                    /* Handle interno: redistribuir anchos entre columnas */
                    if (modoColumnas === 2) {
                        const nuevoAncho1 = Math.min(ANCHO_MAXIMO_COLUMNA, Math.max(ANCHO_MINIMO_COLUMNA, anchosIniciales.columna1 + deltaPorcentaje));
                        const nuevoAncho2 = 100 - nuevoAncho1;

                        if (nuevoAncho2 >= ANCHO_MINIMO_COLUMNA && nuevoAncho2 <= ANCHO_MAXIMO_COLUMNA) {
                            onCambiarAnchos({
                                columna1: Math.round(nuevoAncho1 * 10) / 10,
                                columna2: Math.round(nuevoAncho2 * 10) / 10
                            });
                        }
                    } else if (modoColumnas === 3) {
                        if (posicion === 1) {
                            /* Handle entre columna 1 y 2 */
                            const nuevoAncho1 = Math.min(ANCHO_MAXIMO_COLUMNA, Math.max(ANCHO_MINIMO_COLUMNA, anchosIniciales.columna1 + deltaPorcentaje));
                            const espacioRestante = 100 - nuevoAncho1;
                            const proporcion = anchosIniciales.columna2 / (anchosIniciales.columna2 + anchosIniciales.columna3);
                            const nuevoAncho2 = espacioRestante * proporcion;
                            const nuevoAncho3 = espacioRestante - nuevoAncho2;

                            if (nuevoAncho2 >= ANCHO_MINIMO_COLUMNA && nuevoAncho3 >= ANCHO_MINIMO_COLUMNA) {
                                onCambiarAnchos({
                                    columna1: Math.round(nuevoAncho1 * 10) / 10,
                                    columna2: Math.round(nuevoAncho2 * 10) / 10,
                                    columna3: Math.round(nuevoAncho3 * 10) / 10
                                });
                            }
                        } else {
                            /* Handle entre columna 2 y 3 */
                            const nuevoAncho2 = Math.min(100 - anchosIniciales.columna1 - ANCHO_MINIMO_COLUMNA, Math.max(ANCHO_MINIMO_COLUMNA, anchosIniciales.columna2 + deltaPorcentaje));
                            const nuevoAncho3 = 100 - anchosIniciales.columna1 - nuevoAncho2;

                            if (nuevoAncho3 >= ANCHO_MINIMO_COLUMNA) {
                                onCambiarAnchos({
                                    columna2: Math.round(nuevoAncho2 * 10) / 10,
                                    columna3: Math.round(nuevoAncho3 * 10) / 10
                                });
                            }
                        }
                    }
                }
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                setArrastrando(false);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [tipo, posicion, modoColumnas, anchos, anchoTotal, onCambiarAnchos, onCambiarAnchoTotal]
    );

    /* Doble clic para balancear columnas o resetear ancho total */
    const handleDoubleClick = useCallback(() => {
        if (tipo === 'externo') {
            onCambiarAnchoTotal(100);
        } else {
            /* Balancear columnas equitativamente */
            if (modoColumnas === 2) {
                onCambiarAnchos({columna1: 50, columna2: 50});
            } else if (modoColumnas === 3) {
                onCambiarAnchos({columna1: 33.3, columna2: 33.3, columna3: 33.4});
            }
        }
    }, [tipo, modoColumnas, onCambiarAnchos, onCambiarAnchoTotal]);

    const claseBase = tipo === 'externo' ? 'resizeHandleColumnaExterno' : 'resizeHandleColumnaInterno';
    const clasePosicion = tipo === 'interno' ? `resizeHandleColumna--pos${posicion}` : '';
    const claseArrastrando = arrastrando ? 'resizeHandleColumna--arrastrando' : '';
    const titulo = tipo === 'externo' ? 'Arrastra para ajustar ancho total. Doble clic para 100%.' : 'Arrastra para redistribuir. Doble clic para igualar.';

    return (
        <div className={`resizeHandleColumna ${claseBase} ${clasePosicion} ${claseArrastrando}`} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick} title={titulo}>
            <div className="resizeHandleColumnaLinea" />
        </div>
    );
}
