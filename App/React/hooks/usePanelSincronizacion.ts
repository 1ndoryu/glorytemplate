/*
 * Hook: usePanelSincronizacion
 * Lógica del panel de sincronización estilo Google Drive.
 * Conecta syncStore (estado reactivo) con syncService (operaciones Tauri).
 * Separado de la vista para cumplir SRP.
 */

import { useCallback, useEffect } from 'react';
import { useSyncStore } from '@app/stores/syncStore';

/*
 * Importa dinámicamente el syncService para evitar que Vite web intente resolver Tauri.
 * Retorna null si no estamos en desktop.
 */
async function cargarSyncService() {
    try {
        /* Ruta opaca via alias @desktop — mismo patron que useAuth.ts.
         * Rollup web no resuelve strings concatenados en runtime. */
        const ruta = '@desktop' + '/services/syncService';
        const modulo = await import(/* @vite-ignore */ ruta);
        return modulo;
    } catch {
        return null;
    }
}

export const usePanelSincronizacion = () => {
    const panelAbierto = useSyncStore(s => s.panelAbierto);
    const carpetaLocal = useSyncStore(s => s.carpetaLocal);
    const sincronizacionActiva = useSyncStore(s => s.sincronizacionActiva);
    const ultimaSync = useSyncStore(s => s.ultimaSync);
    const estado = useSyncStore(s => s.estado);
    const progreso = useSyncStore(s => s.progreso);
    const mensajeEstado = useSyncStore(s => s.mensajeEstado);
    const archivos = useSyncStore(s => s.archivos);
    const totalArchivos = useSyncStore(s => s.totalArchivos);
    const espacioUsado = useSyncStore(s => s.espacioUsado);
    const cerrarPanel = useSyncStore(s => s.cerrarPanel);
    const setCarpeta = useSyncStore(s => s.setCarpeta);
    const setActiva = useSyncStore(s => s.setActiva);
    const setEstado = useSyncStore(s => s.setEstado);
    const setUltimaSync = useSyncStore(s => s.setUltimaSync);

    /* Cargar config al montar el panel */
    useEffect(() => {
        if (!panelAbierto) return;
        const controller = new AbortController();
        const cargar = async () => {
            try {
                const srv = await cargarSyncService();
                if (!srv || controller.signal.aborted) return;
                const config = srv.obtenerConfigSync();
                setCarpeta(config.carpetaLocal);
                setActiva(config.sincronizacionActiva);
                setUltimaSync(config.ultimaSync);
            } catch {
                /* Error cargando config de sync — mostrar estado default */
            }
        };
        cargar();
        return () => { controller.abort(); };
    }, [panelAbierto, setCarpeta, setActiva, setUltimaSync]);

    /* Elegir carpeta de sincronización */
    const elegirCarpeta = useCallback(async () => {
        try {
            const srv = await cargarSyncService();
            if (!srv) return;
            const carpeta = await srv.elegirCarpetaSync();
            if (carpeta) {
                setCarpeta(carpeta);
            }
        } catch {
            setEstado('error', 'Error al elegir carpeta');
        }
    }, [setCarpeta, setEstado]);

    /* Activar/desactivar sincronización */
    const alternarSincronizacion = useCallback(async () => {
        try {
            const srv = await cargarSyncService();
            if (!srv) return;
            const nuevoEstado = !sincronizacionActiva;
            await srv.toggleSincronizacion(nuevoEstado);
            setActiva(nuevoEstado);
            setEstado(nuevoEstado ? 'inactivo' : 'pausado',
                nuevoEstado ? 'Sincronización activada' : 'Sincronización pausada');
        } catch {
            setEstado('error', 'Error al cambiar sincronización');
        }
    }, [sincronizacionActiva, setActiva, setEstado]);

    /* Ejecutar sincronización manual */
    const sincronizarAhora = useCallback(async () => {
        if (!carpetaLocal || !sincronizacionActiva) return;
        try {
            setEstado('sincronizando', 'Sincronizando...');
            const srv = await cargarSyncService();
            if (!srv) return;
            const resultado = await srv.sincronizarConServidor();
            setUltimaSync(Date.now());
            setEstado('completado',
                `Sincronización completa: ${resultado.nuevos} nuevos, ${resultado.eliminados} eliminados`);
        } catch {
            setEstado('error', 'Error al sincronizar');
        }
    }, [carpetaLocal, sincronizacionActiva, setEstado, setUltimaSync]);

    /* Formatear espacio usado */
    const espacioFormateado = formatearTamano(espacioUsado);

    /* Formatear última sincronización */
    const ultimaSyncFormateada = ultimaSync > 0
        ? formatearTiempoRelativo(ultimaSync)
        : 'Nunca';

    return {
        panelAbierto,
        carpetaLocal,
        sincronizacionActiva,
        estado,
        progreso,
        mensajeEstado,
        archivos,
        totalArchivos,
        espacioFormateado,
        ultimaSyncFormateada,
        cerrarPanel,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
    };
};

/*
 * Formatea bytes a unidad legible (KB, MB, GB).
 */
function formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 B';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const valor = bytes / Math.pow(1024, i);
    return `${valor.toFixed(1)} ${unidades[i]}`;
}

/*
 * Formatea un timestamp a tiempo relativo ("hace 5 min", "hace 2 horas").
 */
function formatearTiempoRelativo(timestamp: number): string {
    const ahora = Date.now();
    const dif = ahora - timestamp;
    const segundos = Math.floor(dif / 1000);

    if (segundos < 60) return 'Hace un momento';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
}
