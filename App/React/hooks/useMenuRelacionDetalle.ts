/*
 * Hook: useMenuRelacionDetalle — Kamples (C802c)
 * Gestiona el menu contextual de 3 puntos en RelacionDetalleCabecera.
 * Items: adjuntar sample por lado (destino/fuente) + reportar.
 * Replica el flujo del PublicadorExtraccion para vinculacion manual.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Flag } from 'lucide-react';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import type { RelacionDetalleCompleta } from '@app/types/cancion';
import { useCrearModalStore } from '@app/stores/crearModalStore';

interface RetornoMenuRelacion {
    menuAbierto: boolean;
    menuPos: { x: number; y: number };
    items: MenuItemDef[];
    abrirMenu: (e: React.MouseEvent) => void;
    cerrarMenu: () => void;
}

export const useMenuRelacionDetalle = (
    relacion: RelacionDetalleCompleta | null,
    autenticado: boolean
): RetornoMenuRelacion => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const abrirMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuAbierto(true);
    }, []);

    const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

    /*
     * Un solo item de adjuncion: el selector de lado (fuente/destino) se muestra
     * dentro del modal, no en el menu contextual (L7.1 — nombres demasiado largos).
     * Al abrir el modal sin ladoRelacion, ModalCrear muestra un paso previo de seleccion.
     */
    const items: MenuItemDef[] = useMemo(() => {
        if (!relacion || !autenticado) return [];

        return [
            {
                id: 'adjuntar-sample',
                etiqueta: 'Adjuntar sample manual',
                icono: React.createElement(Upload, { size: 14 }),
                separadorDespues: true,
                onClick: () => {
                    useCrearModalStore.getState().abrirConContexto({
                        relacionId: relacion.id,
                        ladoFuente: {
                            cancionId: relacion.cancionFuenteId,
                            titulo: relacion.fuente_titulo ?? 'Desconocida',
                            artista: relacion.fuente_artista ?? undefined,
                        },
                        ladoDestino: {
                            cancionId: relacion.cancionDestinoId,
                            titulo: relacion.destino_titulo ?? 'Desconocida',
                            artista: relacion.destino_artista ?? undefined,
                        },
                    });
                },
            },
            {
                id: 'reportar',
                etiqueta: 'Reportar',
                icono: React.createElement(Flag, { size: 14 }),
                peligro: true,
                onClick: () => {
                    /* TO-DO: Integrar con ModalReporteLegal cuando este disponible */
                },
            },
        ];
    }, [relacion, autenticado]);

    return { menuAbierto, menuPos, items, abrirMenu, cerrarMenu };
};
