/*
 * Hook: useColeccionPreview — Kamples (QQ75)
 * Preview aleatorio de samples de una colección.
 * Reproduce samples aleatorios con máximo 10 segundos cada uno.
 * Reutiliza reproductorStore (reproducir + siguiente con aleatorio).
 * El estado coleccionPreviewId vive en el store para ser accesible
 * desde cualquier TarjetaColeccion sin contexto compartido.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { obtenerColeccion } from '@app/services/apiColecciones';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

const DURACION_MAX_PREVIEW = 10_000;

export const useColeccionPreview = () => {
    const [cargando, setCargando] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);
    /* [2003A-20] Guardar estado original de aleatorio para restaurarlo al detener preview */
    const aleatorioOriginalRef = useRef<boolean | null>(null);

    const limpiarTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const limpiarSuscripcion = useCallback(() => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
    }, []);

    /* Cleanup al desmontar — [2003A-20] También limpiar estado preview del store */
    useEffect(() => {
        return () => {
            limpiarTimer();
            limpiarSuscripcion();
            const store = useReproductorStore.getState();
            if (store.coleccionPreviewId !== null) {
                store.setColeccionPreviewId(null);
            }
            /* Restaurar aleatorio si fue cambiado por el preview */
            if (aleatorioOriginalRef.current !== null) {
                if (store.aleatorio !== aleatorioOriginalRef.current) {
                    store.toggleAleatorio();
                }
                aleatorioOriginalRef.current = null;
            }
        };
    }, [limpiarTimer, limpiarSuscripcion]);

    const detenerPreview = useCallback(() => {
        limpiarTimer();
        limpiarSuscripcion();
        const store = useReproductorStore.getState();
        store.pause();
        store.setColeccionPreviewId(null);
        /* [2003A-20] Restaurar aleatorio a su estado pre-preview.
         * Sin esto, aleatorio queda ON y toda reproducción posterior es shuffled. */
        if (aleatorioOriginalRef.current !== null) {
            if (store.aleatorio !== aleatorioOriginalRef.current) {
                store.toggleAleatorio();
            }
            aleatorioOriginalRef.current = null;
        }
    }, [limpiarTimer, limpiarSuscripcion]);

    /*
     * Programar cambio al siguiente sample cada DURACION_MAX_PREVIEW.
     * Se suscribe a cambios de sampleActual para reiniciar el timer.
     */
    const iniciarCiclo = useCallback(() => {
        const programar = () => {
            limpiarTimer();
            timerRef.current = setTimeout(() => {
                useReproductorStore.getState().siguiente();
            }, DURACION_MAX_PREVIEW);
        };

        programar();

        limpiarSuscripcion();
        unsubRef.current = useReproductorStore.subscribe(
            (state, prev) => {
                /* Si cambió el sample y sigue reproduciéndose, reiniciar timer */
                if (state.sampleActual?.id !== prev.sampleActual?.id && state.reproduciendo) {
                    programar();
                }
                /* Si el usuario pausó externamente, detener preview */
                if (!state.reproduciendo && prev.reproduciendo && state.coleccionPreviewId !== null) {
                    limpiarTimer();
                    limpiarSuscripcion();
                    useReproductorStore.getState().setColeccionPreviewId(null);
                }
            }
        );
    }, [limpiarTimer, limpiarSuscripcion]);

    const iniciarPreview = useCallback(async (coleccionId: number) => {
        const previewActual = useReproductorStore.getState().coleccionPreviewId;

        /* Toggle: si ya reproduce esta colección, detener */
        if (previewActual === coleccionId) {
            detenerPreview();
            return;
        }

        /* Si reproduce otra colección preview, limpiar */
        if (previewActual !== null) {
            limpiarTimer();
            limpiarSuscripcion();
        }

        setCargando(true);
        try {
            const resp = await obtenerColeccion(coleccionId);
            if (!resp.ok || !resp.data) {
                toast.error(getT()('error.cargarColeccion'));
                return;
            }

            const samples = resp.data.samples ?? [];
            if (samples.length === 0) {
                toast.info(getT()('toast.coleccionSinSamples'));
                return;
            }

            /* Sample aleatorio inicial */
            const indice = Math.floor(Math.random() * samples.length);
            const store = useReproductorStore.getState();

            /* Reproducir con contexto = todos los samples de la colección */
            store.reproducir(samples[indice], samples);

            /* [2003A-20] Guardar estado original antes de forzar aleatorio ON */
            if (aleatorioOriginalRef.current === null) {
                aleatorioOriginalRef.current = store.aleatorio;
            }
            /* Activar aleatorio si no lo está */
            if (!store.aleatorio) store.toggleAleatorio();

            store.setColeccionPreviewId(coleccionId);
            iniciarCiclo();
        } catch {
            toast.error(getT()('error.cargarColeccionRed'));
        } finally {
            setCargando(false);
        }
    }, [detenerPreview, limpiarTimer, limpiarSuscripcion, iniciarCiclo]);

    return {
        iniciarPreview,
        detenerPreview,
        cargando,
    };
};
