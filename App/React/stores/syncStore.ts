/*
 * Store: syncStore — Estado reactivo de sincronizacion.
 * Conecta la UI (PanelSincronizacion) con syncService.
 * Permite que componentes React reaccionen a cambios de config/estado.
 */

import { create } from 'zustand';

export type EstadoSync = 'inactivo' | 'sincronizando' | 'completado' | 'error' | 'pausado';
export type TabSync = 'estado' | 'historial' | 'colecciones';

interface ArchivoSync {
    sampleId: number;
    nombre: string;
    ruta: string;
    estado: 'descargado' | 'pendiente' | 'descargando' | 'error';
    tamano: number;
    descargadoEn: number;
}

/* C358: Entrada del historial de sync */
export interface EntradaHistorial {
    tipo: string;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
    timestamp: number;
}

/* C358: Info de colección sincronizada */
export interface ColeccionSyncInfo {
    id: number;
    nombre: string;
    carpetaLocal: string;
    archivos: number;
}

interface SyncStoreState {
    /* UI */
    panelAbierto: boolean;
    tabActual: TabSync;
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
    /* C358: Historial y colecciones */
    historial: EntradaHistorial[];
    colecciones: ColeccionSyncInfo[];
    /* Acciones */
    abrirPanel: () => void;
    cerrarPanel: () => void;
    alternarPanel: () => void;
    setTab: (tab: TabSync) => void;
    setCarpeta: (carpeta: string | null) => void;
    setActiva: (activa: boolean) => void;
    setEstado: (estado: EstadoSync, mensaje?: string) => void;
    setProgreso: (progreso: number) => void;
    setArchivos: (archivos: ArchivoSync[]) => void;
    setUltimaSync: (timestamp: number) => void;
    agregarArchivo: (archivo: ArchivoSync) => void;
    actualizarArchivoEstado: (sampleId: number, estado: ArchivoSync['estado']) => void;
    /* C358 */
    setHistorial: (historial: EntradaHistorial[]) => void;
    setColecciones: (colecciones: ColeccionSyncInfo[]) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
    panelAbierto: false,
    tabActual: 'estado' as TabSync,
    carpetaLocal: null,
    sincronizacionActiva: false,
    ultimaSync: 0,
    estado: 'inactivo',
    progreso: 0,
    mensajeEstado: '',
    archivos: [],
    totalArchivos: 0,
    espacioUsado: 0,
    historial: [],
    colecciones: [],

    abrirPanel: () => set({ panelAbierto: true }),
    cerrarPanel: () => set({ panelAbierto: false, tabActual: 'estado' }),
    alternarPanel: () => set(s => ({ panelAbierto: !s.panelAbierto })),
    setTab: (tab) => set({ tabActual: tab }),

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

    setHistorial: (historial) => set({ historial }),
    setColecciones: (colecciones) => set({ colecciones }),
}));
