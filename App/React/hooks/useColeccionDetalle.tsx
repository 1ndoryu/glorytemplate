/*
 * useColeccionDetalle — Hook para ColeccionDetalleIsland.
 * Gestiona carga de coleccion, descarga ZIP, guardar, menu contextual,
 * sugerencias y metas comunes.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link2, Trash2, Flag, Edit3 } from 'lucide-react';
import { obtenerColeccion, obtenerColeccionPorSlug, descargarColeccionZip } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useAuthStore } from '@app/stores/authStore';
import { toast } from '@app/stores/toastStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import type { Coleccion, ColeccionResumen, SampleResumen } from '@app/types';

const TABS_COLECCION_DETALLE = [
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

interface ColeccionDetalleParams {
    propSlug?: string;
}

export function useColeccionDetalle({ propSlug }: ColeccionDetalleParams) {
    const [coleccion, setColeccion] = useState<Coleccion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardada, setGuardada] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

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

    /* Cargar coleccion con AbortController.
     * Soporta slug y backward compat con ID numérico.
     * incluirSubcolecciones=true para que "Todos" muestre samples de subs. */
    useEffect(() => {
        if (!segmento) return;
        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            try {
                /* Si el segmento es puramente numérico, usar endpoint por ID; si no, por slug */
                const opts = { incluirSubcolecciones: true };
                const resp = id !== null
                    ? await obtenerColeccion(id, opts)
                    : await obtenerColeccionPorSlug(segmento, opts);
                if (controller.signal.aborted) return;
                if (resp.ok && resp.data) setColeccion(resp.data);
            } catch {
                /* Fallo de carga silencioso */
            } finally {
                if (!controller.signal.aborted) setCargando(false);
            }
        };

        cargar();
        return () => { controller.abort(); };
    }, [segmento, id]);

    const manejarGuardar = useCallback(() => {
        setGuardada((prev) => !prev);
    }, []);

    /* Descargar coleccion como ZIP */
    const manejarDescargarZip = useCallback(async () => {
        if (!coleccion?.id || descargando) return;
        setDescargando(true);
        try {
            const resp = await descargarColeccionZip(coleccion.id);
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
            toast.error('Error de conexión al descargar');
        } finally {
            setDescargando(false);
        }
    }, [coleccion?.id, descargando]);

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

    /* Menu contextual de la coleccion */
    const [menuColeccion, setMenuColeccion] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0
    });

    const abrirMenuColeccion = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuColeccion({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenuColeccion = useCallback(() => {
        setMenuColeccion(prev => ({ ...prev, abierto: false }));
    }, []);

    const itemsMenuColeccion = useMemo(() => {
        if (!coleccion) return [];
        const esPropietario = usuario?.id !== undefined && String(coleccion.usuarioId) === String(usuario.id);
        const esAdmin = usuario?.rol === 'admin';
        const items: { id: string; etiqueta: string; icono: JSX.Element; onClick: () => void; peligro?: boolean; separadorDespues?: boolean }[] = [];

        items.push({
            id: 'copiar-enlace',
            etiqueta: 'Copiar enlace',
            icono: <Link2 size={16} />,
            separadorDespues: true,
            onClick: () => {
                copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.slug ?? coleccion.id}/`);
                cerrarMenuColeccion();
            }
        });

        if (esPropietario || esAdmin) {
            items.push({
                id: 'editar',
                etiqueta: 'Editar colección',
                icono: <Edit3 size={16} />,
                separadorDespues: true,
                onClick: () => {
                    cerrarMenuColeccion();
                    setModalEditarAbierto(true);
                }
            });
        }

        if (esPropietario || esAdmin) {
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar colección',
                icono: <Trash2 size={16} />,
                peligro: true,
                onClick: () => {
                    toast.confirmar('¿Eliminar esta colección?', async () => {
                        const { apiDelete } = await import('@app/services/apiCliente');
                        const resp = await apiDelete(`/colecciones/${coleccion.id}`);
                        if (resp.ok) {
                            toast.exito('Colección eliminada');
                            navegar('/libreria/');
                        }
                    });
                    cerrarMenuColeccion();
                }
            });
        }

        items.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            onClick: () => { cerrarMenuColeccion(); }
        });

        return items;
    }, [coleccion, usuario, navegar, cerrarMenuColeccion]);

    /* Actualiza el estado local de la coleccion tras una edicion en el modal */
    const manejarGuardarEdicion = useCallback((coleccionActualizada: Coleccion) => {
        setColeccion(coleccionActualizada);
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
    };
}
