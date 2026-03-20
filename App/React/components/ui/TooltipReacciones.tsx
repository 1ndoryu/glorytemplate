/*
 * Componente: TooltipReacciones
 * Envuelve un boton de like y muestra un tooltip con 3 opciones
 * de reaccion al hacer hover: like, encanta, dislike.
 * Dislike no muestra contador (requisito del producto).
 */

import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { Heart, Sparkles, ThumbsDown } from 'lucide-react';
import type { TipoReaccion } from '@app/types';
import { useT } from '@app/utils/i18n/useT';
import '@app/styles/componentes/tooltipReacciones.css';
import { BotonBase } from './BotonBase';

interface TooltipReaccionesProps {
    reaccionActual?: TipoReaccion | null;
    onReaccionar: (reaccion: TipoReaccion) => void;
    onQuitar: () => void;
    children: ReactNode;
}

const OPCIONES_BASE: { tipo: TipoReaccion; icono: typeof Heart }[] = [
    { tipo: 'like', icono: Heart },
    { tipo: 'encanta', icono: Sparkles },
    { tipo: 'dislike', icono: ThumbsDown },
];

const ETIQUETAS_REACCION: Record<TipoReaccion, string> = {
    like: 'reacciones.meGusta',
    encanta: 'reacciones.meEncanta',
    dislike: 'reacciones.noMeGusta',
};

export const TooltipReacciones = ({
    reaccionActual,
    onReaccionar,
    onQuitar,
    children,
}: TooltipReaccionesProps): JSX.Element => {
    const { t } = useT();
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
            <div className="tooltipReacciones" role="toolbar" aria-label={t('reacciones.reacciones')}>
                {OPCIONES_BASE.map(({ tipo, icono: Icono }) => {
                    const etiqueta = t(ETIQUETAS_REACCION[tipo]);
                    return (
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
                    );
                })}
            </div>
        </div>
    );
};

export default TooltipReacciones;
