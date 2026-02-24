/*
 * Componente: TooltipReacciones
 * Envuelve un boton de like y muestra un tooltip con 3 opciones
 * de reaccion al hacer hover: like, encanta, dislike.
 * Dislike no muestra contador (requisito del producto).
 */

import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { Heart, Sparkles, ThumbsDown } from 'lucide-react';
import type { TipoReaccion } from '@app/types';
import '@app/styles/componentes/tooltipReacciones.css';
import { BotonBase } from './BotonBase';

interface TooltipReaccionesProps {
    reaccionActual?: TipoReaccion | null;
    onReaccionar: (reaccion: TipoReaccion) => void;
    onQuitar: () => void;
    children: ReactNode;
}

const OPCIONES: { tipo: TipoReaccion; icono: typeof Heart; etiqueta: string }[] = [
    { tipo: 'like', icono: Heart, etiqueta: 'Me gusta' },
    { tipo: 'encanta', icono: Sparkles, etiqueta: 'Me encanta' },
    { tipo: 'dislike', icono: ThumbsDown, etiqueta: 'No me gusta' },
];

export const TooltipReacciones = ({
    reaccionActual,
    onReaccionar,
    onQuitar,
    children,
}: TooltipReaccionesProps): JSX.Element => {
    const manejarClick = useCallback(
        (e: MouseEvent, tipo: TipoReaccion) => {
            e.stopPropagation();
            e.preventDefault();

            /* Si la reaccion ya esta activa, quitar la reaccion */
            if (reaccionActual === tipo) {
                onQuitar();
                return;
            }
            onReaccionar(tipo);
        },
        [reaccionActual, onReaccionar, onQuitar]
    );

    return (
        <div className="contenedorReacciones">
            {children}
            <div className="tooltipReacciones" role="toolbar" aria-label="Reacciones">
                {OPCIONES.map(({ tipo, icono: Icono, etiqueta }) => (
                    <BotonBase variante="ghost"
                        key={tipo}
                        className={`tooltipReaccionBtn ${reaccionActual === tipo ? 'tooltipReaccionActiva' : ''}`}
                        data-reaccion={tipo}
                        onClick={(e) => manejarClick(e, tipo)}
                        type="button"
                        aria-label={etiqueta}
                        title={etiqueta}
                    >
                        <Icono
                            size={18}
                            fill={reaccionActual === tipo ? 'currentColor' : 'none'}
                        />
                    </BotonBase>
                ))}
            </div>
        </div>
    );
};

export default TooltipReacciones;
