/*
 * Hook: useFeedFiltros
 * Lógica de filtrado client-side del feed de samples: tags, BPM, precio.
 * C4: Tags agrupados vienen del backend (escalable a 1M+), no de agregación client-side.
 * [183A-114] tagsClientSide=true: derivar tags de los samples ya cargados (sin API).
 *   Usado en colecciones donde todos los samples están disponibles client-side.
 *   Corrige feedTags vacíos en desktop cuando el proxy Vite falla silenciosamente.
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { extraerTagsMetadata, extraerTagsAgrupadosMetadata, normalizarTag } from '@app/services/tagUtils';
import { obtenerTagsAgregados, type TagsAgregadosResp } from '@app/services/apiSamples';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import type { SampleResumen } from '@app/types';
import type { CategoriaTag } from '@app/services/tagUtils';

const MAX_TAGS_SUELTOS = 30;
const DEBOUNCE_TAGS_MS = 400;
/* [183A-114] Estado vacío estable (una sola referencia, no crea objeto nuevo en cada render) */
const TAGS_VACIOS: Record<CategoriaTag, string[]> = { genero: [], instrumento: [], sentimiento: [], tipo: [], otro: [] };

interface UseFeedFiltrosOpciones {
    samples: SampleResumen[];
    idsExcluidos?: Set<number>;
    idsCreadoresIncluidos?: Set<number>;
    /** QL127: Activar filtrado textual client-side (para contextos sin busqueda server-side, ej: colecciones) */
    busquedaClientSide?: boolean;
    /** [183A-114] Derivar tags de los samples ya cargados (sin llamada a /tags/aggregates).
     *  Usar cuando todos los samples están disponibles client-side (busquedaLocal=true). */
    tagsClientSide?: boolean;
}

export function useFeedFiltros({ samples, idsExcluidos, idsCreadoresIncluidos, busquedaClientSide = false, tagsClientSide = false }: UseFeedFiltrosOpciones) {
    const busqueda = useFiltrosStore(s => s.busqueda);
    const tagsIncluidos = useFiltrosStore(s => s.tagsIncluidos);
    const tagsExcluidos = useFiltrosStore(s => s.tagsExcluidos);
    const bpmMin = useFiltrosStore(s => s.bpmMin);
    const bpmMax = useFiltrosStore(s => s.bpmMax);
    const filtroPrecio = useFiltrosStore(s => s.filtroPrecio);
    const incluirTag = useFiltrosStore(s => s.incluirTag);
    const excluirTag = useFiltrosStore(s => s.excluirTag);
    const quitarTag = useFiltrosStore(s => s.quitarTag);
    const setBpmRango = useFiltrosStore(s => s.setBpmRango);

    /* C4: Tags agrupados desde el backend — escalable a 1M+ (solo cuando tagsClientSide=false) */
    const [tagsAgrupadosApi, setTagsAgrupadosApi] = useState<Record<CategoriaTag, string[]>>(TAGS_VACIOS);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        /* [183A-114] En modo client-side los tags se derivan de samples — sin API */
        if (tagsClientSide) {
            clearTimeout(timerRef.current);
            return;
        }
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
                    setTagsAgrupadosApi(agrupados);
                })
                .catch(() => { /* best-effort: mantener tags anteriores */ });
        }, DEBOUNCE_TAGS_MS);

        return () => clearTimeout(timerRef.current);
    }, [bpmMin, bpmMax, tagsClientSide]);

    /* [183A-114] Tags derivados client-side desde los samples ya cargados.
     * Se actualiza automáticamente cuando llegan más samples — sin API call extra. */
    const tagsAgrupadosClientSide = useMemo(
        () => tagsClientSide ? extraerTagsAgrupadosMetadata(samples) : TAGS_VACIOS,
        [samples, tagsClientSide],
    );

    const tagsAgrupados = tagsClientSide ? tagsAgrupadosClientSide : tagsAgrupadosApi;

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

        /*
         * QK83: La búsqueda textual es server-side para el feed global (FTS + GIN indexes).
         * QL127: Para contextos sin busqueda server-side (colecciones), se filtra client-side
         * por titulo, creador y tags. Seguro porque colecciones cargan todos los samples.
         */
        if (busquedaClientSide && busqueda.trim().length > 0) {
            const termino = busqueda.trim().toLowerCase();
            resultado = resultado.filter(s => {
                const titulo = (s.titulo ?? '').toLowerCase();
                const descripcion = (s.descripcion ?? '').toLowerCase();
                const creador = (s.creador?.nombreVisible ?? '').toLowerCase();
                const username = (s.creador?.username ?? '').toLowerCase();
                const tags = extraerTagsMetadata(s).map(t => t.toLowerCase());
                const descripcionMeta = String(
                    s.metadata?.descripcion_corta
                    ?? s.metadata?.descripcionCorta
                    ?? s.metadata?.descripcion
                    ?? s.metadata?.descripcionEs
                    ?? s.metadata?.descripcion_es
                    ?? ''
                ).toLowerCase();
                return titulo.includes(termino)
                    || descripcion.includes(termino)
                    || creador.includes(termino)
                    || username.includes(termino)
                    || descripcionMeta.includes(termino)
                    || tags.some(t => t.includes(termino));
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
    }, [samples, tagsIncluidos, tagsExcluidos, bpmMin, bpmMax, filtroPrecio, idsExcluidos, idsCreadoresIncluidos, busquedaClientSide, busqueda]);

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
