/*
 * usePanelDetalleSample — Hook para PanelDetalleSample.
 * Gestiona carga de detalle, similares, audio inline (waveform + play),
 * likes y coordinacion de reproduccion global.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { obtenerSample } from '@app/services/apiSamples';
import { obtenerSimilares } from '@app/services/apiReproduciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useReproductorStore } from '@app/stores/reproductorStore';
import type { Sample, SampleResumen } from '@app/types';

/* Evento compartido para coordinar reproduccion entre audios */
const EVENTO_REPRODUCCION_SAMPLE = 'kamples:reproduccion-sample';

export function usePanelDetalleSample(sample: SampleResumen) {
    const [detalle, setDetalle] = useState<Sample | null>(null);
    const [liked, setLiked] = useState(sample.liked ?? false);
    const [reaccion, setReaccion] = useState<TipoReaccion | null>(sample.reaccion ?? null);
    const [totalLikes, setTotalLikes] = useState(sample.totalLikes);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const [comentariosVisibles, setComentariosVisibles] = useState(false);
    const navegar = useNavigationStore(s => s.navegar);
    const cerrar = usePanelLateralStore(s => s.cerrar);

    /* Audio */
    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progresoAudio, setProgresoAudio] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    /* Cargar detalle + similares con AbortController */
    useEffect(() => {
        const controller = new AbortController();

        const cargar = async () => {
            const [respDetalle, respSimilares] = await Promise.all([
                obtenerSample(sample.slug),
                obtenerSimilares(sample.id, 12),
            ]);
            if (controller.signal.aborted) return;
            if (respDetalle.ok && respDetalle.data) setDetalle(respDetalle.data);
            if (respSimilares.ok && respSimilares.data) setSimilares(respSimilares.data);
        };

        cargar();
        return () => { controller.abort(); };
    }, [sample.id, sample.slug]);

    /* Cargar picos del waveform con AbortController */
    useEffect(() => {
        const controller = new AbortController();

        const cargarPicos = async () => {
            if (sample.rutaWaveform) {
                try {
                    const resp = await fetch(sample.rutaWaveform, { signal: controller.signal });
                    if (resp.ok) {
                        const json = await resp.json();
                        if (controller.signal.aborted) return;
                        const datos = Array.isArray(json)
                            ? json
                            : (json.peaks ?? json.picos ?? json.data ?? null);
                        if (Array.isArray(datos) && datos.length > 0) {
                            const maximo = Math.max(...datos, 0.001);
                            setPicosAudio(maximo > 1
                                ? datos.map((p: number) => Math.max(0.03, p / maximo))
                                : datos
                            );
                            return;
                        }
                    }
                } catch { /* Fallback silencioso */ }
            }

            /* Fallback: generar desde preview con AudioContext */
            if (!sample.rutaPreview || typeof window === 'undefined' || !window.AudioContext) {
                if (!controller.signal.aborted) setPicosAudio(null);
                return;
            }
            const ctx = new AudioContext();
            try {
                const resp = await fetch(sample.rutaPreview, { signal: controller.signal });
                if (!resp.ok) throw new Error('Error al obtener picos de audio');
                const buf = await resp.arrayBuffer();
                const decoded = await ctx.decodeAudioData(buf.slice(0));
                if (controller.signal.aborted) return;
                const raw = decoded.getChannelData(0);
                const barras = 96;
                const grupo = Math.floor(raw.length / barras);
                const picos: number[] = [];
                for (let i = 0; i < barras; i++) {
                    let max = 0;
                    for (let j = 0; j < grupo; j++) {
                        const abs = Math.abs(raw[i * grupo + j] || 0);
                        if (abs > max) max = abs;
                    }
                    picos.push(max);
                }
                const picoMax = Math.max(...picos, 0.001);
                setPicosAudio(picos.map(p => Math.max(0.03, p / picoMax)));
            } catch {
                if (!controller.signal.aborted) setPicosAudio(null);
            } finally {
                ctx.close().catch(() => undefined);
            }
        };

        cargarPicos();
        return () => { controller.abort(); };
    }, [sample.rutaWaveform, sample.rutaPreview]);

    /* Inicializar elemento de audio */
    const inicializarAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio(sample.rutaPreview);
        audio.preload = 'metadata';

        audio.addEventListener('timeupdate', () => {
            if (audio.duration) setProgresoAudio(audio.currentTime / audio.duration);
        });
        audio.addEventListener('ended', () => { setReproduciendo(false); setProgresoAudio(0); });
        audio.addEventListener('pause', () => setReproduciendo(false));
        audio.addEventListener('play', () => setReproduciendo(true));

        audioRef.current = audio;
        return audio;
    }, [sample.rutaPreview]);

    /* Limpiar audio al desmontar o al cambiar de sample */
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
            setReproduciendo(false);
            setProgresoAudio(0);
        };
    }, [sample.rutaPreview]);

    /* Play/pause al click en waveform */
    const manejarClickWaveform = useCallback(() => {
        const audio = inicializarAudio();
        if (reproduciendo) {
            audio.pause();
        } else {
            useReproductorStore.getState().pause();
            window.dispatchEvent(new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, {
                detail: { sampleId: sample.id },
            }));
            audio.play().catch(() => setReproduciendo(false));
        }
    }, [inicializarAudio, reproduciendo, sample.id]);

    /* Seek por posicion */
    const manejarSeek = useCallback((posicion: number) => {
        const audio = inicializarAudio();
        if (!reproduciendo) return;

        const aplicar = () => {
            if (!audio.duration) return;
            audio.currentTime = posicion * audio.duration;
            setProgresoAudio(posicion);
        };
        if (audio.duration && Number.isFinite(audio.duration)) {
            aplicar();
        } else {
            const h = () => { aplicar(); audio.removeEventListener('loadedmetadata', h); };
            audio.addEventListener('loadedmetadata', h);
            audio.load();
        }
    }, [inicializarAudio, reproduciendo]);

    /* Pausar si otro sample empieza a reproducir */
    useEffect(() => {
        const pausarSiEsOtro = (e: CustomEvent) => {
            if (e.detail?.sampleId !== sample.id && audioRef.current) {
                audioRef.current.pause();
            }
        };
        window.addEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
        return () => {
            window.removeEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
        };
    }, [sample.id]);

    /* Like con optimistic UI */
    const manejarLike = useCallback(async () => {
        if (liked || reaccion) {
            const eraPositivo = reaccion === 'like' || reaccion === 'encanta';
            setLiked(false);
            setReaccion(null);
            setTotalLikes(prev => Math.max(0, prev - (eraPositivo ? 1 : 0)));
            await quitarLike('sample', sample.id);
        } else {
            setLiked(true);
            setReaccion('like');
            setTotalLikes(prev => prev + 1);
            await darLike('sample', sample.id, 'like');
        }
    }, [liked, reaccion, sample.id]);

    /* Badges de metadata */
    const meta = sample.metadata;
    const badges: string[] = [];
    if (meta?.instrumentos) {
        const inst = Array.isArray(meta.instrumentos) ? meta.instrumentos : [meta.instrumentos];
        inst.forEach(i => { if (i) badges.push(i as string); });
    }
    if (meta?.genero) {
        const gen = Array.isArray(meta.genero) ? meta.genero : [meta.genero];
        gen.forEach(g => { if (g) badges.push(g as string); });
    }
    if (meta?.emocion) {
        const emociones = Array.isArray(meta.emocion)
            ? meta.emocion
            : String(meta.emocion).split(/[,|;]\s*|\s+/).filter(Boolean);
        emociones.forEach(e => { if (e && (e as string).length <= 30) badges.push(e as string); });
    }
    if (sample.bpm) badges.push(`${sample.bpm} BPM`);
    if (sample.key) badges.push(sample.key);

    return {
        detalle,
        liked,
        totalLikes,
        similares,
        comentariosVisibles,
        setComentariosVisibles,
        navegar,
        cerrar,
        picosAudio,
        reproduciendo,
        progresoAudio,
        manejarClickWaveform,
        manejarSeek,
        manejarLike,
        badges,
    };
}
