/*
 * Hook: useFeedFiltros
 * Lógica de filtrado client-side del feed de samples: tags, BPM, precio.
 * C4: Tags agrupados vienen del backend (escalable a 1M+), no de agregación client-side.
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { extraerTagsMetadata, normalizarTag } from '@app/services/tagUtils';
import { obtenerTagsAgregados, type TagsAgregadosResp } from '@app/services/apiSamples';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import type { SampleResumen } from '@app/types';
import type { CategoriaTag } from '@app/services/tagUtils';

const MAX_TAGS_SUELTOS = 30;
const DEBOUNCE_TAGS_MS = 400;

interface UseFeedFiltrosOpciones {
    samples: SampleResumen[];
    idsExcluidos?: Set<number>;
    idsCreadoresIncluidos?: Set<number>;
}

export function useFeedFiltros({ samples, idsExcluidos, idsCreadoresIncluidos }: UseFeedFiltrosOpciones) {
    const tagsIncluidos = useFiltrosStore(s => s.tagsIncluidos);
    const tagsExcluidos = useFiltrosStore(s => s.tagsExcluidos);
    const busqueda = useFiltrosStore(s => s.busqueda);
    const bpmMin = useFiltrosStore(s => s.bpmMin);
    const bpmMax = useFiltrosStore(s => s.bpmMax);
    const filtroPrecio = useFiltrosStore(s => s.filtroPrecio);
    const incluirTag = useFiltrosStore(s => s.incluirTag);
    const excluirTag = useFiltrosStore(s => s.excluirTag);
    const quitarTag = useFiltrosStore(s => s.quitarTag);
    const setBpmRango = useFiltrosStore(s => s.setBpmRango);

    /* C4: Tags agrupados desde el backend — escalable a 1M+ */
    const vacioTags: Record<CategoriaTag, string[]> = { genero: [], instrumento: [], sentimiento: [], tipo: [], otro: [] };
    const [tagsAgrupados, setTagsAgrupados] = useState<Record<CategoriaTag, string[]>>(vacioTags);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            obtenerTagsAgregados({ bpmMin: bpmMin ?? undefined, bpmMax: bpmMax ?? undefined })
                .then((resp) => {
                    if (!resp.ok || !resp.data) return;
                    const datos = resp.data as TagsAgregadosResp;
                    const agrupados: Record<CategoriaTag, string[]> = { genero: [], instrumento: [], sentimiento: [], tipo: [], otro: [] };
                    for (const cat of Object.keys(agrupados) as CategoriaTag[]) {
                        agrupados[cat] = (datos[cat] ?? []).map((t) => t.tag);
                    }
                    setTagsAgrupados(agrupados);
                })
                .catch(() => { /* best-effort: mantener tags anteriores */ });
        }, DEBOUNCE_TAGS_MS);

        return () => clearTimeout(timerRef.current);
    }, [bpmMin, bpmMax]);

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

        if (busqueda && busqueda.trim() !== '') {
            /*
             * QQ15: Búsqueda textual con soporte de múltiples términos (coma),
             * y normalización de sinónimos para que "hip hop" encuentre "hip-hop".
             * Cada término debe coincidir con título, tags o tags normalizados.
             */
            const terminos = busqueda.split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            resultado = resultado.filter(s => {
                const tituloLower = s.titulo.toLowerCase();
                const tagsSample = extraerTagsMetadata(s);
                const tagsLower = tagsSample.map(t => t.toLowerCase());
                const tagsNorm = tagsSample.map(normalizarTag);

                return terminos.every(termino => {
                    const terminoNorm = normalizarTag(termino);
                    return tituloLower.includes(termino)
                        || tagsLower.some(t => t.includes(termino))
                        || tagsNorm.some(t => t.includes(terminoNorm));
                });
            });
        }

        if (tagsIncluidos.length === 0 && tagsExcluidos.length === 0) return resultado;

        return resultado.filter(s => {
            const tagsSample = extraerTagsMetadata(s);
            /* QQ15: Normalizar ambos lados para que sinónimos coincidan (hip hop → hip-hop) */
            const tagsNorm = tagsSample.map(normalizarTag);
            return tagsIncluidos.every(t => tagsNorm.includes(normalizarTag(t)))
                && tagsExcluidos.every(t => !tagsNorm.includes(normalizarTag(t)));
        });
    }, [samples, tagsIncluidos, tagsExcluidos, busqueda, bpmMin, bpmMax, filtroPrecio, idsExcluidos, idsCreadoresIncluidos]);

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
