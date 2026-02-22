/*
 * Hook: usePanelSincronizacion
 * Lógica del panel de sincronización estilo Google Drive.
 * Lee syncService desde window.__KAMPLES_SYNC__ inyectado por desktop/main.tsx.
 * Evita dynamic imports con alias que fallan en Vite dev mode en runtime.
 */

import { useCallback, useEffect } from 'react';
import { useSyncStore } from '@app/stores/syncStore';

/* Tipo del objeto expuesto por desktop/main.tsx en window.__KAMPLES_SYNC__ */
interface KamplesSync {
    elegirCarpetaSync: () => Promise<string | null>;
    toggleSincronizacion: (activa: boolean) => Promise<void>;
    obtenerConfigSync: () => { carpetaLocal: string | null; sincronizacionActiva: boolean; ultimaSync: number };
    sincronizarConServidor: () => Promise<{ nuevos: number; eliminados: number }>;
}

function obtenerSync(): KamplesSync | null {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (window as any).__KAMPLES_SYNC__ ?? null;
    /* eslint-enable @typescript-eslint/no-explicit-any */
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

    /* Sincronización manual inmediata */
    const sincronizarAhora = useCallback(async () => {
        if (!carpetaLocal || !sincronizacionActiva) return;
        const srv = obtenerSync();
        if (!srv) return;
        try {
            setEstado('sincronizando', 'Sincronizando...');
            const resultado = await srv.sincronizarConServidor();
            setUltimaSync(Date.now());
            setEstado(
                'completado',
                `Sync completa: ${resultado.nuevos} nuevos, ${resultado.eliminados} eliminados`,
            );
        } catch {
            setEstado('error', 'Error al sincronizar');
        }
    }, [carpetaLocal, sincronizacionActiva, setEstado, setUltimaSync]);

    const espacioFormateado = formatearTamano(espacioUsado);
    const ultimaSyncFormateada = ultimaSync > 0 ? formatearTiempoRelativo(ultimaSync) : 'Nunca';

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
