/*
 * Store: syncStore — Estado reactivo de sincronizacion.
 * Conecta la UI (PanelSincronizacion) con syncService.
 * Permite que componentes React reaccionen a cambios de config/estado.
 */

import { create } from 'zustand';

export type EstadoSync = 'inactivo' | 'sincronizando' | 'completado' | 'error' | 'pausado';

interface ArchivoSync {
    sampleId: number;
    nombre: string;
    ruta: string;
    estado: 'descargado' | 'pendiente' | 'descargando' | 'error';
    tamano: number;
    descargadoEn: number;
}

interface SyncStoreState {
    /* UI */
    panelAbierto: boolean;
    /* Config */
    carpetaLocal: string | null;
    sincronizacionActiva: boolean;
    ultimaSync: number;
    /* Estado actual */
    estado: EstadoSync;
    progreso: number;
    mensajeEstado: string;
    /* Archivos */
    archivos: ArchivoSync[];
    totalArchivos: number;
    espacioUsado: number;
    /* Acciones */
    abrirPanel: () => void;
    cerrarPanel: () => void;
    alternarPanel: () => void;
    setCarpeta: (carpeta: string | null) => void;
    setActiva: (activa: boolean) => void;
    setEstado: (estado: EstadoSync, mensaje?: string) => void;
    setProgreso: (progreso: number) => void;
    setArchivos: (archivos: ArchivoSync[]) => void;
    setUltimaSync: (timestamp: number) => void;
    agregarArchivo: (archivo: ArchivoSync) => void;
    actualizarArchivoEstado: (sampleId: number, estado: ArchivoSync['estado']) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
    panelAbierto: false,
    carpetaLocal: null,
    sincronizacionActiva: false,
    ultimaSync: 0,
    estado: 'inactivo',
    progreso: 0,
    mensajeEstado: '',
    archivos: [],
    totalArchivos: 0,
    espacioUsado: 0,

    abrirPanel: () => set({ panelAbierto: true }),
    cerrarPanel: () => set({ panelAbierto: false }),
    alternarPanel: () => set(s => ({ panelAbierto: !s.panelAbierto })),

    setCarpeta: (carpeta) => set({ carpetaLocal: carpeta }),

    setActiva: (activa) => set({ sincronizacionActiva: activa }),

    setEstado: (estado, mensaje) => set({
        estado,
        mensajeEstado: mensaje ?? '',
    }),

    setProgreso: (progreso) => set({ progreso }),

    setArchivos: (archivos) => set({
        archivos,
        totalArchivos: archivos.length,
        espacioUsado: archivos.reduce((acc, a) => acc + a.tamano, 0),
    }),

    setUltimaSync: (timestamp) => set({ ultimaSync: timestamp }),

    agregarArchivo: (archivo) => set(s => {
        const nuevos = [...s.archivos.filter(a => a.sampleId !== archivo.sampleId), archivo];
        return {
            archivos: nuevos,
            totalArchivos: nuevos.length,
            espacioUsado: nuevos.reduce((acc, a) => acc + a.tamano, 0),
        };
    }),

    actualizarArchivoEstado: (sampleId, estado) => set(s => ({
        archivos: s.archivos.map(a =>
            a.sampleId === sampleId ? { ...a, estado } : a,
        ),
    })),
}));
