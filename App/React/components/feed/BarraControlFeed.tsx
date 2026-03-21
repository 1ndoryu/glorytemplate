/*
 * BarraControlFeed — Kamples (QL53)
 * Barra reutilizable de ordenamiento para FeedSamples.
 * Cada instancia controla su propio estado de orden independientemente.
 * Patrón extraído de inicioBarraControl en InicioIsland.
 */

import { useState, useRef, useEffect } from 'react';
import { ArrowDownWideNarrow, ChevronDown } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/barraControlFeed.css';

export type TipoOrdenFeed = 'recientes' | 'nombre' | 'populares' | 'bpm' | 'posicion';

export interface OpcionOrden {
    valor: TipoOrdenFeed;
    etiqueta: string;
}

/* Opciones predeterminadas para listados personales (favoritos, descargas, coleccionados) */
export const OPCIONES_ORDEN_PERSONAL: OpcionOrden[] = [
    { valor: 'recientes', etiqueta: 'feed.orden.recientes' },
    { valor: 'nombre', etiqueta: 'feed.orden.nombre' },
    { valor: 'populares', etiqueta: 'feed.orden.populares' },
    { valor: 'bpm', etiqueta: 'feed.orden.bpm' },
];

/* Opciones para colecciones (incluye orden manual por posición) */
/* [2103A-3] 'posicion' renombrado a 'Inteligente': tiebreaker ahora es engagement (likes+descargas) */
export const OPCIONES_ORDEN_COLECCION: OpcionOrden[] = [
    { valor: 'posicion', etiqueta: 'feed.orden.inteligente' },
    { valor: 'recientes', etiqueta: 'feed.orden.recientes' },
    { valor: 'nombre', etiqueta: 'feed.orden.nombre' },
    { valor: 'populares', etiqueta: 'feed.orden.populares' },
    { valor: 'bpm', etiqueta: 'feed.orden.bpm' },
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
    const { t } = useT();

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

    const etiquetaActual = t(opciones.find(o => o.valor === ordenActual)?.etiqueta ?? 'feed.ordenar');

    return (
        <div className="barraControlFeed">
            <div className="barraControlFeedIzquierda">
                {contador != null && (
                    <span className="barraControlFeedContador">
                        {contador} {etiquetaContador ?? t(contador === 1 ? 'feed.sample' : 'feed.samples')}
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
                                    {t(opcion.etiqueta)}
                                </BotonBase>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
