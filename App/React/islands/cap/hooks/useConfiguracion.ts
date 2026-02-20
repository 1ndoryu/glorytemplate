/**
 * Hook para gestión de configuración del centro CAP
 *
 * Maneja el estado local y las llamadas a la API REST.
 * Cumple SRP: solo gestiona configuración, no UI.
 */

import {useState, useEffect, useCallback} from 'react';
import {procesarErrorApi, obtenerMensajeContextual, interpretarErrorRed, formatearMensajeError} from '../constants/cap-errores';
import type {ICapSuscripciones} from '../../../types/_generated/schema';

export interface DatosCentro {
    id: number;
    user_id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    logo_url?: string;
    created_at: string;
    updated_at: string;
}

export interface ConfiguracionHorarios {
    centro_id: number;
    timezone?: string;
    hora_inicio_manana: string;
    hora_fin_manana: string;
    hora_inicio_tarde: string;
    hora_fin_tarde: string;
    viernes_especial: boolean;
    hora_fin_viernes: string;
    horarios_semanales?: Record<string, Array<{inicio: string; fin: string}>> | string;
    alumnos_max_clase: number;
    duracion_clase: number;
    duracion_descanso: number;
}

export interface InfoSuscripcion {
    /* Derivado del schema generado — 'pendiente' eliminado (no existe en BD), 'pago_fallido' incluido */
    estado: ICapSuscripciones['estado'];
    fechaInicio: string;
    fechaFin: string;
    diasRestantes: number;
}

/*
 * H.6 Fix: Estados de carga separados por tipo de operación
 * Cada panel tiene su propio estado de guardado independiente
 */
interface EstadoConfiguracion {
    centro: DatosCentro | null;
    config: ConfiguracionHorarios | null;
    suscripcion: InfoSuscripcion | null;
    cargando: boolean;
    guardandoCentro: boolean;
    guardandoHorarios: boolean;
    error: string | null;
    exito: string | null;
}

interface UseConfiguracionReturn extends EstadoConfiguracion {
    cargarConfiguracion: () => Promise<void>;
    guardarCentro: (datos: Partial<DatosCentro>) => Promise<boolean>;
    guardarHorarios: (datos: Partial<ConfiguracionHorarios>) => Promise<boolean>;
    limpiarMensajes: () => void;
}

import {API_BASE} from '../constants/cap-constants';

export function useConfiguracion(): UseConfiguracionReturn {
    const [estado, setEstado] = useState<EstadoConfiguracion>({
        centro: null,
        config: null,
        suscripcion: null,
        cargando: true,
        guardandoCentro: false,
        guardandoHorarios: false,
        error: null,
        exito: null
    });

    const cargarConfiguracion = useCallback(async (signal?: AbortSignal) => {
        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const respuesta = await fetch(`${API_BASE}/config`, {
                credentials: 'same-origin',
                headers: {'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''},
                signal
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'configuracion', 'cargar');
                throw new Error(mensajeError);
            }

            const datos = await respuesta.json();

            /* Calcular días restantes de suscripción */
            let suscripcion: InfoSuscripcion | null = null;
            if (datos.suscripcion) {
                const fechaFin = new Date(datos.suscripcion.fecha_fin);
                const hoy = new Date();
                const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

                suscripcion = {
                    estado: datos.suscripcion.estado,
                    fechaInicio: datos.suscripcion.fecha_inicio,
                    fechaFin: datos.suscripcion.fecha_fin,
                    diasRestantes: Math.max(0, diasRestantes)
                };
            }

            setEstado(prev => ({
                ...prev,
                centro: datos.centro,
                config: {
                    ...datos.config,
                    viernes_especial: Boolean(datos.config?.viernes_especial)
                },
                suscripcion,
                cargando: false
            }));
        } catch (err) {
            /* Ignorar cancelaciones por AbortController */
            if (err instanceof DOMException && err.name === 'AbortError') return;
            const contextual = obtenerMensajeContextual('configuracion', 'cargar');
            let mensajeError = err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`;

            if (err instanceof Error && err.message.includes('fetch')) {
                const errorRed = interpretarErrorRed(err);
                mensajeError = formatearMensajeError(errorRed);
            }

            setEstado(prev => ({
                ...prev,
                cargando: false,
                error: mensajeError
            }));
        }
    }, []);

    const guardarCentro = useCallback(async (datos: Partial<DatosCentro>): Promise<boolean> => {
        setEstado(prev => ({...prev, guardandoCentro: true, error: null, exito: null}));

        try {
            const respuesta = await fetch(`${API_BASE}/config`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                },
                body: JSON.stringify({centro: datos})
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'configuracion', 'guardar');
                throw new Error(mensajeError);
            }

            /* Actualizar estado local */
            setEstado(prev => ({
                ...prev,
                centro: prev.centro ? {...prev.centro, ...datos} : null,
                guardandoCentro: false,
                exito: 'Datos del centro actualizados correctamente'
            }));

            return true;
        } catch (err) {
            const contextual = obtenerMensajeContextual('configuracion', 'guardar');
            setEstado(prev => ({
                ...prev,
                guardandoCentro: false,
                error: err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`
            }));
            return false;
        }
    }, []);

    const guardarHorarios = useCallback(async (datos: Partial<ConfiguracionHorarios>): Promise<boolean> => {
        setEstado(prev => ({...prev, guardandoHorarios: true, error: null, exito: null}));

        try {
            const respuesta = await fetch(`${API_BASE}/config`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                },
                body: JSON.stringify({config: datos})
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'configuracion', 'guardar');
                throw new Error(mensajeError);
            }

            setEstado(prev => ({
                ...prev,
                config: prev.config ? {...prev.config, ...datos} : null,
                guardandoHorarios: false,
                exito: 'Configuración de horarios actualizada'
            }));

            return true;
        } catch (err) {
            const contextual = obtenerMensajeContextual('configuracion', 'guardar');
            setEstado(prev => ({
                ...prev,
                guardandoHorarios: false,
                error: err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`
            }));
            return false;
        }
    }, []);

    const limpiarMensajes = useCallback(() => {
        setEstado(prev => ({...prev, error: null, exito: null}));
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        cargarConfiguracion(controller.signal);
        return () => controller.abort();
    }, [cargarConfiguracion]);

    return {
        ...estado,
        cargarConfiguracion,
        guardarCentro,
        guardarHorarios,
        limpiarMensajes
    };
}

export default useConfiguracion;
