/*
 * Hook: useReproductorGlobal
 * Logica de UI del reproductor global: seek, like, formato.
 * Sin audio element — el motor esta en useMotorAudio.
 * QQ49: Reescrito minimalista.
 */

import { useCallback, useRef, type MouseEvent } from 'react';
import { useReproductorStore } from '../stores/reproductorStore';
import { darLike, quitarLike } from '../services/apiSocial';

const formatearTiempo = (segundos: number): string => {
    if (!segundos || isNaN(segundos)) return '0:00';
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const useReproductorGlobal = () => {
    const sampleActual = useReproductorStore(s => s.sampleActual);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const progreso = useReproductorStore(s => s.progreso);
    const duracion = useReproductorStore(s => s.duracion);
    const aleatorio = useReproductorStore(s => s.aleatorio);

    const togglePlay = useReproductorStore(s => s.togglePlay);
    const toggleAleatorio = useReproductorStore(s => s.toggleAleatorio);
    const siguiente = useReproductorStore(s => s.siguiente);
    const anterior = useReproductorStore(s => s.anterior);
    const seek = useReproductorStore(s => s.seek);
    const actualizarLike = useReproductorStore(s => s.actualizarLike);
    const cerrar = useReproductorStore(s => s.cerrar);

    const progresoBarraRef = useRef<HTMLDivElement>(null);

    const liked = sampleActual?.liked ?? false;

    const manejarSeekProgreso = useCallback(
        (e: MouseEvent) => {
            const barra = progresoBarraRef.current;
            if (!barra) return;
            const rect = barra.getBoundingClientRect();
            const posicion = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(posicion);
        },
        [seek]
    );

    const manejarLike = useCallback(async () => {
        if (!sampleActual) return;
        const nuevoLiked = !liked;
        actualizarLike(nuevoLiked);
        try {
            if (nuevoLiked) {
                await darLike('sample', sampleActual.id);
            } else {
                await quitarLike('sample', sampleActual.id);
            }
        } catch {
            actualizarLike(!nuevoLiked);
        }
    }, [sampleActual, liked, actualizarLike]);

    return {
        sampleActual,
        reproduciendo,
        progreso,
        duracion,
        aleatorio,
        liked,
        togglePlay,
        toggleAleatorio,
        siguiente,
        anterior,
        cerrar,
        manejarLike,
        manejarSeekProgreso,
        progresoBarraRef,
        formatearTiempo,
    };
};
