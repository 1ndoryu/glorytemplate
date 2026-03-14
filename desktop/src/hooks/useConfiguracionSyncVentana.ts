/*
 * Hook: useConfiguracionSyncVentana
 * Versión standalone de useConfiguracionSync para la ventana independiente.
 *
 * Diferencia clave: lee y escribe directamente desde el Tauri Store
 * (no desde el objeto `estado` en memoria de syncState, que vive en
 * otro contexto JS — la ventana sync-panel).
 *
 * Al guardar, emite un evento Tauri 'config-sync-actualizada' para que
 * la ventana de sync refresque su config en memoria.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SyncConfigAvanzada } from '@desktop/services/syncConstants';
import {
    STORE_FILE,
    STORE_KEY_CONFIG_AVANZADA,
    CONFIG_AVANZADA_DEFAULT,
} from '@desktop/services/syncConstants';

interface UseConfiguracionSyncVentanaReturn {
    config: SyncConfigAvanzada;
    cargando: boolean;
    guardando: boolean;
    setVelocidadMaxima: (valor: number) => void;
    setArchivosParalelos: (valor: number) => void;
    setBorrarEnServidorAlBorrarLocal: (valor: boolean) => void;
    setBorrarEnLocalAlBorrarEnServidor: (valor: boolean) => void;
    setBorrarAlSubirExitoso: (valor: boolean) => void;
    setPapeleraActiva: (valor: boolean) => void;
    setPapeleraDuracionDias: (valor: number) => void;
    guardar: () => Promise<void>;
    resetear: () => void;
    hayaCambios: boolean;
}

/**
 * Evento emitido tras guardar config para que la ventana sync refresque.
 * La ventana sync escucha este evento y re-lee config desde el store.
 */
const EVENTO_CONFIG_ACTUALIZADA = 'config-sync-actualizada';

export function useConfiguracionSyncVentana(): UseConfiguracionSyncVentanaReturn {
    const [config, setConfig] = useState<SyncConfigAvanzada>(
        () => ({ ...CONFIG_AVANZADA_DEFAULT }),
    );
    const [configInicial, setConfigInicial] = useState<SyncConfigAvanzada>(
        () => ({ ...CONFIG_AVANZADA_DEFAULT }),
    );
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    /* Función reutilizable para cargar config desde el Tauri Store */
    const cargarDesdeStore = useCallback(async () => {
        try {
            const { load } = await import('@tauri-apps/plugin-store');
            const store = await load(STORE_FILE);
            const guardada = await store.get<SyncConfigAvanzada>(STORE_KEY_CONFIG_AVANZADA);
            if (guardada) {
                const merged = { ...CONFIG_AVANZADA_DEFAULT, ...guardada };
                setConfig(merged);
                setConfigInicial(merged);
            }
        } catch (err) {
            console.error('[ConfigVentana] Error cargando config desde store:', err);
        }
    }, []);

    /* Carga inicial al montar + re-carga al ganar foco (la ventana se pre-crea
     * oculta en tauri.conf.json, así que el mount ocurre al inicio de la app;
     * recargar al ganar foco garantiza datos frescos cada vez que se abre). */
    useEffect(() => {
        let cancelado = false;
        let desuscribir: (() => void) | undefined;

        (async () => {
            await cargarDesdeStore();
            if (cancelado) return;
            setCargando(false);

            try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const ventana = getCurrentWindow();
                desuscribir = await ventana.onFocusChanged(({ payload: enfocado }) => {
                    if (enfocado && !cancelado) {
                        cargarDesdeStore();
                    }
                });
            } catch { /* Entorno no-Tauri */ }
        })();

        return () => {
            cancelado = true;
            desuscribir?.();
        };
    }, [cargarDesdeStore]);

    const hayaCambios = JSON.stringify(config) !== JSON.stringify(configInicial);

    const setVelocidadMaxima = useCallback((valor: number) => {
        setConfig(prev => ({
            ...prev,
            velocidadMaximaSubidaMbps: Math.max(0, valor),
        }));
    }, []);

    const setArchivosParalelos = useCallback((valor: number) => {
        setConfig(prev => ({
            ...prev,
            archivosParalelos: Math.max(1, Math.min(5, Math.round(valor))),
        }));
    }, []);

    const setBorrarEnServidorAlBorrarLocal = useCallback((valor: boolean) => {
        setConfig(prev => ({
            ...prev,
            borrarEnServidorAlBorrarLocal: valor,
        }));
    }, []);

    const setBorrarEnLocalAlBorrarEnServidor = useCallback((valor: boolean) => {
        setConfig(prev => ({
            ...prev,
            borrarEnLocalAlBorrarEnServidor: valor,
        }));
    }, []);

    const setBorrarAlSubirExitoso = useCallback((valor: boolean) => {
        setConfig(prev => ({
            ...prev,
            borrarAlSubirExitoso: valor,
        }));
    }, []);

    const setPapeleraActiva = useCallback((valor: boolean) => {
        setConfig(prev => ({
            ...prev,
            papeleraActiva: valor,
        }));
    }, []);

    const setPapeleraDuracionDias = useCallback((valor: number) => {
        setConfig(prev => ({
            ...prev,
            papeleraDuracionDias: Math.max(1, Math.min(90, Math.round(valor))),
        }));
    }, []);

    const guardar = useCallback(async () => {
        setGuardando(true);
        try {
            /* Persistir directamente en Tauri Store */
            const { load } = await import('@tauri-apps/plugin-store');
            const store = await load(STORE_FILE);
            await store.set(STORE_KEY_CONFIG_AVANZADA, config);
            await store.save();
            setConfigInicial({ ...config });

            /* Notificar a la ventana sync para que refresque su config en memoria */
            const { emit } = await import('@tauri-apps/api/event');
            await emit(EVENTO_CONFIG_ACTUALIZADA);
        } catch (err) {
            console.error('[ConfigVentana] Error guardando config:', err);
        } finally {
            setGuardando(false);
        }
    }, [config]);

    const resetear = useCallback(() => {
        setConfig({ ...CONFIG_AVANZADA_DEFAULT });
    }, []);

    return {
        config,
        cargando,
        guardando,
        setVelocidadMaxima,
        setArchivosParalelos,
        setBorrarEnServidorAlBorrarLocal,
        setBorrarEnLocalAlBorrarEnServidor,
        setBorrarAlSubirExitoso,
        setPapeleraActiva,
        setPapeleraDuracionDias,
        guardar,
        resetear,
        hayaCambios,
    };
}
