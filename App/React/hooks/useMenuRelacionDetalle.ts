/*
 * Hook: useMenuRelacionDetalle — Kamples (C802c)
 * Gestiona el menu contextual de 3 puntos en RelacionDetalleCabecera.
 * Items: adjuntar sample nuevo + vincular existente + reportar.
 * Replica el flujo del PublicadorExtraccion para vinculacion manual.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Link2, Flag } from 'lucide-react';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import type { RelacionDetalleCompleta } from '@app/types/cancion';
import { useCrearModalStore } from '@app/stores/crearModalStore';

interface RetornoMenuRelacion {
    menuAbierto: boolean;
    menuPos: { x: number; y: number };
    items: MenuItemDef[];
    abrirMenu: (e: React.MouseEvent) => void;
    cerrarMenu: () => void;
    /* L7.4: Estado del modal de vincular sample existente */
    vincularAbierto: boolean;
    cerrarVincular: () => void;
}

export const useMenuRelacionDetalle = (
    relacion: RelacionDetalleCompleta | null,
    autenticado: boolean
): RetornoMenuRelacion => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    /* L7.4: Modal vincular sample existente */
    const [vincularAbierto, setVincularAbierto] = useState(false);

    const abrirMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuAbierto(true);
    }, []);

    const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
    const cerrarVincular = useCallback(() => setVincularAbierto(false), []);

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
                id: 'vincular-existente',
                etiqueta: 'Vincular sample existente',
                icono: React.createElement(Link2, { size: 14 }),
                separadorDespues: true,
                onClick: () => setVincularAbierto(true),
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

    return { menuAbierto, menuPos, items, abrirMenu, cerrarMenu, vincularAbierto, cerrarVincular };
};
