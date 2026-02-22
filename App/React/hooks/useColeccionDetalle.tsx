/*
 * useColeccionDetalle — Hook para ColeccionDetalleIsland.
 * Gestiona carga de coleccion, descarga ZIP, guardar, menu contextual,
 * sugerencias y metas comunes.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link2, Trash2, Flag } from 'lucide-react';
import { obtenerColeccion, descargarColeccionZip } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useAuthStore } from '@app/stores/authStore';
import { toast } from '@app/stores/toastStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import type { Coleccion } from '@app/types';

const TABS_COLECCION_DETALLE = [
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

interface ColeccionDetalleParams {
    propId?: string;
}

export function useColeccionDetalle({ propId }: ColeccionDetalleParams) {
    const [coleccion, setColeccion] = useState<Coleccion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardada, setGuardada] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const navegar = useNavigationStore(s => s.navegar);
    const tabActiva = useTabsTopBarStore(s => s.activa);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const usuario = useAuthStore(s => s.usuario);

    useTabsIsla('ColeccionDetalleIsland', TABS_COLECCION_DETALLE, 'samples');

    /* Habilitar panel lateral */
    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'ColeccionDetalleIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Obtener ID de la URL si no viene por props */
    const id = propId ? parseInt(propId, 10) : (() => {
        const path = window.location.pathname;
        const partes = path.split('/').filter(Boolean);
        const idx = partes.indexOf('coleccion');
        return idx >= 0 && partes[idx + 1] ? parseInt(partes[idx + 1], 10) : null;
    })();

    /* Cargar coleccion con AbortController */
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await obtenerColeccion(id);
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
    }, [id]);

    const manejarGuardar = useCallback(() => {
        setGuardada((prev) => !prev);
    }, []);

    /* Descargar coleccion como ZIP */
    const manejarDescargarZip = useCallback(async () => {
        if (!id || descargando) return;
        setDescargando(true);
        try {
            const resp = await descargarColeccionZip(id);
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
    }, [id, descargando]);

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

    /* Metas mas comunes de los samples */
    const metasComunes = useMemo(() => {
        if (!samples.length) return [];
        const conteo = new Map<string, number>();
        for (const s of samples) {
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
    }, [samples]);

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
                copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.id}/`);
                cerrarMenuColeccion();
            }
        });

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

    return {
        coleccion,
        cargando,
        guardada,
        descargando,
        navegar,
        tabActiva,
        usuario,
        id,
        samples,
        metasComunes,
        menuColeccion,
        abrirMenuColeccion,
        cerrarMenuColeccion,
        itemsMenuColeccion,
        manejarGuardar,
        manejarDescargarZip,
        manejarLikeSamples,
    };
}
