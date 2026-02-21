/*
 * Hook: useFeedFiltros
 * Lógica de filtrado client-side del feed de samples: tags, BPM, precio.
 * Extrae la responsabilidad de filtrado de useFeedSamples para cumplir SRP.
 */

import { useMemo, useCallback } from 'react';
import {
    extraerTagsMetadata,
    extraerTagsAgrupadosMetadata,
} from '@app/services/tagUtils';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import type { SampleResumen } from '@app/types';

const MAX_TAGS_SUELTOS = 30;

interface UseFeedFiltrosOpciones {
    samples: SampleResumen[];
    idsExcluidos?: Set<number>;
    idsCreadoresIncluidos?: Set<number>;
}

export function useFeedFiltros({ samples, idsExcluidos, idsCreadoresIncluidos }: UseFeedFiltrosOpciones) {
    const tagsIncluidos = useFiltrosStore(s => s.tagsIncluidos);
    const tagsExcluidos = useFiltrosStore(s => s.tagsExcluidos);
    const bpmMin = useFiltrosStore(s => s.bpmMin);
    const bpmMax = useFiltrosStore(s => s.bpmMax);
    const filtroPrecio = useFiltrosStore(s => s.filtroPrecio);
    const incluirTag = useFiltrosStore(s => s.incluirTag);
    const excluirTag = useFiltrosStore(s => s.excluirTag);
    const quitarTag = useFiltrosStore(s => s.quitarTag);
    const setBpmRango = useFiltrosStore(s => s.setBpmRango);

    const tagsAgrupados = useMemo(() => extraerTagsAgrupadosMetadata(samples), [samples]);

    const tagsSueltos = useMemo(
        () => (tagsAgrupados.otro ?? []).slice(0, MAX_TAGS_SUELTOS),
        [tagsAgrupados],
    );

    const samplesFiltrados = useMemo(() => {
        let resultado = samples;

        if (idsExcluidos && idsExcluidos.size > 0) {
            resultado = resultado.filter(s => !idsExcluidos.has(s.id));
        }

        if (idsCreadoresIncluidos && idsCreadoresIncluidos.size > 0) {
            resultado = resultado.filter(s => {
                const creadorId = s.creador?.id ?? (s as unknown as Record<string, unknown>).creadorId;
                return typeof creadorId === 'number' && idsCreadoresIncluidos.has(creadorId);
            });
        }

        if (bpmMin !== null || bpmMax !== null) {
            resultado = resultado.filter(s => {
                const bpm = (s as unknown as Record<string, unknown>).bpm as number | undefined;
                if (bpm === undefined || bpm === null) return true;
                if (bpmMin !== null && bpm < bpmMin) return false;
                if (bpmMax !== null && bpm > bpmMax) return false;
                return true;
            });
        }

        if (filtroPrecio === 'gratis') {
            resultado = resultado.filter(s => !s.esPremium);
        } else if (filtroPrecio === 'premium') {
            resultado = resultado.filter(s => s.esPremium);
        }

        if (tagsIncluidos.length === 0 && tagsExcluidos.length === 0) return resultado;

        return resultado.filter(s => {
            const tagsSample = extraerTagsMetadata(s);
            return tagsIncluidos.every(t => tagsSample.includes(t))
                && tagsExcluidos.every(t => !tagsSample.includes(t));
        });
    }, [samples, tagsIncluidos, tagsExcluidos, bpmMin, bpmMax, filtroPrecio, idsExcluidos, idsCreadoresIncluidos]);

    const manejarIncluirTag = useCallback((tag: string) => incluirTag(tag), [incluirTag]);
    const manejarExcluirTag = useCallback((tag: string) => excluirTag(tag), [excluirTag]);

    return {
        tagsAgrupados,
        tagsSueltos,
        tagsIncluidos,
        tagsExcluidos,
        bpmMin,
        bpmMax,
        filtroPrecio,
        incluirTag,
        excluirTag,
        quitarTag,
        setBpmRango,
        samplesFiltrados,
        manejarIncluirTag,
        manejarExcluirTag,
    };
}
