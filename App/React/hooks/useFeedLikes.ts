/*
 * Hook: useFeedLikes
 * Like optimista con soporte de reacciones (like, encanta, dislike).
 * Extraido de useFeedSamples para cumplir SRP y limite de 300 lineas.
 */

import { useCallback, useEffect } from 'react';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { requiereAuth } from '@app/utils/requiereAuth';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';

/* QL56: Evento global para sincronizar likes entre feed, reproductor y BotonLike aislados */
export const EVENTO_LIKE_CAMBIADO = 'kamples:like-cambiado';

interface UseFeedLikesOpciones {
    samples: SampleResumen[];
    setSamples: React.Dispatch<React.SetStateAction<SampleResumen[]>>;
    invalidarCache: () => void;
    onLike?: (sampleId: number, nuevoEstado: boolean) => void;
}

export function useFeedLikes({ samples, setSamples, invalidarCache, onLike }: UseFeedLikesOpciones) {
    const abrirSugerencias = usePanelLateralStore(s => s.abrirSugerencias);

    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        if (!requiereAuth()) return;
        const sampleRef = samples.find(s => s.id === sampleId) ?? null;

        if (reaccion) {
            const eraPositivo = sampleRef?.reaccion === 'like' || sampleRef?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            /* [193A-32] Dislike oculta el sample del feed */
            if (!esPositivo) {
                setSamples(prev => prev.filter(s => s.id !== sampleId));
            } else {
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setSamples(prev =>
                    prev.map(s =>
                        s.id === sampleId
                            ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                            : s,
                    ),
                );
            }
            invalidarCache();
            window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId, liked: esPositivo, reaccion } }));
            await darLike('sample', sampleId, reaccion);
            if (esPositivo && sampleRef) abrirSugerencias(sampleRef);
            onLike?.(sampleId, true);
        } else if (sampleRef?.liked || sampleRef?.reaccion) {
            const eraPositivo = sampleRef?.reaccion === 'like' || sampleRef?.reaccion === 'encanta';
            setSamples(prev =>
                prev.map(s =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s,
                ),
            );
            invalidarCache();
            window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId, liked: false, reaccion: null } }));
            await quitarLike('sample', sampleId);
            onLike?.(sampleId, false);
        } else {
            setSamples(prev =>
                prev.map(s =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s,
                ),
            );
            invalidarCache();
            window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId, liked: true, reaccion: 'like' as const } }));
            await darLike('sample', sampleId, 'like');
            if (sampleRef) abrirSugerencias(sampleRef);
            onLike?.(sampleId, true);
        }
    }, [samples, onLike, abrirSugerencias, setSamples, invalidarCache]);

    /* QL56: Escuchar likes externos (reproductor, BotonLike) y sincronizar el array local del feed */
    useEffect(() => {
        const manejar = (e: Event) => {
            const { sampleId, liked, reaccion: reac } = (e as CustomEvent<{ sampleId: number; liked: boolean; reaccion?: TipoReaccion | null }>).detail;
            /* [193A-32] Dislike oculta el sample */
            if (reac === 'dislike') {
                setSamples(prev => prev.filter(s => s.id !== sampleId));
                return;
            }
            setSamples(prev => prev.map(s => {
                if (s.id !== sampleId || s.liked === liked) return s;
                return { ...s, liked, reaccion: reac ?? (liked ? 'like' : null) };
            }));
        };
        window.addEventListener(EVENTO_LIKE_CAMBIADO, manejar);
        return () => window.removeEventListener(EVENTO_LIKE_CAMBIADO, manejar);
    }, [setSamples]);

    return { manejarLike, abrirSugerencias };
}
