/*
 * Hook useEquipos
 *
 * Gestiona la comunicación con la API de equipos
 * y el estado del panel de equipos (social).
 */

import {useState, useCallback, useEffect} from 'react';
import type {EquipoCompleto, SolicitudEquipo, CompaneroEquipo} from '../types/dashboard';

interface EstadoEquipos {
    equipo: EquipoCompleto | null;
    pendientes: number;
    cargando: boolean;
    enviando: boolean;
    error: string | null;
}

interface AccionResultado {
    exito: boolean;
    mensaje: string;
}

const estadoInicial: EstadoEquipos = {
    equipo: null,
    pendientes: 0,
    cargando: false,
    enviando: false,
    error: null
};

const obtenerNonce = (): string => {
    return (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
};

const obtenerHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    'X-WP-Nonce': obtenerNonce()
});

export function useEquipos() {
    const [estado, setEstado] = useState<EstadoEquipos>(estadoInicial);

    const setError = useCallback((mensaje: string | null) => {
        setEstado(prev => ({...prev, error: mensaje}));
    }, []);

    const setCargando = useCallback((cargando: boolean) => {
        setEstado(prev => ({...prev, cargando}));
    }, []);

    const setEnviando = useCallback((enviando: boolean) => {
        setEstado(prev => ({...prev, enviando}));
    }, []);

    /**
     * Obtiene el equipo completo del usuario
     */
    const cargarEquipo = useCallback(async (): Promise<void> => {
        setCargando(true);
        setError(null);

        try {
            const response = await fetch('/wp-json/glory/v1/equipos', {
                method: 'GET',
                headers: obtenerHeaders(),
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (data.success) {
                setEstado(prev => ({
                    ...prev,
                    equipo: data.data,
                    pendientes: data.data.contadores.recibidas,
                    cargando: false,
                    error: null
                }));
            } else {
                throw new Error(data.message || 'Error al cargar equipo');
            }
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({
                ...prev,
                cargando: false,
                error: mensaje
            }));
        }
    }, [setCargando, setError]);

    /**
     * Cuenta solicitudes pendientes (para el badge del header)
     */
    const contarPendientes = useCallback(async (): Promise<number> => {
        try {
            const response = await fetch('/wp-json/glory/v1/equipos/pendientes', {
                method: 'GET',
                headers: obtenerHeaders(),
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (data.success) {
                const pendientes = data.data.pendientes;
                setEstado(prev => ({...prev, pendientes}));
                return pendientes;
            }
            return 0;
        } catch {
            return 0;
        }
    }, []);

    /**
     * Envía una solicitud de conexión por email
     */
    const enviarSolicitud = useCallback(
        async (email: string): Promise<AccionResultado> => {
            setEnviando(true);
            setError(null);

            try {
                const response = await fetch('/wp-json/glory/v1/equipos/solicitud', {
                    method: 'POST',
                    headers: obtenerHeaders(),
                    credentials: 'same-origin',
                    body: JSON.stringify({email})
                });

                const data = await response.json();

                if (data.success) {
                    await cargarEquipo();
                    return {exito: true, mensaje: data.message};
                } else {
                    throw new Error(data.message || 'Error al enviar solicitud');
                }
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setError(mensaje);
                return {exito: false, mensaje};
            } finally {
                setEnviando(false);
            }
        },
        [setEnviando, setError, cargarEquipo]
    );

    /**
     * Acepta una solicitud recibida
     */
    const aceptarSolicitud = useCallback(
        async (solicitudId: number): Promise<AccionResultado> => {
            setEnviando(true);
            setError(null);

            try {
                const response = await fetch(`/wp-json/glory/v1/equipos/${solicitudId}/responder`, {
                    method: 'PUT',
                    headers: obtenerHeaders(),
                    credentials: 'same-origin',
                    body: JSON.stringify({accion: 'aceptar'})
                });

                const data = await response.json();

                if (data.success) {
                    await cargarEquipo();
                    return {exito: true, mensaje: data.message};
                } else {
                    throw new Error(data.message || 'Error al aceptar solicitud');
                }
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setError(mensaje);
                return {exito: false, mensaje};
            } finally {
                setEnviando(false);
            }
        },
        [setEnviando, setError, cargarEquipo]
    );

    /**
     * Rechaza una solicitud recibida
     */
    const rechazarSolicitud = useCallback(
        async (solicitudId: number): Promise<AccionResultado> => {
            setEnviando(true);
            setError(null);

            try {
                const response = await fetch(`/wp-json/glory/v1/equipos/${solicitudId}/responder`, {
                    method: 'PUT',
                    headers: obtenerHeaders(),
                    credentials: 'same-origin',
                    body: JSON.stringify({accion: 'rechazar'})
                });

                const data = await response.json();

                if (data.success) {
                    await cargarEquipo();
                    return {exito: true, mensaje: data.message};
                } else {
                    throw new Error(data.message || 'Error al rechazar solicitud');
                }
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setError(mensaje);
                return {exito: false, mensaje};
            } finally {
                setEnviando(false);
            }
        },
        [setEnviando, setError, cargarEquipo]
    );

    /**
     * Cancela una solicitud enviada o elimina una conexión
     */
    const eliminarConexion = useCallback(
        async (id: number): Promise<AccionResultado> => {
            setEnviando(true);
            setError(null);

            try {
                const response = await fetch(`/wp-json/glory/v1/equipos/${id}`, {
                    method: 'DELETE',
                    headers: obtenerHeaders(),
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (data.success) {
                    await cargarEquipo();
                    return {exito: true, mensaje: data.message};
                } else {
                    throw new Error(data.message || 'Error al eliminar conexión');
                }
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setError(mensaje);
                return {exito: false, mensaje};
            } finally {
                setEnviando(false);
            }
        },
        [setEnviando, setError, cargarEquipo]
    );

    /**
     * Carga inicial al montar
     */
    useEffect(() => {
        contarPendientes();
    }, [contarPendientes]);

    return {
        /* Estado */
        equipo: estado.equipo,
        recibidas: estado.equipo?.recibidas || [],
        enviadas: estado.equipo?.enviadas || [],
        companeros: estado.equipo?.companeros || [],
        contadores: estado.equipo?.contadores || {recibidas: 0, enviadas: 0, companeros: 0},
        pendientes: estado.pendientes,
        cargando: estado.cargando,
        enviando: estado.enviando,
        error: estado.error,

        /* Acciones */
        cargarEquipo,
        contarPendientes,
        enviarSolicitud,
        aceptarSolicitud,
        rechazarSolicitud,
        eliminarConexion,
        limpiarError: () => setError(null)
    };
}

export type UseEquiposReturn = ReturnType<typeof useEquipos>;
