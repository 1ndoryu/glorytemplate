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
import {
    LS_KEY_ORDEN,
    LS_KEY_VISTA,
    ORDENES_VALIDOS,
    VISTAS_VALIDAS,
    leerPreferencia,
    guardarPreferencia,
    normalizarColecciones,
    coincideTagColeccion,
    coincideBusquedaColeccion,
    ordenarColecciones,
    construirArbolEstricto,
} from '@app/utils/libreriaColecciones';
import type { Coleccion } from '@app/types';
import type { OrdenColecciones, VistaColecciones } from '@app/utils/libreriaColecciones';

const log = crearLogger('LibreriaIsland');
export type { OrdenColecciones, VistaColecciones };

/* [2003A-39] Tamaño de página del endpoint /colecciones/explorar (hardcoded en backend) */
const PAGE_SIZE_EXPLORAR = 20;

export function useLibreriaIsland() {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [coleccionesGuardadas, setColeccionesGuardadas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalColeccionAbierto, setModalColeccionAbierto] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);
    const [modalCombinarAbierto, setModalCombinarAbierto] = useState(false);
    const [coleccionCombinando, setColeccionCombinando] = useState<Coleccion | null>(null);
    const [versionDatos, setVersionDatos] = useState(0);

    /* [2003A-39] Paginación para tab explorar (infinite scroll) */
    const [paginaExplorar, setPaginaExplorar] = useState(1);
    const [hayMasExplorar, setHayMasExplorar] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);

    /* C388: Tags frecuentes y filtro/ordenamiento */
    const [tagsFrecuentes, setTagsFrecuentes] = useState<string[]>([]);
    const [tagActivo, setTagActivo] = useState<string | null>(null);
    /* [2103A-3] Default 'inteligente' — refleja el scoring multi-factor del backend */
    const [orden, setOrden] = useState<OrdenColecciones>(() => leerPreferencia(LS_KEY_ORDEN, ORDENES_VALIDOS, 'inteligente'));
    const [vista, setVista] = useState<VistaColecciones>(() => leerPreferencia(LS_KEY_VISTA, VISTAS_VALIDAS, 'cuadricula'));

    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);

    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const busquedaGlobal = useFiltrosStore(s => s.busqueda);

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

    const ultimoFetchRef = useRef<{ tab: string; busqueda: string } | null>(null);

    useEffect(() => {
        guardarPreferencia(LS_KEY_ORDEN, orden);
    }, [orden]);

    useEffect(() => {
        guardarPreferencia(LS_KEY_VISTA, vista);
    }, [vista]);

    useEffect(() => {
        if (
            ultimoFetchRef.current &&
            ultimoFetchRef.current.tab === tabActiva &&
            ultimoFetchRef.current.busqueda === busqueda
        ) {
            return;
        }

        let activo = true;
        setCargando(true);
        /* [2003A-39] Reset paginación al cambiar tab/busqueda */
        setPaginaExplorar(1);
        setHayMasExplorar(true);

        const cargar = async () => {
            try {
                if (tabActiva === 'explorar') {
                    const resp = await listarColeccionesPublicas(busqueda || undefined, 1);
                    if (!activo) return;
                    if (resp.ok && resp.data) {
                        setColeccionesPublicas(resp.data.colecciones);
                        setTagsFrecuentes(resp.data.tagsFrecuentes);
                        setHayMasExplorar(resp.data.colecciones.length >= PAGE_SIZE_EXPLORAR);
                    } else {
                        setColeccionesPublicas([]);
                        setTagsFrecuentes([]);
                        setHayMasExplorar(false);
                    }
                } else if (tabActiva === 'colecciones') {
                    const resp = await listarColecciones();
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
                    } else {
                        setColeccionesGuardadas([]);
                    }
                }
                if (activo) {
                    ultimoFetchRef.current = { tab: tabActiva, busqueda };
                }
            } catch {
                if (activo) {
                    setColecciones([]);
                    setColeccionesPublicas([]);
                    setColeccionesGuardadas([]);
                    setTagsFrecuentes([]);
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [tabActiva, busqueda, versionDatos]);

    const coleccionesPlanas = useMemo(() => normalizarColecciones(colecciones), [colecciones]);
    const coleccionesPublicasPlanas = useMemo(() => normalizarColecciones(coleccionesPublicas), [coleccionesPublicas]);
    const coleccionesGuardadasPlanas = useMemo(() => normalizarColecciones(coleccionesGuardadas), [coleccionesGuardadas]);

    const coleccionesFiltradas = useMemo(() => {
        return ordenarColecciones(
            coleccionesPlanas.filter(coleccion => coincideTagColeccion(coleccion, tagActivo) && coincideBusquedaColeccion(coleccion, busqueda)),
            orden,
        );
    }, [coleccionesPlanas, tagActivo, orden, busqueda]);

    const coleccionesEnArbol = useMemo(() => {
        return construirArbolEstricto(coleccionesPlanas, orden, tagActivo, busqueda);
    }, [coleccionesPlanas, tagActivo, orden, busqueda]);

    const publicasFiltradas = useMemo(() => {
        return ordenarColecciones(
            coleccionesPublicasPlanas.filter(coleccion => coincideTagColeccion(coleccion, tagActivo) && coincideBusquedaColeccion(coleccion, busqueda)),
            orden,
        );
    }, [coleccionesPublicasPlanas, tagActivo, orden, busqueda]);

    const coleccionesPublicasEnArbol = useMemo(() => {
        return construirArbolEstricto(coleccionesPublicasPlanas, orden, tagActivo, busqueda);
    }, [coleccionesPublicasPlanas, tagActivo, orden, busqueda]);

    const guardadasFiltradas = useMemo(() => {
        return ordenarColecciones(
            coleccionesGuardadasPlanas.filter(coleccion => coincideTagColeccion(coleccion, tagActivo) && coincideBusquedaColeccion(coleccion, busqueda)),
            orden,
        );
    }, [coleccionesGuardadasPlanas, tagActivo, orden, busqueda]);

    const coleccionesGuardadasEnArbol = useMemo(() => {
        return construirArbolEstricto(coleccionesGuardadasPlanas, orden, tagActivo, busqueda);
    }, [coleccionesGuardadasPlanas, tagActivo, orden, busqueda]);

    const totalColecciones = tabActiva === 'explorar'
        ? publicasFiltradas.length
        : tabActiva === 'guardadas'
        ? guardadasFiltradas.length
        : coleccionesFiltradas.length;

    const abrirNuevaColeccion = useCallback(() => {
        setColeccionEditando(null);
        setModalColeccionAbierto(true);
    }, []);

    /* [2003A-39] Cargar siguiente página de colecciones públicas (infinite scroll) */
    const cargarMasExplorar = useCallback(async () => {
        if (cargandoMas || !hayMasExplorar) return;
        setCargandoMas(true);
        const siguientePagina = paginaExplorar + 1;
        try {
            const resp = await listarColeccionesPublicas(busqueda || undefined, siguientePagina);
            if (resp.ok && resp.data) {
                setColeccionesPublicas(prev => [...prev, ...resp.data!.colecciones]);
                setPaginaExplorar(siguientePagina);
                setHayMasExplorar(resp.data.colecciones.length >= PAGE_SIZE_EXPLORAR);
            } else {
                setHayMasExplorar(false);
            }
        } catch {
            log.error('Error cargando más colecciones');
        } finally {
            setCargandoMas(false);
        }
    }, [cargandoMas, hayMasExplorar, paginaExplorar, busqueda]);

    const manejarEditarColeccion = useCallback((col: Coleccion) => {
        setColeccionEditando(col);
        setModalColeccionAbierto(true);
    }, []);

    const abrirCombinarColeccion = useCallback((col: Coleccion) => {
        setColeccionCombinando(col);
        setModalCombinarAbierto(true);
    }, []);

    const manejarEliminarColeccion = useCallback(async (col: Coleccion) => {
        setColecciones(prev => prev.filter(c => c.id !== col.id));
        setColeccionesPublicas(prev => prev.filter(c => c.id !== col.id));

        const resp = await eliminarColeccion(col.id);
        if (resp.ok) {
            log.info('Colección eliminada', { id: col.id });
        } else {
            log.error('Error eliminando colección, restaurando', { id: col.id });
            setColecciones(prev => [col, ...prev]);
            setColeccionesPublicas(prev => [col, ...prev]);
        }
    }, []);

    const manejarColeccionCombinada = useCallback(() => {
        setModalCombinarAbierto(false);
        /* [193A-101] Limpiar cache de fetch para forzar refetch al incrementar versionDatos.
         * Sin este reset, el guard del useEffect veía tab+busqueda sin cambiar y hacía early return. */
        ultimoFetchRef.current = null;
        setVersionDatos(prev => prev + 1);
    }, []);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones(prev => {
            const existe = prev.find(c => c.id === col.id);
            if (existe) return prev.map(c => (c.id === col.id ? col : c));
            return [col, ...prev];
        });
    }, []);

    return {
        colecciones: coleccionesFiltradas,
        coleccionesEnArbol,
        coleccionesPublicas: publicasFiltradas,
        coleccionesPublicasEnArbol,
        coleccionesPlanas,
        coleccionesGuardadas: guardadasFiltradas,
        coleccionesGuardadasEnArbol,
        cargando,
        cargandoMas,
        hayMasExplorar,
        cargarMasExplorar,
        modalColeccionAbierto,
        setModalColeccionAbierto,
        coleccionEditando,
        modalCombinarAbierto,
        setModalCombinarAbierto,
        coleccionCombinando,
        tabActiva,
        tagsFrecuentes,
        tagActivo,
        setTagActivo,
        orden,
        setOrden,
        totalColecciones,
        vista,
        setVista,
        abrirNuevaColeccion,
        abrirCombinarColeccion,
        manejarColeccionCombinada,
        manejarEditarColeccion,
        manejarEliminarColeccion,
        manejarGuardarColeccion,
    };
}
