/**
 * useSincronizacion
 *
 * Hook que orquesta la sincronización entre localStorage y el backend WordPress.
 * Implementa estrategia offline-first:
 * - localStorage como cache inmediato
 * - API como fuente de verdad cuando hay conexión
 *
 * @package App/React/hooks
 */

import {useEffect, useCallback, useRef, useState} from 'react';
import {useDashboardApi, type DashboardData} from './useDashboardApi';
import type {Habito, Tarea, Proyecto} from '../types/dashboard';

/*
 * Configuración de sincronización
 */
const CONFIG_SYNC = {
    debounceMs: 2000,
    reintentoMs: 5000,
    maxReintentos: 3
};

/*
 * Tipos para el estado de sincronización
 */
interface EstadoSincronizacion {
    sincronizado: boolean;
    ultimaSync: Date | null;
    pendiente: boolean;
    error: string | null;
    cargandoServidor: boolean;
}

interface DatosLocales {
    habitos: Habito[];
    tareas: Tarea[];
    proyectos: Proyecto[];
    notas: string;
}

interface UseSincronizacionReturn {
    estado: EstadoSincronizacion;
    sincronizarAhora: () => Promise<void>;
    marcarCambiosPendientes: () => void;
    estaLogueado: boolean;
}

/*
 * Helper para verificar si el usuario está logueado en WordPress
 */
function estaUsuarioLogueado(): boolean {
    const wpData = (window as unknown as {gloryDashboard?: {isLoggedIn?: boolean}}).gloryDashboard;
    return wpData?.isLoggedIn === true;
}

/*
 * Helper para obtener el ID de usuario
 */
function obtenerUserId(): number {
    const wpData = (window as unknown as {gloryDashboard?: {userId?: number}}).gloryDashboard;
    return wpData?.userId || 0;
}

/**
 * Hook principal de sincronización
 */
export function useSincronizacion(datosLocales: DatosLocales, onDatosServidor: (datos: DashboardData) => void): UseSincronizacionReturn {
    const {estado: estadoApi, cargar, guardar, sincronizar} = useDashboardApi();

    const [estado, setEstado] = useState<EstadoSincronizacion>({
        sincronizado: true,
        ultimaSync: null,
        pendiente: false,
        error: null,
        cargandoServidor: false
    });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reintentosRef = useRef(0);
    const cargaInicialRef = useRef(false);
    const estaLogueado = estaUsuarioLogueado();

    /*
     * Carga inicial desde el servidor (solo si está logueado)
     */
    useEffect(() => {
        if (!estaLogueado || cargaInicialRef.current) return;

        cargaInicialRef.current = true;

        const cargarDatosServidor = async () => {
            setEstado(prev => ({...prev, cargandoServidor: true}));

            try {
                const datosServidor = await cargar();

                if (datosServidor) {
                    onDatosServidor(datosServidor);
                    setEstado(prev => ({
                        ...prev,
                        sincronizado: true,
                        ultimaSync: new Date(),
                        cargandoServidor: false,
                        error: null
                    }));
                } else {
                    /* No hay datos en servidor, subir los locales */
                    await guardarEnServidor();
                }
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error de conexión';
                setEstado(prev => ({
                    ...prev,
                    cargandoServidor: false,
                    error: mensaje
                }));
            }
        };

        cargarDatosServidor();
    }, [estaLogueado]);

    /*
     * Guarda los datos en el servidor
     */
    const guardarEnServidor = useCallback(async (): Promise<boolean> => {
        if (!estaLogueado) return false;

        setEstado(prev => ({...prev, pendiente: true}));

        try {
            const exito = await guardar({
                habitos: datosLocales.habitos,
                tareas: datosLocales.tareas,
                proyectos: datosLocales.proyectos,
                notas: datosLocales.notas,
                version: '1.0.0',
                ultimaActualizacion: new Date().toISOString(),
                configuracion: {
                    notificaciones: {
                        email: false,
                        frecuenciaResumen: 'nunca',
                        horaPreferida: '09:00',
                        tareasPorVencer: false,
                        rachaEnPeligro: false
                    },
                    cifradoE2E: false,
                    tema: 'terminal',
                    ordenHabitos: 'importancia'
                }
            });

            if (exito) {
                reintentosRef.current = 0;
                setEstado(prev => ({
                    ...prev,
                    sincronizado: true,
                    pendiente: false,
                    ultimaSync: new Date(),
                    error: null
                }));
                return true;
            }

            throw new Error('Error al guardar');
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error de sincronización';

            /* Reintentar si no se alcanzó el máximo */
            if (reintentosRef.current < CONFIG_SYNC.maxReintentos) {
                reintentosRef.current += 1;
                setTimeout(() => guardarEnServidor(), CONFIG_SYNC.reintentoMs);
            }

            setEstado(prev => ({
                ...prev,
                sincronizado: false,
                pendiente: false,
                error: mensaje
            }));
            return false;
        }
    }, [estaLogueado, datosLocales, guardar]);

    /*
     * Sincronización con debounce para evitar exceso de peticiones
     */
    const sincronizarConDebounce = useCallback(() => {
        if (!estaLogueado) return;

        /* Marcar como pendiente inmediatamente */
        setEstado(prev => ({...prev, sincronizado: false, pendiente: true}));

        /* Cancelar sincronización anterior */
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        /* Programar nueva sincronización */
        debounceRef.current = setTimeout(() => {
            guardarEnServidor();
        }, CONFIG_SYNC.debounceMs);
    }, [estaLogueado, guardarEnServidor]);

    /*
     * Sincronización manual inmediata
     */
    const sincronizarAhora = useCallback(async () => {
        if (!estaLogueado) return;

        /* Cancelar debounce pendiente */
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        await guardarEnServidor();
    }, [estaLogueado, guardarEnServidor]);

    /*
     * Marcar que hay cambios pendientes (llamar desde useDashboard)
     */
    const marcarCambiosPendientes = useCallback(() => {
        sincronizarConDebounce();
    }, [sincronizarConDebounce]);

    /*
     * Sincronizar cuando la app vuelve a estar online
     */
    useEffect(() => {
        const handleOnline = () => {
            if (estaLogueado && !estado.sincronizado) {
                guardarEnServidor();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [estaLogueado, estado.sincronizado, guardarEnServidor]);

    /*
     * Limpiar debounce al desmontar
     */
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    /*
     * Heredar errores del hook de API
     */
    useEffect(() => {
        if (estadoApi.error) {
            setEstado(prev => ({...prev, error: estadoApi.error}));
        }
    }, [estadoApi.error]);

    return {
        estado,
        sincronizarAhora,
        marcarCambiosPendientes,
        estaLogueado
    };
}

export {estaUsuarioLogueado, obtenerUserId};
