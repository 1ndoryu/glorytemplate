/*
 * useSampleDetalle — Hook para la isla SampleDetalleIsland.
 * Gestiona la carga del sample, likes/reacciones, similares y tags.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { obtenerSample, listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { etiquetaBpm } from '@app/services/bpmUtils';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { Sample, SampleResumen, TipoReaccion } from '@app/types';

interface SampleDetalleParams {
    slugProp?: string;
}

export function useSampleDetalle({ slugProp }: SampleDetalleParams) {
    const [sample, setSample] = useState<Sample | null>(null);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const [mostrarSimilares, setMostrarSimilares] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [reaccionActual, setReaccionActual] = useState<TipoReaccion | null>(null);
    const [descargado, setDescargado] = useState(false);
    const [comentariosVisibles, setComentariosVisibles] = useState(true);

    const rutaActual = useNavigationStore(s => s.rutaActual);
    const navegar = useNavigationStore(s => s.navegar);
    const usuarioAuth = useAuthStore(s => s.usuario);
    const sugerenciasAlDarLike = usePanelLateralStore(s => s.sugerenciasAlDarLike);

    /* Resolver slug: priorizar URL SPA sobre prop PHP (stale tras primer render) */
    const slug = useMemo(() => {
        const segmentos = rutaActual.replace(/\/$/, '').split('/');
        const idxSample = segmentos.indexOf('sample');
        if (idxSample !== -1 && segmentos[idxSample + 1] && segmentos[idxSample + 1] !== 'sample') {
            return segmentos[idxSample + 1];
        }
        return slugProp && slugProp !== 'sample' ? slugProp : null;
    }, [rutaActual, slugProp]);

    /* Propiedad: comparar con String() para evitar mismatch string/number */
    const esPropietario = Boolean(
        usuarioAuth && sample && (
            String(sample.creadorId) === String(usuarioAuth.id) ||
            String(sample.creador?.id) === String(usuarioAuth.id)
        )
    );

    /* Cargar sample y similares */
    useEffect(() => {
        if (!slug) {
            setError('No se encontró el sample.');
            setCargando(false);
            return;
        }

        const controller = new AbortController();
        const cargar = async () => {
            setCargando(true);
            setError('');
            try {
                const respuesta = await obtenerSample(slug);
                if (controller.signal.aborted) return;
                if (respuesta.ok && respuesta.data) {
                    setSample(respuesta.data);
                    setLiked(Boolean(respuesta.data.liked));
                    setReaccionActual((respuesta.data as any).reaccion ?? null);

                    const tipoSample = respuesta.data.metadata?.tipo;
                    if (tipoSample) {
                        const resSimilares = await listarSamples({ tipo: tipoSample, perPage: 5 });
                        if (controller.signal.aborted) return;
                        if (resSimilares.ok && resSimilares.data) {
                            const listaSimilares = Array.isArray(resSimilares.data)
                                ? resSimilares.data
                                : (resSimilares.data.data ?? []);
                            setSimilares(listaSimilares.filter((s) => s.id !== respuesta.data!.id));
                        }
                    }
                } else {
                    setError(respuesta.error ?? 'Error al cargar el sample.');
                }
            } catch {
                if (!controller.signal.aborted) setError('Error al cargar el sample.');
            }
            if (!controller.signal.aborted) setCargando(false);
        };

        cargar();
        return () => { controller.abort(); };
    }, [slug]);

    /* ---- Callbacks de reacciones ---- */

    const manejarLike = useCallback(async () => {
        if (!sample) return;
        const prevLiked = liked;
        const prevReaccion = reaccionActual;
        try {
            if (liked || reaccionActual) {
                setLiked(false);
                setReaccionActual(null);
                await quitarLike('sample', sample.id);
            } else {
                setLiked(true);
                setReaccionActual('like');
                if (sugerenciasAlDarLike) setMostrarSimilares(true);
                await darLike('sample', sample.id, 'like');
            }
        } catch {
            setLiked(prevLiked);
            setReaccionActual(prevReaccion);
        }
    }, [liked, reaccionActual, sample, sugerenciasAlDarLike]);

    const manejarReaccionDetalle = useCallback(async (reaccion: TipoReaccion) => {
        if (!sample) return;
        const prevLiked = liked;
        const prevReaccion = reaccionActual;
        try {
            setLiked(reaccion !== 'dislike');
            setReaccionActual(reaccion);
            if (reaccion !== 'dislike' && sugerenciasAlDarLike) setMostrarSimilares(true);
            await darLike('sample', sample.id, reaccion);
        } catch {
            setLiked(prevLiked);
            setReaccionActual(prevReaccion);
        }
    }, [sample, sugerenciasAlDarLike]);

    const manejarQuitarReaccionDetalle = useCallback(async () => {
        if (!sample) return;
        const prevLiked = liked;
        const prevReaccion = reaccionActual;
        try {
            setLiked(false);
            setReaccionActual(null);
            await quitarLike('sample', sample.id);
        } catch {
            setLiked(prevLiked);
            setReaccionActual(prevReaccion);
        }
    }, [sample]);

    /* Like en samples similares (optimistic UI con reacciones) */
    const manejarLikeSimilar = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sim = similares.find((s) => s.id === sampleId);
        const snapshot = similares;
        try {
            if (reaccion) {
                const eraPositivo = sim?.reaccion === 'like' || sim?.reaccion === 'encanta';
                const esPositivo = reaccion !== 'dislike';
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setSimilares((prev) =>
                    prev.map((s) =>
                        s.id === sampleId
                            ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                            : s
                    )
                );
                await darLike('sample', sampleId, reaccion);
            } else if (sim?.liked || sim?.reaccion) {
                const eraPositivo = sim?.reaccion === 'like' || sim?.reaccion === 'encanta';
                setSimilares((prev) =>
                    prev.map((s) =>
                        s.id === sampleId
                            ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                            : s
                    )
                );
                await quitarLike('sample', sampleId);
            } else {
                setSimilares((prev) =>
                    prev.map((s) =>
                        s.id === sampleId
                            ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                            : s
                    )
                );
                await darLike('sample', sampleId, 'like');
            }
        } catch {
            setSimilares(snapshot);
        }
    }, [similares]);

    /* Tags/badges computados */
    const tagsHome = useMemo(() => {
        if (!sample) return [] as Array<{ texto: string; clave: string }>;
        const badges: Array<{ texto: string; clave: string }> = [];
        const meta = sample.metadata;

        const instrumentos = meta?.instrumentos ?? meta?.['instrumentos'];
        if (instrumentos) {
            const primerInst = Array.isArray(instrumentos) ? instrumentos[0] : instrumentos;
            if (primerInst) badges.push({ texto: primerInst, clave: 'inst' });
        }
        const genero = meta?.genero ?? meta?.['genero'];
        if (genero) {
            const primerGenero = Array.isArray(genero) ? genero[0] : genero;
            if (primerGenero) badges.push({ texto: primerGenero, clave: 'gen' });
        }
        const emocion = meta?.emocion_es ?? meta?.emocionEs ?? meta?.emocion;
        if (emocion) {
            const emociones = Array.isArray(emocion)
                ? emocion
                : String(emocion).split(/[,|;]\s*|\s+/).filter(Boolean);
            const primeraEmocion = emociones.find(e => e.length <= 30);
            if (primeraEmocion) badges.push({ texto: primeraEmocion, clave: 'emo' });
        }
        if (sample.bpm) badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'vel' });
        const tagsMeta = meta?.tags_es ?? meta?.tagsEs ?? meta?.tags ?? sample.tags;
        if (Array.isArray(tagsMeta) && tagsMeta.length > 0) badges.push({ texto: tagsMeta[0], clave: 'tag' });
        if (badges.length === 0) {
            if (sample.bpm) badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'bpm' });
            if (sample.key) badges.push({ texto: `${sample.key}${sample.escala === 'menor' ? 'm' : ''}`, clave: 'key' });
            badges.push({ texto: sample.tipo, clave: 'tipo' });
        }
        return badges;
    }, [sample]);

    return {
        sample,
        similares,
        mostrarSimilares,
        setMostrarSimilares,
        cargando,
        error,
        liked,
        reaccionActual,
        descargado,
        setDescargado,
        comentariosVisibles,
        setComentariosVisibles,
        slug,
        esPropietario,
        tagsHome,
        navegar,
        usuarioAuth,
        manejarLike,
        manejarReaccionDetalle,
        manejarQuitarReaccionDetalle,
        manejarLikeSimilar,
    };
}
