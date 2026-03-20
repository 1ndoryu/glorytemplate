/*
 * useColeccionDetalle — Hook para ColeccionDetalleIsland.
 * Gestiona carga de coleccion, descarga ZIP, guardar, menu contextual,
 * sugerencias y metas comunes.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { obtenerColeccion, obtenerColeccionPorSlug, descargarColeccionZip, guardarColeccionBookmark, desguardarColeccionBookmark } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useAuthStore } from '@app/stores/authStore';
import { useAuthModalStore } from '@app/stores/authModalStore';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { useColeccionDetalleMenu } from '@app/hooks/useColeccionDetalleMenu';
import { useCodigoGratisStore } from '@app/stores/codigoGratisStore';
import { useColeccionCombinacionPendiente } from '@app/hooks/useColeccionCombinacionPendiente';
import type { Coleccion, ColeccionResumen, SampleResumen } from '@app/types';

const TABS_COLECCION_DETALLE = [
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

interface ColeccionDetalleParams {
    propSlug?: string;
}

const hidratarColeccionDetalle = (coleccion: Coleccion, previa?: Coleccion | null): Coleccion => {
    const samples = coleccion.samples ?? previa?.samples;
    const subcolecciones = coleccion.subcolecciones ?? previa?.subcolecciones;
    const coleccionPadre = coleccion.coleccionPadre ?? previa?.coleccionPadre ?? null;
    const totalSamples = Array.isArray(samples) && samples.length > 0
        ? samples.length
        : coleccion.totalSamples;

    return {
        ...previa,
        ...coleccion,
        samples,
        subcolecciones,
        coleccionPadre,
        totalSamples,
    };
};

export function useColeccionDetalle({ propSlug }: ColeccionDetalleParams) {
    const [coleccion, setColeccion] = useState<Coleccion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardada, setGuardada] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [modalCombinarAbierto, setModalCombinarAbierto] = useState(false);
    const [modalVolumenAbierto, setModalVolumenAbierto] = useState(false);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

    /*
     * C387: Subcolecciones — filtro por sub.
     * subActiva = null → muestra samples del padre (por defecto).
     * subActiva = id → carga y muestra samples de esa sub.
     * Cache evita refetch si el usuario alterna entre subs.
     */
    const [subActiva, setSubActiva] = useState<number | null>(null);
    const [samplesSub, setSamplesSub] = useState<Map<number, SampleResumen[]>>(new Map());
    const [cargandoSub, setCargandoSub] = useState(false);
    const navegar = useNavigationStore(s => s.navegar);
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const usuario = useAuthStore(s => s.usuario);
    const abrirAuth = useAuthModalStore(s => s.abrir);
    const rutaActualRaw = useNavigationStore(s => s.rutaActual);

    /* Keep-alive: congelar valores globales cuando la isla está oculta */
    const activa = useIslaActiva('ColeccionDetalleIsland');
    const rutaActual = useValorCongelado(rutaActualRaw, !activa);
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);

    useTabsIsla('ColeccionDetalleIsland', TABS_COLECCION_DETALLE, 'samples');

    /* Habilitar panel lateral */
    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'ColeccionDetalleIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Obtener identificador: priorizar prop, luego ruta SPA (congelada para keep-alive).
     * Puede ser slug ("mi-coleccion-123") o ID numérico para backward compat. */
    const segmento = useMemo(() => {
        if (propSlug) return propSlug;
        const partes = rutaActual.split('/').filter(Boolean);
        const idx = partes.indexOf('coleccion');
        return idx >= 0 && partes[idx + 1] ? partes[idx + 1] : null;
    }, [propSlug, rutaActual]);

    /* ID numérico derivado del segmento (para operaciones que requieren ID) */
    const id = useMemo(() => {
        if (!segmento) return null;
        const n = parseInt(segmento, 10);
        return !isNaN(n) && String(n) === segmento ? n : null;
    }, [segmento]);

    /* QK70: Cargar coleccion con AbortController.
     * Soporta slug y backward compat con ID numerico.
     * incluirSubcolecciones=true para que "Todos" muestre samples de subs.
     * Se incluye `activa` en deps para re-fetch al reactivar la isla
     * (evita estado stuck si el fetch anterior fue abortado por keep-alive). */
    useEffect(() => {
        if (!segmento || !activa) return;
        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            try {
                const opts = { incluirSubcolecciones: true };
                const resp = id !== null
                    ? await obtenerColeccion(id, opts)
                    : await obtenerColeccionPorSlug(segmento, opts);
                if (controller.signal.aborted) return;
                if (resp.ok && resp.data) {
                    setColeccion(prev => hidratarColeccionDetalle(resp.data!, prev));
                    /* QL92: Cargar estado de bookmark desde la respuesta del servidor */
                    const rawData = resp.data as unknown as Record<string, unknown>;
                    setGuardada(Boolean(rawData.esta_guardada ?? rawData.estaGuardada ?? false));
                } else if (!controller.signal.aborted) {
                    /* QK70: Limpiar coleccion en fallo real (no abort) para evitar datos stale */
                    setColeccion(null);
                }
            } catch {
                if (!controller.signal.aborted) setColeccion(null);
            } finally {
                if (!controller.signal.aborted) setCargando(false);
            }
        };

        cargar();
        return () => { controller.abort(); };
    }, [segmento, id, activa]);

    const recargarColeccionActual = useCallback(async () => {
        if (!segmento) return;

        const resp = id !== null
            ? await obtenerColeccion(id, { incluirSubcolecciones: true })
            : await obtenerColeccionPorSlug(segmento, { incluirSubcolecciones: true });

        if (resp.ok && resp.data) {
            setColeccion(prev => hidratarColeccionDetalle(resp.data!, prev));
            const rawData = resp.data as unknown as Record<string, unknown>;
            setGuardada(Boolean(rawData.esta_guardada ?? rawData.estaGuardada ?? false));
        }
    }, [segmento, id]);

    const coleccionPadre = coleccion?.coleccionPadre ?? null;

    /*
     * QL92: Guardar/desguardar coleccion con persistencia en backend.
     * Optimista: actualiza UI inmediatamente, rollback si falla.
     */
    const manejarGuardar = useCallback(async () => {
        if (!usuario) { abrirAuth('login'); return; }
        if (!coleccion?.id) return;

        const valorAnterior = guardada;
        setGuardada(!valorAnterior);

        const resp = valorAnterior
            ? await desguardarColeccionBookmark(coleccion.id)
            : await guardarColeccionBookmark(coleccion.id);

        if (!resp.ok) {
            setGuardada(valorAnterior);
            toast.error(valorAnterior ? 'Error al quitar de guardadas' : 'Error al guardar colección');
        }
    }, [usuario, abrirAuth, coleccion?.id, guardada]);

    /* Descargar coleccion como ZIP */
    const obtenerCodigoParaColeccion = useCodigoGratisStore(s => s.obtenerCodigoParaColeccion);
    const manejarDescargarZip = useCallback(async () => {
        if (!usuario) { abrirAuth('login'); return; }
        if (!coleccion?.id || descargando) return;
        setDescargando(true);
        try {
            /* [183A-106] Pasar codigo gratis reclamado si existe para saltear limites */
            const codigoGratis = obtenerCodigoParaColeccion(coleccion.id) ?? undefined;
            const resp = await descargarColeccionZip(coleccion.id, codigoGratis);
            if (resp.ok && resp.data) {
                const a = document.createElement('a');
                a.href = resp.data.url;
                a.download = resp.data.nombre;
                document.body.appendChild(a);
                a.click();
                a.remove();

                const msg = resp.data.creditosUsados > 0
                    ? `Descargando ${resp.data.totalSamples} samples (${resp.data.creditosUsados} créditos usados)`
                    : `Descargando ${resp.data.totalSamples} samples (ya descargados previamente)`;
                toast.exito(msg);
            } else {
                if (resp.status === 429 || resp.status === 403) {
                    usePlanesModalStore.getState().abrir();
                }
                toast.error(resp.error ?? 'Error al descargar la colección');
            }
        } catch {
            toast.error(getT()('error.descargar'));
        } finally {
            setDescargando(false);
        }
    }, [coleccion?.id, descargando, usuario, abrirAuth, obtenerCodigoParaColeccion]);

    /* Sync like desde FeedSamples */
    const manejarLikeSamples = useCallback((sampleId: number) => {
        setColeccion((prev) => {
            if (!prev?.samples) return prev;
            return {
                ...prev,
                samples: prev.samples.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: !s.liked, totalLikes: s.liked ? s.totalLikes - 1 : s.totalLikes + 1 }
                        : s
                ),
            };
        });
    }, []);

    const samples = coleccion?.samples ?? [];

    /* C387: Subcolecciones disponibles (solo para colecciones raíz) */
    const subcolecciones: ColeccionResumen[] = useMemo(
        () => (coleccion?.parentId === null ? coleccion?.subcolecciones ?? [] : []),
        [coleccion],
    );

    /*
     * C387: Fetch lazy de samples de subcolecciones.
     * Al seleccionar una sub, si no está en cache, se carga su detalle.
     */
    useEffect(() => {
        if (subActiva === null) return;
        if (samplesSub.has(subActiva)) return;

        const controller = new AbortController();
        setCargandoSub(true);

        const cargarSub = async () => {
            try {
                const resp = await obtenerColeccion(subActiva);
                if (controller.signal.aborted) return;
                if (resp.ok && resp.data?.samples) {
                    setSamplesSub(prev => new Map(prev).set(subActiva, resp.data!.samples ?? []));
                }
            } catch {
                /* Fallo silencioso: se mostrará lista vacía */
            } finally {
                if (!controller.signal.aborted) setCargandoSub(false);
            }
        };

        cargarSub();
        return () => { controller.abort(); };
    }, [subActiva, samplesSub]);

    /* C387: Samples visibles según filtro de subcolección */
    const samplesVisibles = useMemo(() => {
        if (subActiva === null) return samples;
        return samplesSub.get(subActiva) ?? [];
    }, [subActiva, samples, samplesSub]);

    /* Metas mas comunes de los samples visibles */
    const metasComunes = useMemo(() => {
        if (!samplesVisibles.length) return [];
        const conteo = new Map<string, number>();
        for (const s of samplesVisibles) {
            const m = s.metadata;
            if (!m) continue;
            const valores: string[] = [];
            const genero = m.genero;
            if (Array.isArray(genero)) valores.push(...genero.filter((g): g is string => typeof g === 'string'));
            else if (typeof genero === 'string' && genero) valores.push(genero);
            if (typeof m.emocion === 'string' && m.emocion) valores.push(m.emocion);
            if (typeof m.emocionEs === 'string' && m.emocionEs && m.emocionEs !== m.emocion) valores.push(m.emocionEs);
            const instrumentos = m.instrumentos;
            if (Array.isArray(instrumentos)) valores.push(...instrumentos.filter((i): i is string => typeof i === 'string'));
            else if (typeof instrumentos === 'string' && instrumentos) valores.push(instrumentos);
            if (typeof m.tipo === 'string' && m.tipo) valores.push(m.tipo);
            for (const v of valores) {
                if (typeof v !== 'string') continue;
                const limpio = v.trim().toLowerCase();
                if (limpio) conteo.set(limpio, (conteo.get(limpio) ?? 0) + 1);
            }
        }
        return [...conteo.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1));
    }, [samplesVisibles]);

    /* QL115: Combinación pendiente — extraído a hook separado (SRP) */
    const {
        combinacionPendiente, deshaciendoCombinacion,
        manejarDeshacerCombinacion, manejarCombinado: _manejarCombinadoNav,
    } = useColeccionCombinacionPendiente({ coleccionId: coleccion?.id ?? null, activa, navegar });

    /* [2003A-1] Override: al combinar desde el detalle, recargar datos en vez de navegar
     * a la misma URL (que el SPA ignora sin refetch). */
    const manejarCombinado = useCallback((_destinoId: number) => {
        recargarColeccionActual();
    }, [recargarColeccionActual]);

    /* QL119: Callback tras eliminar — navegar a librería */
    const manejarEliminado = useCallback(() => {
        navegar('/libreria/');
    }, [navegar]);

    /* Menu contextual — extraído a hook separado (SRP) */
    const {
        menuColeccion, abrirMenuColeccion, cerrarMenuColeccion, itemsMenuColeccion,
    } = useColeccionDetalleMenu({ coleccion, usuario, navegar, setModalEditarAbierto, setModalCombinarAbierto, setModalVolumenAbierto, setModalEliminarAbierto });

    /* Actualiza el estado local de la coleccion tras una edicion en el modal */
    const manejarGuardarEdicion = useCallback((coleccionActualizada: Coleccion) => {
        setColeccion(prev => hidratarColeccionDetalle(coleccionActualizada, prev));
        setModalEditarAbierto(false);
    }, []);

    return {
        coleccion,
        cargando,
        guardada,
        descargando,
        navegar,
        tabActiva,
        usuario,
        id,
        samples: samplesVisibles,
        metasComunes,
        subcolecciones,
        subActiva,
        setSubActiva,
        cargandoSub,
        coleccionPadre,
        menuColeccion,
        abrirMenuColeccion,
        cerrarMenuColeccion,
        itemsMenuColeccion,
        modalEditarAbierto,
        setModalEditarAbierto,
        manejarGuardarEdicion,
        manejarGuardar,
        manejarDescargarZip,
        manejarLikeSamples,
        modalCombinarAbierto,
        setModalCombinarAbierto,
        modalVolumenAbierto,
        setModalVolumenAbierto,
        recargarColeccionActual,
        combinacionPendiente,
        manejarDeshacerCombinacion,
        deshaciendoCombinacion,
        manejarCombinado,
        modalEliminarAbierto,
        setModalEliminarAbierto,
        manejarEliminado,
    };
}
