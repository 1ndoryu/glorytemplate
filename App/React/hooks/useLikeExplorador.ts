/*
 * Hook: useLikeExplorador
 * Lógica optimista de likes/reacciones para el explorador.
 * Extraído de useExploradorPagina para cumplir SRP y limite-lineas.
 */

import { useCallback } from 'react';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

const log = crearLogger('useLikeExplorador');

type SetSamples = React.Dispatch<React.SetStateAction<SampleResumen[]>>;

export function useLikeExplorador(
    todosSamples: SampleResumen[],
    setTodosSamples: SetSamples,
) {
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = todosSamples.find((s) => s.id === sampleId);
        const prevSamples = todosSamples;

        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            /* [193A-32] Dislike oculta el sample del listado */
            if (!esPositivo) {
                setTodosSamples(prev => prev.filter(s => s.id !== sampleId));
            } else {
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setTodosSamples((prev) =>
                    prev.map((s) =>
                        s.id === sampleId
                            ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                            : s
                    )
                );
            }
            try {
                const resp = await darLike('sample', sampleId, reaccion);
                if (!resp.ok) {
                    setTodosSamples(prevSamples);
                    toast.error(getT()('error.reaccion'));
                }
            } catch (err) {
                setTodosSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setTodosSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            try {
                const resp = await quitarLike('sample', sampleId);
                if (!resp.ok) {
                    setTodosSamples(prevSamples);
                    toast.error(getT()('error.quitarReaccion'));
                }
            } catch (err) {
                setTodosSamples(prevSamples);
                log.error('Error al quitar like', err);
            }
        } else {
            setTodosSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            try {
                const resp = await darLike('sample', sampleId, 'like');
                if (!resp.ok) {
                    setTodosSamples(prevSamples);
                    toast.error(getT()('error.reaccion'));
                }
            } catch (err) {
                setTodosSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        }
    }, [todosSamples, setTodosSamples]);

    return manejarLike;
}
