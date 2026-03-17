/*
 * Hook: useConectividad — QL109
 * Detecta estado de conexion a internet usando navigator.onLine + eventos.
 * Patron singleton: un solo listener global, multiples consumidores via Zustand.
 */

import { useEffect } from 'react';
import { create } from 'zustand';

interface EstadoConectividad {
    enLinea: boolean;
    /** Timestamp de ultimo cambio detectado */
    ultimoCambio: number;
}

export const useConectividadStore = create<EstadoConectividad>(() => ({
    enLinea: typeof navigator !== 'undefined' ? navigator.onLine : true,
    ultimoCambio: Date.now(),
}));

let listenerRegistrado = false;

function registrarListeners(): void {
    if (listenerRegistrado || typeof window === 'undefined') return;
    listenerRegistrado = true;

    window.addEventListener('online', () => {
        useConectividadStore.setState({ enLinea: true, ultimoCambio: Date.now() });
    });
    window.addEventListener('offline', () => {
        useConectividadStore.setState({ enLinea: false, ultimoCambio: Date.now() });
    });
}

/**
 * Hook reactivo que retorna true si hay conexion a internet.
 * Registra listeners globales en el primer mount.
 */
export function useConectividad(): boolean {
    useEffect(() => { registrarListeners(); }, []);
    return useConectividadStore(s => s.enLinea);
}
