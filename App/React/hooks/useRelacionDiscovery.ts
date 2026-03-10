/*
 * Hook: useRelacionDiscovery — Kamples
 * Carga la relación Sample Discovery vinculada a un sample de Kamples.
 * Si el sample fue extraído del pipeline de audio, tiene un sample_id
 * en la tabla relaciones_sample. Este hook lo obtiene para UI.
 */

import { useState, useEffect } from 'react';
import { obtenerRelacionPorSampleId } from '@app/services/apiCanciones';
import type { RelacionDetalleCompleta } from '@app/types/cancion';

export function useRelacionDiscovery(sampleId: number | null | undefined) {
    const [relacion, setRelacion] = useState<RelacionDetalleCompleta | null>(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (!sampleId || sampleId <= 0) return;

        const controller = new AbortController();
        setCargando(true);

        const cargar = async () => {
            const resp = await obtenerRelacionPorSampleId(sampleId);
            if (controller.signal.aborted) return;
            if (resp.ok) {
                setRelacion(resp.data ?? null);
            }
            setCargando(false);
        };

        cargar();
        return () => { controller.abort(); };
    }, [sampleId]);

    return { relacion, cargando };
}
