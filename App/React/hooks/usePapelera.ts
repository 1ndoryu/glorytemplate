/*
 * Hook: usePapelera — Kamples (QQ57)
 * Lógica del modal de papelera: lectura de store y acción de restaurar.
 * Vista separada de lógica (SRP).
 */

import { useCallback } from 'react';
import { usePapeleraStore } from '@app/stores/papeleraStore';
import type { ItemPapelera } from '@app/stores/papeleraStore';

interface RetornoPapelera {
    abierto: boolean;
    items: ItemPapelera[];
    cargando: boolean;
    restaurandoIds: Set<number>;
    cerrar: () => void;
    restaurar: (tipo: 'sample' | 'publicacion', id: number) => Promise<boolean>;
}

export const usePapelera = (): RetornoPapelera => {
    const abierto = usePapeleraStore(s => s.abierto);
    const items = usePapeleraStore(s => s.items);
    const cargando = usePapeleraStore(s => s.cargando);
    const restaurandoIds = usePapeleraStore(s => s.restaurandoIds);
    const cerrarStore = usePapeleraStore(s => s.cerrar);
    const restaurarStore = usePapeleraStore(s => s.restaurar);

    const cerrar = useCallback(() => {
        cerrarStore();
    }, [cerrarStore]);

    const restaurar = useCallback(async (tipo: 'sample' | 'publicacion', id: number) => {
        return restaurarStore(tipo, id);
    }, [restaurarStore]);

    return { abierto, items, cargando, restaurandoIds, cerrar, restaurar };
};
