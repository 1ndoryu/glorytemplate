/*
 * Hook: usePanelSincronizacion
 * Lógica del panel de sincronización estilo Google Drive.
 * Lee syncService desde window.__KAMPLES_SYNC__ inyectado por desktop/main.tsx.
 * Evita dynamic imports con alias que fallan en Vite dev mode en runtime.
 *
 * C358: Añadido soporte para tabs (estado/historial/colecciones),
 * historial de acciones y resync forzada.
 */

import { useCallback, useEffect, useRef } from 'react';
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
    sincronizarConServidor: (onProgreso?: (p: ProgresoSync) => void, opciones?: { forzar?: boolean }) => Promise<{ nuevos: number; eliminados: number }>;
    /* C358 */
    obtenerHistorialSync?: (limite?: number) => Array<{ tipo: string; descripcion: string; sampleId?: number; coleccionId?: number; timestamp: number }>;
    obtenerHistorialSamplesSync?: (limite?: number) => Array<{
        sampleId: number;
        nombreArchivo: string;
        estado: 'detectado' | 'subiendo' | 'sincronizado' | 'error' | 'moviendo' | 'descargando' | 'descargado';
        imagenUrl: string | null;
        rutaLocal: string | null;
        coleccionNombre?: string;
        timestampCreado: number;
        timestampActualizado: number;
        error?: string;
    }>;
    obtenerColeccionesSync?: () => Array<{ id: number; nombre: string; carpetaLocal: string; archivos: number }>;
    forzarResync?: (onProgreso?: (p: ProgresoSync) => void) => Promise<{ nuevos: number; eliminados: number }>;
    reforzarSync?: (onProgreso?: (p: ProgresoSync) => void) => Promise<{ nuevos: number; eliminados: number }>;
    haySyncEnCurso?: () => boolean;
    limpiarHistorialSync?: () => Promise<void>;
    recargarHistorialDesdeStore?: () => Promise<void>;
    rehidratarImagenesPendientesSync?: () => Promise<void>;
}

/* Tipo del objeto expuesto en window.__KAMPLES_UPLOAD__ para cola de subidas */
interface KamplesUpload {
    obtenerEstadoCola: () => {
        items: Array<{ id: string; nombreArchivo: string; estado: string; ultimoError?: string }>;
        totalPendientes: number;
        totalErrores: number;
        procesando: boolean;
    };
    onProgresoUpload: (cb: (progreso: { item: { nombreArchivo: string; estado: string }; totalEnCola: number; posicionEnCola: number }) => void) => void;
}

function historialCambioVisible(
    anterior: Array<{ timestamp: number }> ,
    siguiente: Array<{ timestamp: number }>,
): boolean {
    if (anterior.length !== siguiente.length) return true;
    if (anterior.length === 0) return false;
    return anterior[0].timestamp !== siguiente[0].timestamp;
}

function historialSamplesCambioVisible(
    anterior: Array<{ timestampActualizado: number; estado: string; imagenUrl?: string | null }>,
    siguiente: Array<{ timestampActualizado: number; estado: string; imagenUrl?: string | null }>,
): boolean {
    if (anterior.length !== siguiente.length) return true;
    if (anterior.length === 0) return false;
    /*
     * Comparar todas las entradas: O(n) con n=50 máx, negligible cada 1.2s.
     * Antes solo comparábamos la primera entrada, lo cual ignoraba cambios
     * en posiciones intermedias (ej: imagen actualizada de un sample que no es el más reciente).
     */
    for (let i = 0; i < anterior.length; i++) {
        const a = anterior[i];
        const b = siguiente[i];
        if (a.timestampActualizado !== b.timestampActualizado
            || a.estado !== b.estado
            || a.imagenUrl !== b.imagenUrl) {
            return true;
        }
    }
    return false;
}

function obtenerSync(): KamplesSync | null {
    return window.__KAMPLES_SYNC__ ?? null;
}

function obtenerUpload(): KamplesUpload | null {
    return (window.__KAMPLES_UPLOAD__ as KamplesUpload | undefined) ?? null;
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
    const historialSamples = useSyncStore(s => s.historialSamples);
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
    const setHistorialSamples = useSyncStore(s => s.setHistorialSamples);
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

        /* Historial per-sample v2 (principal para VentanaSincPanel) */
        if (srv.obtenerHistorialSamplesSync) {
            setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
        }

        if (srv.obtenerColeccionesSync) {
            setColecciones(srv.obtenerColeccionesSync());
        }
    }, [panelAbierto, setHistorial, setHistorialSamples, setColecciones]);

    /* Refresco en vivo: historial/colecciones sin recargar ventana.
     * Usa ref para la comparación de cambio, evitando que 'historial' en deps
     * recree el interval en cada actualización. */
    const historialRef = useRef(historial);
    historialRef.current = historial;
    const historialSamplesRef = useRef(historialSamples);
    historialSamplesRef.current = historialSamples;

    useEffect(() => {
        if (!panelAbierto) return;

        const srv = obtenerSync();
        if (!srv?.obtenerHistorialSync) return;

        const refrescar = () => {
            try {
                /* Cross-window: re-leer datos del Tauri Store compartido.
                 * recargarHistorialDesdeStore tiene throttle interno de 5s,
                 * llamarlo cada 1.2s es seguro — solo ejecuta cada 5s. */
                if (srv.recargarHistorialDesdeStore) {
                    srv.recargarHistorialDesdeStore().catch(() => {});
                }

                /* Rehidratar portadas que llegan tarde desde pipeline backend.
                 * Tiene throttle interno (5s), así que llamarlo en polling es seguro. */
                if (srv.rehidratarImagenesPendientesSync) {
                    srv.rehidratarImagenesPendientesSync().catch(() => {});
                }

                const nuevoHistorial = srv.obtenerHistorialSync?.(50) ?? [];
                if (historialCambioVisible(historialRef.current, nuevoHistorial)) {
                    setHistorial(nuevoHistorial);
                }

                /* Refrescar historial per-sample v2 */
                if (srv.obtenerHistorialSamplesSync) {
                    const nuevoSamples = srv.obtenerHistorialSamplesSync(50);
                    if (historialSamplesCambioVisible(historialSamplesRef.current, nuevoSamples)) {
                        setHistorialSamples(nuevoSamples);
                    }
                }

                if (srv.obtenerColeccionesSync) {
                    setColecciones(srv.obtenerColeccionesSync());
                }
            } catch {
                /* Ignorar errores puntuales de refresco */
            }
        };

        const intervalo = setInterval(refrescar, 1200);
        return () => clearInterval(intervalo);
    }, [panelAbierto, setHistorial, setHistorialSamples, setColecciones]);

    /* Watchdog: si UI quedó en "sincronizando" pero el lock global ya terminó, normalizar estado */
    useEffect(() => {
        if (!panelAbierto || estado !== 'sincronizando') return;

        const srv = obtenerSync();
        if (!srv?.haySyncEnCurso) return;

        const verificarEstadoReal = () => {
            try {
                const sigueSync = srv.haySyncEnCurso?.() ?? false;
                if (sigueSync) return;

                setProgreso(100);
                setEstado('completado', 'Sincronizado');

                if (srv.obtenerHistorialSync) {
                    setHistorial(srv.obtenerHistorialSync(50));
                }
                if (srv.obtenerHistorialSamplesSync) {
                    setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
                }
            } catch {
                /* Ignorar errores de verificación del lock */
            }
        };

        verificarEstadoReal();
        const intervalo = setInterval(verificarEstadoReal, 1200);
        return () => clearInterval(intervalo);
    }, [panelAbierto, estado, setEstado, setProgreso, setHistorial, setHistorialSamples]);

    /* Feedback de uploads: conectar cola de subidas al estado del panel.
     * Cuando el watcher detecta un archivo arrastrado y lo sube,
     * el panel muestra feedback en tiempo real. */
    useEffect(() => {
        const upload = obtenerUpload();
        if (!upload) return;

        upload.onProgresoUpload((progreso) => {
            const { item, totalEnCola, posicionEnCola } = progreso;

            if (item.estado === 'subiendo') {
                setEstado('sincronizando', `Subiendo ${item.nombreArchivo}${totalEnCola > 1 ? ` (${posicionEnCola}/${totalEnCola})` : ''}`);
                setProgreso(totalEnCola > 0 ? Math.round((posicionEnCola / totalEnCola) * 100) : 50);
            } else if (item.estado === 'completado') {
                /* Refrescar historial al completar un upload */
                const srv = obtenerSync();
                if (srv?.obtenerHistorialSync) {
                    setHistorial(srv.obtenerHistorialSync(50));
                }
                if (srv?.obtenerHistorialSamplesSync) {
                    setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
                }
                /* Si no hay más en cola, marcar como completado */
                if (totalEnCola <= 1) {
                    setEstado('completado', `Subido: ${item.nombreArchivo}`);
                    setProgreso(100);
                }
            } else if (item.estado === 'error') {
                setEstado('error', `Error subiendo ${item.nombreArchivo}`);
            }
        });
    }, [setEstado, setProgreso, setHistorial]);

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

    /* [2003A-38] alternarSincronizacion movido debajo de ejecutarSyncConProgreso
     * (ver más abajo) para evitar referencia antes de declaración. */

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

    const limpiarHistorialLocal = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv?.limpiarHistorialSync) return;
        try {
            await srv.limpiarHistorialSync();
            setHistorial([]);
            setHistorialSamples([]);
        } catch {
            setEstado('error', 'Error al limpiar el historial');
        }
    }, [setHistorial, setHistorialSamples, setEstado]);

    /* Helper: ejecutar sync con progreso.
     * Envuelve fnSync en try-catch para que un error siempre
     * transite el estado a 'error' y nunca deje el spinner congelado. */
    const ejecutarSyncConProgreso = useCallback(async (
        fnSync: (onProgreso?: (p: ProgresoSync) => void) => Promise<{ nuevos: number; eliminados: number }>,
        mensajeInicio: string,
    ) => {
        setEstado('sincronizando', mensajeInicio);
        setProgreso(0);

        try {
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
        } catch (err) {
            console.error('[usePanelSincronizacion] ejecutarSyncConProgreso fallo:', err);
            setEstado('error', 'Error durante la sincronización');
            setProgreso(0);
            return { nuevos: 0, eliminados: 0 };
        }
    }, [setEstado, setProgreso, agregarArchivo, actualizarArchivoEstado, setUltimaSync]);

    /* [2003A-38] Toggle de sincronización automática.
     * Al activar: trigger sync inmediata para que no quede esperando el poll. */
    const alternarSincronizacion = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv) return;
        try {
            const nuevoEstado = !sincronizacionActiva;
            await srv.toggleSincronizacion(nuevoEstado);
            setActiva(nuevoEstado);

            if (nuevoEstado) {
                /* Activar → iniciar sync inmediata si hay carpeta */
                setEstado('sincronizando', 'Iniciando sincronización...');
                if (carpetaLocal) {
                    try {
                        const resultado = await ejecutarSyncConProgreso(
                            (onProgreso) => srv.sincronizarConServidor(onProgreso, { forzar: true }),
                            'Sincronizando...',
                        );
                        setEstado(
                            'completado',
                            `Sync completa: ${resultado.nuevos} nuevos, ${resultado.eliminados} eliminados`,
                        );
                        if (srv.obtenerHistorialSync) setHistorial(srv.obtenerHistorialSync(50));
                        if (srv.obtenerHistorialSamplesSync) setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
                    } catch {
                        setEstado('error', 'Error al sincronizar');
                    }
                }
            } else {
                setEstado('pausado', 'Sincronización pausada');
            }
        } catch {
            setEstado('error', 'Error al cambiar sincronización');
        }
    }, [sincronizacionActiva, carpetaLocal, setActiva, setEstado, ejecutarSyncConProgreso, setHistorial, setHistorialSamples]);

    /* Sincronización manual inmediata con progreso en tiempo real.
     * Usa forzar:true para que funcione incluso con auto-sync pausado. */
    const sincronizarAhora = useCallback(async () => {
        if (!carpetaLocal) return;
        const srv = obtenerSync();
        if (!srv) return;
        try {
            const resultado = await ejecutarSyncConProgreso(
                (onProgreso) => srv.sincronizarConServidor(onProgreso, { forzar: true }),
                'Sincronizando...',
            );
            setEstado(
                'completado',
                `Sync completa: ${resultado.nuevos} nuevos, ${resultado.eliminados} eliminados`,
            );
            if (srv.obtenerHistorialSync) {
                setHistorial(srv.obtenerHistorialSync(50));
            }
            if (srv.obtenerHistorialSamplesSync) {
                setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
            }
        } catch {
            setEstado('error', 'Error al sincronizar');
        }
    }, [carpetaLocal, ejecutarSyncConProgreso, setEstado, setHistorial, setHistorialSamples]);

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
            /* Refrescar historial */
            if (srv.obtenerHistorialSync) {
                setHistorial(srv.obtenerHistorialSync(50));
            }
            if (srv.obtenerHistorialSamplesSync) {
                setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
            }
        } catch {
            setEstado('error', 'Error al forzar re-sync');
        }
    }, [carpetaLocal, ejecutarSyncConProgreso, setEstado, setHistorial, setHistorialSamples]);

    /* Reforzar sync: reactiva samples borrados localmente y los re-descarga.
     * Menos agresivo que forzarResync (que resetea todo el tracking). */
    const reforzarSyncAhora = useCallback(async () => {
        const srv = obtenerSync();
        if (!srv?.reforzarSync || !carpetaLocal) return;
        try {
            const resultado = await ejecutarSyncConProgreso(
                (onProgreso) => srv.reforzarSync!(onProgreso),
                'Reforzando sincronización...',
            );
            setEstado(
                'completado',
                `Reforzar sync completa: ${resultado.nuevos} archivos recuperados`,
            );
            if (srv.obtenerHistorialSync) {
                setHistorial(srv.obtenerHistorialSync(50));
            }
            if (srv.obtenerHistorialSamplesSync) {
                setHistorialSamples(srv.obtenerHistorialSamplesSync(50));
            }
        } catch {
            setEstado('error', 'Error al reforzar sincronización');
        }
    }, [carpetaLocal, ejecutarSyncConProgreso, setEstado, setHistorial, setHistorialSamples]);

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
        historialSamples,
        colecciones,
        cerrarPanel,
        cambiarTab,
        elegirCarpeta,
        abrirCarpetaSincronizacion,
        alternarSincronizacion,
        sincronizarAhora,
        forzarResyncAhora,
        reforzarSyncAhora,
        limpiarHistorialLocal,
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
