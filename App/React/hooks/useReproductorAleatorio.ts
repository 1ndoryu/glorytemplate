/*
 * Hook: useReproductorAleatorio
 * [2103A-18] Extraído de InicioIsland y ColeccionDetalleIsland para evitar duplicación.
 * [223A-7] Acepta coleccionId opcional para aleatorio dentro de una colección.
 * [223A-8] Modo autoplay forzado para colecciones padre (reproduce continuamente).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { obtenerSampleAleatorio } from '@app/services/apiSamples';
import { useReproductorStore } from '@app/stores/reproductorStore';

export const useReproductorAleatorio = (coleccionId?: number) => {
    const [cargandoAleatorio, setCargandoAleatorio] = useState(false);
    const reproducir = useReproductorStore(s => s.reproducir);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const progreso = useReproductorStore(s => s.progreso);
    const duracion = useReproductorStore(s => s.duracion);
    const [modoAutoplayForzado, setModoAutoplayForzado] = useState(false);
    const cargandoRef = useRef(false);
    const coleccionIdRef = useRef(coleccionId);
    coleccionIdRef.current = coleccionId;

    const reproducirAleatorio = useCallback(async () => {
        if (cargandoRef.current) return;
        cargandoRef.current = true;
        setCargandoAleatorio(true);
        try {
            const resp = await obtenerSampleAleatorio(coleccionIdRef.current);
            if (resp.ok && resp.data) reproducir(resp.data);
        } finally {
            cargandoRef.current = false;
            setCargandoAleatorio(false);
        }
    }, [reproducir]);

    /* [223A-8] Iniciar modo autoplay forzado */
    const iniciarAutoplayForzado = useCallback(async () => {
        setModoAutoplayForzado(true);
        await reproducirAleatorio();
    }, [reproducirAleatorio]);

    const detenerAutoplayForzado = useCallback(() => {
        setModoAutoplayForzado(false);
    }, []);

    /* [223A-8] Cuando el sample actual termina y autoplay forzado está activo,
     * cargar el siguiente automáticamente. Detectamos fin cuando progreso >= duracion - 0.5 */
    useEffect(() => {
        if (!modoAutoplayForzado || !duracion || duracion < 1) return;
        if (progreso >= duracion - 0.5 && !cargandoRef.current) {
            reproducirAleatorio();
        }
    }, [modoAutoplayForzado, progreso, duracion, reproducirAleatorio]);

    /* Si el usuario pausa manualmente, detener el modo autoplay forzado */
    useEffect(() => {
        if (modoAutoplayForzado && !reproduciendo && duracion > 0 && progreso < duracion - 1) {
            setModoAutoplayForzado(false);
        }
    }, [modoAutoplayForzado, reproduciendo, duracion, progreso]);

    return {
        cargandoAleatorio,
        reproducirAleatorio,
        modoAutoplayForzado,
        iniciarAutoplayForzado,
        detenerAutoplayForzado,
    };
};
