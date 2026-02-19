/*
 * useBrowserDaw — Lógica del panel browser del DAW (C307).
 * Carga carpetas y samples desde la API del explorador.
 * Separado del componente por SRP.
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerColeccionados, obtenerCarpetas } from '@app/services/apiExplorador';
import type { CarpetaInfo } from '@app/services/apiExplorador';
import type { SampleResumen } from '@app/types';
import { useBrowserDawStore } from '../stores/browserDawStore';

export interface UseBrowserDawResultado {
    carpetas: CarpetaInfo[];
    samplesPorCarpeta: Map<string, SampleResumen[]>;
    cargando: boolean;
    abierto: boolean;
    carpetasExpandidas: Set<string>;
    toggle: () => void;
    toggleCarpeta: (carpeta: string) => void;
    cargarSamplesCarpeta: (carpeta: string) => Promise<void>;
}

export function useBrowserDaw(): UseBrowserDawResultado {
    const abierto = useBrowserDawStore(s => s.abierto);
    const toggle = useBrowserDawStore(s => s.toggle);
    const carpetasExpandidas = useBrowserDawStore(s => s.carpetasExpandidas);
    const toggleCarpetaStore = useBrowserDawStore(s => s.toggleCarpeta);

    const [carpetas, setCarpetas] = useState<CarpetaInfo[]>([]);
    const [samplesPorCarpeta, setSamplesPorCarpeta] = useState<Map<string, SampleResumen[]>>(new Map());
    const [cargando, setCargando] = useState(false);
    const [cargado, setCargado] = useState(false);

    /* Cargar carpetas cuando se abre el browser por primera vez */
    useEffect(() => {
        if (!abierto || cargado) return;
        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await obtenerCarpetas();
                if (resp.ok && resp.data) setCarpetas(resp.data);
            } catch { /* silencioso */ }
            setCargando(false);
            setCargado(true);
        };
        cargar();
    }, [abierto, cargado]);

    /* Cargar samples de una carpeta cuando se expande */
    const cargarSamplesCarpeta = useCallback(async (carpeta: string) => {
        if (samplesPorCarpeta.has(carpeta)) return;
        try {
            const resp = await obtenerColeccionados(1, 50, carpeta);
            if (resp.ok && resp.data) {
                setSamplesPorCarpeta(prev => {
                    const nuevo = new Map(prev);
                    nuevo.set(carpeta, resp.data?.data ?? []);
                    return nuevo;
                });
            }
        } catch { /* silencioso */ }
    }, [samplesPorCarpeta]);

    /* Al expandir una carpeta, cargar sus samples automáticamente */
    const toggleCarpeta = useCallback((carpeta: string) => {
        toggleCarpetaStore(carpeta);
        if (!carpetasExpandidas.has(carpeta)) {
            cargarSamplesCarpeta(carpeta);
        }
    }, [toggleCarpetaStore, carpetasExpandidas, cargarSamplesCarpeta]);

    return {
        carpetas,
        samplesPorCarpeta,
        cargando,
        abierto,
        carpetasExpandidas,
        toggle,
        toggleCarpeta,
        cargarSamplesCarpeta,
    };
}
