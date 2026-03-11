/*
 * Hook: useMenuRelacionDetalle — Kamples (C802c)
 * Gestiona el menu contextual de 3 puntos en RelacionDetalleCabecera.
 * Items: adjuntar sample por lado (destino/fuente) + reportar.
 * Replica el flujo del PublicadorExtraccion para vinculacion manual.
 */

import { useState, useCallback, useMemo } from 'react';
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
     * Items: un item por lado del sampleo (destino = samplea, fuente = sampleada).
     * Cada item abre el modal de creacion con contexto de relacion + lado,
     * para que el backend vincule via sample_fuente_id / sample_destino_id.
     */
    const items: MenuItemDef[] = useMemo(() => {
        if (!relacion || !autenticado) return [];
        const resultado: MenuItemDef[] = [];

        if (relacion.destino_titulo) {
            resultado.push({
                id: 'adjuntar-destino',
                etiqueta: `Adjuntar sample de "${relacion.destino_titulo}"`,
                icono: Upload({ size: 14 }),
                onClick: () => {
                    useCrearModalStore.getState().abrirConContexto({
                        cancionOrigenId: relacion.cancionDestinoId,
                        relacionId: relacion.id,
                        ladoRelacion: 'destino',
                    });
                },
            });
        }

        if (relacion.fuente_titulo) {
            resultado.push({
                id: 'adjuntar-fuente',
                etiqueta: `Adjuntar sample de "${relacion.fuente_titulo}"`,
                icono: Upload({ size: 14 }),
                onClick: () => {
                    useCrearModalStore.getState().abrirConContexto({
                        cancionOrigenId: relacion.cancionFuenteId,
                        relacionId: relacion.id,
                        ladoRelacion: 'fuente',
                    });
                },
                separadorDespues: true,
            });
        }

        resultado.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: Flag({ size: 14 }),
            peligro: true,
            onClick: () => {
                /* TO-DO: Integrar con ModalReporteLegal cuando este disponible */
            },
        });

        return resultado;
    }, [relacion, autenticado]);

    return { menuAbierto, menuPos, items, abrirMenu, cerrarMenu };
};
