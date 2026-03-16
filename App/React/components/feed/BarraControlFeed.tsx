/*
 * BarraControlFeed — Kamples (QL53)
 * Barra reutilizable de ordenamiento para FeedSamples.
 * Cada instancia controla su propio estado de orden independientemente.
 * Patrón extraído de inicioBarraControl en InicioIsland.
 */

import { useState, useRef, useEffect } from 'react';
import { ArrowDownWideNarrow, ChevronDown } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import '../../styles/componentes/barraControlFeed.css';

export type TipoOrdenFeed = 'recientes' | 'nombre' | 'populares' | 'bpm' | 'posicion';

export interface OpcionOrden {
    valor: TipoOrdenFeed;
    etiqueta: string;
}

/* Opciones predeterminadas para listados personales (favoritos, descargas, coleccionados) */
export const OPCIONES_ORDEN_PERSONAL: OpcionOrden[] = [
    { valor: 'recientes', etiqueta: 'Recientes' },
    { valor: 'nombre', etiqueta: 'Nombre' },
    { valor: 'populares', etiqueta: 'Populares' },
    { valor: 'bpm', etiqueta: 'BPM' },
];

/* Opciones para colecciones (incluye orden manual por posición) */
export const OPCIONES_ORDEN_COLECCION: OpcionOrden[] = [
    { valor: 'posicion', etiqueta: 'Manual' },
    { valor: 'recientes', etiqueta: 'Recientes' },
    { valor: 'nombre', etiqueta: 'Nombre' },
    { valor: 'populares', etiqueta: 'Populares' },
    { valor: 'bpm', etiqueta: 'BPM' },
];

interface BarraControlFeedProps {
    opciones: OpcionOrden[];
    ordenActual: TipoOrdenFeed;
    onOrdenCambiar: (orden: TipoOrdenFeed) => void;
    contador?: number;
    etiquetaContador?: string;
    /** QL87: Contenido extra a la derecha (ej: botón de filtros) */
    children?: React.ReactNode;
}

export const BarraControlFeed = ({
    opciones,
    ordenActual,
    onOrdenCambiar,
    contador,
    etiquetaContador,
    children,
}: BarraControlFeedProps): JSX.Element => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    /* Cerrar dropdown al hacer click fuera */
    useEffect(() => {
        if (!menuAbierto) return;
        const manejarClickFuera = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setMenuAbierto(false);
            }
        };
        document.addEventListener('mousedown', manejarClickFuera);
        return () => document.removeEventListener('mousedown', manejarClickFuera);
    }, [menuAbierto]);

    const etiquetaActual = opciones.find(o => o.valor === ordenActual)?.etiqueta ?? 'Ordenar';

    return (
        <div className="barraControlFeed">
            <div className="barraControlFeedIzquierda">
                {contador != null && (
                    <span className="barraControlFeedContador">
                        {contador} {etiquetaContador ?? `sample${contador !== 1 ? 's' : ''}`}
                    </span>
                )}
            </div>
            <div className="barraControlFeedDerecha">
                {children}
                <div className="barraControlFeedOrdenWrapper" ref={wrapperRef}>
                    <BotonBase
                        variante="ghost"
                        className={`barraControlFeedOrdenBtn ${menuAbierto ? 'barraControlFeedOrdenBtnActivo' : ''}`}
                        onClick={() => setMenuAbierto(prev => !prev)}
                        type="button"
                    >
                        <ArrowDownWideNarrow size={14} />
                        {etiquetaActual}
                        <ChevronDown size={12} />
                    </BotonBase>
                    {menuAbierto && (
                        <div className="barraControlFeedOrdenMenu">
                            {opciones.map(opcion => (
                                <BotonBase
                                    key={opcion.valor}
                                    variante="ghost"
                                    className={ordenActual === opcion.valor ? 'barraControlFeedOrdenActivo' : ''}
                                    onClick={() => { onOrdenCambiar(opcion.valor); setMenuAbierto(false); }}
                                    type="button"
                                >
                                    {opcion.etiqueta}
                                </BotonBase>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
