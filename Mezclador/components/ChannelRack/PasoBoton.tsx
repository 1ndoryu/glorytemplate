/*
 * PasoBoton — Un botón individual del step grid.
 * Click = toggle on/off. Cada 4 pasos alterna color para marcar beats.
 * Memoizado para evitar re-render de todo el grid al clickar un paso.
 */

import { memo, useCallback } from 'react';
import type { Paso } from '../../types/mezclador';
import { BotonBase } from '@app/components/ui/BotonBase';

interface PasoBotonProps {
    paso: Paso;
    indice: number;
    colorCanal: string;
    onToggle: (indice: number) => void;
    onContextMenu?: (indice: number) => void;
}

export const PasoBoton = memo(({
    paso,
    indice,
    colorCanal,
    onToggle,
    onContextMenu,
}: PasoBotonProps): JSX.Element => {
    const alClick = useCallback(() => onToggle(indice), [indice, onToggle]);

    const alContexto = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu?.(indice);
    }, [indice, onContextMenu]);

    /* Cada grupo de 4 pasos alterna fondo para marcar beats */
    const esGrupoImpar = Math.floor(indice / 4) % 2 === 1;

    return (
        <BotonBase variante="ghost"
            className={`pasoBoton ${paso.activo ? 'pasoBotonActivo' : ''} ${esGrupoImpar ? 'pasoBotonGrupoImpar' : ''}`}
            style={paso.activo ? {
                backgroundColor: colorCanal,
                opacity: 0.4 + paso.velocity * 0.6,
            } : undefined}
            onClick={alClick}
            onContextMenu={alContexto}
            title={paso.activo ? `Vel: ${Math.round(paso.velocity * 100)}%` : 'Inactivo'}
        />
    );
});

PasoBoton.displayName = 'PasoBoton';
