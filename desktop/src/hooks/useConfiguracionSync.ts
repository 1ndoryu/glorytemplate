/*
 * Hook: useConfiguracionSync
 * Gestiona la lectura/escritura de SyncConfigAvanzada (limite velocidad,
 * archivos paralelos, borrado bidireccional, papelera).
 *
 * Lee desde syncState.estado.configAvanzada al montar.
 * Guarda con guardarConfigAvanzada() al confirmar cambios.
 */

import { useCallback, useEffect, useState } from 'react';
import {
    estado,
    guardarConfigAvanzada,
    type SyncConfigAvanzada,
    CONFIG_AVANZADA_DEFAULT,
} from '../services/syncState';

interface UseConfiguracionSyncReturn {
    config: SyncConfigAvanzada;
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

export function useConfiguracionSync(): UseConfiguracionSyncReturn {
    const [config, setConfig] = useState<SyncConfigAvanzada>(
        () => ({ ...estado.configAvanzada }),
    );
    const [configInicial, setConfigInicial] = useState<SyncConfigAvanzada>(
        () => ({ ...estado.configAvanzada }),
    );
    const [guardando, setGuardando] = useState(false);

    /* Sincronizar si el estado externo cambia (e.g., carga inicial async) */
    useEffect(() => {
        const intervalo = setInterval(() => {
            const actual = estado.configAvanzada;
            if (JSON.stringify(actual) !== JSON.stringify(configInicial)) {
                setConfig({ ...actual });
                setConfigInicial({ ...actual });
            }
        }, 2000);
        return () => clearInterval(intervalo);
    }, [configInicial]);

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
            /* QL63: Exclusion mutua — borrar-en-servidor y borrar-tras-subir no pueden coexistir */
            ...(valor ? { borrarAlSubirExitoso: false } : {}),
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
            /* QL63: Exclusion mutua — borrar-tras-subir y borrar-en-servidor no pueden coexistir */
            ...(valor ? { borrarEnServidorAlBorrarLocal: false } : {}),
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
            /* Aplicar al estado global mutable */
            Object.assign(estado.configAvanzada, config);
            await guardarConfigAvanzada();
            setConfigInicial({ ...config });
        } finally {
            setGuardando(false);
        }
    }, [config]);

    const resetear = useCallback(() => {
        setConfig({ ...CONFIG_AVANZADA_DEFAULT });
    }, []);

    return {
        config,
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
