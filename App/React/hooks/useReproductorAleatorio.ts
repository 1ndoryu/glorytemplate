/*
 * Hook: useReproductorAleatorio
 * [2103A-18] Extraído de InicioIsland y ColeccionDetalleIsland para evitar duplicación.
 * Obtiene un sample aleatorio del top 1000 y lo manda al reproductor global.
 */

import { useState, useCallback } from 'react';
import { obtenerSampleAleatorio } from '@app/services/apiSamples';
import { useReproductorStore } from '@app/stores/reproductorStore';

export const useReproductorAleatorio = () => {
    const [cargandoAleatorio, setCargandoAleatorio] = useState(false);
    const reproducir = useReproductorStore(s => s.reproducir);

    const reproducirAleatorio = useCallback(async () => {
        if (cargandoAleatorio) return;
        setCargandoAleatorio(true);
        try {
            const resp = await obtenerSampleAleatorio();
            if (resp.ok && resp.data) reproducir(resp.data);
        } finally {
            setCargandoAleatorio(false);
        }
    }, [cargandoAleatorio, reproducir]);

    return { cargandoAleatorio, reproducirAleatorio };
};
