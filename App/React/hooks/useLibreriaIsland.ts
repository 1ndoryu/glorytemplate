/*
 * Hook: useLibreriaIsland — Kamples
 * Lógica de LibreriaIsland: carga por tab (explorar/colecciones), CRUD colecciones.
 * C388: Filtros por tags, ordenamiento y aplanamiento de subcolecciones.
 * Extraído de LibreriaIsland (SRP).
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion, listarColeccionesGuardadas } from '@app/services/apiColecciones';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';

const log = crearLogger('LibreriaIsland');

/* C388: Tipos de ordenamiento disponibles */
export type OrdenColecciones = 'recientes' | 'nombre' | 'totalSamples';

export function useLibreriaIsland() {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [coleccionesGuardadas, setColeccionesGuardadas] = useState<Coleccion[]>([]);
    const [totalGuardadas, setTotalGuardadas] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [modalColeccionAbierto, setModalColeccionAbierto] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    /* C388: Tags frecuentes y filtro/ordenamiento */
    const [tagsFrecuentes, setTagsFrecuentes] = useState<string[]>([]);
    const [tagActivo, setTagActivo] = useState<string | null>(null);
    const [orden, setOrden] = useState<OrdenColecciones>('recientes');

    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);

    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const busquedaGlobal = useFiltrosStore(s => s.busqueda);

    /* Keep-alive: congelar tabActiva y busqueda cuando la isla está oculta.
     * Sin esto, otra isla cambiando tabs o el usuario escribiendo en TopBar
     * provoca re-fetch de datos en esta isla oculta. */
    const activa = useIslaActiva('LibreriaIsland');
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);
    const busqueda = useValorCongelado(busquedaGlobal, !activa);

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'LibreriaIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Cargar datos según tab activa con cleanup.
     * C346: Skip de re-fetch si los parámetros no cambiaron realmente
     * (evita recarga al volver a la isla si el store global cambió
     *  mientras estaba oculta pero el valor congelado resultante es el mismo). */
    const ultimoFetchRef = useRef<{ tab: string; busqueda: string } | null>(null);

    useEffect(() => {
        /* Si los parámetros son los mismos que el último fetch exitoso, no recargar */
        if (
            ultimoFetchRef.current &&
            ultimoFetchRef.current.tab === tabActiva &&
            ultimoFetchRef.current.busqueda === busqueda
        ) {
            return;
        }

        let activo = true;
        setCargando(true);

        const cargar = async () => {
            try {
                if (tabActiva === 'explorar') {
                    const resp = await listarColeccionesPublicas(busqueda || undefined);
                    if (!activo) return;
                    if (resp.ok && resp.data) {
                        setColeccionesPublicas(resp.data.colecciones);
                        setTagsFrecuentes(resp.data.tagsFrecuentes);
                    } else {
                        setColeccionesPublicas([]);
                        setTagsFrecuentes([]);
                    }
                } else if (tabActiva === 'colecciones') {
                    const resp = await listarColecciones(undefined, busqueda || undefined);
                    if (!activo) return;
                    if (resp.ok && resp.data) {
                        setColecciones(resp.data.colecciones);
                        setTagsFrecuentes(resp.data.tagsFrecuentes);
                    } else {
                        setColecciones([]);
                        setTagsFrecuentes([]);
                    }
                } else if (tabActiva === 'guardadas') {
                    const resp = await listarColeccionesGuardadas(1, 100);
                    if (!activo) return;
                    if (resp.ok && resp.data) {
                        setColeccionesGuardadas(resp.data.colecciones);
                        setTotalGuardadas(resp.data.total);
                    } else {
                        setColeccionesGuardadas([]);
                        setTotalGuardadas(0);
                    }
                }
                if (activo) {
                    ultimoFetchRef.current = { tab: tabActiva, busqueda };
                }
            } catch {
                if (activo) {
                    setColecciones([]);
                    setColeccionesPublicas([]);
                    setTagsFrecuentes([]);
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [tabActiva, busqueda]);

    /*
     * C388: Aplanar colecciones (padres + subcolecciones) para grid unificado.
     * Cada subcolección se marca con parentId !== null para indicar visualmente.
     */
    const coleccionesPlanas: Coleccion[] = useMemo(() => {
        const resultado: Coleccion[] = [];
        for (const col of colecciones) {
            resultado.push(col);
            if (col.subcolecciones) {
                for (const sub of col.subcolecciones) {
                    /* Promover ColeccionResumen a Coleccion con campos mínimos */
                    resultado.push({
                        id: sub.id,
                        usuarioId: col.usuarioId,
                        nombre: sub.nombre,
                        slug: sub.slug,
                        descripcion: '',
                        esPublica: sub.esPublica,
                        imagenUrl: sub.imagenUrl,
                        totalSamples: sub.totalSamples,
                        creadoAt: col.creadoAt,
                        actualizadoAt: col.actualizadoAt,
                        parentId: sub.parentId,
                        tags: sub.tags,
                    });
                }
            }
        }
        return resultado;
    }, [colecciones]);

    /*
     * C388: Colecciones filtradas por tag activo y ordenadas.
     * Filtro client-side: verifica si el tag activo está en los tags de la colección.
     * Ordenamiento: recientes (updatedAt desc), nombre (asc), totalSamples (desc).
     */
    const coleccionesFiltradas: Coleccion[] = useMemo(() => {
        let filtradas = coleccionesPlanas;

        /* Filtrar por tag si hay uno activo */
        if (tagActivo) {
            const tagLower = tagActivo.toLowerCase();
            filtradas = filtradas.filter(c =>
                c.tags.some(t => t.toLowerCase() === tagLower)
            );
        }

        /* Ordenar */
        const copia = [...filtradas];
        switch (orden) {
            case 'nombre':
                copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
                break;
            case 'totalSamples':
                copia.sort((a, b) => b.totalSamples - a.totalSamples);
                break;
            case 'recientes':
            default:
                /* Ya vienen ordenadas por updated_at DESC del backend */
                break;
        }

        return copia;
    }, [coleccionesPlanas, tagActivo, orden]);

    /* B1: Filtrar y ordenar colecciones públicas (explorar) con los mismos criterios */
    const publicasFiltradas: Coleccion[] = useMemo(() => {
        let filtradas: Coleccion[] = coleccionesPublicas;

        if (tagActivo) {
            const tagLower = tagActivo.toLowerCase();
            filtradas = filtradas.filter(c =>
                c.tags.some(t => t.toLowerCase() === tagLower)
            );
        }

        const copia = [...filtradas];
        switch (orden) {
            case 'nombre':
                copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
                break;
            case 'totalSamples':
                copia.sort((a, b) => b.totalSamples - a.totalSamples);
                break;
            case 'recientes':
            default:
                break;
        }

        return copia;
    }, [coleccionesPublicas, tagActivo, orden]);

    /* C388: Total de colecciones para el contador (varía según tab activa) */
    const totalColecciones = tabActiva === 'explorar'
        ? publicasFiltradas.length
        : tabActiva === 'guardadas'
        ? totalGuardadas
        : coleccionesFiltradas.length;

    const abrirNuevaColeccion = useCallback(() => {
        setColeccionEditando(null);
        setModalColeccionAbierto(true);
    }, []);

    const manejarEditarColeccion = useCallback((col: Coleccion) => {
        setColeccionEditando(col);
        setModalColeccionAbierto(true);
    }, []);

    const manejarEliminarColeccion = useCallback(async (col: Coleccion) => {
        /* B5: Eliminación optimista — remover de ambas listas inmediatamente */
        setColecciones(prev => prev.filter(c => c.id !== col.id));
        setColeccionesPublicas(prev => prev.filter(c => c.id !== col.id));

        const resp = await eliminarColeccion(col.id);
        if (resp.ok) {
            log.info('Colección eliminada', { id: col.id });
        } else {
            /* Rollback: restaurar si falló */
            log.error('Error eliminando colección, restaurando', { id: col.id });
            setColecciones(prev => [col, ...prev]);
            setColeccionesPublicas(prev => [col, ...prev]);
        }
    }, []);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones(prev => {
            const existe = prev.find(c => c.id === col.id);
            if (existe) return prev.map(c => (c.id === col.id ? col : c));
            return [col, ...prev];
        });
    }, []);

    return {
        colecciones: coleccionesFiltradas, coleccionesPublicas: publicasFiltradas,
        coleccionesGuardadas, cargando,
        modalColeccionAbierto, setModalColeccionAbierto, coleccionEditando,
        tabActiva,
        /* C388: Filtros y ordenamiento */
        tagsFrecuentes, tagActivo, setTagActivo,
        orden, setOrden, totalColecciones,
        abrirNuevaColeccion, manejarEditarColeccion, manejarEliminarColeccion, manejarGuardarColeccion,
    };
}
