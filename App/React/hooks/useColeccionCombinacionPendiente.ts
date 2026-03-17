/*
 * useColeccionCombinacionPendiente — Verifica y permite deshacer combinaciones.
 * QL115: Extraído de useColeccionDetalle para cumplir límite de líneas.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@app/stores/toastStore';
import { obtenerCombinacionPendiente, deshacerCombinacion } from '@app/services/apiColecciones';
import type { CombinacionPendiente } from '@app/services/apiColecciones';

interface UseColeccionCombinacionParams {
    coleccionId: number | null;
    activa: boolean;
    navegar: (ruta: string) => void;
}

export function useColeccionCombinacionPendiente({
    coleccionId,
    activa,
    navegar,
}: UseColeccionCombinacionParams) {
    const [combinacionPendiente, setCombinacionPendiente] = useState<CombinacionPendiente | null>(null);
    const [deshaciendoCombinacion, setDeshaciendoCombinacion] = useState(false);

    useEffect(() => {
        if (!coleccionId || !activa) return;
        const controller = new AbortController();
        obtenerCombinacionPendiente(coleccionId).then(resp => {
            if (controller.signal.aborted) return;
            if (resp.ok && resp.data?.hayCombinacion) {
                setCombinacionPendiente(resp.data);
            } else {
                setCombinacionPendiente(null);
            }
        }).catch(() => {
            /* Degradación silenciosa: botón undo no se muestra si falla */
        });
        return () => { controller.abort(); };
    }, [coleccionId, activa]);

    const manejarDeshacerCombinacion = useCallback(async () => {
        if (!coleccionId || !combinacionPendiente?.undoId || deshaciendoCombinacion) return;
        setDeshaciendoCombinacion(true);
        const resp = await deshacerCombinacion(coleccionId, combinacionPendiente.undoId);
        if (resp.ok) {
            toast.exito('Combinación deshecha — la colección original ha sido restaurada');
            setCombinacionPendiente(null);
            navegar(`/coleccion/${resp.data?.origenId ?? coleccionId}/`);
        } else {
            toast.error(resp.error ?? 'Error al deshacer la combinación');
        }
        setDeshaciendoCombinacion(false);
    }, [coleccionId, combinacionPendiente, deshaciendoCombinacion, navegar]);

    const manejarCombinado = useCallback((destinoId: number) => {
        navegar(`/coleccion/${destinoId}/`);
    }, [navegar]);

    return {
        combinacionPendiente,
        deshaciendoCombinacion,
        manejarDeshacerCombinacion,
        manejarCombinado,
    };
}
