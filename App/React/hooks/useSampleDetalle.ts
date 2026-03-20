/*
 * useSampleDetalle — Hook para la isla SampleDetalleIsland.
 * Gestiona la carga del sample, likes/reacciones, similares y tags.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { obtenerSample } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { descargarSample } from '@app/services/apiDescargas';
import { descargarArchivo } from '@app/utils/descargarArchivo';
import { etiquetaBpm } from '@app/services/bpmUtils';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import type { Sample, SampleResumen, TipoReaccion } from '@app/types';

interface SampleDetalleParams {
    slugProp?: string;
}

export function useSampleDetalle({ slugProp }: SampleDetalleParams) {
    const [sample, setSample] = useState<Sample | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [reaccionActual, setReaccionActual] = useState<TipoReaccion | null>(null);
    const [descargado, setDescargado] = useState(false);
    const [comentariosVisibles, setComentariosVisibles] = useState(true);

    const rutaActual = useNavigationStore(s => s.rutaActual);
    const navegar = useNavigationStore(s => s.navegar);
    const usuarioAuth = useAuthStore(s => s.usuario);
    const abrirSugerencias = usePanelLateralStore(s => s.abrirSugerencias);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirPlanes = usePlanesModalStore(s => s.abrir);

    /* Keep-alive: congelar rutaActual cuando la isla está oculta (display:none).
     * Sin esto, navegar a /comunidad/ cambia rutaActual → slug se hace null →
     * useEffect setea error y al volver re-fetcha innecesariamente. */
    const activa = useIslaActiva('SampleDetalleIsland');
    const rutaCongelada = useValorCongelado(rutaActual, !activa);

    /* QQ19: Habilitar panel lateral en la isla de detalle para sugerencias */
    useEffect(() => {
        if (activa) habilitarPanel();
    }, [activa, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Resolver slug: priorizar URL SPA sobre prop PHP (stale tras primer render) */
    const slug = useMemo(() => {
        const segmentos = rutaCongelada.replace(/\/$/, '').split('/');
        const idxSample = segmentos.indexOf('sample');
        if (idxSample !== -1 && segmentos[idxSample + 1] && segmentos[idxSample + 1] !== 'sample') {
            return segmentos[idxSample + 1];
        }
        return slugProp && slugProp !== 'sample' ? slugProp : null;
    }, [rutaCongelada, slugProp]);

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
                    setReaccionActual(respuesta.data.reaccion ?? null);
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

    /* [183A-73][183A-92] Descarga con validacion de plan y feedback de error.
     * En nativo (Capacitor Android) usa descargarArchivo → Filesystem.writeFile(Documents).
     * En web usa el patrón <a download>. */
    const manejarDescargar = useCallback(async () => {
        if (!sample) return;
        const resp = await descargarSample(sample.id);
        if (resp.ok && resp.data?.url) {
            setDescargado(true);
            try {
                const uri = await descargarArchivo(resp.data.url, resp.data.nombre || sample.titulo || 'sample');
                if (uri) toast.exito('Sample guardado en Documentos/Kamples');
            } catch {
                toast.error(getT()('error.guardarArchivo'));
            }
        } else if (resp.status === 429) {
            toast.error(resp.error ?? 'Has alcanzado el límite de descargas diarias');
            abrirPlanes();
        } else if (resp.status === 403) {
            toast.error(resp.error ?? 'Se requiere plan Pro o Premium');
            abrirPlanes();
        } else if (!resp.ok) {
            toast.error(resp.error ?? 'Error al descargar');
        }
    }, [sample, setDescargado, abrirPlanes]);

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
                abrirSugerencias(sample as unknown as SampleResumen);
                await darLike('sample', sample.id, 'like');
            }
        } catch {
            setLiked(prevLiked);
            setReaccionActual(prevReaccion);
        }
    }, [liked, reaccionActual, sample, abrirSugerencias]);

    const manejarReaccionDetalle = useCallback(async (reaccion: TipoReaccion) => {
        if (!sample) return;
        const prevLiked = liked;
        const prevReaccion = reaccionActual;
        try {
            setLiked(reaccion !== 'dislike');
            setReaccionActual(reaccion);
            if (reaccion !== 'dislike') abrirSugerencias(sample as unknown as SampleResumen);
            await darLike('sample', sample.id, reaccion);
        } catch {
            setLiked(prevLiked);
            setReaccionActual(prevReaccion);
        }
    }, [sample, abrirSugerencias]);

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
        manejarDescargar,
        manejarLike,
        manejarReaccionDetalle,
        manejarQuitarReaccionDetalle,
    };
}
