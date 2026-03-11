/*
 * Hook: useMenuCancionDetalle — Kamples (L6.2 wiring + C802c)
 * Gestiona menu contextual de 3 puntos en CancionDetalleIsland,
 * incluyendo control de ModalContribucion y ModalEdicionRelacion.
 * Extraccion obligatoria: CancionDetalleIsland superaba el limite de useState.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Upload, PlusCircle } from 'lucide-react';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import type { RelacionParaEditar } from '@app/hooks/useEdicionRelacion';
import type { CancionDetalle } from '@app/types/cancion';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { verificarRelacion } from '@app/services/apiRelaciones';
import { toast } from '@app/stores/toastStore';

interface RetornoMenuCancionDetalle {
    menuAbierto: boolean;
    menuPos: { x: number; y: number };
    items: MenuItemDef[];
    abrirMenu: (e: React.MouseEvent) => void;
    cerrarMenu: () => void;
    /* Modal contribucion */
    contribucionAbierta: boolean;
    cerrarContribucion: () => void;
    /* Modal edicion relacion */
    relacionEditando: RelacionParaEditar | null;
    modoEliminacion: boolean;
    cerrarEdicionRelacion: () => void;
    abrirEdicionRelacion: (rel: RelacionParaEditar) => void;
    abrirEliminacionRelacion: (rel: RelacionParaEditar) => void;
    /* Verificar/desverificar relacion — admin only */
    manejarVerificarRelacion: ((relacionId: number, verificada: boolean) => void) | undefined;
}

export const useMenuCancionDetalle = (
    detalle: CancionDetalle | null,
    autenticado: boolean
): RetornoMenuCancionDetalle => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [contribucionAbierta, setContribucionAbierta] = useState(false);
    const [relacionEditando, setRelacionEditando] = useState<RelacionParaEditar | null>(null);
    const [modoEliminacion, setModoEliminacion] = useState(false);

    const abrirMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuAbierto(true);
    }, []);

    const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
    const cerrarContribucion = useCallback(() => setContribucionAbierta(false), []);
    const cerrarEdicionRelacion = useCallback(() => setRelacionEditando(null), []);

    const esAdmin = useAuthStore(s => s.usuario?.rol === 'admin');

    /* Verificar/desverificar relacion — solo admin */
    const manejarVerificarRelacion = useCallback(async (relacionId: number, verificada: boolean) => {
        const resp = await verificarRelacion(relacionId, verificada);
        if (resp.ok) {
            toast.exito(verificada ? 'Relación verificada' : 'Verificación removida');
        } else {
            toast.error(resp.error ?? 'Error al verificar relación');
        }
    }, []);

    const abrirEdicionRelacion = useCallback((rel: RelacionParaEditar) => {
        setRelacionEditando(rel);
        setModoEliminacion(false);
    }, []);

    const abrirEliminacionRelacion = useCallback((rel: RelacionParaEditar) => {
        setRelacionEditando(rel);
        setModoEliminacion(true);
    }, []);

    const items: MenuItemDef[] = useMemo(() => {
        if (!detalle || !autenticado) return [];
        return [
            {
                id: 'subir-sample',
                etiqueta: 'Subir sample de esta canción',
                icono: React.createElement(Upload, { size: 14 }),
                onClick: () => {
                    useCrearModalStore.getState().abrirConContexto({
                        cancionOrigenId: detalle.cancion.id,
                    });
                },
            },
            {
                id: 'proponer-sampleo',
                etiqueta: 'Proponer sampleo',
                icono: React.createElement(PlusCircle, { size: 14 }),
                onClick: () => setContribucionAbierta(true),
            },
        ];
    }, [detalle, autenticado]);

    return {
        menuAbierto,
        menuPos,
        items,
        abrirMenu,
        cerrarMenu,
        contribucionAbierta,
        cerrarContribucion,
        relacionEditando,
        modoEliminacion,
        cerrarEdicionRelacion,
        abrirEdicionRelacion,
        abrirEliminacionRelacion,
        manejarVerificarRelacion: esAdmin ? manejarVerificarRelacion : undefined,
    };
};
