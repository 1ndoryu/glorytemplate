/**
 * Hook para sincronización con la API del Dashboard
 *
 * Maneja la comunicación con el backend WordPress para:
 * - Cargar datos del servidor
 * - Guardar datos en el servidor
 * - Sincronización incremental
 * - Estados de carga y error
 *
 * @package App/React/hooks
 */

import {useState, useCallback, useRef} from 'react';
import type {Habito, Tarea, Proyecto} from '../types/dashboard';

/*
 * Tipos para la API
 */
interface DashboardData {
    version: string;
    habitos: Habito[];
    tareas: Tarea[];
    proyectos: Proyecto[];
    notas: string;
    configuracion: ConfiguracionUsuario;
    ultimaActualizacion: string | null;
}

interface ConfiguracionUsuario {
    notificaciones: {
        email: boolean;
        frecuenciaResumen: 'diario' | 'semanal' | 'nunca';
        horaPreferida: string;
        tareasPorVencer: boolean;
        rachaEnPeligro: boolean;
    };
    cifradoE2E: boolean;
    tema: 'terminal' | 'claro' | 'oscuro';
    ordenHabitos: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    code?: string;
    errors?: string[];
    meta?: {
        userId?: number;
        loadedAt?: string;
        savedAt?: string;
        serverTimestamp?: number;
        counts?: {
            habitos: number;
            tareas: number;
            proyectos: number;
        };
    };
}

interface SyncStatus {
    lastSync: number | null;
    lastUpdate: string | null;
    version: string;
    serverTimestamp: number;
}

interface EstadoApi {
    cargando: boolean;
    guardando: boolean;
    sincronizando: boolean;
    error: string | null;
    ultimaSync: number | null;
    online: boolean;
}

interface UseDashboardApiReturn {
    estado: EstadoApi;
    cargar: () => Promise<DashboardData | null>;
    guardar: (datos: Partial<DashboardData>) => Promise<boolean>;
    obtenerEstadoSync: () => Promise<SyncStatus | null>;
    sincronizar: (datosLocales: DashboardData) => Promise<DashboardData | null>;
    limpiarError: () => void;
}

/* Base URL de la API */
const API_BASE = '/wp-json/glory/v1/dashboard';

/**
 * Hook principal para la API del Dashboard
 */
export function useDashboardApi(): UseDashboardApiReturn {
    const [estado, setEstado] = useState<EstadoApi>({
        cargando: false,
        guardando: false,
        sincronizando: false,
        error: null,
        ultimaSync: null,
        online: navigator.onLine
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Realiza una petición a la API
     */
    const fetchApi = useCallback(async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
        /* Cancelar petición anterior si existe */
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const url = `${API_BASE}${endpoint}`;

        const defaultOptions: RequestInit = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': obtenerNonce()
            },
            signal: abortControllerRef.current.signal
        };

        try {
            const response = await fetch(url, {...defaultOptions, ...options});

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('No autenticado. Inicia sesión para continuar.');
                }
                if (response.status === 403) {
                    throw new Error('Sin permisos para realizar esta acción.');
                }
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            return data as ApiResponse<T>;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Petición cancelada');
            }
            throw error;
        }
    }, []);

    /**
     * Carga todos los datos del dashboard desde el servidor
     */
    const cargar = useCallback(async (): Promise<DashboardData | null> => {
        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const response = await fetchApi<DashboardData>('', {method: 'GET'});

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Error al cargar datos');
            }

            setEstado(prev => ({
                ...prev,
                cargando: false,
                ultimaSync: response.meta?.serverTimestamp || Date.now()
            }));

            return response.data;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({...prev, cargando: false, error: mensaje}));
            return null;
        }
    }, [fetchApi]);

    /**
     * Guarda datos en el servidor
     */
    const guardar = useCallback(
        async (datos: Partial<DashboardData>): Promise<boolean> => {
            setEstado(prev => ({...prev, guardando: true, error: null}));

            try {
                const response = await fetchApi<void>('', {
                    method: 'POST',
                    body: JSON.stringify(datos)
                });

                if (!response.success) {
                    throw new Error(response.message || 'Error al guardar datos');
                }

                setEstado(prev => ({
                    ...prev,
                    guardando: false,
                    ultimaSync: response.meta?.serverTimestamp || Date.now()
                }));

                return true;
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setEstado(prev => ({...prev, guardando: false, error: mensaje}));
                return false;
            }
        },
        [fetchApi]
    );

    /**
     * Obtiene el estado de sincronización del servidor
     */
    const obtenerEstadoSync = useCallback(async (): Promise<SyncStatus | null> => {
        try {
            const response = await fetchApi<SyncStatus>('/sync', {method: 'GET'});

            if (!response.success || !response.data) {
                return null;
            }

            return response.data;
        } catch {
            return null;
        }
    }, [fetchApi]);

    /**
     * Sincroniza datos locales con el servidor
     * Estrategia: Last-Write-Wins con merge inteligente
     */
    const sincronizar = useCallback(
        async (datosLocales: DashboardData): Promise<DashboardData | null> => {
            setEstado(prev => ({...prev, sincronizando: true, error: null}));

            try {
                /* 1. Obtener estado del servidor */
                const estadoServidor = await obtenerEstadoSync();

                if (!estadoServidor) {
                    /* Primera vez - subir todo */
                    const guardado = await guardar(datosLocales);
                    if (guardado) {
                        setEstado(prev => ({...prev, sincronizando: false}));
                        return datosLocales;
                    }
                    throw new Error('Error al sincronizar por primera vez');
                }

                /* 2. Comparar timestamps */
                const timestampLocal = estado.ultimaSync || 0;
                const timestampServidor = estadoServidor.lastSync || 0;

                if (timestampLocal >= timestampServidor) {
                    /* Datos locales más recientes - subir */
                    const guardado = await guardar(datosLocales);
                    if (guardado) {
                        setEstado(prev => ({...prev, sincronizando: false}));
                        return datosLocales;
                    }
                    throw new Error('Error al subir datos locales');
                }

                /* 3. Datos del servidor más recientes - descargar */
                const datosServidor = await cargar();

                if (!datosServidor) {
                    throw new Error('Error al descargar datos del servidor');
                }

                setEstado(prev => ({...prev, sincronizando: false}));
                return datosServidor;
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error de sincronización';
                setEstado(prev => ({...prev, sincronizando: false, error: mensaje}));
                return null;
            }
        },
        [cargar, guardar, obtenerEstadoSync, estado.ultimaSync]
    );

    /**
     * Limpia el error actual
     */
    const limpiarError = useCallback(() => {
        setEstado(prev => ({...prev, error: null}));
    }, []);

    return {
        estado,
        cargar,
        guardar,
        obtenerEstadoSync,
        sincronizar,
        limpiarError
    };
}

/**
 * Obtiene el nonce de WordPress para autenticación
 */
function obtenerNonce(): string {
    /* El nonce debería estar disponible en una variable global */
    const wpData = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard;
    return wpData?.nonce || '';
}

/**
 * Hook para detectar estado online/offline
 */
export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState(navigator.onLine);

    useState(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    });

    return online;
}

export type {DashboardData, ConfiguracionUsuario, SyncStatus, EstadoApi};
