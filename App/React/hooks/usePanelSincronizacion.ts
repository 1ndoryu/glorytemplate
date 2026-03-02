/*
 * Hook: usePanelSincronizacion
 * Lógica del panel de sincronización estilo Google Drive.
 * Lee syncService desde window.__KAMPLES_SYNC__ inyectado por desktop/main.tsx.
 * Evita dynamic imports con alias que fallan en Vite dev mode en runtime.
 *
 * C358: Añadido soporte para tabs (estado/historial/colecciones),
 * historial de acciones y resync forzada.
 */

import { useCallback, useEffect } from 'react';
import { useSyncStore } from '@app/stores/syncStore';
import type { TabSync } from '@app/stores/syncStore';

/* Progreso reportado por sincronizarConServidor() en cada archivo */
interface ProgresoSync {
    actual: number;
    total: number;
    sampleId: number;
    nombre: string;
    estado: 'descargando' | 'descargado' | 'error';
    tamano?: number;
    ruta?: string;
}

/* Tipo del objeto expuesto por desktop/main.tsx en window.__KAMPLES_SYNC__ */
interface KamplesSync {
    elegirCarpetaSync: () => Promise<string | null>;
    toggleSincronizacion: (activa: boolean) => Promise<void>;
    obtenerConfigSync: () => { carpetaLocal: string | null; sincronizacionActiva: boolean; ultimaSync: number };
    abrirCarpetaSync?: () => Promise<boolean>;
    sincronizarConServidor: (onProgreso?: (p: ProgresoSync) => void) => Promise<{ nuevos: number; eliminados: number }>;
    /* C358 */
    obtenerHistorialSync?: (limite?: number) => Array<{ tipo: string; descripcion: string; sampleId?: number; coleccionId?: number; timestamp: number }>;
    obtenerColeccionesSync?: () => Array<{ id: number; nombre: string; carpetaLocal: string; archivos: number }>;
    forzarResync?: (onProgreso?: (p: ProgresoSync) => void) => Promise<{ nuevos: number; eliminados: number }>;
}

function obtenerSync(): KamplesSync | null {
    return window.__KAMPLES_SYNC__ ?? null;
}

export const usePanelSincronizacion = () => {
    const panelAbierto = useSyncStore(s => s.panelAbierto);
    const tabActual = useSyncStore(s => s.tabActual);
    const carpetaLocal = useSyncStore(s => s.carpetaLocal);
    const sincronizacionActiva = useSyncStore(s => s.sincronizacionActiva);
    const ultimaSync = useSyncStore(s => s.ultimaSync);
    const estado = useSyncStore(s => s.estado);
    const progreso = useSyncStore(s => s.progreso);
    const mensajeEstado = useSyncStore(s => s.mensajeEstado);
    const archivos = useSyncStore(s => s.archivos);
    const totalArchivos = useSyncStore(s => s.totalArchivos);
    const espacioUsado = useSyncStore(s => s.espacioUsado);
    const historial = useSyncStore(s => s.historial);
    const colecciones = useSyncStore(s => s.colecciones);
    const cerrarPanel = useSyncStore(s => s.cerrarPanel);
    const setTab = useSyncStore(s => s.setTab);
    const setCarpeta = useSyncStore(s => s.setCarpeta);
    const setActiva = useSyncStore(s => s.setActiva);
    const setEstado = useSyncStore(s => s.setEstado);
    const setUltimaSync = useSyncStore(s => s.setUltimaSync);
    const setProgreso = useSyncStore(s => s.setProgreso);
    const agregarArchivo = useSyncStore(s => s.agregarArchivo);
    const actualizarArchivoEstado = useSyncStore(s => s.actualizarArchivoEstado);
    const setHistorial = useSyncStore(s => s.setHistorial);
    const setColecciones = useSyncStore(s => s.setColecciones);

    /* Cargar config guardada al abrir el panel */
    useEffect(() => {
        if (!panelAbierto) return;
        const srv = obtenerSync();
        if (!srv) return;
        try {
            const config = srv.obtenerConfigSync();
            setCarpeta(config.carpetaLocal);
            setActiva(config.sincronizacionActiva);
            setUltimaSync(config.ultimaSync);
        } catch {
            /* Config no disponible — usar defaults del store */
        }
    }, [panelAbierto, setCarpeta, setActiva, setUltimaSync]);

    /* C358: Cargar historial al abrir panel (UI minimal no usa tabs) */
    useEffect(() => {
        if (!panelAbierto) return;
        const srv = obtenerSync();
        if (!srv) return;

        if (srv.obtenerHistorialSync) {
            setHistorial(srv.obtenerHistorialSync(50));
        }

        if (srv.obtenerColeccionesSync) {
            setColecciones(srv.obtenerColeccionesSync());
        }
    }, [panelAbierto, setHistorial, setColecciones]);

    /* Cambiar tab activo */
    const cambiarTab = useCallback((tab: TabSync) => {
        setTab(tab);
    }, [setTab]);

    /* Abrir diálogo del sistema para elegir carpeta */
    const elegirCarpeta = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv) return;
        try {
            const carpeta = await srv.elegirCarpetaSync();
            if (carpeta) setCarpeta(carpeta);
        } catch {
            setEstado('error', 'Error al elegir carpeta');
        }
    }, [setCarpeta, setEstado]);

    /* Toggle de sincronización automática */
    const alternarSincronizacion = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv) return;
        try {
            const nuevoEstado = !sincronizacionActiva;
            await srv.toggleSincronizacion(nuevoEstado);
            setActiva(nuevoEstado);
            setEstado(
                nuevoEstado ? 'inactivo' : 'pausado',
                nuevoEstado ? 'Sincronización activada' : 'Sincronización pausada',
            );
        } catch {
            setEstado('error', 'Error al cambiar sincronización');
        }
    }, [sincronizacionActiva, setActiva, setEstado]);

    const abrirCarpetaSincronizacion = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv?.abrirCarpetaSync) return;

        try {
            const ok = await srv.abrirCarpetaSync();
            if (!ok) {
                setEstado('error', 'No se pudo abrir la carpeta de sincronización');
            }
        } catch {
            setEstado('error', 'No se pudo abrir la carpeta de sincronización');
        }
    }, [setEstado]);

    /* Helper: ejecutar sync con progreso */
    const ejecutarSyncConProgreso = useCallback(async (
        fnSync: (onProgreso?: (p: ProgresoSync) => void) => Promise<{ nuevos: number; eliminados: number }>,
        mensajeInicio: string,
    ) => {
        setEstado('sincronizando', mensajeInicio);
        setProgreso(0);

        const resultado = await fnSync((p: ProgresoSync) => {
            const porcentaje = p.total > 0 ? Math.round((p.actual / p.total) * 100) : 0;
            setProgreso(porcentaje);

            if (p.estado === 'descargando') {
                agregarArchivo({
                    sampleId: p.sampleId,
                    nombre: p.nombre,
                    ruta: '',
                    estado: 'descargando',
                    tamano: 0,
                    descargadoEn: 0,
                });
            } else if (p.estado === 'descargado') {
                agregarArchivo({
                    sampleId: p.sampleId,
                    nombre: p.nombre,
                    ruta: p.ruta ?? '',
                    estado: 'descargado',
                    tamano: p.tamano ?? 0,
                    descargadoEn: Date.now(),
                });
            } else if (p.estado === 'error') {
                actualizarArchivoEstado(p.sampleId, 'error');
            }
        });

        setProgreso(100);
        setUltimaSync(Date.now());
        return resultado;
    }, [setEstado, setProgreso, agregarArchivo, actualizarArchivoEstado, setUltimaSync]);

    /* Sincronización manual inmediata con progreso en tiempo real */
    const sincronizarAhora = useCallback(async () => {
        if (!carpetaLocal || !sincronizacionActiva) return;
        const srv = obtenerSync();
        if (!srv) return;
        try {
            const resultado = await ejecutarSyncConProgreso(
                (onProgreso) => srv.sincronizarConServidor(onProgreso),
                'Sincronizando...',
            );
            setEstado(
                'completado',
                `Sync completa: ${resultado.nuevos} nuevos, ${resultado.eliminados} eliminados`,
            );
            if (srv.obtenerHistorialSync) {
                setHistorial(srv.obtenerHistorialSync(50));
            }
        } catch {
            setEstado('error', 'Error al sincronizar');
        }
    }, [carpetaLocal, sincronizacionActiva, ejecutarSyncConProgreso, setEstado, setHistorial]);

    /* C358: Re-sync forzada (resetea tracking y re-descarga todo) */
    const forzarResyncAhora = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv?.forzarResync || !carpetaLocal) return;
        try {
            const resultado = await ejecutarSyncConProgreso(
                (onProgreso) => srv.forzarResync!(onProgreso),
                'Re-sincronizando todo...',
            );
            setEstado(
                'completado',
                `Re-sync completa: ${resultado.nuevos} archivos descargados`,
            );
            /* Refrescar historial si estamos en esa tab */
            if (srv.obtenerHistorialSync) {
                setHistorial(srv.obtenerHistorialSync(50));
            }
        } catch {
            setEstado('error', 'Error al forzar re-sync');
        }
    }, [carpetaLocal, ejecutarSyncConProgreso, setEstado, setHistorial]);

    const espacioFormateado = formatearTamano(espacioUsado);
    const ultimaSyncFormateada = ultimaSync > 0 ? formatearTiempoRelativo(ultimaSync) : 'Nunca';

    return {
        panelAbierto,
        tabActual,
        carpetaLocal,
        sincronizacionActiva,
        estado,
        progreso,
        mensajeEstado,
        archivos,
        totalArchivos,
        espacioFormateado,
        ultimaSyncFormateada,
        historial,
        colecciones,
        cerrarPanel,
        cambiarTab,
        elegirCarpeta,
        abrirCarpetaSincronizacion,
        alternarSincronizacion,
        sincronizarAhora,
        forzarResyncAhora,
    };
};

function formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 B';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${unidades[i]}`;
}

function formatearTiempoRelativo(timestamp: number): string {
    const seg = Math.floor((Date.now() - timestamp) / 1000);
    if (seg < 60) return 'Hace un momento';
    const min = Math.floor(seg / 60);
    if (min < 60) return `Hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${Math.floor(h / 24)}d`;
}
